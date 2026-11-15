import type { DailyRecord, DailyValues, Rules } from '../types';

// Água (N12): o tripulante informa quantos mL bebeu e o app compara com uma referência pelo peso.
// A referência vem de rules.json (context.hydration) e é de demonstração: mlPerKg × massa corporal,
// nunca abaixo de minimumMl. Sem massa conhecida, vale só o mínimo.

export type WaterStatus = 'below' | 'ok' | 'high';

// Massa usada na conta: a do próprio dia, senão a última registrada, senão a do início da missão.
export function referenceBodyMass(
  values: DailyValues | undefined,
  previous: DailyRecord[],
  startBodyMassKg?: number,
): number | undefined {
  if (values?.bodyMassKg !== undefined) return values.bodyMassKg;
  for (let i = previous.length - 1; i >= 0; i -= 1) {
    const mass = previous[i].values.bodyMassKg;
    if (mass !== undefined) return mass;
  }
  return startBodyMassKg;
}

export function hydrationReferenceMl(bodyMassKg: number | undefined, rules: Rules): number | undefined {
  const config = rules.context?.hydration;
  if (!config) return undefined;
  if (bodyMassKg === undefined || !Number.isFinite(bodyMassKg) || bodyMassKg <= 0) return config.minimumMl;
  return Math.max(config.minimumMl, Math.round((config.mlPerKg * bodyMassKg) / 50) * 50);
}

export function waterStatus(waterMl: number, bodyMassKg: number | undefined, rules: Rules): WaterStatus | undefined {
  const config = rules.context?.hydration;
  const reference = hydrationReferenceMl(bodyMassKg, rules);
  if (!config || reference === undefined) return undefined;
  if (waterMl < reference) return 'below';
  if (bodyMassKg !== undefined && bodyMassKg > 0 && waterMl > config.highMlPerKg * bodyMassKg) return 'high';
  return 'ok';
}
