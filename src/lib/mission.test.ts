import { describe, expect, it } from 'vitest';
import { daysByEnvironment, MISSION_PROFILES, phaseOnDay } from '../content/missions';
import { rules } from '../rules/rules';
import { estimateBoneLoss } from './boneEstimate';
import { radiationTotal } from './radiationTotal';

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
