import api from './axios';
import { PrintAgent, PrintAgentWithToken, PrintConfig, PrintJob, Printer, PrintingAlerts } from '../types';

interface PrintJobsResponse {
  jobs: PrintJob[];
  total: number;
  page: number;
  limit: number;
}

export const printersApi = {
  getAll: (params?: Record<string, string>) => api.get<Printer[]>('/admin/printing/printers', { params }),
  create: (data: Partial<Printer>) => api.post<Printer>('/admin/printing/printers', data),
  update: (id: string, data: Partial<Printer>) => api.put<Printer>(`/admin/printing/printers/${id}`, data),
  delete: (id: string) => api.delete<{ success: true }>(`/admin/printing/printers/${id}`),
  test: (id: string) => api.post<PrintJob>(`/admin/printing/printers/${id}/test`),
};

export const printAgentsApi = {
  getAll: () => api.get<PrintAgent[]>('/admin/printing/agents'),
  create: (name: string) => api.post<PrintAgentWithToken>('/admin/printing/agents', { name }),
  revoke: (id: string) => api.post<PrintAgent>(`/admin/printing/agents/${id}/revoke`),
  regenerateToken: (id: string) => api.post<PrintAgentWithToken>(`/admin/printing/agents/${id}/regenerate-token`),
};

export const printConfigApi = {
  get: () => api.get<PrintConfig>('/admin/printing/config'),
  update: (data: Partial<PrintConfig>) => api.put<PrintConfig>('/admin/printing/config', data),
};

export const printJobsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get<PrintJobsResponse>('/admin/printing/jobs', { params }),
  retry: (id: string) => api.post<PrintJob>(`/admin/printing/jobs/${id}/retry`),
  reprintOrder: (orderId: string, amountReceived?: number) =>
    api.post<PrintJob>(`/admin/printing/orders/${orderId}/reprint`, { amountReceived }),
  sendReceiptEmail: (orderId: string, email: string) =>
    api.post<{ success: true }>(`/admin/printing/orders/${orderId}/send-receipt-email`, { email }),
};

export const printingAlertsApi = {
  get: () => api.get<PrintingAlerts>('/admin/printing/alerts'),
};
