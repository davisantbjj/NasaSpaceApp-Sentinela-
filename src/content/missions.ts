import type { CrewMember, Environment, MissionProfileId } from '../types';

// Perfis de missão de referência (M8). O Sentinela serve para qualquer nave: os perfis descrevem o
// tipo de missão, e a nave aparece só como exemplo. Durações e fases vêm das fontes citadas; não são
// números de saúde e não mudam nenhum nível de alerta (o ambiente só muda o texto).

export interface MissionPhase {
  label: string;
  environment: Environment;
  fromDay: number; // primeiro dia da fase (o dia 1 é o início da missão)
  toDay: number; // último dia da fase
}

export interface MissionProfile {
  label: string;
  example: string;
  vehicle: string;
  crewSize: string;
  durationDays: number;
  phases: MissionPhase[];
  note: string;
  sourceUrl: string;
}

export const MISSION_PROFILES: Record<MissionProfileId, MissionProfile> = {
  station: {
    label: 'Estação em órbita baixa',
    example: 'ex.: Estação Espacial Internacional',
    vehicle: 'Estação espacial',
    crewSize: '3 a 7 pessoas',
    durationDays: 180,
    phases: [{ label: 'Estação', environment: 'station', fromDay: 1, toDay: 180 }],
    note: 'Expedição típica de cerca de 6 meses. Algumas duram até cerca de 1 ano.',
    sourceUrl: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/',
  },
  lunarFlyby: {
    label: 'Voo lunar curto, sem pouso',
    example: 'ex.: Artemis II',
    vehicle: 'Cápsula',
    crewSize: '4 pessoas',
    durationDays: 10,
    phases: [{ label: 'Trânsito ao redor da Lua', environment: 'transit', fromDay: 1, toDay: 10 }],
    note: 'Duração planejada de 10 dias, fora da magnetosfera da Terra.',
    sourceUrl: 'https://www.nasa.gov/mission/artemis-ii/',
  },
  mars: {
    label: 'Missão a Marte (referência de planejamento)',
    example: 'arquitetura de referência da NASA, não é uma missão marcada',
    vehicle: 'Nave de trânsito e habitat de superfície',
    crewSize: '6 pessoas',
    durationDays: 914,
    phases: [
      { label: 'Ida', environment: 'transit', fromDay: 1, toDay: 180 },
      { label: 'Superfície de Marte', environment: 'mars', fromDay: 181, toDay: 719 },
      { label: 'Volta', environment: 'transit', fromDay: 720, toDay: 914 },
    ],
    note: 'Cerca de 180 dias de ida, 539 dias em Marte e o restante de volta, num total de 914 dias.',
    sourceUrl: 'https://ntrs.nasa.gov/api/citations/20100028285/downloads/20100028285.pdf',
  },
};

export const MISSION_PROFILE_ORDER: MissionProfileId[] = ['station', 'lunarFlyby', 'mars'];

// Fase do dia da missão. Depois do fim previsto, vale a última fase.
export function phaseOnDay(profile: MissionProfile, day: number): MissionPhase {
  return profile.phases.find((p) => day >= p.fromDay && day <= p.toDay) ?? profile.phases[profile.phases.length - 1];
}

// Quantos dias, do dia 1 até `day`, caíram em cada ambiente.
export function daysByEnvironment(profile: MissionProfile, day: number): Partial<Record<Environment, number>> {
  const result: Partial<Record<Environment, number>> = {};
  for (const phase of profile.phases) {
    const overlap = Math.min(day, phase.toDay) - phase.fromDay + 1;
    if (overlap > 0) result[phase.environment] = (result[phase.environment] ?? 0) + overlap;
  }
  const last = profile.phases[profile.phases.length - 1];
  if (day > last.toDay) result[last.environment] = (result[last.environment] ?? 0) + (day - last.toDay);
  return result;
}

// Próxima mudança para um ambiente com gravidade (M11): pouso na Lua ou em Marte depois de uma fase sem
// gravidade, ou a volta à Terra no fim da missão. `inDays` 0 é hoje. Sem próxima mudança, undefined.
export interface GravityChange {
  label: string;
  day: number;
  inDays: number;
}

const WITH_GRAVITY: Environment[] = ['moon', 'mars'];
const LANDING_LABEL: Partial<Record<Environment, string>> = { moon: 'Pouso na Lua', mars: 'Pouso em Marte' };

export function nextGravityChange(profile: MissionProfile, day: number): GravityChange | undefined {
  const changes: { label: string; day: number }[] = [];
  profile.phases.forEach((phase, i) => {
    const previous = profile.phases[i - 1];
    if (previous && WITH_GRAVITY.includes(phase.environment) && !WITH_GRAVITY.includes(previous.environment)) {
      changes.push({ label: LANDING_LABEL[phase.environment] ?? 'Pouso', day: phase.fromDay });
    }
  });
  changes.push({ label: 'Volta à Terra', day: profile.durationDays + 1 });
  const next = changes.find((c) => c.day >= day);
  return next ? { ...next, inDays: next.day - day } : undefined;
}

// Início da missão: o mais antigo entre os tripulantes.
export function missionStartOf(crew: CrewMember[]): string | undefined {
  return crew.map((c) => c.missionStart).sort()[0];
}
