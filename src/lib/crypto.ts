// Criptografia dos dados no aparelho, com a Web Crypto do navegador.
//
// Cada tripulante tem a própria chave de dados (AES-GCM de 256 bits). Ela cifra os registros,
// as anotações e as mensagens dele. Uma cópia dela fica cifrada com o PIN do dono e outra com o
// PIN do oficial médico (PBKDF2). O PIN de outro tripulante não abre essa chave: a separação
// entre tripulantes é feita pela criptografia, não só pela tela.
//
// Duas caixas seladas por chave pública (RSA-OAEP), para quem não deve ter a chave de ninguém:
// - o pacote diário para a Terra, que só a equipe médica do solo abre;
// - o resumo para o comandante (check-in de hoje e se há vermelho), que só o comandante abre.
// Quem faz o check-in sela essas caixas com a chave pública, sem conseguir abrir as dos outros.
//
// Tudo é selado com o id da linha como dado adicional (AAD): o conteúdo de um registro não pode
// ser trocado pelo de outro.
//
// Limites conhecidos do protótipo:
// - um PIN de 4 a 6 dígitos tem no máximo um milhão de combinações; quem copiar o banco consegue
//   testar todas fora do app. Num produto real a chave ficaria no hardware do aparelho ou no
//   sistema da agência;
// - na demonstração, a chave privada do solo fica (cifrada no PIN do solo) no mesmo navegador,
//   porque tudo roda num aparelho só. Na missão real ela ficaria só na Terra.

export interface Sealed {
  iv: Uint8Array;
  data: ArrayBuffer;
}

// Recomendação da OWASP para PBKDF2 com SHA-256.
export const PIN_ITERATIONS = 600_000;

const RSA = { name: 'RSA-OAEP', hash: 'SHA-256' } as const;
const RSA_WRAPPED_BYTES = 256; // RSA de 2048 bits

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function aadOf(aad?: string): { additionalData?: BufferSource } {
  return aad === undefined ? {} : { additionalData: encoder.encode(aad) };
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

export async function keyFromPin(pin: string, salt: Uint8Array, iterations = PIN_ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
}

// Chave de dados de um tripulante. Só a recém-criada pode ser exportada, para ser guardada
// cifrada nos perfis que podem abri-la.
export function createDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function wrapDataKey(dataKey: CryptoKey, pinKey: CryptoKey): Promise<Sealed> {
  const iv = randomBytes(12);
  const data = await crypto.subtle.wrapKey('raw', dataKey, pinKey, { name: 'AES-GCM', iv });
  return { iv, data };
}

// Falha (OperationError) quando o PIN está errado. A chave aberta não pode ser exportada.
export function unwrapDataKey(sealed: Sealed, pinKey: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'raw',
    sealed.data,
    pinKey,
    { name: 'AES-GCM', iv: sealed.iv as BufferSource },
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function seal(key: CryptoKey, value: unknown, aad?: string): Promise<Sealed> {
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, ...aadOf(aad) }, key, encoder.encode(JSON.stringify(value)));
  return { iv, data };
}

export async function unseal<T>(key: CryptoKey, sealed: Sealed, aad?: string): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.iv as BufferSource, ...aadOf(aad) }, key, sealed.data);
  return JSON.parse(decoder.decode(plain)) as T;
}

// --- Caixas seladas por chave pública (solo e comandante) ---

export function createKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { ...RSA, modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]) },
    true,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  return toBase64(await crypto.subtle.exportKey('spki', key));
}

export function importPublicKey(spki: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', fromBase64(spki), RSA, false, ['wrapKey']);
}

// A chave privada fica cifrada com o PIN de quem pode abrir a caixa.
export async function wrapPrivateKey(privateKey: CryptoKey, pinKey: CryptoKey): Promise<Sealed> {
  const iv = randomBytes(12);
  const data = await crypto.subtle.wrapKey('pkcs8', privateKey, pinKey, { name: 'AES-GCM', iv });
  return { iv, data };
}

export function unwrapPrivateKey(sealed: Sealed, pinKey: CryptoKey): Promise<CryptoKey> {
  return crypto.subtle.unwrapKey(
    'pkcs8',
    sealed.data,
    pinKey,
    { name: 'AES-GCM', iv: sealed.iv as BufferSource },
    RSA,
    false,
    ['unwrapKey'],
  );
}

// Selagem híbrida: uma chave AES nova por caixa, guardada com RSA-OAEP no começo de `data`.
// Qualquer um com a chave pública sela; só quem tem a privada abre.
export async function sealFor(publicKey: CryptoKey, value: unknown, aad?: string): Promise<Sealed> {
  const boxKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const sealed = await seal(boxKey, value, aad);
  const wrapped = new Uint8Array(await crypto.subtle.wrapKey('raw', boxKey, publicKey, RSA));
  const data = new Uint8Array(wrapped.length + sealed.data.byteLength);
  data.set(wrapped, 0);
  data.set(new Uint8Array(sealed.data), wrapped.length);
  return { iv: sealed.iv, data: data.buffer };
}

export async function openFrom<T>(privateKey: CryptoKey, sealed: Sealed, aad?: string): Promise<T> {
  const bytes = new Uint8Array(sealed.data);
  const boxKey = await crypto.subtle.unwrapKey(
    'raw',
    bytes.slice(0, RSA_WRAPPED_BYTES),
    privateKey,
    RSA,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  return unseal<T>(boxKey, { iv: sealed.iv, data: bytes.slice(RSA_WRAPPED_BYTES).buffer }, aad);
}

// Base64 para mandar o conteúdo cifrado em JSON (o servidor guarda como texto, sem abrir).
export function toBase64(bytes: Uint8Array | ArrayBuffer): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < view.length; i += 0x8000) binary += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
}
