import { openFrom, sealFor } from '../lib/crypto';
import type { CrewStatusSummary, GroundPacket, PacketPayload } from '../types';
import { db, type StoredPacket, type StoredStatus } from './db';
import { commanderPrivateKey, groundPrivateKey, sealingKeys } from './keyring';
import { openAll } from './openAll';

export type PacketMeta = Omit<StoredPacket, 'sealed'>;

// Quantos pacotes por tripulante são abertos na Visão do solo.
export const RECENT_PACKETS_PER_CREW = 30;

// --- Pacotes para a Terra: selados para a equipe médica do solo ---

// Só o médico do solo abre. A bordo, as telas usam só os metadados (listPacketMeta).
export async function listPacketsForGround(perCrew = RECENT_PACKETS_PER_CREW): Promise<GroundPacket[]> {
  const key = groundPrivateKey();
  const rows = (await db.packets.toArray()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byCrew = new Map<string, StoredPacket[]>();
  for (const row of rows) byCrew.set(row.crewId, [...(byCrew.get(row.crewId) ?? []), row]);
  const recent = [...byCrew.values()].flatMap((list) => list.slice(-perCrew));
  return openAll(recent, async ({ sealed, ...meta }) => ({ ...meta, payload: await openFrom<PacketPayload>(key, sealed, meta.id) }));
}

export async function listPacketMeta(crewId?: string): Promise<PacketMeta[]> {
  const rows = crewId ? await db.packets.where('crewId').equals(crewId).toArray() : await db.packets.toArray();
  return rows.map(({ sealed: _sealed, ...meta }) => meta).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Qualquer sessão de bordo sela com a chave pública do solo, sem conseguir abrir depois.
export async function savePacket({ payload, ...meta }: GroundPacket): Promise<void> {
  await db.packets.put({ ...meta, sealed: await sealFor(sealingKeys().ground, payload, meta.id) });
}

export async function updatePacketMeta(
  id: string,
  patch: Partial<Pick<PacketMeta, 'attemptedAt' | 'sentAt' | 'deliverAt'>>,
): Promise<void> {
  await db.packets.update(id, patch);
}

// Pacotes como estão no banco, ainda selados, na ordem dos ids pedidos. Para enviar à Terra sem abrir.
export async function listSealedPackets(ids: string[]): Promise<StoredPacket[]> {
  const rows = await db.packets.bulkGet(ids);
  return rows.filter((r): r is StoredPacket => !!r);
}

// --- Resumo para o comandante: selado para o comandante ---

export async function saveStatus(summary: CrewStatusSummary, date: string, waitsFor: string[]): Promise<void> {
  const id = `${summary.crewId}_${date}`;
  await db.statuses.put({ id, crewId: summary.crewId, date, waitsFor, sealed: await sealFor(sealingKeys().commander, summary, id) });
}

// O resumo mais recente de cada tripulante que já chegou à central. Só o comandante abre.
export async function listStatusesForCommander(atCentral: (ids: string[]) => boolean): Promise<CrewStatusSummary[]> {
  const key = commanderPrivateKey();
  const latest = new Map<string, StoredStatus>();
  for (const row of await db.statuses.toArray()) {
    if (!atCentral(row.waitsFor)) continue;
    const current = latest.get(row.crewId);
    if (!current || row.date > current.date) latest.set(row.crewId, row);
  }
  return openAll([...latest.values()], (row) => openFrom<CrewStatusSummary>(key, row.sealed, row.id));
}
