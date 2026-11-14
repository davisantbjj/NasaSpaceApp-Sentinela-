import type { DailyRecord } from '../types';
import { db } from './db';

// Registros de um tripulante, do mais antigo para o mais novo.
export async function listRecords(crewId: string): Promise<DailyRecord[]> {
  const records = await db.records.where('crewId').equals(crewId).toArray();
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

// Um registro por tripulante por dia: salvar de novo no mesmo dia substitui o anterior.
export async function saveRecord(record: DailyRecord): Promise<void> {
  await db.records.put(record);
}
