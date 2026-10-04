import { create } from 'zustand';
import { cashShiftsApi } from '../api/cashShifts';
import type { CashShift } from '../types';

interface ShiftState {
  openShift: CashShift | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Single source of truth for "is a shift open right now" — shared by the
// Topbar indicator, BillingPage (sin-turno nudge) and ExpensesPage, so they
// poll once instead of each running their own interval. Mirrors the
// 30s-interval pattern already used by useNotifications.
export const useShiftStore = create<ShiftState>((set) => ({
  openShift: null,
  loading: false,
  refresh: async () => {
    set({ loading: true });
    try {
      const res = await cashShiftsApi.getOpen();
      set({ openShift: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
