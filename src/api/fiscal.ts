import api from './axios';
import { FiscalConfig, FiscalDocument, FiscalHealth, FiscalOrderTicket } from '../types';

interface FiscalDocumentsResponse {
  documents: FiscalDocument[];
  total: number;
  page: number;
  limit: number;
}

export const fiscalConfigApi = {
  get: () => api.get<FiscalConfig>('/admin/fiscal/config'),
  update: (data: Partial<FiscalConfig>) => api.put<FiscalConfig>('/admin/fiscal/config', data),
};

export const fiscalDocumentsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<FiscalDocumentsResponse>('/admin/fiscal/documents', { params }),
  getOne: (id: string) => api.get<FiscalDocument>(`/admin/fiscal/documents/${id}`),
  retry: (id: string) => api.post<FiscalDocument>(`/admin/fiscal/documents/${id}/retry`),
  getFiles: (id: string) => api.get<{ pdfUrl?: string; xmlUrl?: string }>(`/admin/fiscal/documents/${id}/files`),
  createCreditNote: (id: string, reason: string) =>
    api.post<FiscalDocument>(`/admin/fiscal/documents/${id}/credit-note`, { reason }),
};

export const fiscalApi = {
  getHealth: () => api.get<FiscalHealth>('/admin/fiscal/health'),
  getOrderTicket: (orderId: string) => api.get<FiscalOrderTicket>(`/admin/fiscal/orders/${orderId}/ticket`),
};
