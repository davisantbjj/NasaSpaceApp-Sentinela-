import { inRange, rangesFor, seriesPoints } from '../lib/series';
import type { Baseline, Correlation, DailyRecord, IndicatorId, Rules } from '../types';
import { deviationPercent, findBaseline, isBaselineReady, isDeviation } from './baseline';

// Um indicador "se afastou" num dia se saiu da faixa verde geral ou passou do limite
// de desvio em relação à linha de base pessoal, no sentido de risco.
function movedAway(record: DailyRecord, indicator: IndicatorId, baselines: Baseline[], rules: Rules): boolean {
  const rule = rules.indicators[indicator];
  if (!rule) return false;
  return seriesPoints(record.values, indicator).some(({ component, value }) => {
    const { green } = rangesFor(rule, component);
    if (green && !inRange(value, green)) return true;
    const baseline = findBaseline(baselines, indicator, component);
    const deviationLimit = rule.baselineDeviationPercent ?? rules.config.baselineDeviationPercent;
    return (
      rule.useBaseline &&
      isBaselineReady(baseline, rules) &&
      isDeviation(deviationPercent(value, baseline!.mean), deviationLimit, rule.deviationDirection)
    );
  });
}

// Pares de indicadores que se afastaram do esperado nos mesmos dias, até o registro mais recente.
// Só descreve que "mudaram juntos": nunca afirma causa, não cria alerta e não muda nível.
export function findCorrelations(history: DailyRecord[], baselines: Baseline[], rules: Rules): Correlation[] {
  const records = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (records.length === 0) return [];
  const correlations: Correlation[] = [];

  for (const [a, b] of rules.correlationPairs) {
    let days = 0;
    for (let i = records.length - 1; i >= 0; i -= 1) {
      if (!movedAway(records[i], a, baselines, rules) || !movedAway(records[i], b, baselines, rules)) break;
      days += 1;
    }
    if (days < rules.config.sustainedDays) continue;

    correlations.push({
      crewId: records[0].crewId,
      indicators: [a, b],
      fromDate: records[records.length - days].date,
      toDate: records[records.length - 1].date,
      description: {
        key: 'alerts:correlation',
        params: {
          firstKey: rules.indicators[a]!.labelKey,
          secondKey: rules.indicators[b]!.labelKey,
          days,
        },
      },
    });
  }
  return correlations;
}
