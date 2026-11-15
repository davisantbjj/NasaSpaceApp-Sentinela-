import { listAccess } from './accessLogRepo';
import { db } from './db';
import { listMedicalMessages } from './messagesRepo';
import { listRecords } from './recordsRepo';
import { listReviews } from './reviewsRepo';

export const PRIVACY_NOTICE_VERSION = '2026-11-15-v6';

export async function hasAcknowledgedPrivacyNotice(): Promise<boolean> {
  return (await db.preferences.get('privacyNotice'))?.value === PRIVACY_NOTICE_VERSION;
}

export async function acknowledgePrivacyNotice(): Promise<void> {
  await db.preferences.put({ key: 'privacyNotice', value: PRIVACY_NOTICE_VERSION });
}

// Cópia legível dos dados de um tripulante. Os dados ficam cifrados no aparelho, então a cópia
// é montada pelos repositórios, que abrem com a chave da sessão (precisa estar dentro).
export async function exportCrewData(crewId: string) {
  const crew = await db.crew.get(crewId);
  if (!crew) throw new Error('Tripulante não encontrado.');
  const [records, reviews, medicalMessages, accessLog, deletionRequests] = await Promise.all([
    listRecords(crewId),
    listReviews(crewId),
    listMedicalMessages(crewId),
    listAccess(crewId),
    db.deletionRequests.where('crewId').equals(crewId).toArray(),
  ]);
  return {
    format: 'sentinela-crew-export',
    version: 2,
    exportedAt: new Date().toISOString(),
    notice: 'Protótipo com perfis simulados. Exportação local, sem envio. Não é portabilidade regulamentada.',
    crew,
    records,
    alertReviews: reviews,
    medicalMessages,
    accessLog,
    deletionRequests,
  };
}

export async function requestCrewDataDeletion(crewId: string): Promise<void> {
  await db.transaction('rw', db.crew, db.deletionRequests, async () => {
    if (!(await db.crew.get(crewId))) throw new Error('Tripulante não encontrado.');
    // Uma solicitação por perfil; repetir não altera o protocolo nem a data.
    if (await db.deletionRequests.get(crewId)) return;
    await db.deletionRequests.put({ id: crewId, crewId, createdAt: new Date().toISOString(), status: 'pending' });
  });
}

export async function getCrewDeletionRequest(crewId: string) {
  return db.deletionRequests.get(crewId);
}
