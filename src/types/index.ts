// Tipos de domínio. Fonte: docs/arquitetura.md.

export type Level = 'green' | 'yellow' | 'red';

export type IndicatorId =
  | 'bloodPressure' | 'heartRate' | 'glucose' | 'temperature'
  | 'sleepHours' | 'mood' | 'exerciseMinutes' | 'radiationDose'
  | 'vision' | 'symptoms';

export type BodyRegion =
  | 'head' | 'heart' | 'musculoskeletal' | 'immune'
  | 'metabolism' | 'mind' | 'wholeBody';

export type Environment = 'station' | 'transit' | 'moon' | 'mars';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  missionStart: string; // data ISO, AAAA-MM-DD
  trackedIndicators: IndicatorId[]; // o check-in só pede estes
}

export interface DailyValues {
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  glucose?: number;
  temperature?: number;
  sleepHours?: number;
  mood?: 1 | 2 | 3 | 4 | 5;
  exerciseMinutes?: number;
  radiationDose?: number;
  vision?: 0 | 1 | 2;
  symptoms?: string[]; // ids de sintomas definidos em rules.json
}

export interface DailyRecord {
  id: string; // crewId + '_' + date
  crewId: string;
  date: string; // AAAA-MM-DD, um registro por dia
  missionDay: number;
  values: DailyValues;
  createdAt: string;
}

export type BpComponent = 'systolic' | 'diastolic';

export interface Baseline {
  crewId: string;
  indicator: IndicatorId;
  component?: BpComponent; // só para pressão arterial: uma linha de base por número
  mean: number;
  sampleDays: number; // quantos dias entraram no cálculo
  excludedDays: number; // dias descartados por estarem fora da faixa geral
}

export interface Alert {
  id: string;
  crewId: string;
  date: string;
  indicator: IndicatorId;
  region: BodyRegion;
  level: Level;
  trigger: 'generalRange' | 'baselineDeviation' | 'symptom';
  whatChanged: string;
  reference: string;
  whyItMatters: string;
  whatToDo: string;
  environmentNote?: string; // contexto do ambiente atual, só texto
  confidence: 'normal' | 'low';
  confidenceNote?: string;
  notifyGround: boolean;
  sourceUrl: string;
}

export interface Correlation {
  crewId: string;
  indicators: [IndicatorId, IndicatorId];
  fromDate: string;
  toDate: string;
  description: string;
}

export interface Settings {
  environment: Environment;
  activeCrewId: string;
  reminders: { indicator: IndicatorId; everyDays: number }[];
}

// Formato de src/rules/rules.json

export interface Range {
  min: number;
  max: number;
}

export interface RangePair {
  green: Range;
  yellow: Range;
}

export interface SymptomRule {
  id: string;
  label: string;
  level: 'yellow' | 'red';
}

export interface IndicatorRule {
  label: string; // nome usado nos textos de alerta
  region: BodyRegion;
  unit: string;
  green?: Range; // sem faixa geral: o indicador só usa a linha de base
  yellow?: Range;
  components?: Record<BpComponent, RangePair>; // pressão arterial
  valueLabels?: Record<string, string>; // texto de cada valor de uma escala
  useBaseline: boolean;
  deviationDirection?: 'both' | 'above' | 'below'; // sentido de risco do desvio pessoal
  nasaRisk: string;
  hazards: string[];
  messages: {
    whyItMatters: string;
    whatToDo: { yellow: string; red: string };
  };
  sourceUrl: string;
  demo: boolean;
}

export interface Rules {
  config: {
    baselineDays: number;
    sustainedDays: number;
    baselineDeviationPercent: number;
    demo: boolean;
  };
  indicators: Partial<Record<IndicatorId, IndicatorRule>>;
  symptoms: SymptomRule[];
  environmentNotes: Partial<Record<IndicatorId, Record<Environment, string>>>;
  correlationPairs: [IndicatorId, IndicatorId][];
}
