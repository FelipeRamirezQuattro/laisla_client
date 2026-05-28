import api from './axios';
import { CafeTable, TableZoneRecord } from '../types';

export const tablesApi = {
  getZones: () => api.get<TableZoneRecord[]>('/admin/tables/zones'),
  createZone: (data: { label: string }) => api.post<TableZoneRecord>('/admin/tables/zones', data),
  updateZone: (id: string, data: { label: string }) => api.put<TableZoneRecord>(`/admin/tables/zones/${id}`, data),
  getAll: (params?: Record<string, string>) => api.get<CafeTable[]>('/admin/tables', { params }),
  getOne: (id: string) => api.get<CafeTable>(`/admin/tables/${id}`),
  create: (data: Partial<CafeTable>) => api.post<CafeTable>('/admin/tables', data),
  update: (id: string, data: Partial<CafeTable>) => api.put<CafeTable>(`/admin/tables/${id}`, data),
  delete: (id: string) => api.delete(`/admin/tables/${id}`),
  release: (id: string) => api.patch<CafeTable>(`/admin/tables/${id}/release`),
  releaseAll: () => api.patch<{ released: number }>('/admin/tables/release-all'),
};
