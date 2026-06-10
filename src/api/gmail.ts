import api from './axios';

export interface GmailStatus {
  connected: boolean;
  gmailEmail: string;
  updatedAt?: string;
}

export const gmailApi = {
  status: () => api.get<GmailStatus>('/admin/gmail/status'),
  auth: (returnTo: string) => api.get<{ url: string }>('/admin/gmail/auth', { params: { returnTo } }),
  disconnect: () => api.delete('/admin/gmail/disconnect'),
};
