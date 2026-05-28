import api from './axios';
import type {
  CategoriaConInsumos, InsumoCategoria, Insumo,
  RevisionInventario, RevisionInsumoDetalle,
  AlertaCompra, HistorialItem,
  InsumoStockHistory, InsumoStockMovement, InsumoStockStatus,
  ReporteAgotamiento, ReporteCumplimiento, ReporteInsumoCritico,
  MeasurementUnit, TurnoInventario,
} from '../types';

const BASE = '/admin/inventario-diario';

// ── Insumos ───────────────────────────────────────────────────────────────────
export const insumosInvApi = {
  getAgrupados: () => api.get<CategoriaConInsumos[]>(`${BASE}/insumos`),
  getCatalog: () => api.get<CategoriaConInsumos[]>(`${BASE}/insumos/catalog`),
  getCategorias: () => api.get<InsumoCategoria[]>(`${BASE}/insumos/categorias`),
  createCategoria: (data: Partial<InsumoCategoria>) => api.post<InsumoCategoria>(`${BASE}/insumos/categorias`, data),
  updateCategoria: (id: string, data: Partial<InsumoCategoria>) => api.put<InsumoCategoria>(`${BASE}/insumos/categorias/${id}`, data),
  deleteCategoria: (id: string) => api.delete(`${BASE}/insumos/categorias/${id}`),
  create: (data: Partial<Insumo>) => api.post<Insumo>(`${BASE}/insumos`, data),
  update: (id: string, data: Partial<Insumo>) => api.put<Insumo>(`${BASE}/insumos/${id}`, data),
  bulkUpdate: (updates: Array<{ id: string; data: Partial<Insumo> }>) =>
    api.patch<{ updated: number }>(`${BASE}/insumos/bulk`, { updates }),
  delete: (id: string) => api.delete(`${BASE}/insumos/${id}`),
  reactivar: (id: string) => api.patch<Insumo>(`${BASE}/insumos/${id}/reactivar`),
  importCsv: (rows: unknown[]) => api.post<{ created: number; skipped: number }>(`${BASE}/insumos/import-csv`, { rows }),
};

// ── Revisiones ────────────────────────────────────────────────────────────────
export const revisionesApi = {
  createOrGet: (turno: TurnoInventario, notas?: string) =>
    api.post<{ revision: RevisionInventario; detalles: RevisionInsumoDetalle[] }>(`${BASE}/revisiones`, { turno, notas }),
  getHoy: () =>
    api.get<{ matutino: RevisionInventario | null; vespertino: RevisionInventario | null }>(`${BASE}/revisiones/hoy`),
  getDetalles: (id: string) =>
    api.get<{ revision: RevisionInventario; detalles: RevisionInsumoDetalle[] }>(`${BASE}/revisiones/${id}`),
  updateDetalle: (id: string, insumoId: string, data: Partial<RevisionInsumoDetalle>) =>
    api.patch<RevisionInsumoDetalle>(`${BASE}/revisiones/${id}/detalles/${insumoId}`, data),
  bulkUpdateDetalles: (id: string, updates: Array<{ insumoId: string; nivel: string }>) =>
    api.patch<{ updated: number }>(`${BASE}/revisiones/${id}/detalles/bulk`, { updates }),
  cerrar: (id: string) =>
    api.post<{ cerrada: boolean; noRevisados: number; itemNames: string[] }>(`${BASE}/revisiones/${id}/cerrar`),
  reabrir: (id: string, motivo?: string) =>
    api.post<RevisionInventario>(`${BASE}/revisiones/${id}/reabrir`, { motivo }),
};

// ── Alertas ───────────────────────────────────────────────────────────────────
export const alertasInvApi = {
  getAll: () => api.get<AlertaCompra[]>(`${BASE}/alertas`),
  marcarComprado: (insumoId: string) =>
    api.post<RevisionInsumoDetalle>(`${BASE}/alertas/${insumoId}/marcar-comprado`),
};

// ── Historial ─────────────────────────────────────────────────────────────────
export const historialInvApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<{ total: number; page: number; limit: number; items: HistorialItem[] }>(`${BASE}/historial`, { params }),
  getDetalle: (revisionId: string) =>
    api.get<{ revision: RevisionInventario; detalles: RevisionInsumoDetalle[] }>(`${BASE}/historial/${revisionId}`),
};

// ── Stock ────────────────────────────────────────────────────────────────────
export const stockInvApi = {
  getCurrent: () => api.get<InsumoStockStatus[]>(`${BASE}/stock`),
  getHistory: (insumoId: string, params?: Record<string, string>) =>
    api.get<InsumoStockHistory>(`${BASE}/stock/insumos/${insumoId}/history`, { params }),
  createPurchase: (insumoId: string, data: {
    cantidad: number;
    unidad: MeasurementUnit;
    fecha?: string;
    providerId?: string;
    notas?: string;
  }) => api.post<InsumoStockMovement>(`${BASE}/stock/insumos/${insumoId}/purchases`, data),
  approveMovement: (movementId: string, data?: { cantidad?: number; unidad?: MeasurementUnit }) =>
    api.patch<InsumoStockMovement>(`${BASE}/stock/movements/${movementId}/approve`, data ?? {}),
  rejectMovement: (movementId: string, notas?: string) =>
    api.patch<InsumoStockMovement>(`${BASE}/stock/movements/${movementId}/reject`, { notas }),
};

// ── Reportes ──────────────────────────────────────────────────────────────────
export const reportesInvApi = {
  frecuenciaAgotamiento: (dias: number) =>
    api.get<ReporteAgotamiento[]>(`${BASE}/reportes/frecuencia-agotamiento`, { params: { dias } }),
  cumplimiento: (dias: number) =>
    api.get<ReporteCumplimiento[]>(`${BASE}/reportes/cumplimiento`, { params: { dias } }),
  insumosCriticos: (dias: number) =>
    api.get<ReporteInsumoCritico[]>(`${BASE}/reportes/insumos-criticos`, { params: { dias } }),
  horaPromedio: (dias: number) =>
    api.get<{ matutino: string | null; vespertino: string | null; counts: { matutino: number; vespertino: number } }>(`${BASE}/reportes/hora-promedio`, { params: { dias } }),
};
