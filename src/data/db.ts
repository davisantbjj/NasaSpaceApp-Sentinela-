import Dexie, { type Table } from 'dexie';
import type { CrewMember, DailyRecord, Settings } from '../types';

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

// Alertas, correlações e linhas de base não são gravados: são recalculados a partir
// dos registros, então mudar uma regra atualiza tudo.
export class SentinelaDB extends Dexie {
  crew!: Table<CrewMember, string>;
  records!: Table<DailyRecord, string>;
  settings!: Table<SettingsRow, string>;

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
  }
}

export const db = new SentinelaDB();
