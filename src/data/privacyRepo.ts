import { listAccess } from './accessLogRepo';
import { db } from './db';
import { listMedicalMessages } from './messagesRepo';
import { listRecords } from './recordsRepo';
import { listReviews } from './reviewsRepo';

export const PRIVACY_NOTICE_VERSION = '2026-11-14-v1';

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

// Apaga o histórico de saúde do tripulante neste aparelho: check-ins, anotações do oficial
// médico, mensagens, pedido de exclusão e pacotes que ainda não saíram para a Terra.
// Fica o registro de acesso (é a prestação de contas de quem viu os dados) e o perfil fictício.
// Pacotes que já chegaram à Terra não voltam: a exclusão lá seria pedido à equipe da Terra.
export async function deleteCrewHealthData(crewId: string): Promise<void> {
  await db.transaction('rw', [db.records, db.reviews, db.medicalMessages, db.deletionRequests, db.packets], async () => {
    await db.records.where('crewId').equals(crewId).delete();
    await db.reviews.where('crewId').equals(crewId).delete();
    await db.medicalMessages.where('crewId').equals(crewId).delete();
    await db.deletionRequests.where('crewId').equals(crewId).delete();
    await db.packets.where('crewId').equals(crewId).filter((p) => !p.sentAt).delete();
  });
}
