import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { translateText } from './localize';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('translateText', () => {
  it('localizes interpolated M2 workload and stress alert values', async () => {
    await i18n.changeLanguage('en');
    const text = {
      key: 'alerts:change.general',
      params: {
        nameKey: 'indicators:stress.label',
        value: {
          key: 'alerts:values.number',
          params: {
            value: 5,
            unit: 'indicators:units.scaleOfFive',
            labelKey: 'indicators:stress.scale.5',
          },
        },
      },
    };
    expect(translateText(text)).toBe('Stress is 5 of 5 (Very high)');

    await i18n.changeLanguage('pt-BR');
    expect(translateText(text)).toBe('Estresse está em 5 de 5 (Muito alto)');
  });

  it('localizes medication and symptom labels from alert rules', async () => {
    await i18n.changeLanguage('en');
    expect(translateText({
      key: 'alerts:change.symptoms',
      params: { symptomKeys: ['alerts:symptoms.headache', 'alerts:symptoms.chestPain'] },
    })).toBe('Reported symptoms: headache, chest pain');
    expect(translateText({
      key: 'alerts:change.missedMedication',
      params: { doses: 'Lia eye drops' },
    })).toBe('Dose not taken today: Lia eye drops');
  });
});
