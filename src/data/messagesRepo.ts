import { seal, unseal } from '../lib/crypto';
import type { MedicalMessage } from '../types';
import { db } from './db';
import { crewKey } from './keyring';
import { openAll } from './openAll';

export const MEDICAL_MESSAGE_MAX_LENGTH = 2000;

// Mensagens para mostrar ao oficial médico. O texto fica selado com a chave do tripulante.
export async function listMedicalMessages(crewId: string): Promise<MedicalMessage[]> {
  const key = crewKey(crewId);
  const rows = await db.medicalMessages.where('crewId').equals(crewId).sortBy('createdAt');
  return openAll(rows, async ({ sealed, ...meta }) => ({ ...meta, body: await unseal<string>(key, sealed, meta.id) }));
}

export async function saveMedicalMessage(crewId: string, text: string): Promise<void> {
  const body = text.trim();
  if (!body || body.length > MEDICAL_MESSAGE_MAX_LENGTH) {
    throw new Error(`Escreva uma mensagem de 1 a ${MEDICAL_MESSAGE_MAX_LENGTH} caracteres.`);
  }
  if (!(await db.crew.get(crewId))) throw new Error('Tripulante não encontrado.');
  // A cifra é feita fora de transação do Dexie: a Web Crypto é assíncrona e encerraria a transação.
  const id = crypto.randomUUID();
  const sealed = await seal(crewKey(crewId), body, id);
  await db.medicalMessages.add({ id, crewId, createdAt: new Date().toISOString(), status: 'local', sealed });
}
