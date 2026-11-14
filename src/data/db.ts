import Dexie, { type Table } from 'dexie';
import type { Sealed } from '../lib/crypto';
import type { AccessLogEntry, AlertReview, CrewMember, DailyRecord, GroundPacket, Profile, Settings } from '../types';

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

// O que é dado de saúde fica cifrado (campo `sealed`). Ficam abertos só os campos usados para
// buscar e para a fila de sincronização: ids, tripulante, datas e prioridade.
export type StoredRecord = Omit<DailyRecord, 'values'> & { sealed: Sealed };
export type StoredReview = Omit<AlertReview, 'note'> & { sealed: Sealed };
export type StoredPacket = Omit<GroundPacket, 'payload'> & { sealed: Sealed };
export type StoredProfile = Profile & { salt: Uint8Array; wrappedKey: Sealed };

// Mesmos valores de seed.ts, usados só para atualizar a demonstração já gravada (v3).
const DEMO_CREW_SEX: Record<string, NonNullable<CrewMember['sex']>> = {
  ana: 'female',
  lia: 'female',
  kenji: 'male',
};

// Alertas, correlações e linhas de base não são gravados: são recalculados a partir
// dos registros, então mudar uma regra atualiza tudo.
export class SentinelaDB extends Dexie {
  crew!: Table<CrewMember, string>;
  records!: Table<StoredRecord, string>;
  settings!: Table<SettingsRow, string>;
  profiles!: Table<StoredProfile, string>;
  reviews!: Table<StoredReview, string>;
  accessLog!: Table<AccessLogEntry, string>;
  packets!: Table<StoredPacket, string>;

  constructor() {
    super('sentinela');
    this.version(1).stores({
      crew: 'id',
      records: 'id, crewId, date, [crewId+date]',
      baselines: '[crewId+indicator], crewId',
      settings: 'key',
    });
    // v2: a linha de base passou a ser derivada dos registros e deixou de ser gravada.
    this.version(2).stores({ baselines: null });
    // v3: o tripulante ganhou o campo sex, que escolhe a figura do painel.
    this.version(3).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        if (member.sex === undefined && member.id in DEMO_CREW_SEX) member.sex = DEMO_CREW_SEX[member.id];
      }),
    );
    // v4: perfis com PIN, registros cifrados, alertas vistos, registro de acesso e pacotes para a Terra.
    // Os registros antigos estavam em texto puro e não dá para cifrá-los dentro da atualização do
    // banco (a Web Crypto é assíncrona). Como são da demonstração, são apagados e recriados.
    this.version(4)
      .stores({
        profiles: 'id',
        reviews: 'id, crewId',
        accessLog: 'id, subjectCrewId',
        packets: 'id, crewId',
      })
      .upgrade(async (tx) => {
        await Promise.all(['crew', 'records', 'settings'].map((name) => tx.table(name).clear()));
      });
    // v5: a Ana da demonstração passou a ser a comandante. Só troca o papel do perfil dela.
    this.version(5).upgrade((tx) =>
      tx.table<StoredProfile, string>('profiles').where('id').equals('ana').modify((profile) => {
        profile.role = 'commander';
      }),
    );
  }
}

export const db = new SentinelaDB();
