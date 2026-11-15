import { describe, expect, it } from 'vitest';
import { addDays } from '../lib/dates';
import type { Alert, DailyRecord, DailyValues, MissionRuleContext, Rules } from '../types';
import { computeBaselines, findBaseline } from './baseline';
import { findCorrelations } from './correlation';
import { evaluateRecord, isCabinCo2High, levelByRegion, levelForRange } from './engine';
import { rules } from './rules';

const START = '2026-01-01';

// Um registro por item, em dias seguidos a partir de START.
function records(days: DailyValues[], crewId = 'c1'): DailyRecord[] {
  return days.map((values, i) => {
    const date = addDays(START, i);
    return { id: `${crewId}_${date}`, crewId, date, missionDay: i + 1, values, createdAt: date };
  });
}

function evaluateLast(
  days: DailyValues[],
  environment: 'station' | 'mars' = 'station',
  r: Rules = rules,
  context?: MissionRuleContext,
) {
  const all = records(days);
  const last = all[all.length - 1];
  const baselines = computeBaselines('c1', all, r);
  return evaluateRecord(last, all.slice(0, -1), baselines, r, environment, context);
}

const repeat = (values: DailyValues, times: number): DailyValues[] => Array.from({ length: times }, () => values);

describe('levelForRange', () => {
  const green = { min: 60, max: 100 };
  const yellow = { min: 50, max: 120 };

  it('classifica pelos limites, incluindo as bordas', () => {
    expect(levelForRange(60, green, yellow)).toBe('green');
    expect(levelForRange(100, green, yellow)).toBe('green');
    expect(levelForRange(55, green, yellow)).toBe('yellow');
    expect(levelForRange(120, green, yellow)).toBe('yellow');
    expect(levelForRange(49, green, yellow)).toBe('red');
    expect(levelForRange(121, green, yellow)).toBe('red');
  });

  describe('condicionamento periódico (N17)', () => {
    const assessment = (aerobicPercent: number, strengthPercent: number): DailyValues => ({
      conditioning: {
        aerobicPercent,
        strengthPercent,
        aerobicApparatus: 'treadmill',
        strengthApparatus: 'resistive',
      },
    });

    it('gera um alerta separado para cada capacidade abaixo de 80%', () => {
      const alerts = evaluateLast([assessment(79, 75)]);
      expect(alerts).toHaveLength(2);
      expect(alerts.map((alert) => alert.level)).toEqual(['yellow', 'yellow']);
      expect(alerts.every((alert) => alert.indicator === 'conditioning')).toBe(true);
    });

    it('o corte de 80% vem da faixa verde do rules.json', () => {
      const custom = structuredClone(rules);
      custom.indicators.conditioning!.green = { min: 70, max: 200 };
      expect(evaluateLast([assessment(75, 72)], 'station', custom)).toEqual([]);
    });

    it('não alerta quando as duas capacidades atingem 80%', () => {
      expect(evaluateLast([assessment(80, 100)])).toEqual([]);
    });
  });

  it('sem faixa geral fica verde', () => {
    expect(levelForRange(999)).toBe('green');
  });
});

describe('evaluateRecord', () => {
  it('valor dentro da faixa verde não gera alerta', () => {
    expect(evaluateLast(repeat({ heartRate: 70 }, 8))).toEqual([]);
  });

  it('fora da verde e dentro da amarela gera alerta amarelo', () => {
    const [alert] = evaluateLast([...repeat({ heartRate: 70 }, 8), { heartRate: 110 }]);
    expect(alert.level).toBe('yellow');
    expect(alert.trigger).toBe('generalRange');
    expect(alert.region).toBe('heart');
    expect(alert.reference).toEqual({ key: 'alerts:reference.general', params: { min: 60, max: 100, unit: 'bpm' } });
    expect(alert.notifyGround).toBe(false);
    expect(alert.confidence).toBe('normal');
  });

  it('fora da amarela gera alerta vermelho com notifyGround', () => {
    const [alert] = evaluateLast([...repeat({ heartRate: 70 }, 8), { heartRate: 130 }]);
    expect(alert.level).toBe('red');
    expect(alert.notifyGround).toBe(true);
    expect(alert.whatToDo).toBe(rules.indicators.heartRate!.messages.whatToDo.red);
  });

  it('todo alerta traz as seis partes', () => {
    const [alert] = evaluateLast([...repeat({ heartRate: 70 }, 8), { heartRate: 110 }]);
    for (const part of [alert.whatChanged, alert.reference, alert.whyItMatters, alert.whatToDo, alert.confidence, alert.sourceUrl]) {
      expect(part).toBeTruthy();
    }
  });

  it('desvio da linha de base por sustainedDays dias vira amarelo, mesmo dentro da faixa geral', () => {
    // Padrão pessoal de 65 bpm; 80 bpm está na faixa verde, mas 23% acima do padrão.
    const days = [...repeat({ heartRate: 65 }, 7), ...repeat({ heartRate: 80 }, 3)];
    const [alert] = evaluateLast(days);
    expect(alert.level).toBe('yellow');
    expect(alert.trigger).toBe('baselineDeviation');
    expect(alert.whatChanged).toEqual({
      key: 'alerts:change.baseline',
      params: {
        nameKey: 'indicators:heartRate.label',
        componentKey: '',
        percent: expect.any(Number),
        sideKey: 'alerts:side.above',
        days: 3,
        value: { key: 'alerts:values.number', params: { value: 80, unit: 'bpm', labelKey: '' } },
      },
    });
    expect(alert.reference).toEqual({
      key: 'alerts:reference.baseline',
      params: {
        value: { key: 'alerts:values.number', params: { value: 65, unit: 'bpm', labelKey: '' } },
        days: 7,
      },
    });
  });

  it('desvio por menos de sustainedDays dias não gera alerta', () => {
    expect(evaluateLast([...repeat({ heartRate: 65 }, 7), ...repeat({ heartRate: 80 }, 2)])).toEqual([]);
  });

  it('respeita o sentido de risco do desvio', () => {
    // Sono só alerta quando cai. 8,8 h está 17% acima do padrão de 7,5 h e dentro da faixa.
    expect(evaluateLast([...repeat({ sleepHours: 7.5 }, 7), ...repeat({ sleepHours: 8.8 }, 3)])).toEqual([]);
  });

  it('linha de base nunca deixa verde um valor fora da faixa geral', () => {
    // 110 bpm todos os dias é o "normal" da pessoa, mas continua fora da faixa verde.
    const [alert] = evaluateLast(repeat({ heartRate: 110 }, 10));
    expect(alert.level).toBe('yellow');
    expect(alert.trigger).toBe('generalRange');
  });

  it('ambiente acrescenta environmentNote e não muda o nível', () => {
    const days = [...repeat({ radiationDose: 400 }, 7), ...repeat({ radiationDose: 520 }, 3)];
    const [station] = evaluateLast(days, 'station');
    const [mars] = evaluateLast(days, 'mars');
    expect(station.level).toBe('yellow');
    expect(mars.level).toBe(station.level);
    expect(station.environmentNote).toBe(rules.environmentNotes.radiationDose!.station);
    expect(mars.environmentNote).toBe(rules.environmentNotes.radiationDose!.mars);
  });

  it('linha de base incompleta marca confidence low', () => {
    const [alert] = evaluateLast([...repeat({ heartRate: 70 }, 3), { heartRate: 110 }]);
    expect(alert.confidence).toBe('low');
    expect(alert.confidenceNote).toEqual({
      key: 'alerts:confidence.baselineForming',
      params: { sampleDays: 3, baselineDays: 7 },
    });
  });

  it('pressão arterial usa o pior dos dois números', () => {
    const [alert] = evaluateLast([
      ...repeat({ bloodPressure: { systolic: 118, diastolic: 76 } }, 8),
      { bloodPressure: { systolic: 120, diastolic: 95 } },
    ]);
    expect(alert.level).toBe('red');
    expect(alert.whatChanged).toEqual({
      key: 'alerts:change.general',
      params: {
        nameKey: 'indicators:bloodPressure.label',
        value: { key: 'alerts:values.bloodPressure', params: { systolic: 120, diastolic: 95, unit: 'mmHg' } },
      },
    });
  });

  it('escalas mostram o texto do valor', () => {
    const [alert] = evaluateLast([{ vision: 1 }]);
    expect(alert.level).toBe('yellow');
    expect(alert.whatChanged).toEqual({
      key: 'alerts:change.general',
      params: {
        nameKey: 'indicators:vision.label',
        value: { key: 'alerts:values.label', params: { labelKey: 'indicators:vision.scale.1' } },
      },
    });
    expect(alert.reference).toEqual({
      key: 'alerts:reference.expected',
      params: { value: { key: 'alerts:values.label', params: { labelKey: 'indicators:vision.scale.0' } } },
    });
  });

  it('sintomas usam o pior nível entre os marcados', () => {
    expect(evaluateLast([{ symptoms: [] }])).toEqual([]);
    const [yellow] = evaluateLast([{ symptoms: ['headache'] }]);
    expect(yellow.level).toBe('yellow');
    expect(yellow.trigger).toBe('symptom');
    const [red] = evaluateLast([{ symptoms: ['headache', 'chestPain'] }]);
    expect(red.level).toBe('red');
    expect(red.whatChanged).toEqual({
      key: 'alerts:change.symptoms',
      params: { symptomKeys: ['alerts:symptoms.headache', 'alerts:symptoms.chestPain'] },
    });
  });

  it('estresse e carga de trabalho: 1 a 3 é verde, 4 e 5 são amarelos e nunca vermelhos', () => {
    expect(evaluateLast([{ stress: 3, workload: 3 }])).toEqual([]);
    const alerts = evaluateLast([{ stress: 5, workload: 4 }]);
    expect(alerts.map((a) => [a.indicator, a.level])).toEqual([['stress', 'yellow'], ['workload', 'yellow']]);
    expect(alerts.every((a) => a.region === 'mind')).toBe(true);
    expect(alerts[0].whatChanged).toEqual({
      key: 'alerts:change.general',
      params: {
        nameKey: 'indicators:stress.label',
        value: { key: 'alerts:values.number', params: { value: 5, unit: 'indicators:units.scaleOfFive', labelKey: 'indicators:stress.scale.5' } },
      },
    });
  });

  it('treino resistido: sem faixa geral, só o desvio pessoal para baixo gera amarelo', () => {
    // Um dia isolado com pouco treino resistido não gera alerta: não há faixa geral.
    expect(evaluateLast([{ exerciseMinutes: 90, resistanceMinutes: 5 }])).toEqual([]);

    const normal = repeat({ exerciseMinutes: 90, resistanceMinutes: 40 }, 7);
    const less = repeat({ exerciseMinutes: 90, resistanceMinutes: 20 }, 3);
    const alerts = evaluateLast([...normal, ...less]);
    expect(alerts.map((a) => [a.indicator, a.level, a.trigger])).toEqual([['resistanceMinutes', 'yellow', 'baselineDeviation']]);
    expect(alerts[0].region).toBe('musculoskeletal');

    // Mais treino resistido que o habitual não é risco.
    const more = repeat({ exerciseMinutes: 90, resistanceMinutes: 60 }, 3);
    expect(evaluateLast([...normal, ...more])).toEqual([]);
  });

  it('tempo de reação: sem faixa geral, só ficar mais lento que o padrão gera amarelo', () => {
    const reactionTest = { mode: 'full' as const, completed: true, elapsedSeconds: 180, validResponses: 30, anticipations: 0 };
    expect(evaluateLast([{ reactionTime: 900, reactionTest }])).toEqual([]);
    const normal = repeat({ reactionTime: 300, reactionTest }, 7);
    const slower = evaluateLast([...normal, ...repeat({ reactionTime: 360, reactionTest }, 3)]);
    expect(slower.map((a) => [a.indicator, a.level, a.region])).toEqual([['reactionTime', 'yellow', 'mind']]);
    // Mais rápido que o padrão não é risco.
    expect(evaluateLast([...normal, ...repeat({ reactionTime: 240, reactionTest }, 3)])).toEqual([]);
    for (const details of [undefined, { ...reactionTest, mode: 'short' as const }, { ...reactionTest, completed: false }]) {
      const history = [...normal, ...repeat({ reactionTime: 900, reactionTest: details }, 3)];
      expect(evaluateLast(history)).toEqual([]);
      expect(findBaseline(computeBaselines('c1', records(history), rules), 'reactionTime')?.mean).toBe(300);
    }
  });

  it('sono e reação usam a associação genérica, sem corte exclusivo de 6 h e sem modo curto', () => {
    const reactionTest = { mode: 'full' as const, completed: true, elapsedSeconds: 180, validResponses: 30, anticipations: 0 };
    const normal = repeat({ sleepHours: 8, reactionTime: 300, reactionTest }, 7);
    const changed = repeat({ sleepHours: 6.5, reactionTime: 360, reactionTest }, 3);
    const history = records([...normal, ...changed]);
    const baselines = computeBaselines('c1', history, rules);
    expect(findCorrelations(history, baselines, rules).some(c => c.indicators.includes('reactionTime'))).toBe(true);
    const short = records([...normal, ...changed.map(v => ({ ...v, reactionTest: { ...reactionTest, mode: 'short' as const } }))]);
    expect(findCorrelations(short, baselines, rules).some(c => c.indicators.includes('reactionTime'))).toBe(false);
  });

  it('temperatura com linha de base: 7 dias a 36,6 °C seguidos de 3 dias a 37,0 °C gera amarelo por desvio (N1)', () => {
    // Linha de base em 36,6 °C. 37,0 °C é ~1,09% acima (limite 1,0%), gerando alerta após 3 dias.
    const normal = repeat({ temperature: 36.6 }, 7);
    const elevated = repeat({ temperature: 37.0 }, 3);
    const alerts = evaluateLast([...normal, ...elevated]);
    expect(alerts.map((a) => [a.indicator, a.level, a.trigger])).toEqual([
      ['temperature', 'yellow', 'baselineDeviation'],
    ]);
    expect(alerts[0].region).toBe('immune');

    // Desvio de menos de 3 dias não gera alerta
    expect(evaluateLast([...normal, ...repeat({ temperature: 37.0 }, 2)])).toEqual([]);

    // Desvio para baixo não gera alerta pessoal porque deviationDirection é "above"
    expect(evaluateLast([...normal, ...repeat({ temperature: 36.2 }, 3)])).toEqual([]);
  });

  it('temperatura: subida lenta ao longo de 60 dias não gera alerta todo dia (N1)', () => {
    // Sobe suavemente de 36,5 °C a 36,8 °C; as variações ficam dentro do limite de desvio pessoal
    const history: DailyValues[] = Array.from({ length: 60 }, (_, i) => ({
      temperature: Math.round((36.5 + (i / 60) * 0.3) * 10) / 10,
    }));
    const all = records(history);
    const baselines = computeBaselines('c1', all, rules);
    let alertedDays = 0;
    for (let i = 7; i < all.length; i++) {
      const dayAlerts = evaluateRecord(all[i], all.slice(0, i), baselines, rules, 'station');
      if (dayAlerts.some((a) => a.indicator === 'temperature')) {
        alertedDays++;
      }
    }
    expect(alertedDays).toBe(0);
  });

  it('massa corporal compara a perda com o valor inicial da missão (N11)', () => {
    const [yellow] = evaluateLast([{ bodyMassKg: 94 }], 'station', rules, { startBodyMassKg: 100 });
    expect(yellow).toMatchObject({
      indicator: 'bodyMassKg',
      level: 'yellow',
      trigger: 'generalRange',
    });
    expect(yellow.whatChanged.params).toMatchObject({ percent: 6, value: 94, start: 100 });

    const [red] = evaluateLast([{ bodyMassKg: 89.9 }], 'station', rules, { startBodyMassKg: 100 });
    expect(red.level).toBe('red');
  });

  it('massa corporal usa os limites de perda do rules.json (N11)', () => {
    const custom = structuredClone(rules);
    custom.indicators.bodyMassKg!.lossPercent = { yellow: 2, red: 4 };
    const [alert] = evaluateLast([{ bodyMassKg: 97 }], 'station', custom, { startBodyMassKg: 100 });
    expect(alert.level).toBe('yellow');
    expect(alert.reference.params).toMatchObject({ yellow: 2, red: 4 });
  });

  it('limite de CO2 vem do rules.json e só vale para os sintomas ligados ao CO2 (N13)', () => {
    expect(isCabinCo2High(3, rules)).toBe(false);
    expect(isCabinCo2High(3.1, rules)).toBe(true);
    expect(isCabinCo2High(undefined, rules)).toBe(false);
    const custom = structuredClone(rules);
    custom.context!.cabinCo2!.attentionMmhg = 2;
    const [alert] = evaluateLast([{ symptoms: ['headache'] }], 'station', custom, { cabinCo2Mmhg: 2.5 });
    expect(alert.whatToDo).toBe('alerts:rules.symptoms.co2High.yellow');
  });

  it('sintoma respiratório inclui orientação de CO2 quando a cabine passa de 3 mmHg (N13)', () => {
    const [alert] = evaluateLast([{ symptoms: ['headache'] }], 'station', rules, { cabinCo2Mmhg: 3.1 });
    expect(alert.whatToDo).toBe('alerts:rules.symptoms.co2High.yellow');
  });

  it('medicação: alerta só quando uma dose prevista não foi tomada', () => {
    const vitaminD = { id: 'vitaminD', label: 'Suplemento de vitamina D' };
    const eyeDrops = { id: 'eyeDrops', label: 'Colírio lubrificante' };
    expect(evaluateLast([{ medication: [] }])).toEqual([]);
    expect(evaluateLast([{ medication: [{ ...vitaminD, taken: true }] }])).toEqual([]);

    const [alert] = evaluateLast([{ medication: [{ ...vitaminD, taken: false }, { ...eyeDrops, taken: true }] }]);
    expect(alert.level).toBe('yellow');
    expect(alert.region).toBe('wholeBody');
    expect(alert.trigger).toBe('missedMedication');
    expect(alert.whatChanged).toEqual({
      key: 'alerts:change.missedMedication',
      params: { doses: 'Suplemento de vitamina D' },
    });
    expect(alert.confidence).toBe('low');
    expect(alert.notifyGround).toBe(false);
  });

  it('medicação: o ambiente não muda o nível', () => {
    const day = { medication: [{ id: 'vitaminD', label: 'Suplemento de vitamina D', taken: false }] };
    expect(evaluateLast([day], 'mars')[0].level).toBe(evaluateLast([day], 'station')[0].level);
  });

  it('ordena os alertas do mais grave para o menos grave', () => {
    const alerts = evaluateLast([{ heartRate: 110, temperature: 39, mood: 3 }]);
    expect(alerts.map((a) => a.level)).toEqual(['red', 'yellow', 'yellow']);
  });
});

describe('computeBaselines', () => {
  it('usa os primeiros baselineDays dias válidos', () => {
    const all = records([...repeat({ heartRate: 70 }, 7), ...repeat({ heartRate: 90 }, 5)]);
    const baseline = findBaseline(computeBaselines('c1', all, rules), 'heartRate')!;
    expect(baseline.mean).toBe(70);
    expect(baseline.sampleDays).toBe(7);
    expect(baseline.excludedDays).toBe(0);
  });

  it('descarta dias fora da faixa verde e conta em excludedDays', () => {
    const all = records([...repeat({ heartRate: 115 }, 2), ...repeat({ heartRate: 70 }, 7)]);
    const baseline = findBaseline(computeBaselines('c1', all, rules), 'heartRate')!;
    expect(baseline.mean).toBe(70);
    expect(baseline.excludedDays).toBe(2);
  });

  it('informa quantos dias já tem enquanto está em formação', () => {
    const baseline = findBaseline(computeBaselines('c1', records(repeat({ heartRate: 70 }, 4)), rules), 'heartRate')!;
    expect(baseline.sampleDays).toBe(4);
  });

  it('trata sistólica e diastólica como séries separadas', () => {
    const all = records(repeat({ bloodPressure: { systolic: 120, diastolic: 80 } }, 7));
    const baselines = computeBaselines('c1', all, rules);
    expect(findBaseline(baselines, 'bloodPressure', 'systolic')!.mean).toBe(120);
    expect(findBaseline(baselines, 'bloodPressure', 'diastolic')!.mean).toBe(80);
  });

  it('não cria linha de base para humor, visão e sintomas', () => {
    const all = records(repeat({ mood: 4, vision: 0, symptoms: [] }, 7));
    expect(computeBaselines('c1', all, rules)).toEqual([]);
  });
});

describe('findCorrelations', () => {
  it('aponta indicadores que saíram do esperado nos mesmos dias, sem falar em causa', () => {
    const all = records([...repeat({ sleepHours: 7.5, mood: 4 }, 8), ...repeat({ sleepHours: 5.5, mood: 3 }, 4)]);
    const [correlation] = findCorrelations(all, computeBaselines('c1', all, rules), rules);
    expect(correlation.indicators).toEqual(['sleepHours', 'mood']);
    expect(correlation.description).toEqual({
      key: 'alerts:correlation',
      params: {
        firstKey: 'indicators:sleepHours.label',
        secondKey: 'indicators:mood.label',
        days: 4,
      },
    });
    expect(correlation.fromDate).toBe(addDays(START, 8));
    expect(correlation.description.key).toBe('alerts:correlation');
  });

  it('não aponta nada se durou menos que sustainedDays', () => {
    const all = records([...repeat({ sleepHours: 7.5, mood: 4 }, 8), ...repeat({ sleepHours: 5.5, mood: 3 }, 2)]);
    expect(findCorrelations(all, computeBaselines('c1', all, rules), rules)).toEqual([]);
  });
});

describe('levelByRegion', () => {
  const alert = (region: Alert['region'], level: Alert['level']) => ({ region, level }) as Alert;

  it('deixa verde as regiões sem alerta', () => {
    expect(levelByRegion([]).heart).toBe('green');
  });

  it('fica com o pior nível da região', () => {
    const levels = levelByRegion([alert('heart', 'yellow'), alert('heart', 'red'), alert('mind', 'yellow')]);
    expect(levels.heart).toBe('red');
    expect(levels.mind).toBe('yellow');
    expect(levels.head).toBe('green');
  });
});
