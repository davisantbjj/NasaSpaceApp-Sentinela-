import type { DailyRecord, Rules } from '../types';
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
    .filter((v): v is number => typeof v === 'number');
  if (doses.length === 0) return undefined;

  const total = doses.reduce((sum, dose) => sum + dose, 0);
  const missing = Math.max(0, missionDay - doses.length);
  const parts = [
    `Dose acumulada registrada na missão: ${doseText(total)}, somando ${doses.length} ${doses.length === 1 ? 'dia' : 'dias'} com leitura do dosímetro.`,
  ];
  if (missing > 0) {
    parts.push(`${missing} ${missing === 1 ? 'dia sem leitura não entra' : 'dias sem leitura não entram'} na soma, então o total real é maior.`);
  }
  parts.push('É contexto, não limite: o app não avalia limites de dose da carreira nem eventos de radiação intensa.');
  return { text: parts.join(' '), sourceUrl: context.sourceUrl };
}
