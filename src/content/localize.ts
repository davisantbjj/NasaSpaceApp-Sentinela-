import i18n from '../i18n';
import { formatNumber } from '../lib/format';
import type { LocalizedText } from '../types';

export function translateText(text: string | LocalizedText): string {
  if (typeof text === 'string') return i18n.t(text);

  const source = text.params ?? {};
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string' && key.endsWith('Key')) {
      const field = key === 'labelKey' ? 'label' : key.slice(0, -3);
      const translated = value ? i18n.t(value) : '';
      params[field] = field === 'second' ? translated.toLocaleLowerCase(i18n.language) : translated;
    } else if (key === 'unit' && typeof value === 'string' && value.includes(':')) {
      params.unit = i18n.t(value);
    } else if (key === 'value' && typeof value === 'number') {
      params.value = formatNumber(value);
    } else if ((key === 'min' || key === 'max' || key.endsWith('Min') || key.endsWith('Max') ||
      key === 'systolic' || key === 'diastolic' || key === 'percent' || key === 'days' || key === 'start' ||
      key === 'sampleDays' || key === 'baselineDays') && typeof value === 'number') {
      params[key] = formatNumber(value);
    } else if (key === 'value' && typeof value === 'object' && !Array.isArray(value)) {
      params.value = translateText(value);
    } else if (key === 'symptomKeys' && Array.isArray(value)) {
      params.symptoms = value.map((labelKey) => i18n.t(labelKey).toLocaleLowerCase(i18n.language)).join(', ');
    } else if (key === 'unitSuffix' && typeof value === 'string') {
      params.unitSuffix = value ? ` ${value}` : '';
    } else if (key === 'labelSuffix' && typeof value === 'string') {
      params.labelSuffix = value ? ` (${value})` : '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      params[key] = translateText(value);
    } else if (Array.isArray(value)) {
      params[key] = value.join(', ');
    } else {
      params[key] = String(value);
    }
  }

  if (text.key === 'alerts:values.number') {
    params.unitSuffix = params.unit ? ` ${params.unit}` : '';
    params.labelSuffix = params.label ? ` (${params.label})` : '';
  }
  if (source.nameKey && source.componentKey) {
    params.name = `${i18n.t(String(source.nameKey))} ${i18n.t(String(source.componentKey))}`;
  }

  return i18n.t(text.key, params);
}
