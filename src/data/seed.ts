import { addDays, missionDay, todayISO } from '../lib/dates';
import { createDataKey, createKeyPair, exportPublicKey } from '../lib/crypto';
import { composeForDay } from '../sync/compose';
import type { CrewMember, DailyRecord, DailyValues, IndicatorId, Profile, Settings } from '../types';
import { db, DEMO_TABLES } from './db';
import { clearSessionKeys, setSessionKeys } from './keyring';
import { buildProfile } from './profilesRepo';
import { sealRecord } from './recordsRepo';

// Dados SIMULADOS para a demonstração. Nenhum valor aqui vem de uma pessoa real.
// Os registros vão até ontem, para o check-in de hoje ficar pendente.

const SEED_DAYS = 60;

const ALL_BUT_GLUCOSE: IndicatorId[] = [
  'bloodPressure', 'heartRate', 'temperature', 'sleepHours', 'mood',
  'exerciseMinutes', 'radiationDose', 'vision', 'symptoms',
];

// Gerador pseudoaleatório com semente, para a demonstração ser sempre igual.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SeedProfile {
  member: Omit<CrewMember, 'missionStart'>;
  seed: number;
  base: { systolic: number; diastolic: number; heartRate: number; glucose: number; temperature: number; sleepHours: number; exerciseMinutes: number; radiationDose: number };
  // Ajusta os valores dos últimos dias. `daysLeft` é 0 no registro mais recente.
  story?: (values: DailyValues, daysLeft: number) => void;
}

const PROFILES: SeedProfile[] = [
  {
    // Caso preparado para a demonstração: o sono cai por vários dias e depois o humor.
    member: { id: 'ana', name: 'Ana Ribeiro', role: 'Comandante', sex: 'female', trackedIndicators: ALL_BUT_GLUCOSE },
    seed: 11,
    base: { systolic: 116, diastolic: 74, heartRate: 66, glucose: 88, temperature: 36.6, sleepHours: 7.5, exerciseMinutes: 88, radiationDose: 420 },
    story: (values, daysLeft) => {
      const sleep = [5.2, 5.3, 5.6, 5.9, 6.3, 6.7, 7.0];
      const mood = [3, 3, 3, 3, 4, 4, 4] as const;
      if (daysLeft < sleep.length) {
        values.sleepHours = sleep[daysLeft];
        values.mood = mood[daysLeft];
      }
    },
  },
  {
    // Tudo dentro do esperado. É o único que acompanha glicemia.
    member: { id: 'kenji', name: 'Kenji Mori', role: 'Médico de bordo', sex: 'male', trackedIndicators: ['glucose', ...ALL_BUT_GLUCOSE] },
    seed: 23,
    base: { systolic: 121, diastolic: 78, heartRate: 71, glucose: 86, temperature: 36.5, sleepHours: 7.8, exerciseMinutes: 95, radiationDose: 415 },
  },
  {
    // Mudança leve na visão nos últimos dias, com dor de cabeça.
    member: { id: 'lia', name: 'Lia Santos', role: 'Engenheira de voo', sex: 'female', trackedIndicators: ALL_BUT_GLUCOSE },
    seed: 37,
    base: { systolic: 112, diastolic: 72, heartRate: 74, glucose: 90, temperature: 36.7, sleepHours: 7.6, exerciseMinutes: 82, radiationDose: 425 },
    story: (values, daysLeft) => {
      if (daysLeft < 2) values.vision = 1;
      if (daysLeft === 0) values.symptoms = ['headache'];
    },
  },
];

export function buildSeed(today: string): { crew: CrewMember[]; records: DailyRecord[]; settings: Settings } {
  const lastDate = addDays(today, -1);
  const missionStart = addDays(lastDate, -(SEED_DAYS - 1));
  const crew: CrewMember[] = [];
  const records: DailyRecord[] = [];

  for (const profile of PROFILES) {
    const random = mulberry32(profile.seed);
    // Variação em torno do valor de base, limitada a ±spread.
    const around = (center: number, spread: number, decimals = 0) => {
      const factor = 10 ** decimals;
      return Math.round((center + (random() * 2 - 1) * spread) * factor) / factor;
    };
    const { base } = profile;
    crew.push({ ...profile.member, missionStart });

    for (let i = 0; i < SEED_DAYS; i += 1) {
      const date = addDays(missionStart, i);
      const all: DailyValues = {
        bloodPressure: { systolic: around(base.systolic, 5), diastolic: around(base.diastolic, 4) },
        heartRate: around(base.heartRate, 4),
        glucose: around(base.glucose, 5),
        temperature: around(base.temperature, 0.2, 1),
        sleepHours: around(base.sleepHours, 0.3, 1),
        mood: random() < 0.75 ? 4 : 5,
        exerciseMinutes: around(base.exerciseMinutes, 7),
        radiationDose: around(base.radiationDose, 20),
        vision: 0,
        symptoms: [],
      };
      profile.story?.(all, SEED_DAYS - 1 - i);

      const values: DailyValues = {};
      for (const indicator of profile.member.trackedIndicators) {
        Object.assign(values, { [indicator]: all[indicator] });
      }
      records.push({
        id: `${profile.member.id}_${date}`,
        crewId: profile.member.id,
        date,
        missionDay: missionDay(missionStart, date),
        values,
        createdAt: `${date}T08:00:00`,
        syncedAt: `${date}T08:05:00`, // a demonstração já chegou à central
      });
    }
  }

  return {
    crew,
    records,
    settings: { environment: 'station', activeCrewId: crew[0].id, reminders: [] },
  };
}

// Perfis de entrada da demonstração. Os PINs aparecem na tela de entrada, porque é uma demo.
// A Ana é a comandante. O Kenji é o oficial médico de bordo. O médico do solo não é tripulante.
export const DEMO_PROFILES: (Profile & { pin: string })[] = [
  { id: 'ana', name: 'Ana Ribeiro', role: 'commander', crewId: 'ana', pin: '1111' },
  { id: 'kenji', name: 'Kenji Mori', role: 'medicalOfficer', crewId: 'kenji', pin: '2222' },
  { id: 'lia', name: 'Lia Santos', role: 'crew', crewId: 'lia', pin: '3333' },
  { id: 'ground', name: 'Médico de voo', role: 'groundSurgeon', pin: '4444' },
];

async function writeSeed(): Promise<void> {
  const seed = buildSeed(todayISO());

  // Uma chave de dados por tripulante e um par de chaves para o solo e outro para o comandante,
  // novos a cada demonstração. Cada perfil guarda, cifradas no próprio PIN, só as chaves que pode abrir:
  // - tripulante: a dele;
  // - oficial médico: a dele e a de todos os tripulantes;
  // - comandante: a dele e a privada do comandante (resumo de check-in e vermelho dos colegas);
  // - médico do solo: só a privada do solo (pacotes que chegaram à Terra).
  const crewKeys = Object.fromEntries(await Promise.all(seed.crew.map(async (c) => [c.id, await createDataKey()] as const)));
  const ground = await createKeyPair();
  const commander = await createKeyPair();
  const profiles = await Promise.all(
    DEMO_PROFILES.map(({ pin, ...profile }) =>
      buildProfile(profile, pin, {
        crew:
          profile.role === 'medicalOfficer'
            ? crewKeys
            : profile.crewId
              ? { [profile.crewId]: crewKeys[profile.crewId] }
              : {},
        groundPrivate: profile.role === 'groundSurgeon' ? ground.privateKey : undefined,
        commanderPrivate: profile.role === 'commander' ? commander.privateKey : undefined,
      }),
    ),
  );
  const records = await Promise.all(seed.records.map((record) => sealRecord(crewKeys[record.crewId], record)));
  // Fora da transação: a Web Crypto é assíncrona e encerraria a transação do Dexie.
  const publicKeys = [
    { id: 'ground' as const, spki: await exportPublicKey(ground.publicKey) },
    { id: 'commander' as const, spki: await exportPublicKey(commander.publicKey) },
  ];

  const tables = DEMO_TABLES.map((name) => db.table(name));
  await db.transaction('rw', tables, async () => {
    await Promise.all(tables.map((table) => table.clear()));
    await db.crew.bulkPut(seed.crew);
    await db.records.bulkPut(records);
    await db.profiles.bulkPut(profiles);
    await db.publicKeys.bulkPut(publicKeys);
    await db.settings.put({ key: 'app', value: seed.settings });
  });

  // Pacote e resumo iniciais de cada tripulante, como se cada um tivesse feito o último check-in.
  // As chaves ficam abertas só durante esta montagem e são apagadas da memória em seguida.
  setSessionKeys({
    crew: new Map(Object.entries(crewKeys)),
    groundPublic: ground.publicKey,
    commanderPublic: commander.publicKey,
  });
  try {
    for (const member of seed.crew) {
      const last = seed.records.filter((r) => r.crewId === member.id).at(-1);
      if (last) await composeForDay(member, last.date, seed.settings.environment);
    }
  } finally {
    clearSessionKeys();
  }
}

// Primeira abertura: insere os tripulantes fictícios e os dias simulados.
export async function seedIfEmpty(): Promise<void> {
  if ((await db.profiles.count()) === 0) await writeSeed();
}

// Apaga tudo (inclusive perfis, chaves, alertas vistos, acessos e pacotes) e recria a demonstração terminando em ontem.
export async function resetDemo(): Promise<void> {
  await writeSeed();
}
