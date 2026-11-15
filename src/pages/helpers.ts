import { CHECKIN_ORDER } from '../content/indicators';
import { formatNumber } from '../lib/series';
import { findBaseline, isBaselineReady } from '../rules/baseline';
import { rules } from '../rules/rules';
import i18n from '../i18n';
import type { Baseline, CrewMember, DailyRecord, IndicatorId } from '../types';

export function symptomLabels(): Record<string, string> {
  return Object.fromEntries(rules.symptoms.map((s) => [s.id, i18n.t(s.labelKey)]));
}

export function trackedInOrder(member: CrewMember | undefined): IndicatorId[] {
  if (!member) return [];
  return CHECKIN_ORDER.filter((id) => member.trackedIndicators.includes(id));
}

export function latestRecord(records: DailyRecord[]): DailyRecord | undefined {
  return records[records.length - 1];
}

export function baselineNote(indicator: IndicatorId, baselines: Baseline[]): string | undefined {
  const rule = rules.indicators[indicator];
  if (!rule?.useBaseline) return undefined;
  const { baselineDays } = rules.config;

  const found = rule.components
    ? [findBaseline(baselines, indicator, 'systolic'), findBaseline(baselines, indicator, 'diastolic')]
    : [findBaseline(baselines, indicator)];
  const first = found[0];

  if (!found.every((b) => isBaselineReady(b, rules))) {
    return i18n.t('baseline.forming', { sampleDays: first?.sampleDays ?? 0, baselineDays });
  }
  const mean = found.map((b) => formatNumber(Math.round(b!.mean * 10) / 10)).join('/');
  const excluded = first!.excludedDays;
  const details = [i18n.t('baseline.days', { count: first!.sampleDays })];
  if (excluded > 0) details.push(i18n.t('baseline.excludedDays', { count: excluded }));
  return i18n.t('baseline.personal', {
    value: mean,
    unit: rule.unit ? ` ${rule.unit}` : '',
    details: details.join(', '),
  });
}
