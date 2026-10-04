import type { DenominationInput } from '../types';

// Mirrors backend/src/caja/constants/denominations.ts — $1.000 exists as both
// a billete and a moneda, so rows are keyed by (value, kind), never value alone.
export const COP_DENOMINATIONS: { value: number; kind: 'bill' | 'coin' }[] = [
  { value: 100000, kind: 'bill' },
  { value: 50000, kind: 'bill' },
  { value: 20000, kind: 'bill' },
  { value: 10000, kind: 'bill' },
  { value: 5000, kind: 'bill' },
  { value: 2000, kind: 'bill' },
  { value: 1000, kind: 'bill' },
  { value: 1000, kind: 'coin' },
  { value: 500, kind: 'coin' },
  { value: 200, kind: 'coin' },
  { value: 100, kind: 'coin' },
  { value: 50, kind: 'coin' },
];

export function emptyDenominationCounts(): DenominationInput[] {
  return COP_DENOMINATIONS.map((d) => ({ ...d, quantity: 0 }));
}
