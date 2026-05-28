import api from './axios';
import { CashClosing } from '../types';
import type { DailyExpense } from '../types';

export interface DailySalesSummary {
  cashSales: number;
  cardSales: number;
  transferSales: number;
  totalSales: number;
  totalOrders: number;
  totalDailyExpenses: number;
  dailyExpenses: DailyExpense[];
  openOrdersCount: number;
  openOrders: Array<{
    _id: string;
    status: string;
    total: number;
    createdAt: string;
    tableName: string;
    itemsCount: number;
  }>;
  cancelledOrdersCount: number;
  cancelledOrders: Array<{
    _id: string;
    status: string;
    total: number;
    createdAt: string;
    cancelledAt?: string;
    cancelReason?: string;
    cancelReasonDetail?: string;
    tableName: string;
    itemsCount: number;
  }>;
}

export const cashClosingsApi = {
  getAll: () => api.get<CashClosing[]>('/admin/cashclosings'),
  getDailySales: (date?: string) =>
    api.get<DailySalesSummary>(
      '/admin/cashclosings/daily-sales',
      { params: date ? { date } : undefined }
    ),
  create: (data: Partial<CashClosing>) => api.post<CashClosing>('/admin/cashclosings', data),
};
