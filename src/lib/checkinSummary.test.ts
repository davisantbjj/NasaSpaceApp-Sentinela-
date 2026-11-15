import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { displayText } from '../content/format';
import i18n from '../i18n';
import { AMSLER_NO_CHANGE, eyeConcerns, resistancePart, visionSummary, withApparatusTotals } from './checkinSummary';
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

describe('campos numéricos da tela de Missão (N2, N11, N13)', () => {
  it('vazio apaga, fora da faixa ou inválido não grava, vírgula vale como decimal', () => {
    expect(parseBounded('', 0, 10)).toBeNull();
    expect(parseBounded('2,5', 0, 10)).toBe(2.5);
    expect(parseBounded('-1', 0, 10)).toBeUndefined();
    expect(parseBounded('11', 0, 10)).toBeUndefined();
    expect(parseBounded('abc', 0, 10)).toBeUndefined();
  });
});

describe('exercício por aparelho', () => {
  it('soma a duração e separa a parte resistida em "aeróbico e resistido"', () => {
    const session = withApparatusTotals({
      type: 'both',
      durationMinutes: 0,
      apparatus: [
        { part: 'aerobic', apparatus: 'treadmill', minutes: 30 },
        { part: 'resistance', apparatus: 'resistive', minutes: 25 },
        { part: 'resistance', apparatus: 'flywheel', minutes: 0 },
      ],
    });
    expect(session.durationMinutes).toBe(55);
    expect(session.resistanceMinutes).toBe(25);
    expect(session.apparatus).toHaveLength(2);
    expect(resistancePart(session)).toBe(25);
  });

  it('não guarda parte resistida em sessão só aeróbica', () => {
    const session = withApparatusTotals({
      type: 'aerobic',
      durationMinutes: 0,
      apparatus: [{ part: 'aerobic', apparatus: 'cycle', minutes: 40 }],
    });
    expect(session.durationMinutes).toBe(40);
    expect(session.resistanceMinutes).toBeUndefined();
  });
});

describe('grade de Amsler com áreas tocadas', () => {
  const none = { distortedLines: false, missingAreas: false, nearReadingWorse: false };

  it('área tocada sem pergunta marcada conta como uma alteração', () => {
    expect(eyeConcerns({ ...none, areas: [44, 45] })).toBe(1);
    expect(visionSummary({ left: { ...none, areas: [44] }, right: none })).toBe(1);
  });

  it('lista vazia de áreas não conta como alteração', () => {
    expect(eyeConcerns({ ...none, areas: [] })).toBe(0);
    expect(visionSummary({ left: { ...none, areas: [] }, right: none })).toBe(0);
  });
});
