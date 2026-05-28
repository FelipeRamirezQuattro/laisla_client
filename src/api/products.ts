import api from './axios';
import { Product } from '../types';

export const productsApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get<{ products: Product[]; total: number; page: number; totalPages: number }>('/admin/products', { params }),
  getOne: (id: string) => api.get<Product>(`/admin/products/${id}`),
  create: (data: Partial<Product>) => api.post<Product>('/admin/products', data),
  update: (id: string, data: Partial<Product>) => api.put<Product>(`/admin/products/${id}`, data),
  delete: (id: string) => api.delete(`/admin/products/${id}`),
  toggle: (id: string) => api.patch<Product>(`/admin/products/${id}/toggle`),
};
