import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const allowed = !!user && roles.includes(user.role);

  useEffect(() => {
    if (!allowed) toast.error('No tienes permisos para acceder a esta sección');
  }, [allowed]);

  if (!allowed) {
    return fallback ?? <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
