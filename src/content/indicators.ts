import type { BodyRegion, Environment, IndicatorId } from '../types';

export interface ScaleOption {
  value: number;
  label: string;
  symbol: string;
}

export interface IndicatorContent {
  label: string;
  unit: string; // como aparece ao lado do valor
  howToMeasure: string;
  whyMeasure: string;
  // Limites do campo de entrada. Só evitam erro de digitação: não são faixas clínicas
  // (essas ficam em src/rules/rules.json).
  input?: { min: number; max: number; step: number };
  scale?: ScaleOption[];
}

// Ordem dos passos do check-in (docs/diagramas/05-navegacao-telas.md).
export const CHECKIN_ORDER: IndicatorId[] = [
  'bloodPressure', 'heartRate', 'temperature', 'glucose', 'sleepHours',
  'mood', 'exerciseMinutes', 'radiationDose', 'vision', 'symptoms',
];

export const INDICATORS: Record<IndicatorId, IndicatorContent> = {
  bloodPressure: {
    label: 'Pressão arterial',
    unit: 'mmHg',
    howToMeasure: 'Sente-se preso ao assento, descanse 5 minutos e use o medidor de braço. Digite os dois números.',
    whyMeasure: 'Sem gravidade, os líquidos do corpo sobem para a cabeça e o coração se adapta. A pressão mostra como essa adaptação está indo.',
    input: { min: 40, max: 250, step: 1 },
  },
  heartRate: {
    label: 'Frequência cardíaca',
    unit: 'bpm',
    howToMeasure: 'Meça em repouso, antes do exercício. Use o oxímetro de dedo ou conte os batimentos por 1 minuto.',
    whyMeasure: 'A falta de gravidade muda a circulação. O ritmo em repouso é um sinal simples de como o coração está respondendo.',
    input: { min: 20, max: 250, step: 1 },
  },
  temperature: {
    label: 'Temperatura',
    unit: '°C',
    howToMeasure: 'Use o termômetro de bordo, sempre no mesmo horário e longe do exercício.',
    whyMeasure: 'O estresse do voo altera as defesas do corpo e pode reativar vírus dormentes. Febre é um dos primeiros sinais.',
    input: { min: 30, max: 45, step: 0.1 },
  },
  glucose: {
    label: 'Glicemia',
    unit: 'mg/dL',
    howToMeasure: 'Meça em jejum, com o medidor de ponta de dedo, antes da primeira refeição.',
    whyMeasure: 'A comida de bordo é limitada e precisa durar a missão toda. A glicemia ajuda a acompanhar a nutrição de quem tem indicação para medir.',
    input: { min: 20, max: 600, step: 1 },
  },
  sleepHours: {
    label: 'Sono',
    unit: 'h',
    howToMeasure: 'Informe quantas horas dormiu no último período de descanso, sem contar o tempo acordado no saco de dormir.',
    whyMeasure: 'Na estação a tripulação vê cerca de 16 nasceres do sol por dia, o que confunde o relógio do corpo. Dormir pouco reduz a atenção.',
    input: { min: 0, max: 24, step: 0.1 },
  },
  mood: {
    label: 'Humor',
    unit: 'de 5',
    howToMeasure: 'Escolha o rosto que melhor descreve como você se sentiu na maior parte do dia.',
    whyMeasure: 'Isolamento, confinamento e distância da Terra pesam com o tempo. Acompanhar a tendência ajuda a agir cedo.',
    scale: [
      { value: 1, label: 'Muito mal', symbol: '😞' },
      { value: 2, label: 'Mal', symbol: '🙁' },
      { value: 3, label: 'Neutro', symbol: '😐' },
      { value: 4, label: 'Bem', symbol: '🙂' },
      { value: 5, label: 'Muito bem', symbol: '😄' },
    ],
  },
  exerciseMinutes: {
    label: 'Exercício',
    unit: 'min',
    howToMeasure: 'Some os minutos de esteira, bicicleta e treino resistido feitos hoje.',
    whyMeasure: 'Sem gravidade, os ossos perdem de 1% a 1,5% de densidade por mês e os músculos enfraquecem. O exercício é a principal proteção.',
    input: { min: 0, max: 600, step: 1 },
  },
  radiationDose: {
    label: 'Radiação',
    unit: 'µSv',
    howToMeasure: 'Leia a dose acumulada no dia no seu dosímetro pessoal e digite o valor em microsieverts.',
    whyMeasure: 'A radiação espacial aumenta o risco de câncer ao longo da vida. Para dar uma ideia de escala: o detector Radi-N2 mediu cerca de 150 µSv por dia só de nêutrons na estação.',
    input: { min: 0, max: 100000, step: 1 },
  },
  vision: {
    label: 'Visão',
    unit: '',
    howToMeasure: 'Leia o cartão de teste de perto com um olho de cada vez e compare com o que via no começo da missão.',
    whyMeasure: 'Cerca de 70% dos astronautas da estação têm inchaço no fundo do olho. O autoteste não diagnostica, mas mostra quando pedir um exame.',
    scale: [
      { value: 0, label: 'Sem mudança', symbol: '0' },
      { value: 1, label: 'Mudança leve', symbol: '1' },
      { value: 2, label: 'Mudança clara', symbol: '2' },
    ],
  },
  symptoms: {
    label: 'Sintomas',
    unit: '',
    howToMeasure: 'Marque tudo o que sentiu hoje. Se não sentiu nada, avance sem marcar.',
    whyMeasure: 'Longe da Terra, registrar um sintoma cedo dá tempo para agir com os recursos de bordo.',
  },
};

export const REGIONS: Record<BodyRegion, { label: string; description: string }> = {
  mind: { label: 'Mente e sono', description: 'Sono e humor' },
  head: { label: 'Olhos e visão', description: 'Autoteste de visão' },
  heart: { label: 'Coração', description: 'Pressão arterial e frequência cardíaca' },
  immune: { label: 'Defesas do corpo', description: 'Temperatura' },
  metabolism: { label: 'Metabolismo', description: 'Glicemia' },
  musculoskeletal: { label: 'Ossos e músculos', description: 'Exercício' },
  wholeBody: { label: 'Corpo inteiro', description: 'Radiação e sintomas' },
};

export const REGION_ORDER: BodyRegion[] = [
  'mind', 'head', 'heart', 'immune', 'metabolism', 'musculoskeletal', 'wholeBody',
];

// signalDelaySeconds: atraso de ida da comunicação com a Terra, usado na simulação do envio.
// Estação e Lua são os valores médios publicados pela NASA (DTN, 2016). Trânsito e Marte variam
// com a distância; os valores aqui são só para a demonstração.
export const ENVIRONMENTS: Record<Environment, { label: string; description: string; signalDelaySeconds: number; signalDelayLabel: string }> = {
  station: { label: 'Estação', description: 'Órbita baixa da Terra, dentro da magnetosfera.', signalDelaySeconds: 0.24, signalDelayLabel: 'cerca de 0,24 s' },
  transit: { label: 'Trânsito', description: 'Viagem no espaço profundo, fora da magnetosfera.', signalDelaySeconds: 120, signalDelayLabel: 'cresce com a distância (2 min na demonstração)' },
  moon: { label: 'Lua', description: 'Superfície lunar, com um sexto da gravidade da Terra.', signalDelaySeconds: 1.28, signalDelayLabel: 'cerca de 1,28 s' },
  mars: { label: 'Marte', description: 'Superfície de Marte, com resposta do solo de até 20 minutos.', signalDelaySeconds: 720, signalDelayLabel: 'de 3 a 22 min (12 min na demonstração)' },
};

export const ENVIRONMENT_ORDER: Environment[] = ['station', 'transit', 'moon', 'mars'];
