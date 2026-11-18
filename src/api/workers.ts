import api from './axios';
import type { Worker } from '../types';

export type WorkerPayload = Partial<Pick<Worker, 'name' | 'role' | 'hourlyRate' | 'hoursPerDay' | 'daysPerMonth' | 'active'>>;

export const workersApi = {
  getAll: () => api.get<Worker[]>('/admin/workers'),
  create: (data: WorkerPayload) => api.post<Worker>('/admin/workers', data),
  update: (id: string, data: WorkerPayload) => api.put<Worker>(`/admin/workers/${id}`, data),
  deactivate: (id: string) => api.delete<Worker>(`/admin/workers/${id}`),
};
