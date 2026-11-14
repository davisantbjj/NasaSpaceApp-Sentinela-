// Chaves da sessão aberta. Ficam só na memória: bloquear ou recarregar a página apaga.
//
// - crew: as chaves de dados que o PIN abriu (o dono abre a dele; o oficial médico, a de todos);
// - groundPrivate: só no perfil do médico do solo, para abrir os pacotes que chegaram à Terra;
// - commanderPrivate: só no perfil do comandante, para abrir o resumo de check-in e vermelho;
// - groundPublic e commanderPublic: qualquer sessão de bordo usa para selar essas caixas.

export interface SessionKeys {
  crew: Map<string, CryptoKey>;
  groundPrivate?: CryptoKey;
  commanderPrivate?: CryptoKey;
  groundPublic?: CryptoKey;
  commanderPublic?: CryptoKey;
}

let keys: SessionKeys | null = null;

export function setSessionKeys(next: SessionKeys): void {
  keys = next;
}

export function clearSessionKeys(): void {
  keys = null;
}

function requireKeys(): SessionKeys {
  if (!keys) throw new Error('Sessão bloqueada. Entre de novo com o seu PIN.');
  return keys;
}

export class NoAccessError extends Error {
  constructor() {
    super('Sem acesso aos dados deste tripulante.');
  }
}

// Chave de dados de um tripulante. Sem ela, os dados dele não abrem: não é só a tela que esconde.
export function crewKey(crewId: string): CryptoKey {
  const key = requireKeys().crew.get(crewId);
  if (!key) throw new NoAccessError();
  return key;
}

export function hasCrewKey(crewId: string): boolean {
  return !!keys?.crew.has(crewId);
}

export function groundPrivateKey(): CryptoKey {
  const key = requireKeys().groundPrivate;
  if (!key) throw new NoAccessError();
  return key;
}

export function commanderPrivateKey(): CryptoKey {
  const key = requireKeys().commanderPrivate;
  if (!key) throw new NoAccessError();
  return key;
}

export function sealingKeys(): { ground: CryptoKey; commander: CryptoKey } {
  const { groundPublic, commanderPublic } = requireKeys();
  if (!groundPublic || !commanderPublic) throw new Error('Chaves públicas da missão não carregadas.');
  return { ground: groundPublic, commander: commanderPublic };
}
