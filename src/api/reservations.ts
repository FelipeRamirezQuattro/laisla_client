import api from './axios';
import { Reservation, ReservationStatus } from '../types';

interface ReservationsResponse {
  reservations: Reservation[];
  total: number;
  totalPages: number;
}

export const reservationsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<ReservationsResponse>('/admin/reservations', { params }),
  getOne: (id: string) => api.get<Reservation>(`/admin/reservations/${id}`),
  create: (data: Partial<Reservation>) => api.post<Reservation>('/admin/reservations', data),
  updateStatus: (id: string, data: { status?: ReservationStatus; tableId?: string | null; detail?: string }) =>
    api.patch<Reservation>(`/admin/reservations/${id}/status`, data),
  delete: (id: string) => api.delete(`/admin/reservations/${id}`),
};
