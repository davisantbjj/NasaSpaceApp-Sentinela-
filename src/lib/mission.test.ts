import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sourceLabel } from '../content/format';
import i18n from '../i18n';
import { daysByEnvironment, MISSION_PROFILES, nextGravityChange, phaseOnDay } from '../content/missions';
import { rules } from '../rules/rules';
import { estimateBoneLoss } from './boneEstimate';
import { radiationTotal } from './radiationTotal';
import { weeklyGoals } from './weeklyGoals';

// Os textos abaixo são conferidos em português; o teste em inglês fica no fim.
beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});
afterAll(async () => {
  await i18n.changeLanguage('en');
});

describe('perfil de missão (M8)', () => {
  const mars = MISSION_PROFILES.mars;

  it('as fases de cada perfil cobrem do dia 1 até a duração, sem buraco', () => {
    for (const profile of Object.values(MISSION_PROFILES)) {
      expect(profile.phases[0].fromDay).toBe(1);
      expect(profile.phases[profile.phases.length - 1].toDay).toBe(profile.durationDays);
      profile.phases.slice(1).forEach((p, i) => expect(p.fromDay).toBe(profile.phases[i].toDay + 1));
    }
  });

  it('a fase do dia define o ambiente; depois do fim vale a última fase', () => {
    expect(phaseOnDay(mars, 60).environment).toBe('transit');
    expect(phaseOnDay(mars, 181).environment).toBe('mars');
    expect(phaseOnDay(mars, 1000).labelKey).toBe('common:missionProfiles.mars.phases.return');
  });

  it('conta os dias em cada ambiente', () => {
    expect(daysByEnvironment(mars, 200)).toEqual({ transit: 180, mars: 20 });
    expect(daysByEnvironment(MISSION_PROFILES.lunarFlyby, 15)).toEqual({ transit: 15 });
  });
});

describe('perda óssea estimada (M5)', () => {
  it('usa 1% a 1,5% ao mês só nos dias sem gravidade', () => {
    const estimate = estimateBoneLoss(60, { station: 60 }, rules)!;
    expect(estimate.text).toContain('em torno de 2% a 3%');
    expect(estimate.text).toContain('Estimativa, não medida');
    expect(estimate.sourceUrl).toContain('nasa.gov');
  });

  it('explicita a extrapolação antes de 4 e depois de 6 meses', () => {
    expect(estimateBoneLoss(10, { transit: 10 }, rules)!.text).toContain('missão curta não foi validado');
    expect(estimateBoneLoss(200, { station: 200 }, rules)!.text).toContain('extrapolação linear não foi validada');
    expect(estimateBoneLoss(150, { station: 150 }, rules)!.text).not.toContain('extrapolação');
    expect(estimateBoneLoss(150, { station: 150 }, rules)!.text).toContain('Não mede nem prevê');
  });

  it('dias em gravidade parcial não entram na conta e são explicados', () => {
    const estimate = estimateBoneLoss(200, { transit: 180, mars: 20 }, rules)!;
    expect(estimate.text).toContain('para 180 dias em microgravidade');
    expect(estimate.text).toContain('20 dias foram em gravidade parcial');
  });
});

describe('radiação acumulada (M6)', () => {
  const day = (radiationDose?: number) => ({ id: 'x', crewId: 'c1', date: '2026-01-01', missionDay: 1, values: { radiationDose }, createdAt: '' });

  it('soma as doses do dia e passa para mSv a partir de 1.000 µSv', () => {
    const total = radiationTotal([day(400), day(420), day(430)], 3, rules)!;
    expect(total.text).toContain('1,3 mSv');
    expect(total.text).toContain('3 dias com valor informado');
    expect(total.text).toContain('não está conectado a um dosímetro');
    expect(total.text).toContain('não limite');
    expect(total.text).not.toContain('sem leitura');
  });

  it('avisa quando há dias sem leitura', () => {
    const total = radiationTotal([day(400), day()], 5, rules)!;
    expect(total.text).toContain('400 µSv');
    expect(total.text).toContain('4 dias sem leitura válida não entram');
    expect(total.text).toContain('total registrado está incompleto');
    expect(total.text).not.toContain('total real é maior');
  });

  it('ignora doses negativas ou não finitas sem tratar zero como ausência', () => {
    const total = radiationTotal([day(-10), day(NaN), day(Infinity), day(0)], 4, rules)!;
    expect(total.text).toContain('0 µSv');
    expect(total.text).toContain('1 dia com valor informado');
    expect(total.text).toContain('3 dias sem leitura válida');
  });

  it('sem nenhuma leitura não mostra nada', () => {
    expect(radiationTotal([day()], 1, rules)).toBeUndefined();
  });
});

describe('metas semanais (M9)', () => {
  const rec = (date: string, sleepHours: number, exerciseMinutes?: number) => ({ id: date, crewId: 'c1', date, missionDay: 1, values: { sleepHours, exerciseMinutes }, createdAt: '' });

  it('conta os dias na faixa verde nos últimos 7 dias, contando hoje', () => {
    const records = [
      rec('2026-11-01', 8, 90), // fora da janela
      rec('2026-11-09', 8, 90), rec('2026-11-10', 8, 90), rec('2026-11-11', 6, 90),
      rec('2026-11-12', 7.5, 20), rec('2026-11-13', 8, 90), rec('2026-11-15', 8),
    ];
    const [sleep, exercise] = weeklyGoals(records, '2026-11-15', rules);
    expect(sleep).toMatchObject({ indicator: 'sleepHours', daysInGreen: 5, windowDays: 7, targetDays: 5, met: true, greenText: '7 a 9 h' });
    expect(exercise).toMatchObject({ indicator: 'exerciseMinutes', daysInGreen: 4, met: false });
  });
});

describe('readaptação à gravidade (M11)', () => {
  it('o aviso usa a janela configurada, inclui o dia e não inventa evento após o retorno', () => {
    const profile = MISSION_PROFILES.station;
    const window = rules.context!.readaptation!.noticeDaysBefore;
    expect(nextGravityChange(profile, 173)!.inDays).toBeGreaterThan(window);
    expect(nextGravityChange(profile, 174)!.inDays).toBe(window);
    expect(nextGravityChange(profile, 181)!.inDays).toBe(0);
    expect(nextGravityChange(profile, 182)).toBeUndefined();
  });
  it('acha o próximo pouso ou a volta à Terra', () => {
    expect(nextGravityChange(MISSION_PROFILES.mars, 60)).toEqual({ labelKey: 'common:mission.gravityChange.marsLanding', day: 181, inDays: 121 });
    expect(nextGravityChange(MISSION_PROFILES.mars, 181)).toEqual({ labelKey: 'common:mission.gravityChange.marsLanding', day: 181, inDays: 0 });
    expect(nextGravityChange(MISSION_PROFILES.mars, 700)).toEqual({ labelKey: 'common:mission.gravityChange.earthReturn', day: 915, inDays: 215 });
    expect(nextGravityChange(MISSION_PROFILES.station, 175)).toEqual({ labelKey: 'common:mission.gravityChange.earthReturn', day: 181, inDays: 6 });
    expect(nextGravityChange(MISSION_PROFILES.lunarFlyby, 30)).toBeUndefined();
  });
});

describe('origem do dado (M10)', () => {
  it('mostra o aparelho só quando o valor não foi digitado', () => {
    expect(sourceLabel({ sleepHours: 7, sources: { sleepHours: 'wearable' } }, 'sleepHours')).toBe('Sensor vestível');
    expect(sourceLabel({ sleepHours: 7, sources: { sleepHours: 'manual' } }, 'sleepHours')).toBeUndefined();
    expect(sourceLabel({ sleepHours: 7 }, 'sleepHours')).toBeUndefined();
  });
});

describe('contexto da fase 11 em inglês', () => {
  it('perda óssea, radiação e origem do dado seguem o idioma escolhido', async () => {
    await i18n.changeLanguage('en');
    expect(estimateBoneLoss(60, { station: 60 }, rules)!.text).toContain('for 60 days in microgravity');
    expect(estimateBoneLoss(200, { transit: 180, mars: 20 }, rules)!.text).toContain('20 days were in partial gravity');
    const day = { id: 'x', crewId: 'c1', date: '2026-01-01', missionDay: 1, values: { radiationDose: 1300 }, createdAt: '' };
    expect(radiationTotal([day], 1, rules)!.text).toContain('1.3 mSv');
    expect(sourceLabel({ sleepHours: 7, sources: { sleepHours: 'wearable' } }, 'sleepHours')).toBe('Wearable sensor');
    await i18n.changeLanguage('pt-BR');
  });
});
