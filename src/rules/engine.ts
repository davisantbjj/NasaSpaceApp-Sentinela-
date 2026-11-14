import { compareLevels, worstLevel } from '../lib/levels';
import { formatNumber, inRange, rangesFor, seriesPoints, seriesValue } from '../lib/series';
import type {
  Alert, Baseline, BodyRegion, BpComponent, DailyRecord, Environment, IndicatorId,
  IndicatorRule, Level, Range, Rules,
} from '../types';
import { deviationPercent, findBaseline, isBaselineReady, isDeviation } from './baseline';

const REGIONS: BodyRegion[] = [
  'head', 'heart', 'musculoskeletal', 'immune', 'metabolism', 'mind', 'wholeBody',
];

const COMPONENT_LABEL: Record<BpComponent, string> = { systolic: 'sistólica', diastolic: 'diastólica' };

// Dentro de `green` é verde; fora de `green` e dentro de `yellow` é amarelo; fora de `yellow` é vermelho.
export function levelForRange(value: number, green?: Range, yellow?: Range): Level {
  if (!green || inRange(value, green)) return 'green';
  if (!yellow || inRange(value, yellow)) return 'yellow';
  return 'red';
}

interface SeriesResult {
  component?: BpComponent;
  value: number;
  rangeLevel: Level;
  baseline?: Baseline;
  sustained?: { percent: number; days: number }; // desvio pessoal mantido
}

function withUnit(text: string, unit: string): string {
  return unit ? `${text} ${unit}` : text;
}

function valueText(rule: IndicatorRule, results: SeriesResult[]): string {
  if (rule.components) return withUnit(results.map((r) => formatNumber(r.value)).join('/'), rule.unit);
  const value = results[0].value;
  const label = rule.valueLabels?.[String(value)];
  if (label) return rule.unit ? `${formatNumber(value)} ${rule.unit} (${label})` : label;
  return withUnit(formatNumber(value), rule.unit);
}

function rangeText(rule: IndicatorRule): string {
  if (rule.components) {
    const { systolic, diastolic } = rule.components;
    return `Faixa geral: ${systolic.green.min} a ${systolic.green.max} por ${diastolic.green.min} a ${diastolic.green.max} ${rule.unit}`;
  }
  const green = rule.green!;
  if (green.min === green.max) {
    return `Esperado: ${rule.valueLabels?.[String(green.min)] ?? formatNumber(green.min)}`;
  }
  return withUnit(`Faixa geral: ${formatNumber(green.min)} a ${formatNumber(green.max)}`, rule.unit);
}

// Desvio pessoal mantido: os últimos `sustainedDays` valores (incluindo o de hoje)
// passam do limite, todos no mesmo sentido.
function sustainedDeviation(
  indicator: IndicatorId,
  component: BpComponent | undefined,
  record: DailyRecord,
  previous: DailyRecord[],
  baseline: Baseline,
  rule: IndicatorRule,
  rules: Rules,
): SeriesResult['sustained'] {
  const { sustainedDays, baselineDeviationPercent } = rules.config;
  const recent = [...previous, record]
    .map((r) => seriesValue(r.values, indicator, component))
    .filter((v): v is number => v !== undefined)
    .slice(-sustainedDays);
  if (recent.length < sustainedDays) return undefined;

  const percents = recent.map((v) => deviationPercent(v, baseline.mean));
  const allDeviate = percents.every((p) => isDeviation(p, baselineDeviationPercent, rule.deviationDirection));
  const sameSign = percents.every((p) => Math.sign(p) === Math.sign(percents[0]));
  if (!allDeviate || !sameSign) return undefined;
  return { percent: percents[percents.length - 1], days: sustainedDays };
}

function evaluateIndicator(
  indicator: IndicatorId,
  rule: IndicatorRule,
  record: DailyRecord,
  previous: DailyRecord[],
  baselines: Baseline[],
  rules: Rules,
  environment: Environment,
): Alert | undefined {
  const points = seriesPoints(record.values, indicator);
  if (points.length === 0) return undefined;

  const results: SeriesResult[] = points.map(({ component, value }) => {
    const { green, yellow } = rangesFor(rule, component);
    const baseline = rule.useBaseline ? findBaseline(baselines, indicator, component) : undefined;
    const sustained = isBaselineReady(baseline, rules)
      ? sustainedDeviation(indicator, component, record, previous, baseline!, rule, rules)
      : undefined;
    return { component, value, rangeLevel: levelForRange(value, green, yellow), baseline, sustained };
  });

  const rangeLevel = worstLevel(...results.map((r) => r.rangeLevel));
  const deviating = results.find((r) => r.sustained);
  // A linha de base só pode piorar o nível, nunca melhorar.
  const level = worstLevel(rangeLevel, deviating ? 'yellow' : 'green');
  if (level === 'green') return undefined;

  const byRange = compareLevels(rangeLevel, 'green') > 0;
  const text = valueText(rule, results);
  let whatChanged: string;
  let reference: string;

  if (byRange) {
    whatChanged = `${rule.label} está em ${text}`;
    reference = rangeText(rule);
  } else {
    const { sustained, baseline, component } = deviating!;
    const name = component ? `${rule.label} ${COMPONENT_LABEL[component]}` : rule.label;
    const side = sustained!.percent < 0 ? 'abaixo' : 'acima';
    whatChanged = `${name} está ${formatNumber(Math.abs(sustained!.percent))}% ${side} do seu padrão há ${sustained!.days} dias (hoje: ${text})`;
    reference = `Seu padrão pessoal: ${withUnit(formatNumber(baseline!.mean), rule.unit)} (${baseline!.sampleDays} dias)`;
  }

  // Confiança do dado.
  let confidenceNote: string | undefined;
  const firstBaseline = results[0].baseline;
  if (rule.useBaseline && !isBaselineReady(firstBaseline, rules)) {
    confidenceNote = `Linha de base em formação (${firstBaseline?.sampleDays ?? 0} de ${rules.config.baselineDays} dias)`;
  } else if (!previous.some((r) => seriesPoints(r.values, indicator).length > 0)) {
    confidenceNote = 'Medida única, sem histórico para comparar';
  }

  return {
    id: `${record.id}_${indicator}`,
    crewId: record.crewId,
    date: record.date,
    indicator,
    region: rule.region,
    level,
    trigger: byRange ? 'generalRange' : 'baselineDeviation',
    whatChanged,
    reference,
    whyItMatters: rule.messages.whyItMatters,
    whatToDo: rule.messages.whatToDo[level],
    environmentNote: rules.environmentNotes[indicator]?.[environment],
    confidence: confidenceNote ? 'low' : 'normal',
    confidenceNote,
    notifyGround: level === 'red',
    sourceUrl: rule.sourceUrl,
  };
}

function evaluateSymptoms(
  rule: IndicatorRule,
  record: DailyRecord,
  rules: Rules,
  environment: Environment,
): Alert | undefined {
  const reported = (record.values.symptoms ?? [])
    .map((id) => rules.symptoms.find((s) => s.id === id))
    .filter((s) => s !== undefined);
  if (reported.length === 0) return undefined;

  const level = worstLevel(...reported.map((s) => s.level)) as 'yellow' | 'red';
  return {
    id: `${record.id}_symptoms`,
    crewId: record.crewId,
    date: record.date,
    indicator: 'symptoms',
    region: rule.region,
    level,
    trigger: 'symptom',
    whatChanged: `Sintomas relatados: ${reported.map((s) => s.label.toLowerCase()).join(', ')}`,
    reference: 'Esperado: nenhum sintoma',
    whyItMatters: rule.messages.whyItMatters,
    whatToDo: rule.messages.whatToDo[level],
    environmentNote: rules.environmentNotes.symptoms?.[environment],
    confidence: 'low',
    confidenceNote: 'Autorrelato, sem medida objetiva',
    notifyGround: level === 'red',
    sourceUrl: rule.sourceUrl,
  };
}

// Avalia o registro de um dia e devolve os alertas (indicadores verdes não geram alerta).
// Função pura: sem banco, sem React. O ambiente só acrescenta texto, nunca muda o nível.
export function evaluateRecord(
  record: DailyRecord,
  history: DailyRecord[],
  baselines: Baseline[],
  rules: Rules,
  environment: Environment,
): Alert[] {
  const previous = history
    .filter((r) => r.crewId === record.crewId && r.date < record.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const own = baselines.filter((b) => b.crewId === record.crewId);
  const alerts: Alert[] = [];

  for (const [id, rule] of Object.entries(rules.indicators)) {
    if (!rule) continue;
    const indicator = id as IndicatorId;
    const alert =
      indicator === 'symptoms'
        ? evaluateSymptoms(rule, record, rules, environment)
        : evaluateIndicator(indicator, rule, record, previous, own, rules, environment);
    if (alert) alerts.push(alert);
  }
  return alerts.sort((a, b) => compareLevels(b.level, a.level));
}

// Pior nível entre os alertas de cada região. É isso que pinta a figura humana.
export function levelByRegion(alerts: Alert[]): Record<BodyRegion, Level> {
  const result = Object.fromEntries(REGIONS.map((r) => [r, 'green'])) as Record<BodyRegion, Level>;
  for (const alert of alerts) {
    result[alert.region] = worstLevel(result[alert.region], alert.level);
  }
  return result;
}
