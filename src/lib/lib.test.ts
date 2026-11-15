import { afterEach, describe, expect, it } from 'vitest';
import { addDays, diffDays, formatDate, formatDateTime, formatDuration, lastDays, missionDay } from './dates';
import { formatNumber } from './format';
import { worstLevel } from './levels';
import i18n from '../i18n';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

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

  it('formata datas e números de acordo com o idioma ativo', async () => {
    await i18n.changeLanguage('en');
    expect(formatDate('2026-11-12')).toBe('11/12/2026');
    expect(formatNumber(5.2)).toBe('5.2');
    const englishDateTime = formatDateTime('2026-11-12T12:05:06', true);

    await i18n.changeLanguage('pt-BR');
    expect(formatDate('2026-11-12')).toBe('12/11/2026');
    expect(formatNumber(5.2)).toBe('5,2');
    expect(formatDateTime('2026-11-12T12:05:06', true)).not.toBe(englishDateTime);
    expect(englishDateTime).toContain('2026');
  });

  it('formats duration values and units with Intl', async () => {
    await i18n.changeLanguage('en');
    const english = formatDuration(3_600_000);
    await i18n.changeLanguage('pt-BR');
    const portuguese = formatDuration(3_600_000);

    expect(english).toBe('1 hr 0 min');
    expect(portuguese).toBe('1 h 0 min');
  });
});

describe('levels', () => {
  it('fica com o pior nível', () => {
    expect(worstLevel('green', 'yellow')).toBe('yellow');
    expect(worstLevel('red', 'yellow', 'green')).toBe('red');
    expect(worstLevel()).toBe('green');
  });
});
