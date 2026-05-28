import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, CalendarDays, ChevronRight, ClipboardList, DollarSign, Sparkles, Table2 } from 'lucide-react';
import { dashboardApi } from '../../api/dashboard';
import { alertasInvApi } from '../../api/inventario';
import { ordersApi } from '../../api/orders';
import { DashboardSummary } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, formatTime, todayLocal } from '../../utils/formatDate';
import { PageLoader } from '../../components/ui/Spinner';

function todayInput() {
  return todayLocal();
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [timingStats, setTimingStats] = useState<{
    avgDeliveryMinutes: number;
    avgStayMinutes: number;
    points: Array<{ deliveryMinutes: number | null; stayMinutes: number | null }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [agotadoCount, setAgotadoCount] = useState(0);

  useEffect(() => {
    dashboardApi.getSummary()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    alertasInvApi.getAll()
      .then((res) => setAgotadoCount(res.data.filter((a) => a.detalle.nivel === 'AGOTADO').length))
      .catch(() => {});
    const today = todayInput();
    ordersApi.getTimingStats({ dateFrom: today, dateTo: today })
      .then((res) => setTimingStats(res.data))
      .catch(() => {});
  }, []);

  if (loading) return <PageLoader />;

  const summary = data!;
  const timingChartData = (timingStats?.points ?? [])
    .filter((point) => point.deliveryMinutes !== null)
    .slice(-12)
    .map((point, index) => ({
      name: `#${index + 1}`,
      entrega: Math.round(point.deliveryMinutes ?? 0),
      permanencia: point.stayMinutes === null ? 0 : Math.round(point.stayMinutes),
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-espresso">Dashboard</h1>
        <p className="text-stone font-body text-sm mt-1">
          {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Inventory alert banner */}
      {agotadoCount > 0 && (
        <Link to="/admin/inventario/stock" className="flex items-center gap-3 bg-error-tint border border-error rounded-xl px-4 py-3 hover:bg-opacity-80 transition-colors">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <p className="font-body text-sm text-error-ink">
            <strong>{agotadoCount} insumo{agotadoCount !== 1 ? 's' : ''} agotado{agotadoCount !== 1 ? 's' : ''}</strong> en el último inventario — ver alertas de compra
          </p>
        </Link>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Ventas del día"
          value={formatCOP(summary.todaySales)}
          icon={<DollarSign size={22} />}
          color="terracotta"
        />
        <SummaryCard
          label="Pedidos hoy"
          value={String(summary.todayOrders)}
          icon={<ClipboardList size={22} />}
          color="lagoon"
        />
        <SummaryCard
          label="Mesas activas"
          value={String(summary.openTables)}
          icon={<Table2 size={22} />}
          color="olive"
        />
        <SummaryCard
          label="Próximos eventos"
          value={String(summary.upcomingEvents.length)}
          icon={<CalendarDays size={22} />}
          color="espresso"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_18rem_minmax(0,1fr)] gap-4">
        <SummaryCard
          label="Promedio entrega"
          value={`${Math.round(timingStats?.avgDeliveryMinutes ?? 0)} min`}
          icon={<ClipboardList size={22} />}
          color="lagoon"
        />
        <SummaryCard
          label="Promedio permanencia"
          value={`${Math.round(timingStats?.avgStayMinutes ?? 0)} min`}
          icon={<Table2 size={22} />}
          color="olive"
        />
        <div className="card">
          <h2 className="font-body text-lg font-semibold text-espresso mb-4">Tiempos recientes</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
              <Tooltip
                formatter={(value: number, name: string) => [`${value} min`, name === 'entrega' ? 'Entrega' : 'Permanencia']}
                labelStyle={{ fontFamily: 'DM Sans' }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-rule)', fontFamily: 'DM Sans' }}
              />
              <Bar dataKey="entrega" fill="var(--color-terracotta)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="permanencia" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-body text-lg font-semibold text-espresso mb-4">Ventas por hora — hoy</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={summary.hourlySales.filter((h) => h.revenue > 0 || parseInt(h.hour) >= 7 && parseInt(h.hour) <= 22)}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <Tooltip
              formatter={(value: number) => [formatCOP(value), 'Ventas']}
              labelStyle={{ fontFamily: 'DM Sans' }}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-rule)', fontFamily: 'DM Sans' }}
            />
            <Bar dataKey="revenue" fill="var(--color-terracotta)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-body text-lg font-semibold text-espresso mb-4">Acciones rápidas</h2>
          <div className="space-y-2">
            <QuickLink to="/admin/orders" icon={<ClipboardList size={18} />} label="Crear nuevo pedido" />
            <QuickLink to="/admin/tables" icon={<Table2 size={18} />} label="Ver estado de mesas" />
            <QuickLink to="/admin/events" icon={<Sparkles size={18} />} label="Gestionar eventos" />
            <QuickLink to="/admin/cashflow" icon={<DollarSign size={18} />} label="Cierre de caja" />
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h2 className="font-body text-lg font-semibold text-espresso mb-4">Próximos eventos</h2>
          {summary.upcomingEvents.length === 0 ? (
            <p className="text-stone font-body text-sm">No hay eventos próximos.</p>
          ) : (
            <div className="space-y-3">
              {summary.upcomingEvents.map((event) => (
                <div key={event._id} className="flex items-center gap-3 p-3 bg-surface-tint rounded-lg">
                  <Sparkles size={22} className="text-terracotta shrink-0" />
                  <div>
                    <p className="font-body font-medium text-espresso text-sm">{event.title}</p>
                    <p className="text-xs text-stone font-body">
                      {formatDate(event.date)} · {formatTime(event.time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    terracotta: 'bg-surface-tint text-espresso',
    lagoon: 'bg-surface-tint text-espresso',
    olive: 'bg-surface-tint text-espresso',
    espresso: 'bg-surface-tint text-espresso',
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-stone font-body uppercase tracking-wide">{label}</p>
        <p className="text-xl font-body font-bold text-espresso">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-tint transition-colors group"
    >
      <span className="text-stone group-hover:text-terracotta transition-colors">{icon}</span>
      <span className="font-body text-sm text-ink group-hover:text-terracotta transition-colors">
        {label}
      </span>
      <ChevronRight size={16} className="ml-auto text-stone group-hover:text-terracotta transition-colors" />
    </Link>
  );
}
