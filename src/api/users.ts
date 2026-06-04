import api from './axios';
import type { User, UserRole } from '../types';

export interface UserPayload {
  name: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  password?: string;
}

export const usersApi = {
  getAll: () => api.get<User[]>('/admin/users'),
  getAssignable: () => api.get<User[]>('/admin/users/assignable'),
  getMe: () => api.get<User>('/admin/users/me'),
  create: (data: UserPayload) => api.post<User>('/admin/users', data),
  update: (id: string, data: Partial<UserPayload>) => api.put<User>(`/admin/users/${id}`, data),
  updatePassword: (id: string, password: string) => api.put(`/admin/users/${id}/password`, { password }),
  updateMyPassword: (currentPassword: string, password: string) =>
    api.put('/admin/users/me/password', { currentPassword, password }),
  delete: (id: string) => api.delete(`/admin/users/${id}`),
};
