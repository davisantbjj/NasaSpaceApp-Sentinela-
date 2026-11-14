import { CHECKIN_ORDER } from '../content/indicators';
import { formatNumber } from '../lib/series';
import { findBaseline, isBaselineReady } from '../rules/baseline';
import { rules } from '../rules/rules';
import type { Baseline, CrewMember, DailyRecord, IndicatorId } from '../types';

export const SYMPTOM_LABELS: Record<string, string> = Object.fromEntries(
  rules.symptoms.map((s) => [s.id, s.label]),
);

export function trackedInOrder(member: CrewMember | undefined): IndicatorId[] {
  if (!member) return [];
  return CHECKIN_ORDER.filter((id) => member.trackedIndicators.includes(id));
}

export function latestRecord(records: DailyRecord[]): DailyRecord | undefined {
  return records[records.length - 1];
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// "Seu padrão pessoal: 7,5 h (7 dias, 1 descartado)" ou "Linha de base em formação (4 de 7 dias)".
export function baselineNote(indicator: IndicatorId, baselines: Baseline[]): string | undefined {
  const rule = rules.indicators[indicator];
  if (!rule?.useBaseline) return undefined;
  const { baselineDays } = rules.config;

  const found = rule.components
    ? [findBaseline(baselines, indicator, 'systolic'), findBaseline(baselines, indicator, 'diastolic')]
    : [findBaseline(baselines, indicator)];
  const first = found[0];

  if (!found.every((b) => isBaselineReady(b, rules))) {
    return `Linha de base em formação (${first?.sampleDays ?? 0} de ${baselineDays} dias)`;
  }
  const mean = found.map((b) => formatNumber(Math.round(b!.mean * 10) / 10)).join('/');
  const excluded = first!.excludedDays;
  const details = [plural(first!.sampleDays, 'dia', 'dias')];
  if (excluded > 0) details.push(plural(excluded, 'descartado', 'descartados'));
  return `Seu padrão pessoal: ${mean}${rule.unit ? ` ${rule.unit}` : ''} (${details.join(', ')})`;
}
