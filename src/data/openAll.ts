// Abre (decifra) várias linhas e pula, com aviso no console, as que não abrem.
// Uma linha corrompida ou cifrada com outra chave não derruba a tela inteira.
export async function openAll<Row extends { id: string }, T>(rows: Row[], open: (row: Row) => Promise<T>): Promise<T[]> {
  const results = await Promise.allSettled(rows.map(open));
  const opened: T[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') opened.push(result.value);
    else console.warn(`Sentinela: não foi possível abrir ${rows[i].id}; a linha foi ignorada.`, result.reason);
  });
  return opened;
}
