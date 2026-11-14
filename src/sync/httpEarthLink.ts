import { listSealedPackets, updatePacketMeta } from '../data/packetsRepo';
import { toBase64 } from '../lib/crypto';
import type { Environment } from '../types';
import type { EarthLink } from './adapters';
import { signalDelayMs } from './packets';

// Ligação com a Terra pelo backend da equipe (pasta server/).
//
// O pacote sai cifrado, como está no banco: o servidor guarda sem conseguir ler.
// Se o servidor não responder, o envio falha, os pacotes continuam na fila da central
// e saem no próximo ciclo. A nave nunca depende do servidor.
//
// Configuração (variáveis do Vite, num arquivo .env.local que não vai para o Git):
//   VITE_EARTH_API_URL=https://seu-servidor.up.railway.app
//   VITE_EARTH_MISSION_TOKEN=o mesmo MISSION_TOKEN do servidor
// O token vai junto do app publicado, então não é segredo de verdade: só impede gravações
// de quem não tem o app. Num produto real, cada aparelho teria a própria credencial.

const TIMEOUT_MS = 10_000;
const MAX_PER_REQUEST = 100; // o mesmo limite do servidor (server/src/validate.js)

export function createHttpEarthLink(baseUrl: string, token: string): EarthLink {
  const url = `${baseUrl.replace(/\/$/, '')}/api/packets`;
  return {
    name: 'Backend na Terra',
    isOpen: () => typeof navigator === 'undefined' || navigator.onLine,
    async send(packetIds, environment) {
      // Em lotes de 100, na ordem da fila. Se um lote falha, os seguintes esperam o próximo ciclo.
      for (let i = 0; i < packetIds.length; i += MAX_PER_REQUEST) {
        await sendBatch(packetIds.slice(i, i + MAX_PER_REQUEST), environment);
      }
    },
  };

  async function sendBatch(packetIds: string[], environment: Environment) {
    if (packetIds.length === 0) return;
    const rows = await listSealedPackets(packetIds);
    const sentAt = new Date().toISOString();
    // A partir daqui o conteúdo do pacote não muda mais (veja refreshPacket).
    for (const row of rows) if (!row.attemptedAt) await updatePacketMeta(row.id, { attemptedAt: sentAt });
    const body = {
      packets: rows.map(({ sealed, ...meta }) => ({
        id: meta.id,
        crewId: meta.crewId,
        date: meta.date,
        createdAt: meta.createdAt,
        priority: meta.priority,
        sentAt,
        sealed: { iv: toBase64(sealed.iv), data: toBase64(sealed.data) },
      })),
    };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(`O servidor da Terra respondeu ${response.status}${detail.error ? `: ${detail.error}` : ''}`);
    }
    // O servidor confirmou. A chegada à equipe médica segue o atraso de ida do ambiente.
    const deliverAt = new Date(Date.parse(sentAt) + signalDelayMs(environment)).toISOString();
    for (const row of rows) await updatePacketMeta(row.id, { sentAt, deliverAt });
  }
}
