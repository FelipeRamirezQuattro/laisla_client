import api from './axios';
import { Client } from '../types';

export const clientsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<{ clients: Client[]; total: number; totalPages: number }>('/admin/clients', { params }),
  getOne: (id: string) => api.get<Client>(`/admin/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/admin/clients', data),
  update: (id: string, data: Partial<Client>) => api.put<Client>(`/admin/clients/${id}`, data),
  delete: (id: string) => api.delete(`/admin/clients/${id}`),
};
