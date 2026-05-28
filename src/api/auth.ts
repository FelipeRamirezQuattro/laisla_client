import api from './axios';
import { User } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};
