import { formatNumber } from '../lib/series';
import type { DailyValues, IndicatorId } from '../types';
import i18n from '../i18n';
import { indicatorContent, sleepQualityOptions, sourceContent } from './indicators';

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
  const content = indicatorContent(indicator);

  if (indicator === 'bloodPressure') {
    const bp = values.bloodPressure;
    return bp ? { text: `${formatNumber(bp.systolic)}/${formatNumber(bp.diastolic)}`, unit: content.unit } : undefined;
  }
  if (indicator === 'symptoms') {
    const symptoms = values.symptoms;
    if (!symptoms) return undefined;
    if (symptoms.length === 0) return { text: i18n.t('indicators:display.noSymptoms'), unit: '' };
    return { text: symptoms.map((id) => symptomLabels[id] ?? id).join(', '), unit: '' };
  }
  if (indicator === 'medication') {
    const doses = values.medication;
    if (!doses) return undefined;
    // Dose "só quando necessário" não marcada não é dose esquecida.
    const scheduled = doses.filter((dose) => !dose.asNeeded);
    const missed = scheduled.filter((dose) => !dose.taken);
    const asNeededTaken = doses.filter((dose) => dose.asNeeded && dose.taken);
    const main = missed.length > 0
      ? i18n.t('indicators:display.doseNotTaken', { doses: missed.map((dose) => dose.label).join(', ') })
      : i18n.t(scheduled.length === 0 && asNeededTaken.length === 0 ? 'indicators:display.noMedication' : 'indicators:display.allDosesTaken');
    const extra = asNeededTaken.length > 0
      ? i18n.t('indicators:display.asNeededTaken', { doses: asNeededTaken.map((dose) => dose.label).join(', ') })
      : '';
    return { text: scheduled.length === 0 && extra ? extra : extra ? `${main}; ${extra}` : main, unit: '' };
  }
  if (indicator === 'mealsCompleted') {
    const meals = values.mealsCompleted;
    const parts = [
      meals === undefined ? undefined : content.scale?.find((o) => o.value === Math.min(meals, 3))?.label ?? formatNumber(meals),
      values.waterSufficient === undefined
        ? undefined
        : i18n.t(values.waterSufficient ? 'indicators:display.waterSufficient' : 'indicators:display.waterInsufficient'),
    ].filter((part): part is string => part !== undefined);
    return parts.length > 0 ? { text: parts.join('; '), unit: '' } : undefined;
  }
  if (indicator === 'conditioning') {
    const assessment = values.conditioning;
    if (!assessment) return undefined;
    return {
      text: `${i18n.t('indicators:conditioning.aerobic')}: ${formatNumber(assessment.aerobicPercent)}%; ${i18n.t('indicators:conditioning.strength')}: ${formatNumber(assessment.strengthPercent)}%`,
      unit: '',
    };
  }
  const value = values[indicator];
  if (typeof value !== 'number') return undefined;
  if (indicator === 'reactionTime') {
    const details = values.reactionTest;
    const mode = details
      ? `${i18n.t(details.mode === 'short' ? 'indicators:display.reactionShort' : 'indicators:display.reactionFull')}${details.completed ? '' : i18n.t('indicators:display.reactionInterrupted')}`
      : i18n.t('indicators:display.reactionUnknownMode');
    return { text: `${formatNumber(value)} (${mode})`, unit: content.unit };
  }
  const option = content.scale?.find((o) => o.value === value);
  if (option) {
    const unit = content.unitKey ? `(${formatNumber(value)} ${content.unit})` : '';
    return { text: option.label, unit };
  }
  return { text: formatNumber(value), unit: content.unit };
}

// "qualidade: boa" quando a qualidade do sono foi informada (N14).
export function sleepQualityText(values: DailyValues): string | undefined {
  const quality = values.sleepQuality;
  if (quality === undefined) return undefined;
  const label = sleepQualityOptions().find((o) => o.value === quality)?.label ?? formatNumber(quality);
  return i18n.t('indicators:display.sleepQuality', { quality: label.toLocaleLowerCase(i18n.language) });
}

// Remédios para dormir marcados como tomados no dia (N14), para cruzar com o sono.
export function sleepAidsTaken(values: DailyValues): string[] {
  return (values.medication ?? []).filter((dose) => dose.sleepAid && dose.taken).map((dose) => dose.label);
}

// "Sensor vestível" quando o valor veio de um aparelho; nada quando foi digitado (M10).
export function sourceLabel(values: DailyValues, indicator: IndicatorId): string | undefined {
  const source = values.sources?.[indicator];
  return source && source !== 'manual' ? sourceContent(source).label : undefined;
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
