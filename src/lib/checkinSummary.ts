import type { AmslerVisionResult, ExerciseSession } from '../types';

// Minutos resistidos de uma sessão (N16). Em "aeróbico e resistido" vale o que a pessoa
// informou, limitado à duração; sem informar, não se supõe nada e fica 0.
export function resistancePart(session: ExerciseSession): number {
  if (session.resistanceStatus === 'notDone' || session.type === 'aerobic') return 0;
  if (session.type === 'resistance') return session.durationMinutes;
  return Math.min(Math.max(session.resistanceMinutes ?? 0, 0), session.durationMinutes);
}

// Visão (N15): o resumo 0/1/2 conta as alterações marcadas nos dois olhos.
export function visionSummary(amsler: AmslerVisionResult): 0 | 1 | 2 {
  const eyes = [amsler.left, amsler.right].filter((eye): eye is NonNullable<typeof eye> => eye !== undefined);
  const concerns = eyes.reduce((sum, eye) => sum + Object.values(eye).filter(Boolean).length, 0);
  return concerns >= 2 ? 2 : concerns > 0 ? 1 : 0;
}

// Grade de Amsler sem nenhuma alteração marcada nos dois olhos.
export const AMSLER_NO_CHANGE: AmslerVisionResult = {
  left: { distortedLines: false, missingAreas: false, nearReadingWorse: false },
  right: { distortedLines: false, missingAreas: false, nearReadingWorse: false },
};
