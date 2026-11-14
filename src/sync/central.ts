import { listPacketMeta, updatePacketMeta } from '../data/packetsRepo';
import { listUnsyncedRecords, markRecordsSynced } from '../data/recordsRepo';
import { listUnsyncedReviews, markReviewsSynced } from '../data/reviewsRepo';
import type { Settings } from '../types';
import type { EarthLink, OutboxItem, SyncAdapter } from './adapters';
import { createHttpEarthLink } from './httpEarthLink';
import { signalDelayMs, transmitOrder } from './packets';

// Central de bordo e ligação com a Terra, simuladas no próprio navegador.
// "Offline" no Sentinela quer dizer sem internet da Terra: a nave tem rede interna.
//
// A central não abre nada: os registros chegam selados com a chave de cada tripulante, e o pacote
// para a Terra e o resumo do comandante já vêm selados de quem fez o check-in (sync/compose.ts).
// Ela só marca o que chegou e encaminha as caixas na ordem da fila.

export async function listOutbox(): Promise<OutboxItem[]> {
  const [records, reviews] = await Promise.all([listUnsyncedRecords(), listUnsyncedReviews()]);
  return [
    ...records.map((r) => ({ kind: 'record' as const, id: r.id, crewId: r.crewId, date: r.date, createdAt: r.createdAt })),
    ...reviews.map((r) => ({ kind: 'review' as const, id: r.id, crewId: r.crewId, date: r.date, createdAt: r.seenAt })),
  ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Verdadeiro quando tudo de que uma caixa depende já chegou à central.
export async function atCentralChecker(): Promise<(ids: string[]) => boolean> {
  const waiting = new Set((await listOutbox()).map((i) => i.id));
  return (ids) => ids.every((id) => !waiting.has(id));
}

export function createLocalCentral(isOnline: () => boolean): SyncAdapter {
  return {
    name: 'Central de bordo (simulada)',
    reachable: isOnline,
    async push(items) {
      const at = new Date().toISOString();
      await markRecordsSynced(items.filter((i) => i.kind === 'record').map((i) => i.id), at);
      await markReviewsSynced(items.filter((i) => i.kind === 'review').map((i) => i.id), at);
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
export async function runSyncCycle(settings: Settings, sendAll: boolean): Promise<SyncResult> {
  // Duas abas (ou o app instalado e uma aba) não rodam o ciclo ao mesmo tempo: a segunda pula.
  if (typeof navigator !== 'undefined' && navigator.locks) {
    const result = await navigator.locks.request('sentinela-sync', { ifAvailable: true }, (lock) =>
      lock ? runCycle(settings, sendAll) : { pushed: 0, sent: 0 },
    );
    return result;
  }
  return runCycle(settings, sendAll);
}

async function runCycle(settings: Settings, sendAll: boolean): Promise<SyncResult> {
  const central = createLocalCentral(() => true);
  const link = createEarthLink();

  let pushed = 0;
  const outbox = await listOutbox();
  if (outbox.length > 0 && (await central.reachable())) pushed = (await central.push(outbox)).length;

  let sent = 0;
  if (await link.isOpen()) {
    // Só sai o pacote cujo registro (e anotações) já chegou à central.
    const atCentral = await atCentralChecker();
    const queue = transmitOrder((await listPacketMeta()).filter((p) => atCentral(p.waitsFor)));
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

