import { describe, expect, it } from 'vitest';
import { calculateNitDV, isValidNitDV } from './nitValidation';

describe('calculateNitDV', () => {
  it('computes the verification digit for a real NIT (DIAN módulo 11 algorithm)', () => {
    expect(calculateNitDV('890903938')).toBe(8);
  });

  it('returns the remainder as-is when it is 0 or 1', () => {
    expect(calculateNitDV('0')).toBe(0);
    expect(calculateNitDV('111111111111111')).toBe(1);
  });

  it('ignores non-digit characters like dots', () => {
    expect(calculateNitDV('890.903.938')).toBe(8);
  });
});

describe('isValidNitDV', () => {
  it('validates a correct NIT/DV pair', () => {
    expect(isValidNitDV('890903938', 8)).toBe(true);
    expect(isValidNitDV('890903938', '8')).toBe(true);
  });

  it('rejects an incorrect DV', () => {
    expect(isValidNitDV('890903938', 5)).toBe(false);
  });

  it('rejects an empty NIT', () => {
    expect(isValidNitDV('', 0)).toBe(false);
  });
});
