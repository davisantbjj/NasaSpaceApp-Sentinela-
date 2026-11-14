import { latestSyncedDate, listRecords, listUnsyncedRecords, markRecordsSynced } from '../data/recordsRepo';
import { listPacketMeta, listPackets, savePacket, updatePacketMeta } from '../data/packetsRepo';
import { listReviews, listUnsyncedReviews, markReviewsSynced } from '../data/reviewsRepo';
import { computeBaselines } from '../rules/baseline';
import { evaluateRecord } from '../rules/engine';
import { rules } from '../rules/rules';
import type { CrewMember, Environment, GroundPacket, Settings } from '../types';
import type { EarthLink, OutboxItem, SyncAdapter } from './adapters';
import { createHttpEarthLink } from './httpEarthLink';
import { buildPacketPayload, packetPriority, signalDelayMs, transmitOrder } from './packets';

// Central de bordo e ligação com a Terra, simuladas no próprio navegador.
// "Offline" no Sentinela quer dizer sem internet da Terra: a nave tem rede interna.

export async function listOutbox(): Promise<OutboxItem[]> {
  const [records, reviews] = await Promise.all([listUnsyncedRecords(), listUnsyncedReviews()]);
  return [
    ...records.map((r) => ({ kind: 'record' as const, id: r.id, crewId: r.crewId, date: r.date, createdAt: r.createdAt })),
    ...reviews.map((r) => ({ kind: 'review' as const, id: r.id, crewId: r.crewId, date: r.date, createdAt: r.seenAt })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Monta (ou atualiza, se ainda não saiu) o pacote do dia de um tripulante, só com o que está na central.
// `arriving` são os ids que estão chegando à central neste ciclo e ainda não foram marcados.
export async function refreshPacket(
  member: CrewMember,
  date: string,
  environment: Environment,
  arriving: ReadonlySet<string> = new Set(),
): Promise<void> {
  const atCentral = (r: { id: string; syncedAt?: string }) => !!r.syncedAt || arriving.has(r.id);
  const records = (await listRecords(member.id)).filter(atCentral);
  const index = records.findIndex((r) => r.date === date);
  if (index < 0) return;
  const history = records.slice(0, index + 1);
  const record = records[index];
  const baselines = computeBaselines(member.id, history, rules);
  const alerts = evaluateRecord(record, history.slice(0, -1), baselines, rules, environment);
  const reviews = (await listReviews(member.id)).filter(atCentral);
  const payload = buildPacketPayload(member, record, alerts, reviews, environment);

  // Só reaproveita pacote que nunca tentou sair. Depois da primeira tentativa o conteúdo fica
  // congelado: se o servidor gravou e a resposta se perdeu, um reenvio com conteúdo diferente
  // e o mesmo id seria ignorado lá. Conteúdo novo ganha id novo.
  const pending = (await listPacketMeta()).find(
    (p) => p.crewId === member.id && p.date === date && !p.sentAt && !p.attemptedAt,
  );
  const createdAt = new Date().toISOString();
  const packet: GroundPacket = {
    id: pending?.id ?? `${member.id}_${date}_${createdAt}`,
    crewId: member.id,
    date,
    createdAt: pending?.createdAt ?? createdAt,
    priority: packetPriority(payload),
    payload,
  };
  await savePacket(packet);
}

// Garante um pacote para o último registro de cada tripulante que já está na central.
export async function ensurePackets(crew: CrewMember[], environment: Environment): Promise<void> {
  const packets = await listPacketMeta();
  for (const member of crew) {
    const date = await latestSyncedDate(member.id);
    if (date && !packets.some((p) => p.crewId === member.id && p.date === date)) {
      await refreshPacket(member, date, environment);
    }
  }
}

export function createLocalCentral(
  isOnline: () => boolean,
  crew: () => CrewMember[],
  environment: () => Environment,
): SyncAdapter {
  return {
    name: 'Central de bordo (simulada)',
    reachable: isOnline,
    async push(items) {
      const records = items.filter((i) => i.kind === 'record').map((i) => i.id);
      const reviews = items.filter((i) => i.kind === 'review').map((i) => i.id);
      // Primeiro os pacotes, depois a marcação. Se a sessão bloquear no meio, nada sai da
      // fila sem o pacote correspondente: o ciclo seguinte refaz tudo.
      const arriving = new Set(items.map((i) => i.id));
      const days = new Map(items.map((i) => [`${i.crewId}|${i.date}`, i]));
      for (const item of days.values()) {
        const member = crew().find((c) => c.id === item.crewId);
        if (member) await refreshPacket(member, item.date, environment(), arriving);
      }
      const at = new Date().toISOString();
      await markRecordsSynced(records, at);
      await markReviewsSynced(reviews, at);
      return items.map((i) => i.id);
    },
  };
}

export function earthReachable(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine;
}

// O pacote chega depois do atraso de ida do ambiente atual.
export function createSimulatedEarthLink(isOpen: () => boolean): EarthLink {
  return {
    name: 'Ligação com a Terra (simulada)',
    isOpen,
    async send(packetIds, environment) {
      for (const id of packetIds) {
        const sent = Date.now();
        await updatePacketMeta(id, {
          sentAt: new Date(sent).toISOString(),
          deliverAt: new Date(sent + signalDelayMs(environment)).toISOString(),
        });
      }
    },
  };
}

export interface SyncResult {
  pushed: number;
  sent: number;
}

// Com VITE_EARTH_API_URL configurado, os pacotes vão para o backend da equipe; sem ele,
// a ligação com a Terra é simulada no navegador.
const EARTH_API_URL = import.meta.env.VITE_EARTH_API_URL as string | undefined;
const EARTH_TOKEN = (import.meta.env.VITE_EARTH_MISSION_TOKEN as string | undefined) ?? '';

export function createEarthLink(): EarthLink {
  return EARTH_API_URL ? createHttpEarthLink(EARTH_API_URL, EARTH_TOKEN) : createSimulatedEarthLink(earthReachable);
}

// Estado da última tentativa de envio à Terra, para a tela de sincronização.
export interface EarthLinkStatus {
  name: string;
  lastError?: string;
  lastErrorAt?: string;
}

let earthStatus: EarthLinkStatus = { name: createEarthLink().name };

export function earthLinkStatus(): EarthLinkStatus {
  return earthStatus;
}

// Um ciclo: leva a fila do aparelho à central e manda pacotes para a Terra.
// Em cada ciclo sai um pacote (assim dá para ver o vermelho passar na frente);
// quando a conexão volta, saem todos os que esperavam, na ordem da fila.
//
// Nada aqui é opção do usuário: a sincronização acontece sozinha sempre que há conexão.
// A central simulada está sempre ao alcance. A ligação com a Terra usa a conexão real do
// navegador, a mesma que o backend vai usar: sem conexão, os pacotes esperam na central.
export async function runSyncCycle(crew: CrewMember[], settings: Settings, sendAll: boolean): Promise<SyncResult> {
  // Duas abas (ou o app instalado e uma aba) não rodam o ciclo ao mesmo tempo: a segunda pula.
  if (typeof navigator !== 'undefined' && navigator.locks) {
    const result = await navigator.locks.request('sentinela-sync', { ifAvailable: true }, (lock) =>
      lock ? runCycle(crew, settings, sendAll) : { pushed: 0, sent: 0 },
    );
    return result;
  }
  return runCycle(crew, settings, sendAll);
}

async function runCycle(crew: CrewMember[], settings: Settings, sendAll: boolean): Promise<SyncResult> {
  const central = createLocalCentral(() => true, () => crew, () => settings.environment);
  const link = createEarthLink();

  let pushed = 0;
  const outbox = await listOutbox();
  if (outbox.length > 0 && (await central.reachable())) pushed = (await central.push(outbox)).length;

  await ensurePackets(crew, settings.environment);

  let sent = 0;
  if (await link.isOpen()) {
    const queue = transmitOrder(await listPacketMeta());
    const batch = (sendAll ? queue : queue.slice(0, 1)).map((p) => p.id);
    try {
      await link.send(batch, settings.environment);
      sent = batch.length;
      earthStatus = { name: link.name };
    } catch (error) {
      // Servidor fora do ar ou sem rede: os pacotes ficam na fila e saem no próximo ciclo.
      earthStatus = {
        name: link.name,
        lastError: error instanceof Error ? error.message : String(error),
        lastErrorAt: new Date().toISOString(),
      };
    }
  }
  return { pushed, sent };
}

// Só para a demonstração: faz os pacotes a caminho chegarem agora.
export async function deliverInTransitNow(): Promise<void> {
  const now = new Date().toISOString();
  for (const p of await listPacketMeta()) {
    if (p.sentAt && p.deliverAt && p.deliverAt > now) await updatePacketMeta(p.id, { deliverAt: now });
  }
}

export { listPackets };
