import { seal, unseal } from '../lib/crypto';
import type { AlertReview } from '../types';
import { db, type StoredReview } from './db';
import { requireDataKey } from './keyring';
import { openAll } from './openAll';

// Alertas marcados como vistos pelo oficial médico. A conduta anotada fica cifrada.
export async function listReviews(crewId: string): Promise<AlertReview[]> {
  const key = requireDataKey();
  const rows = await db.reviews.where('crewId').equals(crewId).toArray();
  return openAll(rows, async ({ sealed, ...meta }) => ({ ...meta, note: await unseal<string>(key, sealed) }));
}

export async function saveReview({ note, ...meta }: AlertReview): Promise<void> {
  await db.reviews.put({ ...meta, syncedAt: undefined, sealed: await seal(requireDataKey(), note) });
}

export async function listUnsyncedReviews(): Promise<Omit<StoredReview, 'sealed'>[]> {
  const rows = await db.reviews.filter((r) => !r.syncedAt).toArray();
  return rows.map(({ sealed: _sealed, ...meta }) => meta);
}

export async function markReviewsSynced(ids: string[], at: string): Promise<void> {
  if (ids.length > 0) await db.reviews.where('id').anyOf(ids).modify({ syncedAt: at });
}
