import api from './axios';
import { Event, DinnerGuest } from '../types';

interface EventsResponse {
  events: Event[];
  total: number;
  totalPages: number;
}

export const eventsApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get<EventsResponse>('/admin/events', { params }),
  getOne: (id: string) => api.get<Event>(`/admin/events/${id}`),
  create: (data: Partial<Event>) => api.post<Event>('/admin/events', data),
  update: (id: string, data: Partial<Event>) => api.put<Event>(`/admin/events/${id}`, data),
  delete: (id: string) => api.delete(`/admin/events/${id}`),
  generateGroups: (id: string) =>
    api.post<{ groups: Event['generatedGroups']; guests: DinnerGuest[] }>(`/admin/events/${id}/generate-groups`),
  getGuests: (id: string) => api.get<DinnerGuest[]>(`/admin/events/${id}/guests`),
  reassignGuest: (id: string, guestId: string, groupNumber: number) =>
    api.patch(`/admin/events/${id}/reassign-guest`, { guestId, groupNumber }),
};
