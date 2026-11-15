import type { BpComponent, DailyValues, IndicatorId, IndicatorRule, Range } from '../types';

// Uma série é uma sequência de números no tempo. Pressão arterial tem duas (sistólica e diastólica).
export interface SeriesPoint {
  component?: BpComponent;
  value: number;
}

export const BP_COMPONENTS: BpComponent[] = ['systolic', 'diastolic'];

// Indicadores que são listas, não números: não têm série, linha de base nem gráfico.
const LIST_INDICATORS: IndicatorId[] = ['symptoms', 'medication'];

export function hasHistoryChart(indicator: IndicatorId): boolean {
  return !LIST_INDICATORS.includes(indicator);
}

// Se o indicador foi registrado no dia (para listas, mesmo vazia).
export function hasValue(values: DailyValues, indicator: IndicatorId): boolean {
  if (indicator === 'reactionTime') return typeof values.reactionTime === 'number' && Number.isFinite(values.reactionTime);
  if (LIST_INDICATORS.includes(indicator)) return values[indicator] !== undefined;
  return seriesPoints(values, indicator).length > 0;
}

// Valores numéricos de um indicador num dia. Sintomas e medicação não são numéricos e devolvem lista vazia.
export function seriesPoints(values: DailyValues, indicator: IndicatorId): SeriesPoint[] {
  if (!hasHistoryChart(indicator)) return [];
  // Não misturar modos, sessões interrompidas ou registros antigos de protocolo desconhecido.
  if (indicator === 'reactionTime' && (values.reactionTest?.mode !== 'full' || !values.reactionTest.completed)) return [];
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
