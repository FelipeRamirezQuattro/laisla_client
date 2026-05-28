import api from './axios';
import type {
  RawMaterial, DisposablePack, LaborAndOverheadParams,
  Recipe, RecipeCategoryOption, Projection, ActualResult, InventoryStatus, CascadePreview,
} from '../types';

// ── Raw Materials ─────────────────────────────────────────────────────────────
export const rawMaterialsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<RawMaterial[]>('/admin/raw-materials', { params }),
  getOne: (id: string) => api.get<RawMaterial>(`/admin/raw-materials/${id}`),
  cascadePreview: (id: string) =>
    api.get<CascadePreview>(`/admin/raw-materials/${id}/cascade-preview`),
  create: (data: Partial<RawMaterial>) =>
    api.post<RawMaterial>('/admin/raw-materials', data),
  update: (id: string, data: Partial<RawMaterial>) =>
    api.put<RawMaterial>(`/admin/raw-materials/${id}`, data),
  delete: (id: string) => api.delete(`/admin/raw-materials/${id}`),
};

// ── Disposable Packs ──────────────────────────────────────────────────────────
export const disposablePacksApi = {
  getAll: () => api.get<DisposablePack[]>('/admin/disposable-packs'),
  create: (data: Partial<DisposablePack>) =>
    api.post<DisposablePack>('/admin/disposable-packs', data),
  update: (id: string, data: Partial<DisposablePack>) =>
    api.put<DisposablePack>(`/admin/disposable-packs/${id}`, data),
};

// ── Labor & Overhead Params ───────────────────────────────────────────────────
export const laborOverheadApi = {
  get: () => api.get<LaborAndOverheadParams>('/admin/labor-overhead-params'),
  cascadePreview: () =>
    api.get<{ affectedRecipes: number }>('/admin/labor-overhead-params/cascade-preview'),
  update: (data: Partial<LaborAndOverheadParams>) =>
    api.put<LaborAndOverheadParams>('/admin/labor-overhead-params', data),
};

// ── Recipes ───────────────────────────────────────────────────────────────────
export const recipesApi = {
  getCategories: () => api.get<RecipeCategoryOption[]>('/admin/recipes/categories'),
  createCategory: (data: Partial<RecipeCategoryOption>) =>
    api.post<RecipeCategoryOption>('/admin/recipes/categories', data),
  updateCategory: (id: string, data: Partial<RecipeCategoryOption>) =>
    api.put<RecipeCategoryOption>(`/admin/recipes/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/admin/recipes/categories/${id}`),
  getAll: (params?: Record<string, string>) =>
    api.get<Recipe[]>('/admin/recipes', { params }),
  getOne: (id: string) => api.get<Recipe>(`/admin/recipes/${id}`),
  getCostSheet: (id: string) =>
    api.get<{ recipe: Recipe; params: LaborAndOverheadParams }>(`/admin/recipes/${id}/cost-sheet`),
  create: (data: Partial<Recipe>) => api.post<Recipe>('/admin/recipes', data),
  update: (id: string, data: Partial<Recipe>) =>
    api.put<Recipe>(`/admin/recipes/${id}`, data),
  delete: (id: string) => api.delete(`/admin/recipes/${id}`),
};

// ── Projections ───────────────────────────────────────────────────────────────
export const projectionsApi = {
  get: (year: number) => api.get<Projection>(`/admin/projections/${year}`),
  create: (data: { year: number; growthRate?: number; workingDaysPerMonth?: number }) =>
    api.post<Projection>('/admin/projections', data),
  updateMonth: (year: number, month: number, data: Partial<Projection['months'][0]>) =>
    api.put<Projection>(`/admin/projections/${year}/month/${month}`, data),
  getComparison: (year: number) =>
    api.get<{ year: number; comparison: Array<{ month: number; projected: Projection['months'][0]; actual: ActualResult | null; variationSalesPct: number | null }> }>(
      `/admin/projections/${year}/comparison`
    ),
};

// ── Actual Results ────────────────────────────────────────────────────────────
export const actualResultsApi = {
  getYear: (year: number) => api.get<ActualResult[]>(`/admin/results/${year}`),
  getMonth: (year: number, month: number) =>
    api.get<ActualResult>(`/admin/results/${year}/${month}`),
  getSummary: (year: number) => api.get(`/admin/results/${year}/summary`),
  create: (data: Partial<ActualResult>) => api.post<ActualResult>('/admin/results', data),
  update: (id: string, data: Partial<ActualResult>) =>
    api.put<ActualResult>(`/admin/results/${id}`, data),
};

// ── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryApi = {
  getCurrent: () => api.get<InventoryStatus[]>('/admin/inventory'),
  getHistory: (rawMaterialId: string) =>
    api.get(`/admin/inventory/${rawMaterialId}/history`),
  createMovement: (data: {
    rawMaterialId: string; purchases?: number; consumed?: number;
    unit: string; period?: string;
  }) => api.post('/admin/inventory/movements', data),
  getAlerts: () => api.get<InventoryStatus[]>('/admin/inventory/alerts'),
  getReorderReport: () => api.get('/admin/inventory/reorder-report'),
};
