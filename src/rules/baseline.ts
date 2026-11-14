import { BP_COMPONENTS, inRange, rangesFor, seriesValue } from '../lib/series';
import type { Baseline, BpComponent, DailyRecord, IndicatorId, Rules } from '../types';

// Linha de base pessoal: média dos primeiros `baselineDays` dias válidos de cada série.
// Um dia fora da faixa verde geral é descartado, para que um começo de missão alterado
// não vire o "normal" da pessoa. Função pura: sem banco, sem React.
export function computeBaselines(crewId: string, history: DailyRecord[], rules: Rules): Baseline[] {
  const records = history
    .filter((r) => r.crewId === crewId)
    .sort((a, b) => a.date.localeCompare(b.date));
  const baselines: Baseline[] = [];

  for (const [id, rule] of Object.entries(rules.indicators)) {
    if (!rule?.useBaseline) continue;
    const indicator = id as IndicatorId;
    const components: (BpComponent | undefined)[] = rule.components ? BP_COMPONENTS : [undefined];

    for (const component of components) {
      const { green } = rangesFor(rule, component);
      const valid: number[] = [];
      let excludedDays = 0;

      for (const record of records) {
        if (valid.length >= rules.config.baselineDays) break;
        const value = seriesValue(record.values, indicator, component);
        if (value === undefined) continue;
        if (green && !inRange(value, green)) excludedDays += 1;
        else valid.push(value);
      }

      if (valid.length === 0) continue;
      baselines.push({
        crewId,
        indicator,
        ...(component ? { component } : {}),
        mean: valid.reduce((sum, v) => sum + v, 0) / valid.length,
        sampleDays: valid.length,
        excludedDays,
      });
    }
  }
  return baselines;
}

export function findBaseline(
  baselines: Baseline[],
  indicator: IndicatorId,
  component?: BpComponent,
): Baseline | undefined {
  return baselines.find((b) => b.indicator === indicator && b.component === component);
}

export function isBaselineReady(baseline: Baseline | undefined, rules: Rules): boolean {
  return !!baseline && baseline.sampleDays >= rules.config.baselineDays;
}

// Desvio em relação à média pessoal, em pontos percentuais (negativo = abaixo).
export function deviationPercent(value: number, mean: number): number {
  return mean === 0 ? 0 : ((value - mean) / Math.abs(mean)) * 100;
}

export function isDeviation(
  percent: number,
  limit: number,
  direction: 'both' | 'above' | 'below' = 'both',
): boolean {
  if (direction === 'above') return percent > limit;
  if (direction === 'below') return percent < -limit;
  return Math.abs(percent) > limit;
}
