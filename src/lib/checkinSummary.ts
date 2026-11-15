import type { AmslerEyeResult, AmslerVisionResult, ExerciseApparatus, ExercisePart, ExerciseSession } from '../types';

// Minutos resistidos de uma sessão (N16). Em "aeróbico e resistido" vale o que a pessoa
// informou, limitado à duração; sem informar, não se supõe nada e fica 0.
export function resistancePart(session: ExerciseSession): number {
  if (session.resistanceStatus === 'notDone' || session.type === 'aerobic') return 0;
  if (session.type === 'resistance') return session.durationMinutes;
  return Math.min(Math.max(session.resistanceMinutes ?? 0, 0), session.durationMinutes);
}

// Aparelhos oferecidos em cada parte da sessão. O flywheel da Orion serve às duas.
export const APPARATUS_BY_PART: Record<ExercisePart, ExerciseApparatus[]> = {
  aerobic: ['treadmill', 'cycle', 'rower', 'flywheel', 'other'],
  resistance: ['resistive', 'flywheel', 'other'],
};

// Totais da sessão a partir dos aparelhos usados: a duração é a soma e, em "aeróbico e resistido",
// a parte resistida é a soma dos aparelhos marcados nessa parte.
export function withApparatusTotals(session: ExerciseSession): ExerciseSession {
  const uses = (session.apparatus ?? []).filter((use) => use.minutes > 0);
  const durationMinutes = uses.reduce((sum, use) => sum + use.minutes, 0);
  const resistanceMinutes = uses.filter((use) => use.part === 'resistance').reduce((sum, use) => sum + use.minutes, 0);
  return {
    ...session,
    apparatus: uses,
    durationMinutes,
    resistanceMinutes: session.type === 'both' ? resistanceMinutes : undefined,
  };
}

const EYE_FLAGS = ['distortedLines', 'missingAreas', 'nearReadingWorse'] as const;

// Um olho tem alteração quando alguma pergunta foi marcada ou alguma área da grade foi tocada.
export function eyeConcerns(eye: AmslerEyeResult): number {
  const flags = EYE_FLAGS.filter((key) => eye[key]).length;
  return flags > 0 ? flags : (eye.areas?.length ?? 0) > 0 ? 1 : 0;
}

// Visão (N15): o resumo 0/1/2 conta as alterações marcadas nos dois olhos.
export function visionSummary(amsler: AmslerVisionResult): 0 | 1 | 2 {
  const eyes = [amsler.left, amsler.right].filter((eye): eye is NonNullable<typeof eye> => eye !== undefined);
  const concerns = eyes.reduce((sum, eye) => sum + eyeConcerns(eye), 0);
  return concerns >= 2 ? 2 : concerns > 0 ? 1 : 0;
}

// Grade de Amsler sem nenhuma alteração marcada nos dois olhos.
export const AMSLER_NO_CHANGE: AmslerVisionResult = {
  left: { distortedLines: false, missingAreas: false, nearReadingWorse: false },
  right: { distortedLines: false, missingAreas: false, nearReadingWorse: false },
};
