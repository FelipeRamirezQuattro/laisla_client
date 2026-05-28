import api from './axios';
import { Provider } from '../types';

export const providersApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<{ providers: Provider[]; total: number; totalPages: number }>('/admin/providers', { params }),
  getOne: (id: string) => api.get<Provider>(`/admin/providers/${id}`),
  create: (data: Partial<Provider>) => api.post<Provider>('/admin/providers', data),
  update: (id: string, data: Partial<Provider>) => api.put<Provider>(`/admin/providers/${id}`, data),
  delete: (id: string) => api.delete(`/admin/providers/${id}`),
};
