import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('la_isla_token');
const storedUser = localStorage.getItem('la_isla_user');

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,

  login: (token, user) => {
    localStorage.setItem('la_isla_token', token);
    localStorage.setItem('la_isla_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('la_isla_token');
    localStorage.removeItem('la_isla_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
