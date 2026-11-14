import { seal, unseal } from '../lib/crypto';
import type { MedicalMessage } from '../types';
import { db } from './db';
import { requireDataKey } from './keyring';
import { openAll } from './openAll';

export const MEDICAL_MESSAGE_MAX_LENGTH = 2000;

// Mensagens para mostrar ao oficial médico. O texto fica cifrado, como os outros dados de saúde.
export async function listMedicalMessages(crewId: string): Promise<MedicalMessage[]> {
  const key = requireDataKey();
  const rows = await db.medicalMessages.where('crewId').equals(crewId).sortBy('createdAt');
  return openAll(rows, async ({ sealed, ...meta }) => ({ ...meta, body: await unseal<string>(key, sealed) }));
}

export async function saveMedicalMessage(crewId: string, text: string): Promise<void> {
  const body = text.trim();
  if (!body || body.length > MEDICAL_MESSAGE_MAX_LENGTH) {
    throw new Error(`Escreva uma mensagem de 1 a ${MEDICAL_MESSAGE_MAX_LENGTH} caracteres.`);
  }
  if (!(await db.crew.get(crewId))) throw new Error('Tripulante não encontrado.');
  // A cifra é feita fora de transação do Dexie: a Web Crypto é assíncrona e encerraria a transação.
  const sealed = await seal(requireDataKey(), body);
  await db.medicalMessages.add({ id: crypto.randomUUID(), crewId, createdAt: new Date().toISOString(), status: 'local', sealed });
}
