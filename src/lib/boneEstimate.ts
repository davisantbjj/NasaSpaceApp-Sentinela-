import type { Environment, Rules } from '../types';
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
    parts.push(
      `Estimativa, não medida: depois de ${zeroG} ${zeroG === 1 ? 'dia' : 'dias'} sem gravidade, a perda nos ossos que sustentam peso fica em torno de ${min}% a ${max}%. ` +
        `A conta usa a média da NASA (${formatNumber(bone.minPercentPerMonth)}% a ${formatNumber(bone.maxPercentPerMonth)}% ao mês, em missões de ${bone.studiedMonths.min} a ${bone.studiedMonths.max} meses), um valor de grupo e não o seu.`,
    );
    if (months > bone.studiedMonths.max) {
      parts.push(`Depois de ${bone.studiedMonths.max} meses, a NASA ainda não sabe se a perda continua no mesmo ritmo.`);
    }
  }
  if (partial > 0) {
    parts.push(
      `${partial} ${partial === 1 ? 'dia foi' : 'dias foram'} em gravidade parcial (Lua ou Marte), onde a taxa de perda não é conhecida; ${partial === 1 ? 'esse dia não entra' : 'esses dias não entram'} na conta.`,
    );
  }
  if (parts.length === 0) return undefined;
  return { text: parts.join(' '), sourceUrl: bone.sourceUrl };
}
