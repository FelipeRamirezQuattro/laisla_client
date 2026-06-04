import api from './axios';
import type { Notification } from '../types';

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; onlyUnread?: boolean }) =>
    api.get<NotificationsResponse>('/admin/notifications', { params }),
  getUnreadCount: () => api.get<{ unreadCount: number }>('/admin/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/admin/notifications/${id}/read`),
  markAllAsRead: () => api.put('/admin/notifications/read-all'),
};
