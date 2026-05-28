import api from './axios';
import type { DailyExpense, MeasurementUnit } from '../types';

export interface DailyExpensesResponse {
  expenses: DailyExpense[];
  total: number;
}

export interface CreateDailyExpensePayload {
  date: string;
  type: 'INSUMO' | 'OTRO';
  description: string;
  amount: number;
  insumoId?: string;
  providerId?: string;
  quantity?: number;
  unit?: MeasurementUnit;
  notes?: string;
}

export const expensesApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<DailyExpensesResponse>('/admin/expenses', { params }),
  create: (data: CreateDailyExpensePayload) =>
    api.post<DailyExpense>('/admin/expenses', data),
  update: (id: string, data: CreateDailyExpensePayload) =>
    api.put<DailyExpense>(`/admin/expenses/${id}`, data),
};
