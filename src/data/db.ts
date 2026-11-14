import Dexie, { type Table } from 'dexie';
import type { CrewMember, DailyRecord, DeletionRequest, MedicalMessage, Settings } from '../types';

// Mesmos valores de seed.ts, usados só para atualizar a demonstração já gravada.
const DEMO_CREW_SEX: Record<string, NonNullable<CrewMember['sex']>> = {
  ana: 'female',
  lia: 'female',
  kenji: 'male',
};

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

export interface PreferenceRow {
  key: string;
  value: string;
}

// Alertas, correlações e linhas de base não são gravados: são recalculados a partir
// dos registros, então mudar uma regra atualiza tudo.
export class SentinelaDB extends Dexie {
  crew!: Table<CrewMember, string>;
  records!: Table<DailyRecord, string>;
  settings!: Table<SettingsRow, string>;
  preferences!: Table<PreferenceRow, string>;
  medicalMessages!: Table<MedicalMessage, string>;
  deletionRequests!: Table<DeletionRequest, string>;

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
    // v3: o tripulante ganhou o campo sex, que escolhe a figura do painel. A demonstração
    // gravada antes disso não tem o campo; preenche aqui para a Ana e a Lia já abrirem
    // com a figura feminina, sem precisar recriar a demonstração.
    this.version(3).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        if (member.sex === undefined && member.id in DEMO_CREW_SEX) member.sex = DEMO_CREW_SEX[member.id];
      }),
    );
    this.version(4).stores({
      preferences: 'key',
      medicalMessages: 'id, crewId, createdAt',
      deletionRequests: 'id, crewId',
    });
  }
}

export const db = new SentinelaDB();
