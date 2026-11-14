import { seal, unseal } from '../lib/crypto';
import type { DailyRecord, DailyValues } from '../types';
import { db, type StoredRecord } from './db';
import { crewKey } from './keyring';
import { openAll } from './openAll';

async function openRecord(key: CryptoKey, { sealed, ...meta }: StoredRecord): Promise<DailyRecord> {
  return { ...meta, values: await unseal<DailyValues>(key, sealed, meta.id) };
}

export async function sealRecord(key: CryptoKey, { values, ...meta }: DailyRecord): Promise<StoredRecord> {
  return { ...meta, sealed: await seal(key, values, meta.id) };
}

// Registros de um tripulante, do mais antigo para o mais novo. Só abre com a chave dele:
// quem não tem a chave recebe erro, não importa por onde chame.
// `strict`: falha se alguma linha não abrir, em vez de pular (usado ao montar o pacote,
// para um registro ilegível não mudar o nível de um alerta sem ninguém perceber).
export async function listRecords(crewId: string, strict = false): Promise<DailyRecord[]> {
  const key = crewKey(crewId);
  const rows = await db.records.where('crewId').equals(crewId).toArray();
  const records = strict
    ? await Promise.all(rows.map((row) => openRecord(key, row)))
    : await openAll(rows, (row) => openRecord(key, row));
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

// Um registro por tripulante por dia: salvar de novo no mesmo dia substitui o anterior
// e volta para a fila de sincronização.
export async function saveRecord(record: DailyRecord): Promise<void> {
  await db.records.put(await sealRecord(crewKey(record.crewId), { ...record, syncedAt: undefined }));
}

// Registros que ainda não chegaram à central. Não precisa abrir os valores.
export async function listUnsyncedRecords(): Promise<Omit<StoredRecord, 'sealed'>[]> {
  const rows = await db.records.filter((r) => !r.syncedAt).toArray();
  return rows.map(({ sealed: _sealed, ...meta }) => meta);
}

export async function markRecordsSynced(ids: string[], at: string): Promise<void> {
  if (ids.length > 0) await db.records.where('id').anyOf(ids).modify({ syncedAt: at });
}
