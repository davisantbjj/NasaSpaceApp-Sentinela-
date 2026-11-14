import 'fake-indexeddb/auto';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { unseal } from '../lib/crypto';
import { db, openDatabase } from './db';
import { clearSessionKeys, crewKey, setSessionKeys } from './keyring';
import { listMedicalMessages, saveMedicalMessage } from './messagesRepo';
import { listPacketMeta, listPacketsForGround, listStatusesForCommander } from './packetsRepo';
import { loadPublicKeys, unlockProfile } from './profilesRepo';
import { listRecords } from './recordsRepo';
import { resetDemo } from './seed';

// Resposta à crítica "no código, todo mundo pode ver o de todo mundo": cada teste entra com um
// perfil e tenta abrir dados dos outros direto pelos repositórios e pelo banco, sem passar pela tela.

async function enter(profileId: string, pin: string) {
  const { keys } = await unlockProfile(profileId, pin);
  setSessionKeys({ ...keys, ...(await loadPublicKeys()) });
}

const everyId = () => true;

beforeAll(async () => {
  await openDatabase();
  await resetDemo();
}, 120_000);

afterEach(() => clearSessionKeys());

describe('cada tripulante só abre os próprios dados', () => {
  it('a Lia abre os registros dela e não abre os da Ana nem os do Kenji', async () => {
    await enter('lia', '3333');
    expect(await listRecords('lia')).toHaveLength(60);
    await expect(listRecords('ana')).rejects.toThrow('Sem acesso');
    await expect(listRecords('kenji')).rejects.toThrow('Sem acesso');
  }, 30_000);

  it('nem lendo a linha crua do banco a chave da Lia decifra um registro da Ana', async () => {
    await enter('lia', '3333');
    const row = await db.records.where('crewId').equals('ana').first();
    expect(row).toBeDefined();
    expect('values' in row!).toBe(false); // no banco só há o conteúdo selado
    await expect(unseal(crewKey('lia'), row!.sealed, row!.id)).rejects.toThrow();
  }, 30_000);

  it('o conteúdo selado de um registro não serve no lugar de outro (preso ao id)', async () => {
    await enter('lia', '3333');
    const [first, second] = await db.records.where('crewId').equals('lia').limit(2).toArray();
    await expect(unseal(crewKey('lia'), first.sealed, second.id)).rejects.toThrow();
  }, 30_000);

  it('mensagens ao oficial médico também ficam presas ao dono', async () => {
    await enter('ana', '1111');
    await saveMedicalMessage('ana', 'Exemplo fictício: dor de cabeça desde ontem.');
    expect((await listMedicalMessages('ana')).map((m) => m.body)).toEqual(['Exemplo fictício: dor de cabeça desde ontem.']);
    clearSessionKeys();
    await enter('lia', '3333');
    await expect(listMedicalMessages('ana')).rejects.toThrow('Sem acesso');
  }, 30_000);
});

describe('papéis', () => {
  it('o oficial médico abre os registros de todos', async () => {
    await enter('kenji', '2222');
    for (const crewId of ['ana', 'kenji', 'lia']) expect(await listRecords(crewId)).toHaveLength(60);
  }, 30_000);

  it('a comandante não abre os registros dos colegas, mas abre o resumo selado para ela', async () => {
    await enter('ana', '1111');
    await expect(listRecords('lia')).rejects.toThrow('Sem acesso');
    const summaries = await listStatusesForCommander(everyId);
    expect(summaries.map((s) => s.crewId).sort()).toEqual(['ana', 'kenji', 'lia']);
    // O resumo só tem data do último check-in e se há vermelho.
    expect(Object.keys(summaries[0]).sort()).toEqual(['crewId', 'lastCheckinDate', 'red']);
  }, 30_000);

  it('quem não é comandante não abre o resumo', async () => {
    await enter('kenji', '2222');
    await expect(listStatusesForCommander(everyId)).rejects.toThrow('Sem acesso');
  }, 30_000);

  it('o médico do solo abre os pacotes, e nenhum registro de bordo', async () => {
    await enter('ground', '4444');
    const packets = await listPacketsForGround();
    expect(new Set(packets.map((p) => p.crewId))).toEqual(new Set(['ana', 'kenji', 'lia']));
    expect(packets[0].payload.values).toBeDefined();
    for (const crewId of ['ana', 'kenji', 'lia']) await expect(listRecords(crewId)).rejects.toThrow('Sem acesso');
  }, 30_000);

  it('a bordo ninguém abre o pacote do solo, nem o oficial médico: só vê os metadados', async () => {
    await enter('kenji', '2222');
    await expect(listPacketsForGround()).rejects.toThrow('Sem acesso');
    const meta = await listPacketMeta();
    expect(meta.length).toBeGreaterThan(0);
    expect('payload' in meta[0]).toBe(false);
  }, 30_000);
});

describe('PIN', () => {
  it('PIN errado não abre nada', async () => {
    await expect(unlockProfile('lia', '9999')).rejects.toThrow('PIN incorreto');
  }, 30_000);
});
