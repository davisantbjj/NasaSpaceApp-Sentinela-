import { afterEach, describe, expect, it } from 'vitest';
import { buildCrewStatusSummary, crewStatus, hasCommanderRed, isCommanderAlert } from './access';
import { addDays, diffDays, formatDate, formatDateTime, formatDuration, lastDays, missionDay } from './dates';
import { formatNumber } from './format';
import { worstLevel } from './levels';
import type { Alert, DailyRecord, IndicatorId, Level } from '../types';
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

const mockAlert = (indicator: IndicatorId, level: Level = 'red'): Alert => ({
  id: `c1_2026-11-15_${indicator}`,
  crewId: 'c1',
  date: '2026-11-15',
  indicator,
  region: 'mind',
  level,
  trigger: 'generalRange',
  whatChanged: { key: 'test' },
  reference: { key: 'test' },
  whyItMatters: 'test',
  whatToDo: 'test',
  confidence: 'normal',
  notifyGround: level === 'red',
  sourceUrl: 'https://test',
});

describe('access: resumo do comandante (N9)', () => {
  it('resumo do comandante sai com red: false quando o único alerta vermelho vem do humor', () => {
    const alerts = [mockAlert('mood', 'red')];
    const summary = buildCrewStatusSummary('c1', '2026-11-15', alerts);
    expect(summary.red).toBe(false);
  });

  it('ignora alertas vermelhos de estresse, carga de trabalho e medicação', () => {
    expect(isCommanderAlert(mockAlert('mood'))).toBe(false);
    expect(isCommanderAlert(mockAlert('stress'))).toBe(false);
    expect(isCommanderAlert(mockAlert('workload'))).toBe(false);
    expect(isCommanderAlert(mockAlert('medication'))).toBe(false);
    expect(isCommanderAlert(mockAlert('heartRate'))).toBe(true);

    expect(hasCommanderRed([mockAlert('stress', 'red')])).toBe(false);
    expect(hasCommanderRed([mockAlert('workload', 'red')])).toBe(false);
    expect(hasCommanderRed([mockAlert('medication', 'red')])).toBe(false);
    expect(buildCrewStatusSummary('c1', '2026-11-15', [mockAlert('stress', 'red'), mockAlert('medication', 'red')]).red).toBe(false);
  });

  it('considera alerta vermelho de outros indicadores', () => {
    expect(hasCommanderRed([mockAlert('heartRate', 'red')])).toBe(true);
    expect(buildCrewStatusSummary('c1', '2026-11-15', [mockAlert('heartRate', 'red')]).red).toBe(true);
    expect(hasCommanderRed([mockAlert('mood', 'red'), mockAlert('bloodPressure', 'red')])).toBe(true);
    expect(buildCrewStatusSummary('c1', '2026-11-15', [mockAlert('mood', 'red'), mockAlert('bloodPressure', 'red')]).red).toBe(true);
  });

  it('crewStatus com lista de Alert respeita exclusão de saúde mental', () => {
    const records: DailyRecord[] = [
      { id: 'c1_2026-11-15', crewId: 'c1', date: '2026-11-15', missionDay: 1, values: {}, createdAt: '2026-11-15' },
    ];
    expect(crewStatus(records, [mockAlert('mood', 'red')], '2026-11-15')).toEqual({
      checkinToday: true,
      hasRed: false,
    });
    expect(crewStatus(records, [mockAlert('heartRate', 'red')], '2026-11-15')).toEqual({
      checkinToday: true,
      hasRed: true,
    });
  });
});
