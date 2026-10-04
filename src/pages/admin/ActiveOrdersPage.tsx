import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Eye, Trash2, Volume2, VolumeX } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ordersApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatShortDate, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import {
  CancelOrderModal,
  elapsedInCurrentStatus,
  elapsedMsInCurrentStatus,
  OrderDetailDrawer,
  useNow,
} from '../../components/orders/OrderWorkflow';

const AUTO_REFRESH_MS = 12_000;
const ELAPSED_ALERT_MS = 10 * 60 * 1000; // 10 minutes in the same status turns the row red
const SOUND_STORAGE_KEY = 'la_isla_bar_sound_enabled';

const STATUS_FILTERS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'ready', label: 'Listo' },
];

function isWaiting(order: Order) {
  return !['delivered', 'billed', 'cancelled'].includes(order.status);
}

function todayInput() {
  return todayLocal();
}

// pending -> in-progress -> ready; "ready" advances via the dedicated
// "Entregado" button (ordersApi.deliver), not this generic transition.
function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  if (status === 'pending') return 'in-progress';
  if (status === 'in-progress') return 'ready';
  return null;
}

function advanceStatusLabel(status: OrderStatus): string {
  if (status === 'pending') return 'Iniciar';
  if (status === 'in-progress') return 'Marcar listo';
  return '';
}

function loadSoundPreference(): boolean {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function saveSoundPreference(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Private browsing / blocked storage — the toggle just won't persist.
  }
}

// A short beep for new pending orders — generated with the Web Audio API so
// no audio asset needs to ship with the app. Some browsers block audio
// before any user gesture on the page; that failure is silently ignored.
function playNewOrderBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => ctx.close();
  } catch {
    // Audio blocked or unsupported — the visual list is still up to date.
  }
}

export function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayInput());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [soundEnabled, setSoundEnabled] = useState(loadSoundPreference);
  const [selected, setSelected] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<{ avgDeliveryMinutes: number; avgStayMinutes: number; points: Array<{ deliveryMinutes: number | null; stayMinutes: number | null; createdAt: string }> } | null>(null);
  const now = useNow();
  const toast = useToast();
  const knownPendingIdsRef = useRef<Set<string> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        ordersApi.getAll({ status: 'open', page: 1, limit: 100, dateFrom: selectedDate, dateTo: selectedDate }),
        ordersApi.getTimingStats({ dateFrom: selectedDate, dateTo: selectedDate }),
      ]);
      const waiting = ordersRes.data.orders.filter(isWaiting);

      const pendingIds = new Set(waiting.filter((o) => o.status === 'pending').map((o) => o._id));
      if (knownPendingIdsRef.current) {
        const hasNewPending = [...pendingIds].some((id) => !knownPendingIdsRef.current!.has(id));
        if (hasNewPending && soundEnabled) playNewOrderBeep();
      }
      knownPendingIdsRef.current = pendingIds;

      setOrders(waiting);
      setStats(statsRes.data);
    } catch {
      toast.error('Error al cargar pedidos activos');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, soundEnabled]);

  useEffect(() => { setLoading(true); fetchData(); }, [selectedDate]);

  useEffect(() => {
    const id = window.setInterval(fetchData, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [fetchData]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      saveSoundPreference(next);
      return next;
    });
  };

  const markDelivered = async (order: Order) => {
    setActionLoading((prev) => ({ ...prev, [order._id]: true }));
    try {
      await ordersApi.deliver(order._id);
      toast.success('Pedido marcado como entregado');
      fetchData();
    } catch {
      toast.error('Error al entregar pedido');
    } finally {
      setActionLoading((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const advanceStatus = async (order: Order) => {
    const next = nextOrderStatus(order.status);
    if (!next) return;
    setActionLoading((prev) => ({ ...prev, [order._id]: true }));
    try {
      await ordersApi.update(order._id, { status: next });
      fetchData();
    } catch {
      toast.error('Error al actualizar el estado del pedido');
    } finally {
      setActionLoading((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const cancelOrder = async (reason: string, reasonDetail: string) => {
    if (!cancelTarget) return;
    setActionLoading((prev) => ({ ...prev, [cancelTarget._id]: true }));
    try {
      await ordersApi.cancel(cancelTarget._id, { reason, reasonDetail });
      toast.success('Pedido eliminado');
      setCancelTarget(null);
      fetchData();
    } catch {
      toast.error('Error al eliminar pedido');
    } finally {
      setActionLoading((prev) => ({ ...prev, [cancelTarget._id]: false }));
    }
  };

  const chartData = useMemo(
    () => (stats?.points ?? [])
      .filter((point) => point.deliveryMinutes !== null)
      .slice(-12)
      .map((point, index) => ({
        name: `#${index + 1}`,
        entrega: Math.round(point.deliveryMinutes ?? 0),
        permanencia: point.stayMinutes === null ? 0 : Math.round(point.stayMinutes),
      })),
    [stats]
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = useMemo(
    () => orders
      .filter((order) => statusFilter === 'all' || order.status === statusFilter)
      .filter((order) => {
        if (!normalizedSearch) return true;
        const tableLabel = !order.tableId
          ? 'Sin mesa / Mostrador'
          : typeof order.tableId === 'object'
            ? order.tableId.name
            : order.tableId;
        const itemsLabel = order.items.map((item) => item.productName).join(' ');
        return [
          tableLabel,
          order.status,
          order._id,
          itemsLabel,
          formatCOP(order.total),
          String(order.total),
        ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
      })
      // Chronological: staff attends orders in the order they arrived.
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders, statusFilter, normalizedSearch]
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Pedidos activos</h1>
          <p className="text-island-dark/70 font-body text-sm">Pantalla de barra: pedidos creados que todavía no han sido entregados. Se actualiza sola cada {AUTO_REFRESH_MS / 1000}s.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="card px-4 py-3 flex items-center gap-3">
            <CalendarDays size={18} className="text-island-blue" />
            <span>
              <span className="block text-xs text-island-dark/70 font-body">Fecha</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value || todayInput())}
                className="bg-transparent font-body font-semibold text-island-dark outline-none"
              />
            </span>
          </label>
          <button
            type="button"
            onClick={toggleSound}
            className="card px-4 py-3 flex items-center gap-2 hover:bg-gray-100 transition-colors"
            title={soundEnabled ? 'Desactivar aviso sonoro' : 'Activar aviso sonoro'}
          >
            {soundEnabled ? <Volume2 size={18} className="text-island-blue" /> : <VolumeX size={18} className="text-island-dark/50" />}
            <span className="text-xs font-body text-island-dark/70">{soundEnabled ? 'Sonido activo' : 'Sonido apagado'}</span>
          </button>
          <div className="card px-4 py-3">
            <p className="text-xs text-island-dark/70 font-body">En espera</p>
            <p className="font-body font-semibold text-island-dark">{filteredOrders.length} pedido(s)</p>
          </div>
        </div>
      </div>

      <div className="card grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem]">
        <Input
          placeholder="Buscar por mesa, producto, estado o total..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="rounded-lg border border-island-blue/20 bg-gray-100 px-4 py-2 font-body text-sm text-island-dark/70">
          {filteredOrders.length} de {orders.length} pedidos
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-body font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-island-blue text-white'
                : 'bg-white border border-island-blue/20 text-island-dark/70 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <section className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-gray-100 border-b border-island-blue/20">
            <h2 className="font-body font-semibold text-island-dark">Lista de espera</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="border-b border-island-blue/20">
                <tr>
                  <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Mesa</th>
                  <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Pedido</th>
                  <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Espera</th>
                  <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Total</th>
                  <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filteredOrders.map((order) => {
                  const overThreshold = elapsedMsInCurrentStatus(order, now) >= ELAPSED_ALERT_MS;
                  const next = nextOrderStatus(order.status);
                  return (
                    <tr key={order._id} className="hover:bg-gray-100">
                      <td className="px-4 py-3 font-medium text-island-dark">
                        {!order.tableId ? 'Sin mesa / Mostrador' : typeof order.tableId === 'object' ? order.tableId.name : order.tableId}
                      </td>
                      <td className="px-4 py-3 text-island-dark/70">
                        <p>{order.items.length} ítem(s)</p>
                        <p className="text-xs">{formatShortDate(order.createdAt)}</p>
                        {order.notes && <p className="text-xs italic text-island-dark/60 mt-0.5">{order.notes}</p>}
                      </td>
                      <td className={`px-4 py-3 font-semibold tabular-nums ${overThreshold ? 'text-error-ink' : 'text-island-dark'}`}>
                        {elapsedInCurrentStatus(order, now)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-island-dark">{formatCOP(order.total)}</td>
                      <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {next && (
                            <Button size="sm" variant="secondary" onClick={() => advanceStatus(order)} loading={actionLoading[order._id]}>
                              <ArrowRight size={14} /> {advanceStatusLabel(order.status)}
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button size="sm" onClick={() => markDelivered(order)} loading={actionLoading[order._id]}>
                              <Check size={14} /> Entregado
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setSelected(order)}>
                            <Eye size={14} />
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setCancelTarget(order)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-island-dark/70">No hay pedidos pendientes de entrega.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card">
            <p className="text-xs text-island-dark/70 font-body">Promedio entrega</p>
            <p className="text-2xl font-body font-bold text-island-dark">{Math.round(stats?.avgDeliveryMinutes ?? 0)} min</p>
          </div>
          <div className="card">
            <p className="text-xs text-island-dark/70 font-body">Promedio permanencia</p>
            <p className="text-2xl font-body font-bold text-island-dark">{Math.round(stats?.avgStayMinutes ?? 0)} min</p>
          </div>
          <div className="card">
            <h2 className="font-body font-semibold text-island-dark mb-3">Tiempos recientes</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="entrega" fill="var(--color-island-blue)" />
                  <Bar dataKey="permanencia" fill="var(--color-info)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </aside>
      </div>

      <OrderDetailDrawer order={selected} onClose={() => setSelected(null)} />
      <CancelOrderModal
        order={cancelTarget}
        onCancel={() => setCancelTarget(null)}
        onConfirm={cancelOrder}
        loading={cancelTarget ? actionLoading[cancelTarget._id] : false}
      />
    </div>
  );
}
