import { describe, expect, it } from 'vitest';
import { daysByEnvironment, MISSION_PROFILES, phaseOnDay } from '../content/missions';
import { rules } from '../rules/rules';
import { estimateBoneLoss } from './boneEstimate';
import { radiationTotal } from './radiationTotal';
import { weeklyGoals } from './weeklyGoals';

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
    expect(phaseOnDay(mars, 1000).label).toBe('Volta');
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

  it('avisa que não se sabe o ritmo depois de 6 meses', () => {
    expect(estimateBoneLoss(200, { station: 200 }, rules)!.text).toContain('ainda não sabe se a perda continua');
    expect(estimateBoneLoss(60, { station: 60 }, rules)!.text).not.toContain('ainda não sabe');
  });

  it('dias em gravidade parcial não entram na conta e são explicados', () => {
    const estimate = estimateBoneLoss(200, { transit: 180, mars: 20 }, rules)!;
    expect(estimate.text).toContain('depois de 180 dias sem gravidade');
    expect(estimate.text).toContain('20 dias foram em gravidade parcial');
  });
});

describe('radiação acumulada (M6)', () => {
  const day = (radiationDose?: number) => ({ id: 'x', crewId: 'c1', date: '2026-01-01', missionDay: 1, values: { radiationDose }, createdAt: '' });

  it('soma as doses do dia e passa para mSv a partir de 1.000 µSv', () => {
    const total = radiationTotal([day(400), day(420), day(430)], 3, rules)!;
    expect(total.text).toContain('1,3 mSv');
    expect(total.text).toContain('3 dias com leitura');
    expect(total.text).toContain('não limite');
    expect(total.text).not.toContain('sem leitura');
  });

  it('avisa quando há dias sem leitura', () => {
    const total = radiationTotal([day(400), day()], 5, rules)!;
    expect(total.text).toContain('400 µSv');
    expect(total.text).toContain('4 dias sem leitura não entram');
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
