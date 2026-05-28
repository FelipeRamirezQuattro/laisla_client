import api from './axios';
import { Event, Reservation, DinnerGuest, EventBooking } from '../types';

export const publicApi = {
  getEvents: (params?: { type?: string }) =>
    api.get<Event[]>('/public/events', { params }),
  getEvent: (id: string) => api.get<Event>(`/public/events/${id}`),
  createReservation: (data: Partial<Reservation>) =>
    api.post<Reservation>('/public/reservations', data),
  bookEvent: (id: string, data: { name: string; email: string; phone: string; tickets: number; notes?: string }) =>
    api.post<{ message: string; booking: EventBooking; event: Pick<Event, 'title' | 'date' | 'time'> }>(`/public/events/${id}/book`, data),
  registerDinnerGuest: (data: Partial<DinnerGuest>) =>
    api.post<DinnerGuest>('/public/dinner-registrations', data),
};
