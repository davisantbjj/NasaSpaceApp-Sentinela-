import { seal, unseal } from '../lib/crypto';
import type { GroundPacket, PacketPayload } from '../types';
import { db, type StoredPacket } from './db';
import { requireDataKey } from './keyring';
import { openAll } from './openAll';

export type PacketMeta = Omit<StoredPacket, 'sealed'>;

// Quantos pacotes por tripulante são abertos para as telas. O ciclo roda a cada 5 s, então
// abrir todos ficaria mais lento a cada dia de missão.
export const RECENT_PACKETS_PER_CREW = 30;

// Pacotes para a Terra, com o conteúdo aberto: os mais recentes de cada tripulante,
// do mais antigo para o mais novo. Sem `crewId`, de todos.
export async function listPackets(crewId?: string, perCrew = RECENT_PACKETS_PER_CREW): Promise<GroundPacket[]> {
  const key = requireDataKey();
  const rows = crewId ? await db.packets.where('crewId').equals(crewId).toArray() : await db.packets.toArray();
  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byCrew = new Map<string, StoredPacket[]>();
  for (const row of rows) byCrew.set(row.crewId, [...(byCrew.get(row.crewId) ?? []), row]);
  const recent = [...byCrew.values()].flatMap((list) => list.slice(-perCrew));
  const packets = await openAll(recent, async ({ sealed, ...meta }) => ({ ...meta, payload: await unseal<PacketPayload>(key, sealed) }));
  return packets.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function listPacketMeta(): Promise<PacketMeta[]> {
  const rows = await db.packets.toArray();
  return rows.map(({ sealed: _sealed, ...meta }) => meta);
}

export async function savePacket({ payload, ...meta }: GroundPacket): Promise<void> {
  await db.packets.put({ ...meta, sealed: await seal(requireDataKey(), payload) });
}

export async function updatePacketMeta(
  id: string,
  patch: Partial<Pick<PacketMeta, 'attemptedAt' | 'sentAt' | 'deliverAt'>>,
): Promise<void> {
  await db.packets.update(id, patch);
}

// Pacotes como estão no banco, ainda cifrados, na ordem dos ids pedidos. Para enviar à Terra sem abrir.
export async function listSealedPackets(ids: string[]): Promise<StoredPacket[]> {
  const rows = await db.packets.bulkGet(ids);
  return rows.filter((r): r is StoredPacket => !!r);
}
