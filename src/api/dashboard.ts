import api from './axios';
import { DashboardSummary } from '../types';

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/admin/dashboard/summary'),
};
