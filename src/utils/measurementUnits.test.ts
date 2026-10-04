import { describe, expect, it } from 'vitest';
import {
  areCompatibleUnits,
  calcConvertedCost,
  formatMeasurementUnit,
  normalizeMeasurementUnit,
  toBaseQuantity
} from './measurementUnits';

describe('measurementUnits', () => {
  it.each([
    ['kilogramos', 'KG'],
    ['g', 'GR'],
    ['l', 'LT'],
    ['mililitros', 'ML'],
    ['paquetes', 'PAQ'],
    [null, 'UND']
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeMeasurementUnit(input)).toBe(expected);
  });

  it('formats normalized display units', () => {
    expect(formatMeasurementUnit('unidad')).toBe('UNIDADES');
    expect(formatMeasurementUnit('pack')).toBe('PAQ');
  });

  it('converts mass and volume presentations to base quantities', () => {
    expect(toBaseQuantity(2, 'KG')).toBe(2_000);
    expect(toBaseQuantity(1.5, 'LT')).toBe(1_500);
    expect(toBaseQuantity(4, 'PAQ')).toBe(4);
  });

  it('recognizes compatible and incompatible units', () => {
    expect(areCompatibleUnits('KG', 'GR')).toBe(true);
    expect(areCompatibleUnits('LT', 'ML')).toBe(true);
    expect(areCompatibleUnits('UND', 'PAQ')).toBe(true);
    expect(areCompatibleUnits('KG', 'LT')).toBe(false);
  });

  it('calculates converted cost and protects invalid inputs', () => {
    expect(calcConvertedCost({
      quantity: 250,
      unit: 'GR',
      totalPrice: 20_000,
      pricedQuantity: 1,
      pricedUnit: 'KG'
    })).toBe(5_000);
    expect(calcConvertedCost({
      quantity: 250,
      unit: 'ML',
      totalPrice: 20_000,
      pricedQuantity: 1,
      pricedUnit: 'KG'
    })).toBe(0);
    expect(calcConvertedCost({
      quantity: 250,
      unit: 'GR',
      totalPrice: 20_000,
      pricedQuantity: 0,
      pricedUnit: 'KG'
    })).toBe(0);
  });
});
