import { describe, expect, it } from 'vitest';
import { formatCOP, formatCOPDecimal, formatNumber, formatPct } from './formatCurrency';

describe('currency and percentage formatting', () => {
  it('formats Colombian pesos without cents', () => {
    expect(formatCOP(45_000)).toMatch(/45[.\u00a0]?000/);
    expect(formatCOP(45_000)).toContain('$');
  });

  it('formats numbers and decimal costs using the Colombian locale', () => {
    expect(formatNumber(12_345)).toMatch(/12[.\u00a0]?345/);
    expect(formatCOPDecimal(3.5)).toContain('3,50');
  });

  it('formats fractional percentages', () => {
    expect(formatPct(0.325)).toContain('32,5');
    expect(formatPct(0.325)).toContain('%');
  });
});
