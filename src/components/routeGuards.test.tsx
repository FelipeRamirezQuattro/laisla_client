import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User, UserRole } from '../types';
import { useAuthStore } from '../store/authStore';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';

const showPermissionError = vi.fn();

vi.mock('../hooks/useToast', () => ({
  useToast: () => ({ error: showPermissionError })
}));

function user(role: UserRole): User {
  return {
    id: `${role}-1`,
    name: `QA ${role}`,
    email: `${role}@laisla.test`,
    role
  };
}

describe('route guards', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    showPermissionError.mockClear();
  });

  it('redirects anonymous visitors to the admin login', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<div>Private dashboard</div>} />
          </Route>
          <Route path="/admin/login" element={<div>Admin login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin login')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });

  it('renders a protected route for an authenticated user', () => {
    useAuthStore.getState().login('token', user('user'));
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<div>Private dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Private dashboard')).toBeInTheDocument();
  });

  it('renders role-protected content for an allowed role', () => {
    useAuthStore.getState().login('token', user('admin'));
    render(
      <RoleGuard roles={['admin', 'superadmin']}>
        <div>Costs module</div>
      </RoleGuard>
    );

    expect(screen.getByText('Costs module')).toBeInTheDocument();
    expect(showPermissionError).not.toHaveBeenCalled();
  });

  it('renders the fallback and reports an error for a forbidden role', () => {
    useAuthStore.getState().login('token', user('user'));
    render(
      <RoleGuard roles={['superadmin']} fallback={<div>Forbidden</div>}>
        <div>Users module</div>
      </RoleGuard>
    );

    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('Users module')).not.toBeInTheDocument();
    expect(showPermissionError).toHaveBeenCalledWith('No tienes permisos para acceder a esta sección');
  });
});
