import { useEffect, useState, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, Minus, Moon, Sun, X } from 'lucide-react';
import { historialInvApi } from '../../../api/inventario';
import { useToast } from '../../../hooks/useToast';
import { PageLoader } from '../../../components/ui/Spinner';
import { Pagination } from '../../../components/ui/Pagination';
import type { HistorialItem, RevisionInventario, RevisionInsumoDetalle } from '../../../types';

const NIVEL_BADGE: Record<string, string> = {
  BUENO: 'bg-success-tint text-success-ink',
  REGULAR: 'bg-warning-tint text-warning-ink',
  AGOTADO: 'bg-error-tint text-error-ink',
  NO_REVISADO: 'bg-rule text-stone',
};

export function HistorialRevisionesPage({ hideHeader = false }: { hideHeader?: boolean }) {
  const toast = useToast();
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ desde: '', hasta: '', turno: '', colaboradorId: '' });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detalleData, setDetalleData] = useState<{ revision: RevisionInventario; detalles: RevisionInsumoDetalle[] } | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      if (filters.turno) params.turno = filters.turno;
      if (filters.colaboradorId) params.colaboradorId = filters.colaboradorId;
      const res = await historialInvApi.getAll(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const toggleDetalle = async (revisionId: string) => {
    if (expanded === revisionId) { setExpanded(null); return; }
    setExpanded(revisionId);
    setLoadingDetalle(true);
    try {
      const res = await historialInvApi.getDetalle(revisionId);
      setDetalleData(res.data);
    } catch {
      toast.error('Error al cargar detalle');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const applyFilters = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load(); };

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Historial de Revisiones</h1>
          <p className="text-stone font-body text-sm mt-1">{total} revisiones encontradas</p>
        </div>
      )}
      {hideHeader && (
        <p className="text-stone font-body text-sm">{total} revisiones encontradas</p>
      )}

      {/* Filters */}
      <form onSubmit={applyFilters} className="card flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-body text-stone">Desde</label>
          <input type="date" value={filters.desde} onChange={(e) => setFilters((f) => ({ ...f, desde: e.target.value }))} className="input-base w-36 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-body text-stone">Hasta</label>
          <input type="date" value={filters.hasta} onChange={(e) => setFilters((f) => ({ ...f, hasta: e.target.value }))} className="input-base w-36 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-body text-stone">Turno</label>
          <select value={filters.turno} onChange={(e) => setFilters((f) => ({ ...f, turno: e.target.value }))} className="input-base w-36 text-sm">
            <option value="">Todos</option>
            <option value="MATUTINO">Mañana</option>
            <option value="VESPERTINO">Tarde</option>
          </select>
        </div>
        <button type="submit" className="btn-primary text-sm py-2">Filtrar</button>
        <button type="button" className="btn-secondary text-sm py-2" onClick={() => { setFilters({ desde: '', hasta: '', turno: '', colaboradorId: '' }); setPage(1); }}>
          Limpiar
        </button>
      </form>

      {loading ? <PageLoader /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-surface-tint text-stone text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Turno</th>
                <th className="px-4 py-3 text-left">Colaborador</th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-success" aria-label="Bueno" />
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-warning" aria-label="Regular" />
                </th>
                <th className="px-4 py-3 text-center">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-error" aria-label="Agotado" />
                </th>
                <th className="px-4 py-3 text-center">Sin rev.</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {items.map((item) => (
                <>
                  <tr key={item._id} className="hover:bg-surface-tint cursor-pointer" onClick={() => toggleDetalle(item._id)}>
                    <td className="px-4 py-3 text-espresso">
                      {new Date(item.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.turno === 'MATUTINO' ? 'bg-warning-tint text-warning-ink' : 'bg-info-tint text-info-ink'}`}>
                        {item.turno === 'MATUTINO' ? (
                          <span className="inline-flex items-center gap-1"><Sun size={12} /> Mañana</span>
                        ) : (
                          <span className="inline-flex items-center gap-1"><Moon size={12} /> Tarde</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-espresso">{item.colaborador?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-center font-medium text-success-ink">{item.counts.bueno}</td>
                    <td className="px-4 py-3 text-center font-medium text-warning-ink">{item.counts.regular}</td>
                    <td className="px-4 py-3 text-center font-medium text-error-ink">{item.counts.agotado}</td>
                    <td className="px-4 py-3 text-center text-stone">{item.counts.noRevisado}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.cerradaEn ? 'bg-success-tint text-success-ink' : 'bg-warning-tint text-warning-ink'}`}>
                        {item.cerradaEn ? 'Cerrada' : 'Abierta'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone">
                      {expanded === item._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expanded === item._id && (
                    <tr key={`${item._id}-detail`}>
                      <td colSpan={9} className="px-4 pb-4 bg-surface-tint">
                        {loadingDetalle ? (
                          <p className="text-sm text-stone py-2">Cargando detalle...</p>
                        ) : detalleData && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                            {detalleData.detalles.map((d) => (
                              <div key={d._id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow-sm">
                                <span className="text-xs font-body text-espresso truncate">{d.nombreSnapshot}</span>
                                <span className={`text-xs font-semibold ml-2 px-1.5 py-0.5 rounded-full ${NIVEL_BADGE[d.nivel]}`}>
                                  {d.nivel === 'BUENO' ? <Check size={12} /> : d.nivel === 'REGULAR' ? <Minus size={12} /> : d.nivel === 'AGOTADO' ? <X size={12} /> : '?'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-stone text-sm">No hay revisiones para este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / 20)} onPageChange={setPage} />
    </div>
  );
}
