import { db } from './db';
import type { MedicalMessage } from '../types';

export const MEDICAL_MESSAGE_MAX_LENGTH = 2000;

export async function listMedicalMessages(crewId: string): Promise<MedicalMessage[]> {
  return db.medicalMessages.where('crewId').equals(crewId).sortBy('createdAt');
}

export async function saveMedicalMessage(crewId: string, text: string): Promise<void> {
  const body = text.trim();
  if (!body || body.length > MEDICAL_MESSAGE_MAX_LENGTH) {
    throw new Error(`Escreva uma mensagem de 1 a ${MEDICAL_MESSAGE_MAX_LENGTH} caracteres.`);
  }
  await db.transaction('rw', db.crew, db.medicalMessages, async () => {
    if (!await db.crew.get(crewId)) throw new Error('Tripulante não encontrado.');
    await db.medicalMessages.add({ id: crypto.randomUUID(), crewId, body, createdAt: new Date().toISOString(), status: 'local' });
  });
}
