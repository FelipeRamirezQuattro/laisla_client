import { describe, expect, it } from 'vitest';
import {
  calcGIFResult,
  calcIngredientCost,
  calcMODFromWorkersResult,
  calcMODResult,
  calcMonthProjection,
  calcPricePerUnit,
  calcVariantCosts
} from './costFormulas';

describe('costFormulas', () => {
  it('calculates base-unit and ingredient costs', () => {
    expect(calcPricePerUnit(18_000, 1.5, 'KG')).toBe(12);
    expect(calcIngredientCost(250, 12)).toBe(3_000);
  });

  it('calculates food-cost price, tax and profitability', () => {
    const result = calcVariantCosts({
      ingredientCosts: [2_000, 1_000],
      disposablePackCost: 500,
      laborPerItem: 750,
      overheadPerItem: 250,
      salePrice: 10_800,
      costingMethod: 'food-cost',
      targetFoodCostPct: 0.35,
      ivaRate: 0.08,
      taxIncluded: true
    });

    expect(result.directMaterialCost).toBe(3_500);
    expect(result.totalCost).toBe(3_500);
    expect(result.salePriceWithoutTax).toBeCloseTo(10_000);
    expect(result.finalPrice).toBe(10_800);
    expect(result.suggestedPrice).toBeCloseTo(10_800);
  });

  it('calculates full-cost labor from preparation time', () => {
    const result = calcVariantCosts({
      ingredientCosts: [2_000],
      disposablePackCost: 500,
      laborPerItem: 750,
      overheadPerItem: 250,
      preparationTimeMinutes: 6,
      laborCostPerMinute: 125,
      salePrice: 8_000,
      costingMethod: 'full-cost',
      targetMargin: 0.5,
      ivaRate: 0,
      taxIncluded: false
    });

    expect(result.laborCost).toBe(750);
    expect(result.overheadCost).toBe(250);
    expect(result.totalCost).toBe(3_500);
    expect(result.suggestedPrice).toBe(7_000);
  });

  it('uses safe zero allocations when volume is zero', () => {
    expect(calcMODResult({
      hourlyWage: 10_000,
      numberOfWorkers: 2,
      hoursPerDay: 8,
      numberOfShifts: 1,
      monthlyCustomers: 0,
      productsPerCustomer: 2
    }).laborPerItem).toBe(0);
    expect(calcGIFResult({
      overheadItems: [{ monthlyCost: 2_000_000 }],
      monthlyCustomers: 0,
      productsPerCustomer: 2
    }).overheadPerItem).toBe(0);
  });

  it('calculates projection totals', () => {
    expect(calcMonthProjection({
      dailyTickets: 80,
      workingDaysPerMonth: 25,
      averageTicket: 20_000,
      costOfSalesPct: 0.25,
      operatingExpenses: 12_000_000
    })).toEqual({
      monthlyTickets: 2_000,
      dailySales: 1_600_000,
      monthlySales: 40_000_000,
      costOfSales: 10_000_000,
      totalExpenses: 22_000_000,
      profit: 18_000_000
    });
  });
});

describe('calcMODFromWorkersResult', () => {
  const workers = [
    { hourlyRate: 5_000, hoursPerDay: 8, daysPerMonth: 26 },
    { hourlyRate: 4_000, hoursPerDay: 4, daysPerMonth: 30.4 },
    { hourlyRate: 6_000, hoursPerDay: 6, daysPerMonth: 20 },
  ];

  it('suma el costo de cada trabajador con su tarifa, horas y días', () => {
    const r = calcMODFromWorkersResult({ workers, monthlyCustomers: 600, productsPerCustomer: 2 });
    expect(r.monthlyLabor).toBeCloseTo(2_246_400, 2);
    expect(r.totalHourlyWage).toBe(92_000);
    expect(r.laborPerItem).toBeCloseTo(1_872, 4);
  });

  it('con trabajadores iguales coincide con el cálculo manual (3 × $2.000 × 8 h = $1.459.200/mes)', () => {
    const same = Array.from({ length: 3 }, () => ({ hourlyRate: 2_000, hoursPerDay: 8, daysPerMonth: 30.4 }));
    const a = calcMODFromWorkersResult({ workers: same, monthlyCustomers: 600, productsPerCustomer: 2 });
    const b = calcMODResult({ hourlyWage: 2_000, numberOfWorkers: 3, hoursPerDay: 8, numberOfShifts: 1, monthlyCustomers: 600, productsPerCustomer: 2 });
    expect(a.monthlyLabor).toBeCloseTo(b.monthlyLabor, 6);
    expect(a.laborPerItem).toBeCloseTo(b.laborPerItem, 6);
  });

  it('sin demanda no divide entre cero', () => {
    expect(calcMODFromWorkersResult({ workers, monthlyCustomers: 0, productsPerCustomer: 2 }).laborPerItem).toBe(0);
  });
});
