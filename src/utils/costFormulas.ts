// Mirror of backend/src/costs/services/CostCalculationService.ts
// Keep in sync. Used for real-time UI previews without API calls.
import type { MeasurementUnit } from '../types';
import { toBaseQuantity } from './measurementUnits';

export function calcPricePerUnit(
  totalPrice: number,
  quantityPerPresentation: number,
  unit: MeasurementUnit = 'UND'
): number {
  const baseQuantity = toBaseQuantity(quantityPerPresentation, unit);
  if (baseQuantity <= 0) return 0;
  return totalPrice / baseQuantity;
}

export function calcIngredientCost(quantity: number, pricePerUnit: number): number {
  return quantity * pricePerUnit;
}

export interface VariantCostInput {
  ingredientCosts: number[];
  disposablePackCost: number;
  laborPerItem: number;
  overheadPerItem: number;
  preparationTimeMinutes?: number;
  laborCostPerMinute?: number;
  salePrice: number;
  targetMargin?: number;
  ivaRate: number;
  taxRate?: number;
  taxIncluded?: boolean;
}

export interface VariantCostResult {
  directMaterialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  profitAmount: number;
  profitPct: number;
  grossMarginPct: number;
  suggestedPrice: number;
  salePriceWithoutTax: number;
  taxAmount: number;
  finalPrice: number;
}

export function calcVariantCosts(input: VariantCostInput): VariantCostResult {
  const directMaterialCost =
    input.ingredientCosts.reduce((a, b) => a + b, 0) + input.disposablePackCost;
  const laborCost =
    input.preparationTimeMinutes && input.preparationTimeMinutes > 0
      ? input.preparationTimeMinutes * (input.laborCostPerMinute ?? 0)
      : input.laborPerItem;
  const overheadCost = input.overheadPerItem;
  const totalCost = directMaterialCost + laborCost + overheadCost;
  const taxRate = input.taxRate ?? input.ivaRate ?? 0;
  const taxIncluded = input.taxIncluded ?? true;
  const salePriceWithoutTax = taxIncluded ? input.salePrice / (1 + taxRate) : input.salePrice;
  const taxAmount = salePriceWithoutTax * taxRate;
  const finalPrice = taxIncluded ? input.salePrice : salePriceWithoutTax + taxAmount;
  const profitAmount = salePriceWithoutTax - totalCost;
  const profitPct = totalCost > 0 ? profitAmount / totalCost : 0;
  const grossMarginPct =
    salePriceWithoutTax > 0 ? profitAmount / salePriceWithoutTax : 0;
  const suggestedNetPrice =
    input.targetMargin && input.targetMargin > 0 && input.targetMargin < 1
      ? totalCost / (1 - input.targetMargin)
      : 0;
  const suggestedPrice = taxRate > 0 ? suggestedNetPrice * (1 + taxRate) : suggestedNetPrice;
  return { directMaterialCost, laborCost, overheadCost, totalCost, profitAmount, profitPct, grossMarginPct, suggestedPrice, salePriceWithoutTax, taxAmount, finalPrice };
}

export function calcMODResult(params: {
  hourlyWage: number; numberOfWorkers: number; hoursPerDay: number;
  numberOfShifts: number; monthlyCustomers: number; productsPerCustomer: number;
}) {
  const totalHourlyWage = params.hourlyWage * params.numberOfWorkers * params.hoursPerDay;
  const dailyLabor = totalHourlyWage * params.numberOfShifts;
  const monthlyLabor = dailyLabor * 30.4;
  const denom = params.monthlyCustomers * params.productsPerCustomer;
  const laborPerItem = denom > 0 ? monthlyLabor / denom : 0;
  return { totalHourlyWage, dailyLabor, monthlyLabor, laborPerItem };
}

export function calcGIFResult(params: {
  overheadItems: Array<{ monthlyCost: number }>;
  monthlyCustomers: number; productsPerCustomer: number;
}) {
  const totalMonthlyOverhead = params.overheadItems.reduce((s, i) => s + i.monthlyCost, 0);
  const dailyOverhead = totalMonthlyOverhead / 30.4;
  const denom = params.monthlyCustomers * params.productsPerCustomer;
  const overheadPerItem = denom > 0 ? totalMonthlyOverhead / denom : 0;
  return { totalMonthlyOverhead, dailyOverhead, overheadPerItem };
}

export function calcMonthProjection(input: {
  dailyTickets: number; workingDaysPerMonth: number; averageTicket: number;
  costOfSalesPct: number; operatingExpenses: number;
}) {
  const monthlyTickets = input.dailyTickets * input.workingDaysPerMonth;
  const dailySales = input.dailyTickets * input.averageTicket;
  const monthlySales = monthlyTickets * input.averageTicket;
  const costOfSales = monthlySales * input.costOfSalesPct;
  const totalExpenses = costOfSales + input.operatingExpenses;
  const profit = monthlySales - totalExpenses;
  return { monthlyTickets, dailySales, monthlySales, costOfSales, totalExpenses, profit };
}
