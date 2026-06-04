import { create } from 'zustand';
import { User, UserRole } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('la_isla_token');
const storedUser = localStorage.getItem('la_isla_user');
const parsedUser = storedUser ? JSON.parse(storedUser) as User : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  token: storedToken,
  user: parsedUser,
  isAuthenticated: !!storedToken,
  hasRole: (roles) => {
    const user = get().user;
    return !!user && roles.includes(user.role);
  },
  isSuperAdmin: parsedUser?.role === 'superadmin',
  isAdmin: parsedUser ? ['admin', 'superadmin'].includes(parsedUser.role) : false,

  login: (token, user) => {
    localStorage.setItem('la_isla_token', token);
    localStorage.setItem('la_isla_user', JSON.stringify(user));
    set({
      token,
      user,
      isAuthenticated: true,
      isSuperAdmin: user.role === 'superadmin',
      isAdmin: ['admin', 'superadmin'].includes(user.role),
    });
  },

  logout: () => {
    localStorage.removeItem('la_isla_token');
    localStorage.removeItem('la_isla_user');
    set({ token: null, user: null, isAuthenticated: false, isSuperAdmin: false, isAdmin: false });
  },
}));
