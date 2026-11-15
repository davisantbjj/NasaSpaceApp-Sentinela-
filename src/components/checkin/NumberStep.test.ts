import { describe, expect, it } from 'vitest';
import { parseNumber } from './NumberStep';

describe('parseNumber', () => {
  it('accepts decimal commas and decimal points', () => {
    expect(parseNumber('5,2')).toBe(5.2);
    expect(parseNumber('5.2')).toBe(5.2);
  });
});
