import { addDays, missionDay, todayISO } from '../lib/dates';
import type { CrewMember, DailyRecord, DailyValues, IndicatorId, Settings } from '../types';
import { db } from './db';

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

interface Profile {
  member: Omit<CrewMember, 'missionStart'>;
  seed: number;
  base: { systolic: number; diastolic: number; heartRate: number; glucose: number; temperature: number; sleepHours: number; exerciseMinutes: number; radiationDose: number };
  // Ajusta os valores dos últimos dias. `daysLeft` é 0 no registro mais recente.
  story?: (values: DailyValues, daysLeft: number) => void;
}

const PROFILES: Profile[] = [
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
      });
    }
  }

  return { crew, records, settings: { environment: 'station', activeCrewId: crew[0].id, reminders: [] } };
}

async function writeSeed(): Promise<void> {
  const seed = buildSeed(todayISO());
  await db.transaction('rw', db.crew, db.records, db.settings, async () => {
    await Promise.all([db.crew.clear(), db.records.clear(), db.settings.clear()]);
    await db.crew.bulkPut(seed.crew);
    await db.records.bulkPut(seed.records);
    await db.settings.put({ key: 'app', value: seed.settings });
  });
}

// Primeira abertura: insere os tripulantes fictícios e os dias simulados.
export async function seedIfEmpty(): Promise<void> {
  if ((await db.crew.count()) === 0) await writeSeed();
}

// Apaga tudo e recria a demonstração terminando em ontem.
export async function resetDemo(): Promise<void> {
  await writeSeed();
}
