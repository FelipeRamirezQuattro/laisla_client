import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export function useAuth() {
  const { token, user, isAuthenticated, login, logout } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    login(res.data.token, res.data.user);
    return res.data;
  };

  const signOut = () => {
    authApi.logout().catch(() => {});
    logout();
  };

  return { token, user, isAuthenticated, signIn, signOut };
}
