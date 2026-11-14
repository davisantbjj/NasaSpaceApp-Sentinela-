import { db } from './db';

export const PRIVACY_NOTICE_VERSION = '2026-11-14-v1';

export async function hasAcknowledgedPrivacyNotice(): Promise<boolean> {
  return (await db.preferences.get('privacyNotice'))?.value === PRIVACY_NOTICE_VERSION;
}

export async function acknowledgePrivacyNotice(): Promise<void> {
  await db.preferences.put({ key: 'privacyNotice', value: PRIVACY_NOTICE_VERSION });
}

export async function exportCrewData(crewId: string) {
  return db.transaction('r', db.crew, db.records, db.medicalMessages, db.deletionRequests, async () => {
    const crew = await db.crew.get(crewId);
    if (!crew) throw new Error('Tripulante não encontrado.');
    return {
      format: 'sentinela-crew-export',
      version: 1,
      exportedAt: new Date().toISOString(),
      notice: 'Protótipo com perfis simulados. Exportação local, sem envio. Não é portabilidade regulamentada.',
      crew,
      records: await db.records.where('crewId').equals(crewId).sortBy('date'),
      medicalMessages: await db.medicalMessages.where('crewId').equals(crewId).sortBy('createdAt'),
      deletionRequests: await db.deletionRequests.where('crewId').equals(crewId).toArray(),
    };
  });
}

export async function requestCrewDataDeletion(crewId: string): Promise<void> {
  await db.transaction('rw', db.crew, db.deletionRequests, async () => {
    if (!await db.crew.get(crewId)) throw new Error('Tripulante não encontrado.');
    // Uma solicitação por perfil; repetir não altera o protocolo nem a data.
    if (await db.deletionRequests.get(crewId)) return;
    await db.deletionRequests.put({ id: crewId, crewId, createdAt: new Date().toISOString(), status: 'pending' });
  });
}

export async function getCrewDeletionRequest(crewId: string) {
  return db.deletionRequests.get(crewId);
}

export async function deleteCrewHealthData(crewId: string): Promise<void> {
  await db.transaction('rw', db.records, db.medicalMessages, db.deletionRequests, async () => {
    await db.records.where('crewId').equals(crewId).delete();
    await db.medicalMessages.where('crewId').equals(crewId).delete();
    await db.deletionRequests.where('crewId').equals(crewId).delete();
  });
  // O perfil fictício é mantido: seedIfEmpty não deve recriar registros apagados.
}
