import Dexie, { type Table } from 'dexie';
import type { Sealed } from '../lib/crypto';
import type {
  AccessLogEntry, AlertReview, CrewMember, DailyRecord, DeletionRequest, GroundPacket, MedicalMessage, PlannedMedication, Profile, Settings,
} from '../types';

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

// Valores dos registros, anotações e texto das mensagens ficam selados (campo `sealed`).
// Metadados de busca/fila ficam abertos. Exceção de saúde: crew.medications (plano previsto)
// permanece sem cifra no cadastro do protótipo; o aviso de privacidade documenta esse limite.
export type StoredRecord = Omit<DailyRecord, 'values'> & { sealed: Sealed };
// Da anotação do oficial médico ficam abertos só ids e horários; nível, indicador e texto vão selados.
export type StoredReview = Pick<AlertReview, 'id' | 'crewId' | 'date' | 'seenAt' | 'syncedAt'> & { sealed: Sealed };
export type StoredPacket = Omit<GroundPacket, 'payload'> & { sealed: Sealed };
export type StoredMessage = Omit<MedicalMessage, 'body'> & { sealed: Sealed };

// Perfil: as chaves que o PIN dele abre, cada uma cifrada com o PIN. O PIN não é gravado.
export type StoredProfile = Profile & {
  salt: Uint8Array;
  crewKeys: Record<string, Sealed>; // crewId -> chave de dados daquele tripulante
  groundKey?: Sealed; // chave privada do solo (só no perfil do médico do solo)
  commanderKey?: Sealed; // chave privada do comandante (só no perfil do comandante)
};

// Chaves públicas da missão, abertas de propósito: servem só para selar.
export interface PublicKeyRow {
  id: 'ground' | 'commander';
  spki: string;
}

// Resumo selado para o comandante: um por tripulante e dia.
export interface StoredStatus {
  id: string; // crewId + '_' + date
  crewId: string;
  date: string;
  waitsFor: string[]; // só vale depois que o registro chega à central
  sealed: Sealed;
}

// Preferências do aparelho, sem dado de saúde (ex.: versão do aviso de privacidade aceita).
export interface PreferenceRow {
  key: string;
  value: string;
}

// Mesmos valores de seed.ts, usados só para atualizar a demonstração já gravada (v3).
const DEMO_CREW_SEX: Record<string, NonNullable<CrewMember['sex']>> = {
  ana: 'female',
  lia: 'female',
  kenji: 'male',
};

// Medicação prevista FICTÍCIA da demonstração (seed.ts), usada também para atualizar o banco já gravado (v8).
export const DEMO_MEDICATIONS: Record<string, PlannedMedication[]> = {
  ana: [
    { id: 'vitaminD', label: 'Suplemento de vitamina D', schedule: '1 vez ao dia' },
    // Remédio para dormir FICTÍCIO, só quando necessário (N14): não marcar não é dose esquecida.
    { id: 'sleepAid', label: 'Remédio para dormir', schedule: 'Só quando necessário', asNeeded: true, sleepAid: true },
  ],
  lia: [
    { id: 'vitaminD', label: 'Suplemento de vitamina D', schedule: '1 vez ao dia' },
    { id: 'eyeDrops', label: 'Colírio lubrificante', schedule: '2 vezes ao dia' },
  ],
};

export const DEMO_START_BODY_MASS_KG: Record<string, number> = {
  ana: 68,
  lia: 62,
  kenji: 78,
};

// Tabelas com dados da demonstração. As preferências (aviso de privacidade lido) ficam fora.
export const DEMO_TABLES = [
  'crew', 'records', 'settings', 'profiles', 'reviews', 'accessLog', 'packets',
  'medicalMessages', 'deletionRequests', 'publicKeys', 'statuses',
] as const;

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
  preferences!: Table<PreferenceRow, string>;
  medicalMessages!: Table<StoredMessage, string>;
  deletionRequests!: Table<DeletionRequest, string>;
  publicKeys!: Table<PublicKeyRow, string>;
  statuses!: Table<StoredStatus, string>;

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
    // v4: perfis com PIN, registros cifrados, alertas vistos, registro de acesso e pacotes.
    this.version(4).stores({
      profiles: 'id',
      reviews: 'id, crewId',
      accessLog: 'id, subjectCrewId',
      packets: 'id, crewId',
    });
    // v5: a Ana da demonstração passou a ser a comandante.
    // v6: privacidade e comunicação (aviso lido, mensagens ao oficial médico, pedidos de exclusão).
    this.version(6).stores({
      preferences: 'key',
      medicalMessages: 'id, crewId, createdAt',
      deletionRequests: 'id, crewId',
    });
    // v7: uma chave por tripulante, caixas seladas para o solo e o comandante. Os dados das versões
    // anteriores (texto puro ou chave única) não abrem com as chaves novas e a Web Crypto não roda
    // dentro da atualização do banco; como são da demonstração, são apagados e recriados.
    this.version(7)
      .stores({ publicKeys: 'id', statuses: 'id, crewId' })
      .upgrade(async (tx) => {
        await Promise.all(DEMO_TABLES.map((name) => tx.table(name).clear()));
      });
    // v8: medicação prevista (M1). Os tripulantes da demonstração já gravados ganham a lista e o
    // indicador, sem apagar o histórico. Os dias antigos ficam sem registro de medicação.
    this.version(8).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        const planned = DEMO_MEDICATIONS[member.id];
        if (!planned || member.medications) return;
        member.medications = planned;
        if (!member.trackedIndicators.includes('medication')) member.trackedIndicators.push('medication');
      }),
    );
    // v9: estresse e carga de trabalho (M2) passam a ser acompanhados por todos os tripulantes já gravados.
    // Os dias antigos ficam sem esses valores.
    this.version(9).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        for (const id of ['stress', 'workload'] as const) {
          if (!member.trackedIndicators.includes(id)) member.trackedIndicators.push(id);
        }
      }),
    );
    // v10: treino resistido (M3) para quem já acompanha exercício. Os dias antigos ficam só com o total.
    this.version(10).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        const tracked = member.trackedIndicators;
        if (tracked.includes('exerciseMinutes') && !tracked.includes('resistanceMinutes')) tracked.push('resistanceMinutes');
      }),
    );
    // v11: teste de reação (M4) para todos os tripulantes já gravados. Os dias antigos ficam sem esse valor.
    this.version(11).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        if (!member.trackedIndicators.includes('reactionTime')) member.trackedIndicators.push('reactionTime');
      }),
    );
    // v12: massa inicial da missão e CO2 da cabine (N11/N13). Os registros antigos
    // permanecem legíveis; a demonstração recriada passa a incluir a nova série.
    this.version(12).upgrade(async (tx) => {
      await tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        const startMass = DEMO_START_BODY_MASS_KG[member.id];
        if (member.startBodyMassKg === undefined && startMass !== undefined) member.startBodyMassKg = startMass;
        if (!member.trackedIndicators.includes('bodyMassKg')) member.trackedIndicators.push('bodyMassKg');
      });
      const settings = await tx.table<SettingsRow, string>('settings').get('app');
      if (settings && settings.value.cabinCo2Mmhg === undefined) {
        settings.value.cabinCo2Mmhg = 2.3;
        await tx.table<SettingsRow, string>('settings').put(settings);
      }
    });
    // v13: alimentação e água (N12) para todos e o remédio para dormir fictício da Ana (N14).
    // Os campos ficaram previstos na v12; esta versão só atualiza o cadastro já gravado.
    // Os dias antigos ficam sem esses valores.
    this.version(13).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        if (!member.trackedIndicators.includes('mealsCompleted')) member.trackedIndicators.push('mealsCompleted');
        const sleepAid = DEMO_MEDICATIONS[member.id]?.find((m) => m.sleepAid);
        if (sleepAid && member.medications && !member.medications.some((m) => m.id === sleepAid.id)) {
          member.medications.push(sleepAid);
        }
      }),
    );
    // v14: acrescentava o condicionamento (N17), retirado na v15. Como a N17 e a N12/N14 foram feitas
    // em paralelo e as duas usaram a v13, esta versão também repete a atualização da N12/N14.
    this.version(14).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        if (!member.trackedIndicators.includes('mealsCompleted')) member.trackedIndicators.push('mealsCompleted');
        const sleepAid = DEMO_MEDICATIONS[member.id]?.find((m) => m.sleepAid);
        if (sleepAid && member.medications && !member.medications.some((m) => m.id === sleepAid.id)) {
          member.medications.push(sleepAid);
        }
      }),
    );
    // v15: sai o condicionamento físico (não há como medir a bordo) e entra o oxímetro (SpO2) para
    // todos. A água passa a ser digitada em mL (waterIntakeMl); registros antigos guardam o sim/não.
    this.version(15).upgrade((tx) =>
      tx.table<CrewMember, string>('crew').toCollection().modify((member) => {
        const tracked = member.trackedIndicators.filter((id) => (id as string) !== 'conditioning');
        if (!tracked.includes('oxygenSaturation')) tracked.push('oxygenSaturation');
        member.trackedIndicators = tracked;
      }),
    );
  }
}

export const db = new SentinelaDB();

async function resetDatabase(): Promise<void> {
  console.warn('Sentinela: o banco local foi gravado por outra versão do app. A demonstração será recriada.');
  db.close();
  await Dexie.delete('sentinela');
  await db.open();
}

// Abre o banco local. Um navegador que já abriu outra versão do app pode ter o banco num formato
// que esta versão não abre (versão maior, ou atualização que falha): aí o banco é apagado e aberto
// de novo, e o seedIfEmpty recria a demonstração. Os dados são só da demonstração.
export async function openDatabase(): Promise<void> {
  try {
    await db.open();
  } catch (error) {
    console.warn('Sentinela: não foi possível abrir o banco local.', error);
    await resetDatabase();
  }
}
