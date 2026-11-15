import type { Environment, Rules } from '../types';
import i18n from '../i18n';
import { formatNumber } from './series';

// Perda óssea ESTIMADA pelo tempo sem gravidade (M5). É contexto, não medida e não alerta:
// usa a média de grupo publicada pela NASA (rules.json, context.boneLoss) e o número de dias em cada ambiente.

export interface BoneEstimate {
  text: string;
  sourceUrl: string;
}

const MICROGRAVITY: Environment[] = ['station', 'transit'];
const PARTIAL_GRAVITY: Environment[] = ['moon', 'mars'];

export function estimateBoneLoss(
  missionDay: number,
  daysByEnvironment: Partial<Record<Environment, number>>,
  rules: Rules,
): BoneEstimate | undefined {
  const bone = rules.context?.boneLoss;
  if (!bone || missionDay < 1) return undefined;

  const sum = (envs: Environment[]) => envs.reduce((total, env) => total + (daysByEnvironment[env] ?? 0), 0);
  const zeroG = sum(MICROGRAVITY);
  const partial = sum(PARTIAL_GRAVITY);
  const months = zeroG / bone.daysPerMonth;

  const parts: string[] = [];
  if (zeroG > 0) {
    const min = formatNumber(Math.round(months * bone.minPercentPerMonth * 10) / 10);
    const max = formatNumber(Math.round(months * bone.maxPercentPerMonth * 10) / 10);
    parts.push(i18n.t('context.boneLoss.estimate', {
      days: i18n.t('context.dayCount', { count: zeroG }),
      min,
      max,
      rateMin: formatNumber(bone.minPercentPerMonth),
      rateMax: formatNumber(bone.maxPercentPerMonth),
      monthsMin: bone.studiedMonths.min,
      monthsMax: bone.studiedMonths.max,
    }));
    if (months < bone.studiedMonths.min) {
      parts.push(i18n.t('context.boneLoss.shortPeriod', { monthsMin: bone.studiedMonths.min, monthsMax: bone.studiedMonths.max }));
    }
    if (months > bone.studiedMonths.max) {
      parts.push(i18n.t('context.boneLoss.beyondStudied', { months: bone.studiedMonths.max }));
    }
  }
  if (partial > 0) {
    parts.push(i18n.t('context.boneLoss.partial', { count: partial }));
  }
  if (parts.length === 0) return undefined;
  return { text: parts.join(' '), sourceUrl: bone.sourceUrl };
}
