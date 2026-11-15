import { describe, expect, it } from 'vitest';
import enAlerts from './en/alerts.json';
import enCheckin from './en/checkin.json';
import enCommon from './en/common.json';
import enIndicators from './en/indicators.json';
import ptAlerts from './pt-BR/alerts.json';
import ptCheckin from './pt-BR/checkin.json';
import ptCommon from './pt-BR/common.json';
import ptIndicators from './pt-BR/indicators.json';
import { ENVIRONMENTS, INDICATORS, REGIONS } from '../content/indicators';
import rules from '../rules/rules.json';

function leafPaths(value: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null
      ? leafPaths(child as Record<string, unknown>, path)
      : [path];
  }).sort();
}

describe('locale resources', () => {
  const resources = {
    common: { en: enCommon, 'pt-BR': ptCommon },
    checkin: { en: enCheckin, 'pt-BR': ptCheckin },
    alerts: { en: enAlerts, 'pt-BR': ptAlerts },
    indicators: { en: enIndicators, 'pt-BR': ptIndicators },
  };

  it.each([
    ['common', enCommon, ptCommon],
    ['checkin', enCheckin, ptCheckin],
    ['alerts', enAlerts, ptAlerts],
    ['indicators', enIndicators, ptIndicators],
  ])('%s has the same keys in English and Brazilian Portuguese', (_namespace, english, portuguese) => {
    expect(leafPaths(portuguese)).toEqual(leafPaths(english));
  });

  it('every translation key referenced by indicator content and alert rules exists in both locales', () => {
    const references = collectKeys([INDICATORS, REGIONS, ENVIRONMENTS, rules]);
    for (const reference of references) {
      const separator = reference.indexOf(':');
      const namespace = reference.slice(0, separator) as keyof typeof resources;
      const key = reference.slice(separator + 1);
      expect(resources[namespace], `${reference} namespace`).toBeDefined();
      for (const language of ['en', 'pt-BR'] as const) {
        expect(hasPath(resources[namespace][language], key), `${language}: ${reference}`).toBe(true);
      }
    }
  });
});

function collectKeys(value: unknown): string[] {
  if (typeof value === 'string') return /^(common|checkin|alerts|indicators):/.test(value) ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value === 'object' && value !== null) return Object.values(value).flatMap(collectKeys);
  return [];
}

function hasPath(value: unknown, path: string): boolean {
  let current = value;
  for (const part of path.split('.')) {
    if (typeof current !== 'object' || current === null || !(part in current)) return false;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string';
}
