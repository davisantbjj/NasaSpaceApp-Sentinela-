import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { displayText } from '../content/format';
import i18n from '../i18n';
import { AMSLER_NO_CHANGE, resistancePart, visionSummary } from './checkinSummary';
import { parseBounded } from '../components/mission/MissionDataCards';
import { hasHistoryChart, hasValue } from './series';

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});
afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('visão pela grade de Amsler (N15)', () => {
  it('sem nada marcado nos dois olhos o resumo é "sem mudança"', () => {
    expect(visionSummary(AMSLER_NO_CHANGE)).toBe(0);
  });

  it('conta as alterações marcadas', () => {
    const eye = { distortedLines: true, missingAreas: false, nearReadingWorse: false };
    expect(visionSummary({ left: eye })).toBe(1);
    expect(visionSummary({ left: eye, right: { ...eye, missingAreas: true } })).toBe(2);
  });

  it('o resumo da visão volta a aparecer com rótulo, não como número', () => {
    expect(displayText({ vision: 0 }, 'vision')).toBe('Sem mudança');
    expect(displayText({ vision: 1 }, 'vision')).toBe('Mudança leve');
  });
});

describe('parte resistida da sessão de exercício (N16)', () => {
  it('em "aeróbico e resistido" usa os minutos informados, não a duração inteira', () => {
    expect(resistancePart({ type: 'both', durationMinutes: 60, resistanceMinutes: 20 })).toBe(20);
  });

  it('sem minutos informados não supõe nada; e nunca passa da duração', () => {
    expect(resistancePart({ type: 'both', durationMinutes: 60 })).toBe(0);
    expect(resistancePart({ type: 'both', durationMinutes: 60, resistanceMinutes: 90 })).toBe(60);
  });

  it('só resistido conta a duração; aeróbico ou "não feito" contam 0', () => {
    expect(resistancePart({ type: 'resistance', durationMinutes: 40 })).toBe(40);
    expect(resistancePart({ type: 'aerobic', durationMinutes: 40 })).toBe(0);
    expect(resistancePart({ type: 'both', durationMinutes: 40, resistanceMinutes: 15, resistanceStatus: 'notDone' })).toBe(0);
  });
});

describe('condicionamento (N17)', () => {
  const conditioning = { aerobicPercent: 85, strengthPercent: 90, aerobicApparatus: 'treadmill', strengthApparatus: 'resistive' } as const;

  it('conta como registrado e não ganha gráfico de série única', () => {
    expect(hasValue({ conditioning }, 'conditioning')).toBe(true);
    expect(hasValue({}, 'conditioning')).toBe(false);
    expect(hasHistoryChart('conditioning')).toBe(false);
  });
});

describe('campos numéricos da tela de Missão (N2, N11, N13)', () => {
  it('vazio apaga, fora da faixa ou inválido não grava, vírgula vale como decimal', () => {
    expect(parseBounded('', 0, 10)).toBeNull();
    expect(parseBounded('2,5', 0, 10)).toBe(2.5);
    expect(parseBounded('-1', 0, 10)).toBeUndefined();
    expect(parseBounded('11', 0, 10)).toBeUndefined();
    expect(parseBounded('abc', 0, 10)).toBeUndefined();
  });
});
