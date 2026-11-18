import api from './axios';
import type { DailyExpense, DailyExpenseType, ExpenseCategory, MeasurementUnit, PaymentMethod } from '../types';

export interface DailyExpensesResponse {
  expenses: DailyExpense[];
  total: number;
}

export interface CreateDailyExpensePayload {
  date: string;
  type: DailyExpenseType;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  cashAccount?: 'menor' | 'general';
  categoriaGasto?: ExpenseCategory;
  workerId?: string;
  gifConcept?: string;
  fechaVencimiento?: string;
  insumoId?: string;
  providerId?: string;
  quantity?: number;
  unit?: MeasurementUnit;
  notes?: string;
}

export interface LastInsumoPrice {
  insumoId: string;
  amount: number;
  quantity: number;
  unit: MeasurementUnit;
  /** Valor por unidad de compra (amount / quantity). */
  unitPrice: number;
  date: string;
}

export const expensesApi = {
  getLastPrices: () => api.get<LastInsumoPrice[]>('/admin/expenses/last-prices'),
  getAll: (params?: Record<string, string>) =>
    api.get<DailyExpensesResponse>('/admin/expenses', { params }),
  create: (data: CreateDailyExpensePayload) =>
    api.post<DailyExpense>('/admin/expenses', data),
  update: (id: string, data: CreateDailyExpensePayload) =>
    api.put<DailyExpense>(`/admin/expenses/${id}`, data),
  remove: (id: string) => api.delete(`/admin/expenses/${id}`),
};
