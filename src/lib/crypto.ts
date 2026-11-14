// Criptografia dos dados no aparelho, com a Web Crypto do navegador.
//
// Uma chave de dados (AES-GCM de 256 bits) cifra os registros. Cada perfil guarda uma cópia
// dela cifrada com uma chave derivada do PIN (PBKDF2). PIN errado não abre a cópia, então a
// conferência do PIN é a própria abertura da chave, e o PIN nunca é gravado.
//
// Limite conhecido: um PIN de 4 a 6 dígitos tem no máximo um milhão de combinações. Quem copiar
// o banco consegue testar todas fora do app. Num produto real a chave ficaria no hardware do
// aparelho (ou no sistema da agência), não só atrás do PIN.

export interface Sealed {
  iv: Uint8Array;
  data: ArrayBuffer;
}

// Recomendação da OWASP para PBKDF2 com SHA-256.
export const PIN_ITERATIONS = 600_000;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

// Só a chave recém-criada pode ser exportada, para ser guardada cifrada em cada perfil.
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

export async function seal(key: CryptoKey, value: unknown): Promise<Sealed> {
  const iv = randomBytes(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)));
  return { iv, data };
}

export async function unseal<T>(key: CryptoKey, sealed: Sealed): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: sealed.iv as BufferSource }, key, sealed.data);
  return JSON.parse(decoder.decode(plain)) as T;
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
