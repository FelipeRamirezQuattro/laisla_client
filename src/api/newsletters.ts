import api from './axios';
import type { NewsletterCampaign, NewsletterSubscriber, NewsletterSummary } from '../types';

interface CampaignsResponse {
  campaigns: NewsletterCampaign[];
  total: number;
  totalPages: number;
}

interface SubscribersResponse {
  subscribers: NewsletterSubscriber[];
  total: number;
  totalPages: number;
}

export const newslettersApi = {
  getSummary: () => api.get<NewsletterSummary>('/admin/newsletters/summary'),
  getCampaigns: (params?: Record<string, string | number>) =>
    api.get<CampaignsResponse>('/admin/newsletters/campaigns', { params }),
  getSubscribers: (params?: Record<string, string | number>) =>
    api.get<SubscribersResponse>('/admin/newsletters/subscribers', { params }),
  createCampaign: (data: { subject: string; preheader?: string; body: string }) =>
    api.post<NewsletterCampaign>('/admin/newsletters/campaigns', data),
  sendCampaign: (id: string) =>
    api.post<NewsletterCampaign>(`/admin/newsletters/campaigns/${id}/send`),
};
