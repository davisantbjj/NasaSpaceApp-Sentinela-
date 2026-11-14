import type { AccessLogEntry } from '../types';
import { db } from './db';

export async function logAccess(entry: Omit<AccessLogEntry, 'id' | 'at'>): Promise<void> {
  const at = new Date().toISOString();
  // Id aleatório: dois acessos no mesmo milissegundo não se sobrescrevem.
  await db.accessLog.put({ ...entry, at, id: crypto.randomUUID() });
}

// Acessos aos dados de um tripulante, do mais novo para o mais antigo.
export async function listAccess(crewId: string): Promise<AccessLogEntry[]> {
  const rows = await db.accessLog.where('subjectCrewId').equals(crewId).toArray();
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}
