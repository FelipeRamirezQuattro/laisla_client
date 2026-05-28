import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Eye, Trash2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ordersApi } from '../../api/orders';
import { Order } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatShortDate, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import {
  CancelOrderModal,
  elapsedInCurrentStatus,
  OrderDetailDrawer,
  useNow,
} from '../../components/orders/OrderWorkflow';

function isWaiting(order: Order) {
  return !['delivered', 'billed', 'cancelled'].includes(order.status);
}

function todayInput() {
  return todayLocal();
}

export function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayInput());
  const [selected, setSelected] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<{ avgDeliveryMinutes: number; avgStayMinutes: number; points: Array<{ deliveryMinutes: number | null; stayMinutes: number | null; createdAt: string }> } | null>(null);
  const now = useNow();
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        ordersApi.getAll({ status: 'open', page: 1, limit: 100, dateFrom: selectedDate, dateTo: selectedDate }),
        ordersApi.getTimingStats({ dateFrom: selectedDate, dateTo: selectedDate }),
      ]);
      setOrders(ordersRes.data.orders.filter(isWaiting));
      setStats(statsRes.data);
    } catch {
      toast.error('Error al cargar pedidos activos');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Pedidos activos</h1>
          <p className="text-stone font-body text-sm">Pedidos creados que todavía no han sido entregados para la fecha seleccionada.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <label className="card px-4 py-3 flex items-center gap-3">
            <CalendarDays size={18} className="text-terracotta" />
            <span>
              <span className="block text-xs text-stone font-body">Fecha</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value || todayInput())}
                className="bg-transparent font-body font-semibold text-espresso outline-none"
              />
            </span>
          </label>
          <div className="card px-4 py-3">
            <p className="text-xs text-stone font-body">En espera</p>
            <p className="font-body font-semibold text-espresso">{orders.length} pedido(s)</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-4">
        <section className="card p-0 overflow-hidden">
          <div className="px-4 py-3 bg-surface-tint border-b border-rule">
            <h2 className="font-body font-semibold text-espresso">Lista de espera</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="border-b border-rule">
                <tr>
                  <th className="text-left px-4 py-3 text-stone font-medium">Mesa</th>
                  <th className="text-left px-4 py-3 text-stone font-medium">Pedido</th>
                  <th className="text-left px-4 py-3 text-stone font-medium">Espera</th>
                  <th className="text-right px-4 py-3 text-stone font-medium">Total</th>
                  <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                  <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-surface-tint">
                    <td className="px-4 py-3 font-medium text-espresso">
                      {!order.tableId ? 'Sin mesa / Mostrador' : typeof order.tableId === 'object' ? order.tableId.name : order.tableId}
                    </td>
                    <td className="px-4 py-3 text-stone">
                      <p>{order.items.length} ítem(s)</p>
                      <p className="text-xs">{formatShortDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink tabular-nums">{elapsedInCurrentStatus(order, now)}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink">{formatCOP(order.total)}</td>
                    <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => markDelivered(order)} loading={actionLoading[order._id]}>
                          <Check size={14} /> Entregado
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelected(order)}>
                          <Eye size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setCancelTarget(order)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-stone">No hay pedidos pendientes de entrega.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="card">
            <p className="text-xs text-stone font-body">Promedio entrega</p>
            <p className="text-2xl font-body font-bold text-espresso">{Math.round(stats?.avgDeliveryMinutes ?? 0)} min</p>
          </div>
          <div className="card">
            <p className="text-xs text-stone font-body">Promedio permanencia</p>
            <p className="text-2xl font-body font-bold text-espresso">{Math.round(stats?.avgStayMinutes ?? 0)} min</p>
          </div>
          <div className="card">
            <h2 className="font-body font-semibold text-espresso mb-3">Tiempos recientes</h2>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="entrega" fill="var(--color-terracotta)" />
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
