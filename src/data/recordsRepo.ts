import { seal, unseal } from '../lib/crypto';
import type { DailyRecord, DailyValues } from '../types';
import { db, type StoredRecord } from './db';
import { requireDataKey } from './keyring';
import { openAll } from './openAll';

async function openRecord(key: CryptoKey, { sealed, ...meta }: StoredRecord): Promise<DailyRecord> {
  return { ...meta, values: await unseal<DailyValues>(key, sealed) };
}

export async function sealRecord(key: CryptoKey, { values, ...meta }: DailyRecord): Promise<StoredRecord> {
  return { ...meta, sealed: await seal(key, values) };
}

// Registros de um tripulante, do mais antigo para o mais novo.
export async function listRecords(crewId: string): Promise<DailyRecord[]> {
  const key = requireDataKey();
  const rows = await db.records.where('crewId').equals(crewId).toArray();
  const records = await openAll(rows, (row) => openRecord(key, row));
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

// Um registro por tripulante por dia: salvar de novo no mesmo dia substitui o anterior
// e volta para a fila de sincronização.
export async function saveRecord(record: DailyRecord): Promise<void> {
  await db.records.put(await sealRecord(requireDataKey(), { ...record, syncedAt: undefined }));
}

// Registros que ainda não chegaram à central. Não precisa abrir os valores.
export async function listUnsyncedRecords(): Promise<Omit<StoredRecord, 'sealed'>[]> {
  const rows = await db.records.filter((r) => !r.syncedAt).toArray();
  return rows.map(({ sealed: _sealed, ...meta }) => meta);
}

export async function markRecordsSynced(ids: string[], at: string): Promise<void> {
  if (ids.length > 0) await db.records.where('id').anyOf(ids).modify({ syncedAt: at });
}

// Data do último registro do tripulante que já está na central, sem abrir os valores.
export async function latestSyncedDate(crewId: string): Promise<string | undefined> {
  const rows = await db.records.where('crewId').equals(crewId).filter((r) => !!r.syncedAt).toArray();
  return rows.reduce<string | undefined>((max, r) => (!max || r.date > max ? r.date : max), undefined);
}
