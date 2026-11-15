import i18n from '../i18n';
import type { DailyRecord, IndicatorId, Rules } from '../types';
import { addDays } from './dates';
import { inRange } from './series';

// Metas semanais (M9): em quantos dos últimos 7 dias o indicador ficou na faixa verde geral.
// A faixa vem do rules.json; o número de dias da meta também (context.weeklyGoals). Não é prescrição.

export interface WeeklyGoal {
  indicator: IndicatorId;
  labelKey: string;
  daysInGreen: number;
  windowDays: number;
  targetDays: number;
  met: boolean;
  greenText: string; // "7 a 9 h"
}

export interface ExerciseVolumeSummary {
  weekMinutes: number;
  planMinutes: number;
  baselineMinutes?: number;
  baselineDays: number;
}

export function exerciseVolumeSummary(records: DailyRecord[], today: string, rules: Rules): ExerciseVolumeSummary {
  const config = rules.context?.weeklyGoals;
  const green = rules.indicators.exerciseMinutes?.green;
  const windowDays = config?.windowDays ?? 7;
  const targetDays = config?.targetDays ?? 5;
  const from = addDays(today, -(windowDays - 1));
  const recent = records.filter((r) => r.date >= from && r.date <= today);
  const minutes = (record: DailyRecord) => record.values.exerciseSession?.durationMinutes ?? record.values.exerciseMinutes ?? 0;
  const baselineRecords = records
    .filter((r) => r.date < from && r.values.exerciseMinutes !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  return {
    weekMinutes: recent.reduce((sum, record) => sum + minutes(record), 0),
    planMinutes: (green?.min ?? 0) * targetDays,
    baselineMinutes: baselineRecords.length > 0
      ? (baselineRecords.reduce((sum, record) => sum + minutes(record), 0) / baselineRecords.length) * windowDays
      : undefined,
    baselineDays: baselineRecords.length,
  };
}

export function weeklyGoals(records: DailyRecord[], today: string, rules: Rules): WeeklyGoal[] {
  const config = rules.context?.weeklyGoals;
  if (!config) return [];
  const from = addDays(today, -(config.windowDays - 1));
  const recent = records.filter((r) => r.date >= from && r.date <= today);

  return config.indicators.flatMap((indicator) => {
    const rule = rules.indicators[indicator];
    if (!rule?.green) return [];
    const green = rule.green;
    const daysInGreen = recent.filter((r) => {
      const value = r.values[indicator];
      return typeof value === 'number' && inRange(value, green);
    }).length;
    return [{
      indicator,
      labelKey: rule.labelKey,
      daysInGreen,
      windowDays: config.windowDays,
      targetDays: config.targetDays,
      met: daysInGreen >= config.targetDays,
      greenText: i18n.t('mission.goals.range', { min: green.min, max: green.max, unit: rule.unit }).trim(),
    }];
  });
}
