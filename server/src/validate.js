// Conferência de tudo o que chega. O servidor recusa o que não tem o formato esperado,
// em vez de guardar lixo ou deixar alguém encher o disco.

export const MAX_PACKETS_PER_REQUEST = 100;
const MAX_IV_CHARS = 64;
const MAX_DATA_CHARS = 200_000; // ~150 kB cifrados por pacote; um pacote real tem menos de 2 kB

const ID = /^[\w.:-]{1,200}$/;
const CREW_ID = /^[\w-]{1,64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

function isIsoDate(value) {
  return typeof value === 'string' && value.length <= 40 && !Number.isNaN(Date.parse(value));
}

function isBase64(value, max) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && BASE64.test(value);
}

/** Devolve a mensagem do primeiro problema, ou null se o pacote está certo. */
export function packetProblem(p, index) {
  const where = `pacote ${index}`;
  if (!p || typeof p !== 'object') return `${where}: não é um objeto`;
  if (typeof p.id !== 'string' || !ID.test(p.id)) return `${where}: id inválido`;
  if (typeof p.crewId !== 'string' || !CREW_ID.test(p.crewId)) return `${where}: crewId inválido`;
  if (typeof p.date !== 'string' || !DATE.test(p.date)) return `${where}: date deve ser AAAA-MM-DD`;
  if (!isIsoDate(p.createdAt)) return `${where}: createdAt inválido`;
  if (!isIsoDate(p.sentAt)) return `${where}: sentAt inválido`;
  if (p.priority !== 'red' && p.priority !== 'normal') return `${where}: priority deve ser red ou normal`;
  if (!p.sealed || typeof p.sealed !== 'object') return `${where}: falta sealed`;
  if (!isBase64(p.sealed.iv, MAX_IV_CHARS)) return `${where}: sealed.iv inválido`;
  if (!isBase64(p.sealed.data, MAX_DATA_CHARS)) return `${where}: sealed.data inválido`;
  return null;
}

/** Confere o corpo de POST /api/packets. Devolve { packets } ou { error }. */
export function parsePacketsBody(body) {
  if (!body || !Array.isArray(body.packets)) return { error: 'O corpo deve ter a lista "packets".' };
  if (body.packets.length === 0) return { error: 'A lista "packets" está vazia.' };
  if (body.packets.length > MAX_PACKETS_PER_REQUEST) {
    return { error: `No máximo ${MAX_PACKETS_PER_REQUEST} pacotes por envio.` };
  }
  for (const [i, p] of body.packets.entries()) {
    const problem = packetProblem(p, i);
    if (problem) return { error: problem };
  }
  return { packets: body.packets };
}
