// Chave de dados da sessão aberta. Fica só na memória: bloquear ou recarregar a página apaga.

let dataKey: CryptoKey | null = null;

export function setDataKey(key: CryptoKey): void {
  dataKey = key;
}

export function clearDataKey(): void {
  dataKey = null;
}

export function requireDataKey(): CryptoKey {
  if (!dataKey) throw new Error('Sessão bloqueada. Entre de novo com o seu PIN.');
  return dataKey;
}
