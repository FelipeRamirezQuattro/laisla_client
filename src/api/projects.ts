import api from './axios';
import type { Project, ProjectTask } from '../types';

export const projectsApi = {
  getAll: () => api.get<Project[]>('/admin/projects'),
  create: (data: Partial<Project>) => api.post<Project>('/admin/projects', data),
  getOne: (id: string) => api.get<{ project: Project; tasks: ProjectTask[] }>(`/admin/projects/${id}`),
  update: (id: string, data: Partial<Project>) => api.put<Project>(`/admin/projects/${id}`, data),
  delete: (id: string) => api.delete(`/admin/projects/${id}`),
};
