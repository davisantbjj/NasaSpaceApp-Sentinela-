import { seal, unseal } from '../lib/crypto';
import type { AlertReview } from '../types';
import { db, type StoredReview } from './db';
import { crewKey } from './keyring';
import { openAll } from './openAll';

type SealedPart = Omit<AlertReview, 'id' | 'crewId' | 'date' | 'seenAt' | 'syncedAt'>;

// Alertas marcados como vistos pelo oficial médico. Nível, indicador, autor e conduta vão selados
// com a chave do tripulante: abrem para ele e para o oficial médico, não para os colegas.
export async function listReviews(crewId: string): Promise<AlertReview[]> {
  const key = crewKey(crewId);
  const rows = await db.reviews.where('crewId').equals(crewId).toArray();
  return openAll(rows, async ({ sealed, ...meta }) => ({ ...meta, ...(await unseal<SealedPart>(key, sealed, meta.id)) }));
}

export async function saveReview(review: AlertReview): Promise<void> {
  const { id, crewId, date, seenAt, syncedAt: _syncedAt, ...rest } = review;
  await db.reviews.put({ id, crewId, date, seenAt, syncedAt: undefined, sealed: await seal(crewKey(crewId), rest, id) });
}

export async function listUnsyncedReviews(): Promise<Omit<StoredReview, 'sealed'>[]> {
  const rows = await db.reviews.filter((r) => !r.syncedAt).toArray();
  return rows.map(({ sealed: _sealed, ...meta }) => meta);
}

export async function markReviewsSynced(ids: string[], at: string): Promise<void> {
  if (ids.length > 0) await db.reviews.where('id').anyOf(ids).modify({ syncedAt: at });
}
