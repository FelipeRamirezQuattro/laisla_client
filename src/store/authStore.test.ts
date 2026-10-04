import { beforeEach, describe, expect, it } from 'vitest';
import type { User } from '../types';
import { useAuthStore } from './authStore';

const admin: User = {
  id: 'admin-1',
  name: 'QA Admin',
  email: 'qa-admin@laisla.test',
  role: 'admin'
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('persists login data and derives role flags', () => {
    useAuthStore.getState().login('test-token', admin);
    const state = useAuthStore.getState();

    expect(state.isAuthenticated).toBe(true);
    expect(state.isAdmin).toBe(true);
    expect(state.isSuperAdmin).toBe(false);
    expect(state.hasRole(['admin'])).toBe(true);
    expect(localStorage.getItem('la_isla_token')).toBe('test-token');
    expect(JSON.parse(localStorage.getItem('la_isla_user') ?? '{}')).toMatchObject(admin);
  });

  it('clears persisted and in-memory state on logout', () => {
    useAuthStore.getState().login('test-token', admin);
    useAuthStore.getState().logout();

    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isSuperAdmin: false
    });
    expect(localStorage.getItem('la_isla_token')).toBeNull();
    expect(localStorage.getItem('la_isla_user')).toBeNull();
  });
});
