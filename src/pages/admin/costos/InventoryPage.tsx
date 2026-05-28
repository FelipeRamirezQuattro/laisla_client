import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCircle, History, Plus, ShoppingBag, X } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { stockInvApi, alertasInvApi, insumosInvApi } from '../../../api/inventario';
import { providersApi } from '../../../api/providers';
import { AlertaCompra, InsumoCategoria, InsumoStockHistory, InsumoStockMovement, InsumoStockStatus, MeasurementUnit, Provider } from '../../../types';
import { formatMeasurementUnit, MEASUREMENT_UNITS } from '../../../utils/measurementUnits';
import { useToast } from '../../../hooks/useToast';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';

const NIVEL_BORDER: Record<string, string> = {
  AGOTADO: 'border-l-4 border-error',
  REGULAR: 'border-l-4 border-warning',
};
const NIVEL_BADGE: Record<string, string> = {
  AGOTADO: 'bg-error-tint text-error-ink',
  REGULAR: 'bg-warning-tint text-warning-ink',
};

const movementLabel: Record<string, string> = {
  VENTA_AUTOMATICA: 'Venta facturada',
  COMPRA: 'Compra',
  AJUSTE_MANUAL: 'Ajuste manual',
  REVISION_MANUAL: 'Revisión manual',
};

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayInput() {
  return localDateStr(new Date());
}

function monthAgoInput() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return localDateStr(d);
}

function providerName(provider?: string | Provider | null) {
  if (!provider) return 'Sin proveedor';
  return typeof provider === 'string' ? provider : provider.name;
}

export function InventoryPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'stock' | 'alertas'>('stock');
  const [inventory, setInventory] = useState<InsumoStockStatus[]>([]);
  const [alertas, setAlertas] = useState<AlertaCompra[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categorias, setCategorias] = useState<InsumoCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [marking, setMarking] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<InsumoStockStatus | null>(null);
  const [history, setHistory] = useState<InsumoStockHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(monthAgoInput());
  const [dateTo, setDateTo] = useState(todayInput());
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseUnit, setPurchaseUnit] = useState<MeasurementUnit>('UND');
  const [purchaseDate, setPurchaseDate] = useState(todayInput());
  const [purchaseProvider, setPurchaseProvider] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [creatingProvider, setCreatingProvider] = useState(false);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [movementSaving, setMovementSaving] = useState<Record<string, boolean>>({});
  const [createInsumoOpen, setCreateInsumoOpen] = useState(false);
  const [newInsumoName, setNewInsumoName] = useState('');
  const [newInsumoCategory, setNewInsumoCategory] = useState('');
  const [newInsumoQty, setNewInsumoQty] = useState('1');
  const [newInsumoUnit, setNewInsumoUnit] = useState<MeasurementUnit>('UND');
  const [newInsumoCost, setNewInsumoCost] = useState('');
  const [newInsumoNivelBueno, setNewInsumoNivelBueno] = useState('');
  const [newInsumoNivelRegular, setNewInsumoNivelRegular] = useState('');
  const [newInsumoNivelAgotado, setNewInsumoNivelAgotado] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [creatingInsumo, setCreatingInsumo] = useState(false);
  const purchaseSectionRef = useRef<HTMLElement | null>(null);
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockInvApi.getCurrent();
      setInventory(res.data);
    } catch {
      toast.error('Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  const fetchAlertas = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await alertasInvApi.getAll();
      setAlertas(res.data);
    } catch {
      toast.error('Error al cargar alertas de compra');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAlertas(); }, [fetchAlertas]);

  useEffect(() => {
    providersApi.getAll({ limit: 100 }).then((res) => setProviders(res.data.providers)).catch(() => undefined);
  }, []);

  useEffect(() => {
    insumosInvApi.getCategorias()
      .then((res) => {
        setCategorias(res.data);
        setNewInsumoCategory((current) => current || res.data[0]?._id || '');
      })
      .catch(() => undefined);
  }, []);

  const fetchHistory = useCallback(async (item: InsumoStockStatus) => {
    setHistoryLoading(true);
    try {
      const res = await stockInvApi.getHistory(item.insumo._id, { desde: dateFrom, hasta: dateTo });
      setHistory(res.data);
    } catch {
      toast.error('Error al cargar historial');
    } finally {
      setHistoryLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (selected) fetchHistory(selected);
  }, [selected, fetchHistory]);

  const openDrawer = (item: InsumoStockStatus, focusPurchase = false) => {
    setSelected(item);
    setPurchaseUnit(item.unit);
    setPurchaseQty('');
    setPurchaseDate(todayInput());
    setPurchaseProvider(typeof item.insumo.proveedorPrincipalId === 'object' ? item.insumo.proveedorPrincipalId._id : '');
    setPurchaseNotes('');
    if (focusPurchase) {
      window.setTimeout(() => purchaseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  };

  const savePurchase = async () => {
    if (!selected) return;
    const cantidad = Number(purchaseQty);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }

    setSavingPurchase(true);
    try {
      await stockInvApi.createPurchase(selected.insumo._id, {
        cantidad,
        unidad: purchaseUnit,
        fecha: purchaseDate,
        providerId: purchaseProvider || undefined,
        notas: purchaseNotes,
      });
      toast.success('Compra registrada');
      setPurchaseQty('');
      await Promise.all([fetchStock(), fetchHistory(selected)]);
    } catch {
      toast.error('Error al registrar compra');
    } finally {
      setSavingPurchase(false);
    }
  };

  const createProvider = async () => {
    const name = newProviderName.trim();
    if (!name) return;
    setCreatingProvider(true);
    try {
      const category = selected && typeof selected.insumo.categoriaId === 'object'
        ? selected.insumo.categoriaId.nombre
        : 'Insumos';
      const res = await providersApi.create({ name, category });
      setProviders((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setPurchaseProvider(res.data._id);
      setNewProviderName('');
      toast.success('Proveedor creado');
    } catch {
      toast.error('Error al crear proveedor');
    } finally {
      setCreatingProvider(false);
    }
  };

  const openCreateInsumo = () => {
    setNewInsumoName('');
    setNewInsumoQty('1');
    setNewInsumoUnit('UND');
    setNewInsumoCost('');
    setNewInsumoNivelBueno('');
    setNewInsumoNivelRegular('');
    setNewInsumoNivelAgotado('');
    setNewCategoryName('');
    setNewInsumoCategory((current) => current || categorias[0]?._id || '');
    setCreateInsumoOpen(true);
  };

  const createCategory = async () => {
    const nombre = newCategoryName.trim();
    if (!nombre) return;
    setCreatingCategory(true);
    try {
      const res = await insumosInvApi.createCategoria({ nombre });
      setCategorias((prev) => [...prev, res.data].sort((a, b) => a.orden - b.orden));
      setNewInsumoCategory(res.data._id);
      setNewCategoryName('');
      toast.success('Categoría creada');
    } catch {
      toast.error('Error al crear categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  const createInsumo = async () => {
    const nombre = newInsumoName.trim();
    const cantidadPresentacion = Number(newInsumoQty);
    const precioLista = newInsumoCost.trim() ? Number(newInsumoCost) : undefined;
    if (!nombre) {
      toast.error('Ingresa el nombre del insumo');
      return;
    }
    if (!newInsumoCategory) {
      toast.error('Selecciona una categoría');
      return;
    }
    if (!Number.isFinite(cantidadPresentacion) || cantidadPresentacion <= 0) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    if (precioLista !== undefined && (!Number.isFinite(precioLista) || precioLista < 0)) {
      toast.error('Ingresa un costo válido');
      return;
    }

    setCreatingInsumo(true);
    try {
      await insumosInvApi.create({
        nombre,
        categoriaId: newInsumoCategory,
        cantidadPresentacion,
        unidad: newInsumoUnit,
        precioLista,
        nivelBueno: newInsumoNivelBueno.trim() || undefined,
        nivelRegular: newInsumoNivelRegular.trim() || undefined,
        nivelAgotado: newInsumoNivelAgotado.trim() || undefined,
      });
      toast.success('Insumo creado');
      setCreateInsumoOpen(false);
      await fetchStock();
    } catch {
      toast.error('Error al crear insumo');
    } finally {
      setCreatingInsumo(false);
    }
  };

  const pendingMovements = useMemo(
    () => (history?.movements ?? []).filter((mov) => mov.estado === 'PENDIENTE'),
    [history]
  );

  const approveMovement = async (movement: InsumoStockMovement) => {
    if (!selected) return;
    setMovementSaving((prev) => ({ ...prev, [movement._id]: true }));
    try {
      await stockInvApi.approveMovement(movement._id);
      toast.success('Movimiento aprobado');
      await Promise.all([fetchStock(), fetchHistory(selected)]);
    } catch {
      toast.error('Error al aprobar movimiento');
    } finally {
      setMovementSaving((prev) => ({ ...prev, [movement._id]: false }));
    }
  };

  const rejectMovement = async (movement: InsumoStockMovement) => {
    if (!selected) return;
    setMovementSaving((prev) => ({ ...prev, [movement._id]: true }));
    try {
      await stockInvApi.rejectMovement(movement._id);
      toast.success('Movimiento rechazado');
      await Promise.all([fetchStock(), fetchHistory(selected)]);
    } catch {
      toast.error('Error al rechazar movimiento');
    } finally {
      setMovementSaving((prev) => ({ ...prev, [movement._id]: false }));
    }
  };

  const marcarComprado = async (insumoId: string) => {
    setMarking((m) => ({ ...m, [insumoId]: true }));
    try {
      await alertasInvApi.marcarComprado(insumoId);
      setAlertas((prev) => prev.filter((a) => a.insumo._id !== insumoId));
      toast.success('Marcado como comprado');
    } catch {
      toast.error('Error al marcar como comprado');
    } finally {
      setMarking((m) => ({ ...m, [insumoId]: false }));
    }
  };

  const filtered = inventory.filter((item) => {
    const matchSearch = !search || item.insumo.nombre.toLowerCase().includes(search.toLowerCase());
    const matchPending = !showPendingOnly || item.pendingCount > 0;
    return matchSearch && matchPending;
  });

  const pendingCount = inventory.reduce((sum, item) => sum + item.pendingCount, 0);
  const agotados = alertas.filter((a) => a.detalle.nivel === 'AGOTADO');
  const regulares = alertas.filter((a) => a.detalle.nivel === 'REGULAR');
  const chartData = (history?.points ?? []).map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Inventario</h1>
          <p className="text-stone font-body text-sm">
            {inventory.length} insumos sincronizados · {pendingCount > 0
              ? <span className="text-warning-ink">{pendingCount} movimientos por aprobar</span>
            : 'sin movimientos pendientes'}
          </p>
        </div>
        {isAdmin && (
          <Button type="button" onClick={openCreateInsumo} disabled={categorias.length === 0}>
            <Plus size={16} /> Nuevo insumo
          </Button>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-rule bg-white p-1 shadow-sm">
        <button
          onClick={() => setView('stock')}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === 'stock' ? 'bg-espresso text-cream' : 'text-espresso hover:bg-surface-tint'}`}
        >
          Stock
        </button>
        <button
          onClick={() => setView('alertas')}
          className={`px-3 py-1.5 rounded-md text-sm font-body transition-all ${view === 'alertas' ? 'bg-espresso text-cream' : 'text-espresso hover:bg-surface-tint'}`}
        >
          Alertas de compra
          {alertas.length > 0 && <span className="ml-2 rounded-full bg-error text-cream px-1.5 py-0.5 text-xs font-bold">{alertas.length}</span>}
        </button>
      </div>

      {view === 'stock' && (
        <>
          <div className="card flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Input
              placeholder="Buscar insumo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <label className="flex items-center gap-2 text-sm font-body text-ink cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={showPendingOnly}
                onChange={(e) => setShowPendingOnly(e.target.checked)}
                className="rounded"
              />
              Solo pendientes ({pendingCount})
            </label>
          </div>

          {loading ? <PageLoader /> : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm font-body">
                <thead className="bg-surface-tint border-b border-rule">
                  <tr>
                    <th className="text-left px-4 py-3 text-stone font-medium">Insumo</th>
                    <th className="text-right px-4 py-3 text-stone font-medium">Stock aprobado</th>
                    <th className="text-right px-4 py-3 text-stone font-medium">Pendiente venta</th>
                    <th className="text-left px-4 py-3 text-stone font-medium">Proveedor</th>
                    <th className="text-left px-4 py-3 text-stone font-medium">Último movimiento</th>
                    <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                    <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {filtered.map((item) => (
                    <tr key={item.insumo._id} className={`hover:bg-surface-tint transition-colors ${item.pendingCount > 0 ? 'bg-warning-tint' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => openDrawer(item)} className="text-left">
                          <p className="font-medium text-ink hover:text-terracotta">{item.insumo.nombre}</p>
                          <p className="text-xs text-stone">
                            {typeof item.insumo.categoriaId === 'object' ? item.insumo.categoriaId.nombre : 'Sin categoría'}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ink">
                        {item.stock.toFixed(2)} {formatMeasurementUnit(item.unit)}
                      </td>
                      <td className="px-4 py-3 text-right text-warning-ink">
                        {item.pendingOut > 0 ? `${item.pendingOut.toFixed(2)} ${formatMeasurementUnit(item.unit)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-stone">
                        {providerName(item.insumo.proveedorPrincipalId)}
                      </td>
                      <td className="px-4 py-3 text-stone text-xs">
                        {item.lastMovementAt ? new Date(item.lastMovementAt).toLocaleDateString('es-CO') : 'Sin movimientos'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.pendingCount > 0
                          ? <Badge label={`${item.pendingCount} pendiente(s)`} variant="yellow" />
                          : <Badge label="OK" variant="green" />
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openDrawer(item, true)}>
                            <ShoppingBag size={14} className="mr-1" /> Registrar compra
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDrawer(item)}>
                            <History size={14} className="mr-1" /> Historial
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-stone">
                        {showPendingOnly ? 'No hay movimientos pendientes.' : 'No se encontraron insumos.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === 'alertas' && (
        <div className="space-y-4">
          {alertsLoading ? <PageLoader /> : alertas.length === 0 ? (
            <div className="card flex flex-col items-center py-16 gap-4">
              <CheckCircle size={48} className="text-success" />
              <p className="font-body text-xl text-espresso">Todo en orden por hoy</p>
              <p className="text-sm font-body text-stone">No hay insumos agotados o en nivel regular.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-error bg-error-tint px-4 py-3">
                  <p className="text-xs font-body text-error-ink">Agotados</p>
                  <p className="font-body text-2xl font-bold text-error-ink">{agotados.length}</p>
                </div>
                <div className="rounded-lg border border-warning bg-warning-tint px-4 py-3">
                  <p className="text-xs font-body text-warning-ink">En nivel regular</p>
                  <p className="font-body text-2xl font-bold text-warning-ink">{regulares.length}</p>
                </div>
              </div>

              {[agotados, regulares].map((group) =>
                group.length === 0 ? null : (
                  <div key={group[0].detalle.nivel} className="space-y-2">
                    <h2 className="font-body font-semibold text-espresso text-base">
                      {group[0].detalle.nivel === 'AGOTADO' ? 'Agotados' : 'En nivel regular'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.map((alerta) => (
                        <div
                          key={alerta.detalle._id}
                          className={`bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 ${NIVEL_BORDER[alerta.detalle.nivel]}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-body font-semibold text-espresso text-sm">{alerta.insumo.nombre}</p>
                              <p className="text-xs text-stone font-body mt-0.5">{alerta.categoria.nombre}</p>
                            </div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${NIVEL_BADGE[alerta.detalle.nivel]}`}>
                              {alerta.detalle.nivel}
                            </span>
                          </div>

                          {alerta.insumo.nivelAgotado && (
                            <p className="text-xs font-body text-stone bg-surface-tint rounded px-2 py-1">
                              Nivel reorden: <strong>{alerta.insumo.nivelAgotado}</strong>
                            </p>
                          )}

                          <p className="text-xs font-body text-stone opacity-60">
                            Última revisión: {alerta.ultimaRevision
                              ? new Date(alerta.ultimaRevision).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                              : '-'}
                          </p>

                          <button
                            onClick={() => marcarComprado(alerta.insumo._id)}
                            disabled={marking[alerta.insumo._id]}
                            className="w-full text-sm font-body font-medium bg-success text-cream rounded-lg py-2 hover:bg-success-ink transition-all disabled:opacity-50"
                          >
                            {marking[alerta.insumo._id] ? 'Guardando...' : 'Marcar como comprado'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-ink/30" onClick={() => setSelected(null)} aria-label="Cerrar historial" />
          <aside className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-y-auto bg-paper shadow-2xl border-l border-rule">
            <div className="sticky top-0 z-10 bg-paper border-b border-rule px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-body text-xl font-bold text-espresso">{selected.insumo.nombre}</h2>
                <p className="text-sm text-stone font-body">
                  Stock aprobado: {selected.stock.toFixed(2)} {formatMeasurementUnit(selected.unit)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="h-9 w-9 rounded-lg bg-white text-stone inline-flex items-center justify-center">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="card grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
                <Input label="Desde" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
                <Input label="Hasta" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
                <Button variant="secondary" onClick={() => fetchHistory(selected)}>Filtrar</Button>
              </div>

              <section ref={purchaseSectionRef} className="card scroll-mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-body font-semibold text-espresso">Histórico de stock</h3>
                  {historyLoading && <span className="text-xs text-stone">Cargando...</span>}
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="stock" stroke="var(--color-terracotta)" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {pendingMovements.length > 0 && (
                <section className="card">
                  <h3 className="font-body font-semibold text-espresso mb-3">Movimientos pendientes por aprobar</h3>
                  <div className="space-y-2">
                    {pendingMovements.map((movement) => (
                      <div key={movement._id} className="rounded-lg border border-warning bg-warning-tint px-3 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-body text-sm font-semibold text-ink">{movementLabel[movement.tipo] ?? movement.tipo}</p>
                          <p className="text-xs text-stone">
                            {movement.cantidad.toFixed(2)} {formatMeasurementUnit(movement.unidad)} · {new Date(movement.fecha).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveMovement(movement)} loading={movementSaving[movement._id]}>
                            <Check size={14} className="mr-1" /> Aprobar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => rejectMovement(movement)} loading={movementSaving[movement._id]}>
                            <X size={14} className="mr-1" /> Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="card">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag size={18} className="text-terracotta" />
                  <h3 className="font-body font-semibold text-espresso">Registrar compra</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Cantidad" type="number" step="0.001" value={purchaseQty} onChange={(event) => setPurchaseQty(event.target.value)} />
                  <label className="block">
                    <span className="block text-sm font-medium text-ink font-body mb-1">Unidad</span>
                    <select className="input-base" value={purchaseUnit} onChange={(event) => setPurchaseUnit(event.target.value as MeasurementUnit)}>
                      {MEASUREMENT_UNITS.map((unit) => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </label>
                  <Input label="Fecha" type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
                  <label className="block">
                    <span className="block text-sm font-medium text-ink font-body mb-1">Proveedor</span>
                    <select className="input-base" value={purchaseProvider} onChange={(event) => setPurchaseProvider(event.target.value)}>
                      <option value="">Sin proveedor</option>
                      {providers.map((provider) => (
                        <option key={provider._id} value={provider._id}>{provider.name}</option>
                      ))}
                    </select>
                  </label>
                  <div className="sm:col-span-2 rounded-lg border border-rule bg-surface-tint p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                      <Input
                        label="Nuevo proveedor"
                        value={newProviderName}
                        onChange={(event) => setNewProviderName(event.target.value)}
                        placeholder="Nombre del proveedor"
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={createProvider}
                          loading={creatingProvider}
                          disabled={!newProviderName.trim()}
                        >
                          Crear proveedor
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink font-body mb-1">Notas</label>
                    <textarea className="input-base h-20 resize-none" value={purchaseNotes} onChange={(event) => setPurchaseNotes(event.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={savePurchase} loading={savingPurchase}>Registrar compra</Button>
                </div>
              </section>

              <section className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-rule bg-surface-tint">
                  <h3 className="font-body font-semibold text-espresso">Movimientos</h3>
                </div>
                <div className="divide-y divide-rule">
                  {(history?.movements ?? []).slice().reverse().map((movement) => (
                    <div key={movement._id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-body text-sm font-medium text-ink">{movementLabel[movement.tipo] ?? movement.tipo}</p>
                        <p className="text-xs text-stone">
                          {new Date(movement.fecha).toLocaleDateString('es-CO')} · {providerName(movement.providerId)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={movement.cantidadBase < 0 ? 'text-error-ink' : 'text-success-ink'}>
                          {movement.cantidadBase < 0 ? '-' : '+'}{movement.cantidad.toFixed(2)} {formatMeasurementUnit(movement.unidad)}
                        </p>
                        <p className="text-xs text-stone">{movement.estado}</p>
                      </div>
                    </div>
                  ))}
                  {(history?.movements ?? []).length === 0 && (
                    <p className="px-4 py-10 text-center text-stone">Sin movimientos en el rango seleccionado.</p>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      <Modal
        isOpen={createInsumoOpen}
        onClose={() => setCreateInsumoOpen(false)}
        title="Nuevo insumo"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-rule bg-surface-tint p-3 space-y-3">
            <label className="block">
              <span className="block text-sm font-medium text-ink font-body mb-1">Categoría</span>
              <select
                value={newInsumoCategory}
                onChange={(event) => setNewInsumoCategory(event.target.value)}
                className="input-base"
              >
                {categorias.map((categoria) => (
                  <option key={categoria._id} value={categoria._id}>{categoria.nombre}</option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Input
                label="Nueva categoría"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Ej: Cocina fría"
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={createCategory}
                  loading={creatingCategory}
                  disabled={!newCategoryName.trim()}
                >
                  Crear categoría
                </Button>
              </div>
            </div>
          </div>
          <Input
            label="Nombre del insumo"
            value={newInsumoName}
            onChange={(event) => setNewInsumoName(event.target.value)}
            placeholder="Ej: Leche entera"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad por presentación"
              type="number"
              min="0.001"
              step="0.001"
              value={newInsumoQty}
              onChange={(event) => setNewInsumoQty(event.target.value)}
            />
            <label className="block">
              <span className="block text-sm font-medium text-ink font-body mb-1">Unidad</span>
              <select
                value={newInsumoUnit}
                onChange={(event) => setNewInsumoUnit(event.target.value as MeasurementUnit)}
                className="input-base"
              >
                {MEASUREMENT_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </label>
          </div>
          <Input
            label="Costo por unidad"
            type="number"
            min="0"
            step="0.01"
            value={newInsumoCost}
            onChange={(event) => setNewInsumoCost(event.target.value)}
            placeholder="COP / unidad"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Nivel bueno"
              value={newInsumoNivelBueno}
              onChange={(event) => setNewInsumoNivelBueno(event.target.value)}
              placeholder="Ej: 30+ un."
            />
            <Input
              label="Nivel regular"
              value={newInsumoNivelRegular}
              onChange={(event) => setNewInsumoNivelRegular(event.target.value)}
              placeholder="Ej: 10-29 un."
            />
            <Input
              label="Nivel agotado"
              value={newInsumoNivelAgotado}
              onChange={(event) => setNewInsumoNivelAgotado(event.target.value)}
              placeholder="Ej: < 10 un."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setCreateInsumoOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={createInsumo} loading={creatingInsumo}>
              Crear insumo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
