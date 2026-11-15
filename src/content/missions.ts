import type { CrewMember, Environment, MissionProfileId } from '../types';

// Perfis de missão de referência (M8). O Sentinela serve para qualquer nave: os perfis descrevem o
// tipo de missão, e a nave aparece só como exemplo. Durações e fases vêm das fontes citadas; não são
// números de saúde e não mudam nenhum nível de alerta (o ambiente só muda o texto).

export interface MissionPhase {
  labelKey: string;
  environment: Environment;
  fromDay: number; // primeiro dia da fase (o dia 1 é o início da missão)
  toDay: number; // último dia da fase
}

export interface MissionProfile {
  labelKey: string;
  exampleKey: string;
  vehicleKey: string;
  crewSizeKey: string;
  durationDays: number;
  phases: MissionPhase[];
  noteKey: string;
  sourceUrl: string;
}

export const MISSION_PROFILES: Record<MissionProfileId, MissionProfile> = {
  station: {
    labelKey: 'common:missionProfiles.station.label',
    exampleKey: 'common:missionProfiles.station.example',
    vehicleKey: 'common:missionProfiles.station.vehicle',
    crewSizeKey: 'common:missionProfiles.station.crewSize',
    durationDays: 180,
    phases: [{ labelKey: 'common:missionProfiles.station.phases.station', environment: 'station', fromDay: 1, toDay: 180 }],
    noteKey: 'common:missionProfiles.station.note',
    sourceUrl: 'https://www.nasa.gov/reference/risk-of-spaceflight-induced-bone-changes/',
  },
  lunarFlyby: {
    labelKey: 'common:missionProfiles.lunarFlyby.label',
    exampleKey: 'common:missionProfiles.lunarFlyby.example',
    vehicleKey: 'common:missionProfiles.lunarFlyby.vehicle',
    crewSizeKey: 'common:missionProfiles.lunarFlyby.crewSize',
    durationDays: 10,
    phases: [{ labelKey: 'common:missionProfiles.lunarFlyby.phases.transit', environment: 'transit', fromDay: 1, toDay: 10 }],
    noteKey: 'common:missionProfiles.lunarFlyby.note',
    sourceUrl: 'https://www.nasa.gov/mission/artemis-ii/',
  },
  mars: {
    labelKey: 'common:missionProfiles.mars.label',
    exampleKey: 'common:missionProfiles.mars.example',
    vehicleKey: 'common:missionProfiles.mars.vehicle',
    crewSizeKey: 'common:missionProfiles.mars.crewSize',
    durationDays: 914,
    phases: [
      { labelKey: 'common:missionProfiles.mars.phases.outbound', environment: 'transit', fromDay: 1, toDay: 180 },
      { labelKey: 'common:missionProfiles.mars.phases.surface', environment: 'mars', fromDay: 181, toDay: 719 },
      { labelKey: 'common:missionProfiles.mars.phases.return', environment: 'transit', fromDay: 720, toDay: 914 },
    ],
    noteKey: 'common:missionProfiles.mars.note',
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
  labelKey: string;
  day: number;
  inDays: number;
}

const WITH_GRAVITY: Environment[] = ['moon', 'mars'];
const LANDING_LABEL: Partial<Record<Environment, string>> = { moon: 'common:mission.gravityChange.moonLanding', mars: 'common:mission.gravityChange.marsLanding' };

export function nextGravityChange(profile: MissionProfile, day: number): GravityChange | undefined {
  const changes: { labelKey: string; day: number }[] = [];
  profile.phases.forEach((phase, i) => {
    const previous = profile.phases[i - 1];
    if (previous && WITH_GRAVITY.includes(phase.environment) && !WITH_GRAVITY.includes(previous.environment)) {
      changes.push({ labelKey: LANDING_LABEL[phase.environment] ?? 'common:mission.gravityChange.landing', day: phase.fromDay });
    }
  });
  changes.push({ labelKey: 'common:mission.gravityChange.earthReturn', day: profile.durationDays + 1 });
  const next = changes.find((c) => c.day >= day);
  return next ? { ...next, inDays: next.day - day } : undefined;
}

// Início da missão: o mais antigo entre os tripulantes.
export function missionStartOf(crew: CrewMember[]): string | undefined {
  return crew.map((c) => c.missionStart).sort()[0];
}
