import api from './axios';
import type { CashBalances, CashMovement, CashMovementType, CashShift, DenominationInput } from '../types';

export interface OpenShiftPayload {
  denominations: DenominationInput[];
  notes?: string;
}

export interface CloseShiftPayload {
  denominations: DenominationInput[];
  notes?: string;
}

export interface CreateMovementPayload {
  type: CashMovementType;
  amount: number;
  reason: string;
}

export interface ShiftFiscalCheck {
  unsettledCount: number;
  warning: string;
}

export interface ShiftSummary {
  salesSnapshot: {
    cashSales: number;
    cardSales: number;
    nequiSales: number;
    transferSales: number;
    totalSales: number;
    totalOrders: number;
    unassignedOrdersCount: number;
  };
  totalExpenses: number;
  dailyExpenses: Array<{ _id: string; description: string; amount: number }>;
  unassignedOrders: Array<{ _id: string; total: number }>;
}

export type CashAccountKey = 'menor' | 'general' | 'transfer' | 'nequi' | 'card';

export interface ListShiftsFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export interface ShiftDeletionPreview {
  status: string;
  orders: number;
  ordersTotal: number;
  expenses: number;
  expensesTotal: number;
  movements: number;
  acceptedFiscalDocuments: number;
}

export interface UpdateShiftPayload {
  openedBy?: string;
  notes?: string;
}

export const cashShiftsApi = {
  getOpen: () => api.get<CashShift | null>('/admin/caja/shifts/open'),
  open: (data: OpenShiftPayload) => api.post<CashShift>('/admin/caja/shifts', data),
  getById: (id: string) => api.get<CashShift>(`/admin/caja/shifts/${id}`),
  list: (params?: ListShiftsFilters) => api.get<CashShift[]>('/admin/caja/shifts', { params }),
  addMovement: (shiftId: string, data: CreateMovementPayload) =>
    api.post<CashMovement>(`/admin/caja/shifts/${shiftId}/movements`, data),
  close: (shiftId: string, data: CloseShiftPayload) =>
    api.post<CashShift>(`/admin/caja/shifts/${shiftId}/close`, data),
  approve: (shiftId: string, notes?: string) =>
    api.post<CashShift>(`/admin/caja/shifts/${shiftId}/approve`, { notes }),
  adjust: (shiftId: string, reason: string, changes: Partial<CashShift>) =>
    api.post<CashShift>(`/admin/caja/shifts/${shiftId}/adjust`, { reason, changes }),
  getFiscalCheck: (shiftId: string) => api.get<ShiftFiscalCheck>(`/admin/caja/shifts/${shiftId}/fiscal-check`),
  update: (shiftId: string, data: UpdateShiftPayload) => api.put<CashShift>(`/admin/caja/shifts/${shiftId}`, data),
  getDeletionPreview: (shiftId: string) => api.get<ShiftDeletionPreview>(`/admin/caja/shifts/${shiftId}/deletion-preview`),
  remove: (shiftId: string) => api.delete<ShiftDeletionPreview>(`/admin/caja/shifts/${shiftId}`),
  getBalances: () => api.get<CashBalances>('/admin/caja/shifts/balances'),
  transfer: (data: CreateMovementPayload) => api.post<CashMovement>('/admin/caja/shifts/transfers', data),
  transferBetweenAccounts: (data: { from: CashAccountKey; to: CashAccountKey; amount: number; reason: string }) =>
    api.post<CashBalances>('/admin/caja/shifts/account-transfers', data),
  calibrateAccount: (data: { account: Exclude<CashAccountKey, 'menor'>; targetBalance: number; reason: string }) =>
    api.post<{ delta: number; balances: CashBalances }>('/admin/caja/shifts/calibrate', data),
  getSummary: (shiftId: string) => api.get<ShiftSummary>(`/admin/caja/shifts/${shiftId}/summary`),
};
