import type { BpComponent, DailyValues, IndicatorId, IndicatorRule, Range } from '../types';

// Uma série é uma sequência de números no tempo. Pressão arterial tem duas (sistólica e diastólica).
export interface SeriesPoint {
  component?: BpComponent;
  value: number;
}

export const BP_COMPONENTS: BpComponent[] = ['systolic', 'diastolic'];

// Valores numéricos de um indicador num dia. Sintomas não são numéricos e devolvem lista vazia.
export function seriesPoints(values: DailyValues, indicator: IndicatorId): SeriesPoint[] {
  if (indicator === 'symptoms') return [];
  if (indicator === 'bloodPressure') {
    const bp = values.bloodPressure;
    return bp ? BP_COMPONENTS.map((component) => ({ component, value: bp[component] })) : [];
  }
  const value = values[indicator];
  return typeof value === 'number' ? [{ value }] : [];
}

export function seriesValue(
  values: DailyValues,
  indicator: IndicatorId,
  component?: BpComponent,
): number | undefined {
  return seriesPoints(values, indicator).find((p) => p.component === component)?.value;
}

export function rangesFor(rule: IndicatorRule, component?: BpComponent): { green?: Range; yellow?: Range } {
  if (component && rule.components) return rule.components[component];
  return { green: rule.green, yellow: rule.yellow };
}

export function inRange(value: number, range: Range): boolean {
  return value >= range.min && value <= range.max;
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}
