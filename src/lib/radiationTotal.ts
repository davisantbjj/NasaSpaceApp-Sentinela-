import type { DailyRecord, Rules } from '../types';
import i18n from '../i18n';
import { formatNumber } from './series';

// Radiação ACUMULADA na missão (M6). É contexto, não alerta e não limite: soma as doses do dia
// digitadas pelo tripulante. Dias sem registro não entram, e o texto diz isso.

export interface RadiationTotal {
  text: string;
  sourceUrl: string;
}

// µSv até 999; a partir de 1.000 µSv, em mSv (1 mSv = 1.000 µSv).
function doseText(microsieverts: number): string {
  if (microsieverts < 1000) return `${formatNumber(Math.round(microsieverts))} µSv`;
  return `${formatNumber(Math.round(microsieverts / 100) / 10)} mSv`;
}

export function radiationTotal(records: DailyRecord[], missionDay: number, rules: Rules): RadiationTotal | undefined {
  const context = rules.context?.radiationTotal;
  if (!context) return undefined;
  const doses = records
    .map((r) => r.values.radiationDose)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (doses.length === 0) return undefined;

  const total = doses.reduce((sum, dose) => sum + dose, 0);
  const missing = Math.max(0, missionDay - doses.length);
  const parts = [
    i18n.t('context.radiation.total', { dose: doseText(total), days: i18n.t('context.dayCount', { count: doses.length }) }),
  ];
  if (missing > 0) parts.push(i18n.t('context.radiation.missing', { count: missing }));
  parts.push(i18n.t('context.radiation.notLimit'));
  return { text: parts.join(' '), sourceUrl: context.sourceUrl };
}
