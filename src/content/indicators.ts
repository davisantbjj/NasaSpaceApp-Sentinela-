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

// Ordem dos passos do check-in (docs/diagramas/05-navegacao-telas.md). `resistanceMinutes` não tem passo
// próprio: é o segundo campo do passo de exercício.
export const CHECKIN_ORDER: IndicatorId[] = [
  'bloodPressure', 'heartRate', 'temperature', 'glucose', 'sleepHours',
  'mood', 'stress', 'workload', 'exerciseMinutes', 'resistanceMinutes', 'radiationDose', 'vision', 'medication', 'symptoms',
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
  stress: {
    label: 'Estresse',
    unit: 'de 5',
    howToMeasure: 'Escolha o número que melhor descreve o seu estresse na maior parte do dia.',
    whyMeasure: 'Na estação, a NASA pede aos astronautas notas de estresse no Reaction Self Test. Um estudo com 24 astronautas ligou dormir 6 horas ou menos a mais estresse.',
    scale: [
      { value: 1, label: 'Muito baixo', symbol: '1' },
      { value: 2, label: 'Baixo', symbol: '2' },
      { value: 3, label: 'Moderado', symbol: '3' },
      { value: 4, label: 'Alto', symbol: '4' },
      { value: 5, label: 'Muito alto', symbol: '5' },
    ],
  },
  workload: {
    label: 'Carga de trabalho',
    unit: 'de 5',
    howToMeasure: 'Escolha o número que melhor descreve o volume de trabalho de hoje.',
    whyMeasure: 'Excesso de trabalho faz parte do risco de sono ruim e horários irregulares da NASA. Acompanhar a carga ajuda o comandante a redistribuir tarefas antes do cansaço acumular.',
    scale: [
      { value: 1, label: 'Muito leve', symbol: '1' },
      { value: 2, label: 'Leve', symbol: '2' },
      { value: 3, label: 'Adequada', symbol: '3' },
      { value: 4, label: 'Pesada', symbol: '4' },
      { value: 5, label: 'Excessiva', symbol: '5' },
    ],
  },
  exerciseMinutes: {
    label: 'Exercício',
    unit: 'min',
    howToMeasure: 'Digite os minutos de exercício aeróbico (correr, pedalar, remar) e de treino resistido (contra carga ou resistência, como agachamento) feitos hoje, com o equipamento da sua nave. O app soma os dois. Use 0 se não fez um deles.',
    whyMeasure: 'A microgravidade afeta ossos e músculos. A NASA relata perda média de 1% a 1,5% ao mês nos ossos que sustentam peso em missões de 4 a 6 meses; isso não prevê a sua perda. Exercício aeróbico e resistido fazem parte das contramedidas, conforme o plano individual.',
    input: { min: 0, max: 600, step: 1 },
  },
  resistanceMinutes: {
    label: 'Treino resistido',
    unit: 'min',
    howToMeasure: 'Minutos de treino contra carga ou resistência, digitados no passo de exercício.',
    whyMeasure: 'O treino resistido é o que mais protege os ossos no voo. Sozinho, ele reduz a perda óssea, mas não a impede.',
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
  medication: {
    label: 'Medicação',
    unit: '',
    howToMeasure: 'Marque cada dose prevista para hoje que você já tomou. A dose que ficar sem marcar conta como não tomada.',
    whyMeasure: 'Longe da Terra não há reposição rápida, e o corpo muda no voo. Registrar cada dose ajuda o médico de bordo a saber se o tratamento está sendo seguido.',
  },
  symptoms: {
    label: 'Sintomas',
    unit: '',
    howToMeasure: 'Marque tudo o que sentiu hoje. Se não sentiu nada, avance sem marcar.',
    whyMeasure: 'Longe da Terra, registrar um sintoma cedo dá tempo para agir com os recursos de bordo.',
  },
};

export const REGIONS: Record<BodyRegion, { label: string; description: string }> = {
  mind: { label: 'Mente e sono', description: 'Sono, humor, estresse e carga de trabalho' },
  head: { label: 'Olhos e visão', description: 'Autoteste de visão' },
  heart: { label: 'Coração', description: 'Pressão arterial e frequência cardíaca' },
  immune: { label: 'Defesas do corpo', description: 'Temperatura' },
  metabolism: { label: 'Metabolismo', description: 'Glicemia' },
  musculoskeletal: { label: 'Ossos e músculos', description: 'Exercício e treino resistido' },
  wholeBody: { label: 'Corpo inteiro', description: 'Radiação, sintomas e medicação' },
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
