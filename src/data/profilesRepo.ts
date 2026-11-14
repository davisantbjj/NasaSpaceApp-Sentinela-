import { keyFromPin, randomBytes, unwrapDataKey, wrapDataKey } from '../lib/crypto';
import type { Profile } from '../types';
import { db, type StoredProfile } from './db';

export class WrongPinError extends Error {
  constructor() {
    super('PIN incorreto.');
  }
}

export async function listProfiles(): Promise<Profile[]> {
  const rows = await db.profiles.toArray();
  // Tripulantes primeiro, em ordem alfabética; o médico do solo por último.
  return rows
    .map(({ id, name, role, crewId }) => ({ id, name, role, crewId }))
    .sort((a, b) => Number(a.role === 'groundSurgeon') - Number(b.role === 'groundSurgeon') || a.name.localeCompare(b.name));
}

// Guarda uma cópia da chave de dados cifrada com o PIN do perfil. O PIN não é gravado.
export async function buildProfile(profile: Profile, pin: string, dataKey: CryptoKey): Promise<StoredProfile> {
  const salt = randomBytes(16);
  const wrappedKey = await wrapDataKey(dataKey, await keyFromPin(pin, salt));
  return { ...profile, salt, wrappedKey };
}

// Abre a chave de dados com o PIN. PIN errado gera WrongPinError.
export async function unlockProfile(profileId: string, pin: string): Promise<{ profile: Profile; dataKey: CryptoKey }> {
  const row = await db.profiles.get(profileId);
  if (!row) throw new Error('Perfil não encontrado.');
  try {
    const dataKey = await unwrapDataKey(row.wrappedKey, await keyFromPin(pin, row.salt));
    const { id, name, role, crewId } = row;
    return { profile: { id, name, role, crewId }, dataKey };
  } catch {
    throw new WrongPinError();
  }
}
