// Tipos de domínio. Fonte: docs/arquitetura.md.

export type Level = 'green' | 'yellow' | 'red';

export type IndicatorId =
  | 'bloodPressure' | 'heartRate' | 'glucose' | 'temperature'
  | 'sleepHours' | 'mood' | 'stress' | 'workload' | 'reactionTime' | 'exerciseMinutes' | 'resistanceMinutes' | 'radiationDose'
  | 'vision' | 'symptoms' | 'medication';

export type BodyRegion =
  | 'head' | 'heart' | 'musculoskeletal' | 'immune'
  | 'metabolism' | 'mind' | 'wholeBody';

export type Environment = 'station' | 'transit' | 'moon' | 'mars';

// Origem de um valor (M10): digitado pela pessoa ou lido de um aparelho. O app não lê aparelhos.
export type DataSource = 'manual' | 'wearable' | 'dosimeter';

// Perfis de missão de referência (src/content/missions.ts, M8).
export type MissionProfileId = 'station' | 'lunarFlyby' | 'mars';

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  missionStart: string; // data ISO, AAAA-MM-DD
  trackedIndicators: IndicatorId[]; // o check-in só pede estes
  sex?: 'female' | 'male'; // figura e contexto educativo; não muda nenhuma faixa
  medications?: PlannedMedication[]; // medicação prevista; sem lista, o check-in não pergunta
}

// Medicação prevista para o tripulante. Na demonstração os nomes são fictícios.
export interface PlannedMedication {
  id: string;
  label: string; // "Suplemento de vitamina D"
  schedule: string; // "1 vez ao dia"
}

// Uma dose prevista no dia e se foi tomada. Guarda o nome junto, para o registro continuar legível
// mesmo se a lista prevista mudar depois.
export interface MedicationDose {
  id: string;
  label: string;
  taken: boolean;
}

export interface DailyValues {
  bloodPressure?: { systolic: number; diastolic: number };
  heartRate?: number;
  glucose?: number;
  temperature?: number;
  sleepHours?: number;
  mood?: 1 | 2 | 3 | 4 | 5;
  stress?: 1 | 2 | 3 | 4 | 5; // 1 = muito baixo, 5 = muito alto
  workload?: 1 | 2 | 3 | 4 | 5; // 1 = muito leve, 5 = excessiva
  reactionTime?: number; // média do teste de reação, em ms (M4)
  exerciseMinutes?: number; // total do dia (aeróbico + resistido)
  resistanceMinutes?: number; // parte do total feita em treino resistido (M3)
  radiationDose?: number;
  vision?: 0 | 1 | 2;
  symptoms?: string[]; // ids de sintomas definidos em rules.json
  medication?: MedicationDose[]; // doses previstas no dia
  sources?: Partial<Record<IndicatorId, DataSource>>; // origem dos valores; ausente = digitado (M10)
}

export interface DailyRecord {
  id: string; // crewId + '_' + date
  crewId: string;
  date: string; // AAAA-MM-DD, um registro por dia
  missionDay: number;
  values: DailyValues;
  createdAt: string;
  syncedAt?: string; // quando chegou à central de bordo; sem valor, ainda está só no aparelho
}

// Papéis e acesso. O comandante é tripulante: vê os próprios dados e, dos outros, só o status de check-in e se há vermelho.
export type Role = 'crew' | 'commander' | 'medicalOfficer' | 'groundSurgeon';

export interface Profile {
  id: string;
  name: string;
  role: Role;
  crewId?: string; // ausente no médico do solo, que não é tripulante
}

export interface Session {
  profileId: string;
  name: string;
  role: Role;
  crewId?: string;
}

// Alerta marcado como visto pelo oficial médico, com a conduta anotada.
export interface AlertReview {
  id: string; // o mesmo id do alerta
  crewId: string;
  date: string;
  indicator: IndicatorId;
  seenByProfileId: string;
  seenBy: string;
  seenAt: string;
  note: string;
  syncedAt?: string;
  // O "visto" vale só para o alerta como estava: se o check-in for refeito ou o nível mudar,
  // o alerta volta a aparecer como não visto (lib/reviews.ts).
  level?: Level;
  recordCreatedAt?: string;
}

// Quem abriu os dados de quem. O tripulante vê os acessos aos dados dele.
export interface AccessLogEntry {
  id: string;
  subjectCrewId: string;
  actorProfileId: string;
  actorName: string;
  actorRole: Role;
  at: string;
  what: string;
}

// Pacote diário que a central de bordo manda para a Terra.
export interface PacketPayload {
  crewName: string;
  crewRole: string;
  missionDay: number;
  environment: Environment;
  recordedAt: string;
  values: DailyValues;
  alerts: { id: string; indicator: IndicatorId; level: Level; whatChanged: string }[];
  notes: { indicator: IndicatorId; note: string; seenBy: string; seenAt: string }[];
}

export interface GroundPacket {
  id: string;
  crewId: string;
  date: string;
  createdAt: string;
  priority: 'red' | 'normal'; // vermelho passa na frente da fila
  waitsFor: string[]; // registros e anotações que precisam chegar à central antes de o pacote sair
  attemptedAt?: string; // primeira tentativa de envio; daí em diante o conteúdo não muda mais
  sentAt?: string;
  deliverAt?: string; // envio + atraso da comunicação no ambiente atual
  payload: PacketPayload;
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
  trigger: 'generalRange' | 'baselineDeviation' | 'symptom' | 'missedMedication';
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
  activeCrewId: string; // tripulante cujos dados estão na tela
  reminders: { indicator: IndicatorId; everyDays: number }[];
  missionProfile?: MissionProfileId; // sem perfil, o ambiente é só o escolhido à mão
  environmentManual?: boolean; // true quando alguém trocou o ambiente à mão, fora da fase da missão
}

// Resumo que o comandante pode ver de cada colega. Fica selado para o comandante.
export interface CrewStatusSummary {
  crewId: string;
  lastCheckinDate: string; // data do último registro
  red: boolean; // se o último registro tem alerta vermelho
}

export interface MedicalMessage {
  id: string;
  crewId: string;
  body: string;
  createdAt: string;
  status: 'local'; // sem entrega até a integração com papéis e central de bordo
}

export interface DeletionRequest {
  id: string;
  crewId: string;
  createdAt: string;
  status: 'pending'; // solicitação local, sem envio a um controlador
}

export interface RangeEvidence {
  status: 'demo-not-clinically-validated';
  generalReferenceUrls: string[];
  green: string;
  yellow: string;
  red: string;
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
  rangeEvidence?: RangeEvidence;
  missedLevel?: 'yellow' | 'red'; // medicação: nível quando uma dose prevista não foi tomada
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
  // Contexto que não vira alerta (M5).
  context?: {
    boneLoss: {
      minPercentPerMonth: number;
      maxPercentPerMonth: number;
      daysPerMonth: number;
      studiedMonths: { min: number; max: number };
      sourceUrl: string;
      demo: boolean;
    };
    radiationTotal?: { sourceUrl: string }; // M6: soma das doses do dia, só contexto
    weeklyGoals?: { windowDays: number; targetDays: number; indicators: IndicatorId[]; demo: boolean }; // M9
    readaptation?: { noticeDaysBefore: number }; // M11: quantos dias antes da mudança de gravidade destacar
  };
}
