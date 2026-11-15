import type { BodyRegion, Environment, IndicatorId } from '../types';
import i18n from '../i18n';

export interface ScaleOption {
  value: number;
  labelKey: string;
  symbol: string;
}

export interface TranslatedScaleOption extends ScaleOption {
  label: string;
}

export interface IndicatorContent {
  labelKey: string;
  unit: string; // como aparece ao lado do valor
  unitKey?: string;
  howToMeasureKey: string;
  whyMeasureKey: string;
  // Limites do campo de entrada. Só evitam erro de digitação: não são faixas clínicas
  // (essas ficam em src/rules/rules.json).
  input?: { min: number; max: number; step: number };
  scale?: ScaleOption[];
}

// Ordem dos passos do check-in (docs/diagramas/05-navegacao-telas.md).
export const CHECKIN_ORDER: IndicatorId[] = [
  'bloodPressure', 'heartRate', 'temperature', 'glucose', 'sleepHours',
  'mood', 'stress', 'workload', 'exerciseMinutes', 'radiationDose', 'vision', 'medication', 'symptoms',
];

export const INDICATORS: Record<IndicatorId, IndicatorContent> = {
  bloodPressure: {
    labelKey: 'indicators:bloodPressure.label',
    unit: 'mmHg',
    howToMeasureKey: 'indicators:bloodPressure.howToMeasure',
    whyMeasureKey: 'indicators:bloodPressure.whyMeasure',
    input: { min: 40, max: 250, step: 1 },
  },
  heartRate: {
    labelKey: 'indicators:heartRate.label',
    unit: 'bpm',
    howToMeasureKey: 'indicators:heartRate.howToMeasure',
    whyMeasureKey: 'indicators:heartRate.whyMeasure',
    input: { min: 20, max: 250, step: 1 },
  },
  temperature: {
    labelKey: 'indicators:temperature.label',
    unit: '°C',
    howToMeasureKey: 'indicators:temperature.howToMeasure',
    whyMeasureKey: 'indicators:temperature.whyMeasure',
    input: { min: 30, max: 45, step: 0.1 },
  },
  glucose: {
    labelKey: 'indicators:glucose.label',
    unit: 'mg/dL',
    howToMeasureKey: 'indicators:glucose.howToMeasure',
    whyMeasureKey: 'indicators:glucose.whyMeasure',
    input: { min: 20, max: 600, step: 1 },
  },
  sleepHours: {
    labelKey: 'indicators:sleepHours.label',
    unit: 'h',
    howToMeasureKey: 'indicators:sleepHours.howToMeasure',
    whyMeasureKey: 'indicators:sleepHours.whyMeasure',
    input: { min: 0, max: 24, step: 0.1 },
  },
  mood: {
    labelKey: 'indicators:mood.label',
    unit: '',
    unitKey: 'indicators:units.scaleOfFive',
    howToMeasureKey: 'indicators:mood.howToMeasure',
    whyMeasureKey: 'indicators:mood.whyMeasure',
    scale: [
      { value: 1, labelKey: 'indicators:mood.scale.1', symbol: '😞' },
      { value: 2, labelKey: 'indicators:mood.scale.2', symbol: '🙁' },
      { value: 3, labelKey: 'indicators:mood.scale.3', symbol: '😐' },
      { value: 4, labelKey: 'indicators:mood.scale.4', symbol: '🙂' },
      { value: 5, labelKey: 'indicators:mood.scale.5', symbol: '😄' },
    ],
  },
  stress: {
    labelKey: 'indicators:stress.label',
    unit: '',
    unitKey: 'indicators:units.scaleOfFive',
    howToMeasureKey: 'indicators:stress.howToMeasure',
    whyMeasureKey: 'indicators:stress.whyMeasure',
    scale: [
      { value: 1, labelKey: 'indicators:stress.scale.1', symbol: '1' },
      { value: 2, labelKey: 'indicators:stress.scale.2', symbol: '2' },
      { value: 3, labelKey: 'indicators:stress.scale.3', symbol: '3' },
      { value: 4, labelKey: 'indicators:stress.scale.4', symbol: '4' },
      { value: 5, labelKey: 'indicators:stress.scale.5', symbol: '5' },
    ],
  },
  workload: {
    labelKey: 'indicators:workload.label',
    unit: '',
    unitKey: 'indicators:units.scaleOfFive',
    howToMeasureKey: 'indicators:workload.howToMeasure',
    whyMeasureKey: 'indicators:workload.whyMeasure',
    scale: [
      { value: 1, labelKey: 'indicators:workload.scale.1', symbol: '1' },
      { value: 2, labelKey: 'indicators:workload.scale.2', symbol: '2' },
      { value: 3, labelKey: 'indicators:workload.scale.3', symbol: '3' },
      { value: 4, labelKey: 'indicators:workload.scale.4', symbol: '4' },
      { value: 5, labelKey: 'indicators:workload.scale.5', symbol: '5' },
    ],
  },
  exerciseMinutes: {
    labelKey: 'indicators:exerciseMinutes.label',
    unit: 'min',
    howToMeasureKey: 'indicators:exerciseMinutes.howToMeasure',
    whyMeasureKey: 'indicators:exerciseMinutes.whyMeasure',
    input: { min: 0, max: 600, step: 1 },
  },
  radiationDose: {
    labelKey: 'indicators:radiationDose.label',
    unit: 'µSv',
    howToMeasureKey: 'indicators:radiationDose.howToMeasure',
    whyMeasureKey: 'indicators:radiationDose.whyMeasure',
    input: { min: 0, max: 100000, step: 1 },
  },
  vision: {
    labelKey: 'indicators:vision.label',
    unit: '',
    howToMeasureKey: 'indicators:vision.howToMeasure',
    whyMeasureKey: 'indicators:vision.whyMeasure',
    scale: [
      { value: 0, labelKey: 'indicators:vision.scale.0', symbol: '0' },
      { value: 1, labelKey: 'indicators:vision.scale.1', symbol: '1' },
      { value: 2, labelKey: 'indicators:vision.scale.2', symbol: '2' },
    ],
  },
  medication: {
    labelKey: 'indicators:medication.label',
    unit: '',
    howToMeasureKey: 'indicators:medication.howToMeasure',
    whyMeasureKey: 'indicators:medication.whyMeasure',
  },
  symptoms: {
    labelKey: 'indicators:symptoms.label',
    unit: '',
    howToMeasureKey: 'indicators:symptoms.howToMeasure',
    whyMeasureKey: 'indicators:symptoms.whyMeasure',
  },
};

export function indicatorContent(id: IndicatorId) {
  const content = INDICATORS[id];
  return {
    label: i18n.t(content.labelKey),
    unit: content.unitKey ? i18n.t(content.unitKey) : content.unit,
    unitKey: content.unitKey,
    howToMeasure: i18n.t(content.howToMeasureKey),
    whyMeasure: i18n.t(content.whyMeasureKey),
    input: content.input,
    scale: content.scale?.map((option): TranslatedScaleOption => ({ ...option, label: i18n.t(option.labelKey) })),
  };
}

export const REGIONS: Record<BodyRegion, { labelKey: string; descriptionKey: string }> = {
  mind: { labelKey: 'indicators:regions.mind.label', descriptionKey: 'indicators:regions.mind.description' },
  head: { labelKey: 'indicators:regions.head.label', descriptionKey: 'indicators:regions.head.description' },
  heart: { labelKey: 'indicators:regions.heart.label', descriptionKey: 'indicators:regions.heart.description' },
  immune: { labelKey: 'indicators:regions.immune.label', descriptionKey: 'indicators:regions.immune.description' },
  metabolism: { labelKey: 'indicators:regions.metabolism.label', descriptionKey: 'indicators:regions.metabolism.description' },
  musculoskeletal: { labelKey: 'indicators:regions.musculoskeletal.label', descriptionKey: 'indicators:regions.musculoskeletal.description' },
  wholeBody: { labelKey: 'indicators:regions.wholeBody.label', descriptionKey: 'indicators:regions.wholeBody.description' },
};

export function regionContent(region: BodyRegion) {
  return {
    label: i18n.t(REGIONS[region].labelKey),
    description: i18n.t(REGIONS[region].descriptionKey),
  };
}

export const REGION_ORDER: BodyRegion[] = [
  'mind', 'head', 'heart', 'immune', 'metabolism', 'musculoskeletal', 'wholeBody',
];

// signalDelaySeconds: atraso de ida da comunicação com a Terra, usado na simulação do envio.
// Estação e Lua são os valores médios publicados pela NASA (DTN, 2016). Trânsito e Marte variam
// com a distância; os valores aqui são só para a demonstração.
export const ENVIRONMENTS: Record<Environment, { labelKey: string; descriptionKey: string; signalDelaySeconds: number; signalDelayLabelKey: string }> = {
  station: { labelKey: 'indicators:environments.station.label', descriptionKey: 'indicators:environments.station.description', signalDelaySeconds: 0.24, signalDelayLabelKey: 'indicators:environments.station.signalDelayLabel' },
  transit: { labelKey: 'indicators:environments.transit.label', descriptionKey: 'indicators:environments.transit.description', signalDelaySeconds: 120, signalDelayLabelKey: 'indicators:environments.transit.signalDelayLabel' },
  moon: { labelKey: 'indicators:environments.moon.label', descriptionKey: 'indicators:environments.moon.description', signalDelaySeconds: 1.28, signalDelayLabelKey: 'indicators:environments.moon.signalDelayLabel' },
  mars: { labelKey: 'indicators:environments.mars.label', descriptionKey: 'indicators:environments.mars.description', signalDelaySeconds: 720, signalDelayLabelKey: 'indicators:environments.mars.signalDelayLabel' },
};

export function environmentContent(environment: Environment) {
  const content = ENVIRONMENTS[environment];
  return {
    label: i18n.t(content.labelKey),
    description: i18n.t(content.descriptionKey),
    signalDelaySeconds: content.signalDelaySeconds,
    signalDelayLabel: i18n.t(content.signalDelayLabelKey),
  };
}

export const ENVIRONMENT_ORDER: Environment[] = ['station', 'transit', 'moon', 'mars'];
