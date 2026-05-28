import api from './axios';
import { Order, PaymentMethod } from '../types';

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export const ordersApi = {
  getAll: (params?: Record<string, string | number>) => api.get<OrdersResponse>('/admin/orders', { params }),
  getOne: (id: string) => api.get<Order>(`/admin/orders/${id}`),
  getTimingStats: (params?: Record<string, string>) => api.get<{
    avgDeliveryMinutes: number;
    avgStayMinutes: number;
    deliveredCount: number;
    billedCount: number;
    points: Array<{
      orderId: string;
      createdAt: string;
      deliveredAt?: string;
      billedAt?: string;
      deliveryMinutes: number | null;
      stayMinutes: number | null;
      total: number;
    }>;
  }>('/admin/orders/stats/timing', { params }),
  create: (data: { tableId?: string | null; orderType?: 'table' | 'walk-in'; clientId?: string; items: Order['items']; notes?: string; serviceDate?: string }) =>
    api.post<Order>('/admin/orders', data),
  update: (id: string, data: Partial<Order>) => api.put<Order>(`/admin/orders/${id}`, data),
  deliver: (id: string) => api.patch<Order>(`/admin/orders/${id}/deliver`),
  close: (id: string, paymentMethod: PaymentMethod) =>
    api.patch<Order>(`/admin/orders/${id}/close`, { paymentMethod }),
  cancel: (id: string, data: { reason: string; reasonDetail?: string }) =>
    api.patch<Order>(`/admin/orders/${id}/cancel`, data),
};
