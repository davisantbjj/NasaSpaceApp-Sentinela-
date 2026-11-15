import type { DailyRecord, Rules } from '../types';
import i18n from '../i18n';
import { formatNumber } from './series';

// Radiação ACUMULADA na missão (M6 e N2). É contexto, não alerta e não limite: soma as doses do dia
// digitadas pelo tripulante e compara com o limite de carreira da NASA (600 mSv).
// Dias sem registro não entram, e o texto diz isso.

export interface RadiationTotal {
  text: string;
  sourceUrl: string;
  missionDoseMsv: number;
  totalCareerDoseMsv: number;
  careerPercent: number;
  careerLimitMsv: number;
}

// µSv até 999; a partir de 1.000 µSv, em mSv (1 mSv = 1.000 µSv).
function doseText(microsieverts: number): string {
  if (microsieverts < 1000) return `${formatNumber(Math.round(microsieverts))} µSv`;
  return `${formatNumber(Math.round(microsieverts / 100) / 10)} mSv`;
}

// Percentual do limite de carreira: abaixo de 1% não vira "0%"; abaixo de 10%, uma casa decimal.
function percentText(percent: number): string {
  if (percent > 0 && percent < 1) return '<1';
  return formatNumber(percent < 10 ? percent : Math.round(percent));
}

export function radiationTotal(
  records: DailyRecord[],
  missionDay: number,
  rules: Rules,
  priorCareerDoseMsv = 0,
): RadiationTotal | undefined {
  const context = rules.context?.radiationTotal;
  if (!context) return undefined;
  const doses = records
    .map((r) => r.values.radiationDose)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (doses.length === 0) return undefined;

  const total = doses.reduce((sum, dose) => sum + dose, 0);
  const missing = Math.max(0, missionDay - doses.length);
  const careerLimitMsv = context.careerLimitMsv ?? 600;
  const missionDoseMsv = Math.round((total / 1000) * 10) / 10;
  const totalCareerDoseMsv = Math.round((missionDoseMsv + priorCareerDoseMsv) * 10) / 10;
  const careerPercent = Math.round((totalCareerDoseMsv / careerLimitMsv) * 1000) / 10;

  const priorNote = priorCareerDoseMsv > 0
    ? i18n.t('context.radiation.prior', { prior: formatNumber(priorCareerDoseMsv) })
    : '';

  const parts = [
    i18n.t('context.radiation.total', {
      dose: doseText(total),
      percent: percentText(careerPercent),
      limit: formatNumber(careerLimitMsv),
      priorNote,
      days: i18n.t('context.dayCount', { count: doses.length }),
    }),
  ];
  if (missing > 0) parts.push(i18n.t('context.radiation.missing', { count: missing }));
  parts.push(i18n.t('context.radiation.notLimit'));

  return {
    text: parts.join(' '),
    sourceUrl: context.sourceUrl,
    missionDoseMsv,
    totalCareerDoseMsv,
    careerPercent,
    careerLimitMsv,
  };
}
