import type { DailyRecord, IndicatorId, Rules } from '../types';
import { addDays } from './dates';
import { inRange } from './series';

// Metas semanais (M9): em quantos dos últimos 7 dias o indicador ficou na faixa verde geral.
// A faixa vem do rules.json; o número de dias da meta também (context.weeklyGoals). Não é prescrição.

export interface WeeklyGoal {
  indicator: IndicatorId;
  label: string;
  daysInGreen: number;
  windowDays: number;
  targetDays: number;
  met: boolean;
  greenText: string; // "7 a 9 h"
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
      label: rule.label,
      daysInGreen,
      windowDays: config.windowDays,
      targetDays: config.targetDays,
      met: daysInGreen >= config.targetDays,
      greenText: `${green.min} a ${green.max} ${rule.unit}`.trim(),
    }];
  });
}
