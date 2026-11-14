import type { Level } from '../types';

const ORDER: Record<Level, number> = { green: 0, yellow: 1, red: 2 };

export function compareLevels(a: Level, b: Level): number {
  return ORDER[a] - ORDER[b];
}

export function worstLevel(...levels: Level[]): Level {
  return levels.reduce<Level>((worst, l) => (ORDER[l] > ORDER[worst] ? l : worst), 'green');
}
