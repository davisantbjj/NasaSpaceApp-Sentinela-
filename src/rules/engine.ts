import { compareLevels, worstLevel } from '../lib/levels';
import { formatNumber, inRange, rangesFor, seriesPoints, seriesValue } from '../lib/series';
import type {
  Alert, Baseline, BodyRegion, BpComponent, DailyRecord, Environment, IndicatorId, LocalizedText,
  IndicatorRule, Level, Range, Rules,
} from '../types';
import { deviationPercent, findBaseline, isBaselineReady, isDeviation } from './baseline';

const REGIONS: BodyRegion[] = [
  'head', 'heart', 'musculoskeletal', 'immune', 'metabolism', 'mind', 'wholeBody',
];

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

function valueText(rule: IndicatorRule, results: SeriesResult[]): LocalizedText {
  if (rule.components) {
    return {
      key: 'alerts:values.bloodPressure',
      params: { systolic: results[0].value, diastolic: results[1].value, unit: rule.unit },
    };
  }
  const value = results[0].value;
  const labelKey = rule.valueLabels?.[String(value)];
  if (labelKey && !rule.unit && !rule.unitKey) {
    return { key: 'alerts:values.label', params: { labelKey } };
  }
  return {
    key: 'alerts:values.number',
    params: {
      value,
      unit: rule.unitKey ?? rule.unit,
      labelKey: labelKey ?? '',
    },
  };
}

function rangeText(rule: IndicatorRule): LocalizedText {
  if (rule.components) {
    const { systolic, diastolic } = rule.components;
    return {
      key: 'alerts:reference.bloodPressure',
      params: {
        systolicMin: systolic.green.min,
        systolicMax: systolic.green.max,
        diastolicMin: diastolic.green.min,
        diastolicMax: diastolic.green.max,
        unit: rule.unit,
      },
    };
  }
  const green = rule.green!;
  if (green.min === green.max) {
    const labelKey = rule.valueLabels?.[String(green.min)];
    return {
      key: 'alerts:reference.expected',
      params: {
        value: labelKey
          ? { key: 'alerts:values.label', params: { labelKey } }
          : { key: 'alerts:values.number', params: { value: green.min, unit: rule.unitKey ?? rule.unit, labelKey: '' } },
      },
    };
  }
  return {
    key: 'alerts:reference.general',
    params: { min: green.min, max: green.max, unit: rule.unitKey ?? rule.unit },
  };
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
  let whatChanged: LocalizedText;
  let reference: LocalizedText;

  if (byRange) {
    whatChanged = { key: 'alerts:change.general', params: { nameKey: rule.labelKey, value: text } };
    reference = rangeText(rule);
  } else {
    const { sustained, baseline, component } = deviating!;
    whatChanged = {
      key: 'alerts:change.baseline',
      params: {
        nameKey: rule.labelKey,
        componentKey: component ? `alerts:components.${component}` : '',
        percent: Math.abs(sustained!.percent),
        sideKey: sustained!.percent < 0 ? 'alerts:side.below' : 'alerts:side.above',
        days: sustained!.days,
        value: text,
      },
    };
    reference = {
      key: 'alerts:reference.baseline',
      params: {
        value: {
          key: 'alerts:values.number',
          params: { value: baseline!.mean, unit: rule.unitKey ?? rule.unit, labelKey: '' },
        },
        days: baseline!.sampleDays,
      },
    };
  }

  // Confiança do dado.
  let confidenceNote: string | undefined;
  const firstBaseline = results[0].baseline;
  if (rule.useBaseline && !isBaselineReady(firstBaseline, rules)) {
    confidenceNote = 'alerts:confidence.baselineForming';
  } else if (!previous.some((r) => seriesPoints(r.values, indicator).length > 0)) {
    confidenceNote = 'alerts:confidence.singleMeasure';
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
    confidenceNote: confidenceNote
      ? {
          key: confidenceNote,
          params: {
            sampleDays: firstBaseline?.sampleDays ?? 0,
            baselineDays: rules.config.baselineDays,
          },
        }
      : undefined,
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
    whatChanged: {
      key: 'alerts:change.symptoms',
      params: { symptomKeys: reported.map((s) => s.labelKey) },
    },
    reference: { key: 'alerts:reference.noSymptoms' },
    whyItMatters: rule.messages.whyItMatters,
    whatToDo: rule.messages.whatToDo[level],
    environmentNote: rules.environmentNotes.symptoms?.[environment],
    confidence: 'low',
    confidenceNote: { key: 'alerts:confidence.selfReported' },
    notifyGround: level === 'red',
    sourceUrl: rule.sourceUrl,
  };
}

// Medicação: alerta quando uma dose prevista no dia não foi marcada como tomada.
// O nível vem de `missedLevel` no rules.json.
function evaluateMedication(
  rule: IndicatorRule,
  record: DailyRecord,
  rules: Rules,
  environment: Environment,
): Alert | undefined {
  const missed = (record.values.medication ?? []).filter((dose) => !dose.taken);
  if (missed.length === 0) return undefined;

  const level = rule.missedLevel ?? 'yellow';
  return {
    id: `${record.id}_medication`,
    crewId: record.crewId,
    date: record.date,
    indicator: 'medication',
    region: rule.region,
    level,
    trigger: 'missedMedication',
    whatChanged: {
      key: 'alerts:change.missedMedication',
      params: { doses: missed.map((dose) => dose.label).join(', ') },
    },
    reference: { key: 'alerts:reference.medication' },
    whyItMatters: rule.messages.whyItMatters,
    whatToDo: rule.messages.whatToDo[level],
    environmentNote: rules.environmentNotes.medication?.[environment],
    confidence: 'low',
    confidenceNote: { key: 'alerts:confidence.medicationSelfReported' },
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
        : indicator === 'medication'
          ? evaluateMedication(rule, record, rules, environment)
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
