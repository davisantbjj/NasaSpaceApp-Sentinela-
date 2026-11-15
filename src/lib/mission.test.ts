import { describe, expect, it } from 'vitest';
import { daysByEnvironment, MISSION_PROFILES, phaseOnDay } from '../content/missions';
import { rules } from '../rules/rules';
import { estimateBoneLoss } from './boneEstimate';

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
