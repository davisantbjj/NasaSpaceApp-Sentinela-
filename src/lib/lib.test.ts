import { describe, expect, it } from 'vitest';
import { addDays, diffDays, lastDays, missionDay } from './dates';
import { worstLevel } from './levels';

describe('dates', () => {
  it('soma dias atravessando mês e ano', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('conta o dia de missão a partir de 1', () => {
    expect(missionDay('2026-01-01', '2026-01-01')).toBe(1);
    expect(missionDay('2026-01-01', '2026-03-01')).toBe(60);
    expect(diffDays('2026-01-01', '2026-01-08')).toBe(7);
  });

  it('monta a janela de dias em ordem crescente', () => {
    expect(lastDays('2026-01-03', 3)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
  });
});

describe('levels', () => {
  it('fica com o pior nível', () => {
    expect(worstLevel('green', 'yellow')).toBe('yellow');
    expect(worstLevel('red', 'yellow', 'green')).toBe('red');
    expect(worstLevel()).toBe('green');
  });
});
