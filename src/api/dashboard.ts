import api from './axios';
import { DashboardSummary, MonthlySales } from '../types';

export const dashboardApi = {
  getSummary: (params?: { dateFrom?: string; dateTo?: string }) => api.get<DashboardSummary>('/admin/dashboard/summary', { params }),
  getMonthlySales: (month?: string) => api.get<MonthlySales>('/admin/dashboard/monthly-sales', { params: { month } }),
};
