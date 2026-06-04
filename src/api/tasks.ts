import api from './axios';
import type { ProjectTask, ProjectTaskStatus, TaskPriority } from '../types';

export interface TaskPayload {
  projectId?: string;
  title?: string;
  description?: string;
  status?: ProjectTaskStatus;
  priority?: TaskPriority;
  assignedTo?: string[];
  dueDate?: string;
  notes?: string;
  attachments?: unknown[];
  tags?: string[];
  order?: number;
}

export const tasksApi = {
  getAll: (params?: Record<string, string>) => api.get<ProjectTask[]>('/admin/tasks', { params }),
  getMyTasks: () => api.get<ProjectTask[]>('/admin/tasks/my-tasks'),
  getOne: (id: string) => api.get<ProjectTask>(`/admin/tasks/${id}`),
  create: (data: TaskPayload) => api.post<ProjectTask>('/admin/tasks', data),
  update: (id: string, data: TaskPayload) => api.put<ProjectTask>(`/admin/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/admin/tasks/${id}`),
  addAttachment: (id: string, data: { filename: string; url: string }) =>
    api.post<ProjectTask>(`/admin/tasks/${id}/attachments`, data),
  deleteAttachment: (id: string, attachmentId: string) =>
    api.delete<ProjectTask>(`/admin/tasks/${id}/attachments/${attachmentId}`),
};
