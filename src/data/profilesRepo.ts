import {
  importPublicKey, keyFromPin, randomBytes, unwrapDataKey, unwrapPrivateKey, wrapDataKey, wrapPrivateKey,
} from '../lib/crypto';
import type { Profile } from '../types';
import { db, type StoredProfile } from './db';
import type { SessionKeys } from './keyring';

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

export interface ProfileKeys {
  crew: Record<string, CryptoKey>; // as chaves de dados que este perfil pode abrir
  groundPrivate?: CryptoKey;
  commanderPrivate?: CryptoKey;
}

// Guarda cada chave que o perfil pode abrir cifrada com o PIN dele. O PIN não é gravado.
export async function buildProfile(profile: Profile, pin: string, keys: ProfileKeys): Promise<StoredProfile> {
  const salt = randomBytes(16);
  const pinKey = await keyFromPin(pin, salt);
  const crewKeys: StoredProfile['crewKeys'] = {};
  for (const [crewId, key] of Object.entries(keys.crew)) crewKeys[crewId] = await wrapDataKey(key, pinKey);
  return {
    ...profile,
    salt,
    crewKeys,
    groundKey: keys.groundPrivate ? await wrapPrivateKey(keys.groundPrivate, pinKey) : undefined,
    commanderKey: keys.commanderPrivate ? await wrapPrivateKey(keys.commanderPrivate, pinKey) : undefined,
  };
}

// Abre com o PIN as chaves do perfil. PIN errado gera WrongPinError.
export async function unlockProfile(
  profileId: string,
  pin: string,
): Promise<{ profile: Profile; keys: Omit<SessionKeys, 'groundPublic' | 'commanderPublic'> }> {
  const row = await db.profiles.get(profileId);
  if (!row) throw new Error('Perfil não encontrado.');
  const pinKey = await keyFromPin(pin, row.salt);
  try {
    const crew = new Map<string, CryptoKey>();
    for (const [crewId, sealed] of Object.entries(row.crewKeys)) crew.set(crewId, await unwrapDataKey(sealed, pinKey));
    const groundPrivate = row.groundKey ? await unwrapPrivateKey(row.groundKey, pinKey) : undefined;
    const commanderPrivate = row.commanderKey ? await unwrapPrivateKey(row.commanderKey, pinKey) : undefined;
    // Perfil sem nenhuma chave não confere o PIN; não existe na demonstração, mas não pode passar.
    if (crew.size === 0 && !groundPrivate && !commanderPrivate) throw new Error('Perfil sem chaves.');
    const { id, name, role, crewId } = row;
    return { profile: { id, name, role, crewId }, keys: { crew, groundPrivate, commanderPrivate } };
  } catch {
    throw new WrongPinError();
  }
}

// Chaves públicas da missão, para selar o pacote do solo e o resumo do comandante.
export async function loadPublicKeys(): Promise<{ groundPublic?: CryptoKey; commanderPublic?: CryptoKey }> {
  const [ground, commander] = await Promise.all([db.publicKeys.get('ground'), db.publicKeys.get('commander')]);
  return {
    groundPublic: ground ? await importPublicKey(ground.spki) : undefined,
    commanderPublic: commander ? await importPublicKey(commander.spki) : undefined,
  };
}
