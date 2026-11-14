import { formatNumber } from '../lib/series';
import type { DailyValues, IndicatorId } from '../types';
import { INDICATORS } from './indicators';

export interface DisplayValue {
  text: string; // "118/76", "7,4", "Bem"
  unit: string; // "mmHg", "h", ""
}

// Valor de um indicador pronto para mostrar. `symptomLabels` traduz os ids de sintomas.
export function displayValue(
  values: DailyValues,
  indicator: IndicatorId,
  symptomLabels: Record<string, string> = {},
): DisplayValue | undefined {
  const content = INDICATORS[indicator];

  if (indicator === 'bloodPressure') {
    const bp = values.bloodPressure;
    return bp ? { text: `${bp.systolic}/${bp.diastolic}`, unit: content.unit } : undefined;
  }
  if (indicator === 'symptoms') {
    const symptoms = values.symptoms;
    if (!symptoms) return undefined;
    if (symptoms.length === 0) return { text: 'Nenhum', unit: '' };
    return { text: symptoms.map((id) => symptomLabels[id] ?? id).join(', '), unit: '' };
  }
  const value = values[indicator];
  if (typeof value !== 'number') return undefined;
  const option = content.scale?.find((o) => o.value === value);
  if (option) return { text: option.label, unit: indicator === 'mood' ? `(${value} ${content.unit})` : '' };
  return { text: formatNumber(value), unit: content.unit };
}

export function displayText(
  values: DailyValues,
  indicator: IndicatorId,
  symptomLabels?: Record<string, string>,
): string | undefined {
  const display = displayValue(values, indicator, symptomLabels);
  if (!display) return undefined;
  return display.unit ? `${display.text} ${display.unit}` : display.text;
}
