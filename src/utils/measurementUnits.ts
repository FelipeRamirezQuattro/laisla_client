import type { MeasurementUnit } from '../types';

export const MEASUREMENT_UNITS: Array<{ value: MeasurementUnit; label: string; short: string }> = [
  { value: 'KG', label: 'Kilogramos', short: 'KG' },
  { value: 'GR', label: 'Gramos', short: 'GR' },
  { value: 'LT', label: 'Litros', short: 'LT' },
  { value: 'ML', label: 'Mililitros', short: 'ML' },
  { value: 'UND', label: 'Unidades', short: 'UNIDADES' },
  { value: 'PAQ', label: 'Paquetes', short: 'PAQ' },
];

const FAMILY: Record<MeasurementUnit, 'weight' | 'volume' | 'count'> = {
  KG: 'weight',
  GR: 'weight',
  LT: 'volume',
  ML: 'volume',
  UND: 'count',
  PAQ: 'count',
};

export function normalizeMeasurementUnit(unit?: string | null): MeasurementUnit {
  const value = String(unit ?? '').trim().toUpperCase();
  if (['KG', 'KILO', 'KILOS', 'KILOGRAMO', 'KILOGRAMOS'].includes(value)) return 'KG';
  if (['GR', 'G', 'GRAMO', 'GRAMOS'].includes(value)) return 'GR';
  if (['LT', 'L', 'LITRO', 'LITROS'].includes(value)) return 'LT';
  if (['ML', 'MILILITRO', 'MILILITROS'].includes(value)) return 'ML';
  if (['PAQ', 'PAQS', 'PAQUETE', 'PAQUETES', 'PACK', 'PACKS'].includes(value)) return 'PAQ';
  return 'UND';
}

export function formatMeasurementUnit(unit?: string | null): string {
  const normalized = normalizeMeasurementUnit(unit);
  return MEASUREMENT_UNITS.find((u) => u.value === normalized)?.short ?? normalized;
}

export function toBaseQuantity(quantity: number, unit?: string | null): number {
  const normalized = normalizeMeasurementUnit(unit);
  if (normalized === 'KG' || normalized === 'LT') return quantity * 1000;
  return quantity;
}

export function areCompatibleUnits(a?: string | null, b?: string | null): boolean {
  return FAMILY[normalizeMeasurementUnit(a)] === FAMILY[normalizeMeasurementUnit(b)];
}

export function calcConvertedCost(input: {
  quantity: number;
  unit?: string | null;
  totalPrice?: number | null;
  pricedQuantity?: number | null;
  pricedUnit?: string | null;
}): number {
  const totalPrice = input.totalPrice ?? 0;
  const pricedQuantity = input.pricedQuantity ?? 1;
  if (!totalPrice || !areCompatibleUnits(input.unit, input.pricedUnit)) return 0;
  const baseQuantity = toBaseQuantity(input.quantity, input.unit);
  const pricedBaseQuantity = toBaseQuantity(pricedQuantity, input.pricedUnit);
  if (pricedBaseQuantity <= 0) return 0;
  return baseQuantity * (totalPrice / pricedBaseQuantity);
}
