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
      `Estimativa, não medida: para ${zeroG} ${zeroG === 1 ? 'dia' : 'dias'} em microgravidade, a conta ilustrativa fica em torno de ${min}% a ${max}%. ` +
        `Ela multiplica pelo tempo uma média publicada pela NASA para ossos que sustentam peso (${formatNumber(bone.minPercentPerMonth)}% a ${formatNumber(bone.maxPercentPerMonth)}% ao mês, em missões de ${bone.studiedMonths.min} a ${bone.studiedMonths.max} meses). Não mede nem prevê a sua perda óssea; exercício, alimentação e diferenças individuais influenciam o resultado.`,
    );
    if (months < bone.studiedMonths.min) {
      parts.push(`Este período é menor que os ${bone.studiedMonths.min} a ${bone.studiedMonths.max} meses citados na fonte: extrapolar a média para uma missão curta não foi validado.`);
    }
    if (months > bone.studiedMonths.max) {
      parts.push(`Depois de ${bone.studiedMonths.max} meses, não se deve supor que a perda continua no mesmo ritmo; a extrapolação linear não foi validada.`);
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
