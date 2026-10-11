import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Banknote, CalendarDays, ChevronRight, ClipboardList, DollarSign, Landmark, Sparkles, Table2, Wallet } from 'lucide-react';
import { cashShiftsApi } from '../../api/cashShifts';
import { dashboardApi } from '../../api/dashboard';
import { useAuthStore } from '../../store/authStore';
import { alertasInvApi } from '../../api/inventario';
import { ordersApi } from '../../api/orders';
import { CashBalances, DashboardSummary, MonthlySales } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, formatTime, todayLocal } from '../../utils/formatDate';
import { PageLoader } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [timingStats, setTimingStats] = useState<{
    avgDeliveryMinutes: number;
    avgStayMinutes: number;
    points: Array<{ deliveryMinutes: number | null; stayMinutes: number | null }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [agotadoCount, setAgotadoCount] = useState(0);
  const [monthly, setMonthly] = useState<MonthlySales | null>(null);
  const { isAdmin } = useAuthStore();
  const [balances, setBalances] = useState<CashBalances | null>(null);
  const today = todayLocal();
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const isToday = dateFrom === today && dateTo === today;
  const isRange = dateFrom !== dateTo;
  const dayLabel = isToday
    ? 'hoy'
    : isRange
      ? `${formatDate(dateFrom, 'd MMM')} al ${formatDate(dateTo, 'd MMM yyyy')}`
      : formatDate(dateFrom);

  // Current account balances (sales − expenses); admin-only endpoint, independent of the date filter.
  useEffect(() => {
    if (!isAdmin) return;
    cashShiftsApi.getBalances().then((res) => setBalances(res.data)).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    alertasInvApi.getAll()
      .then((res) => setAgotadoCount(res.data.filter((a) => a.detalle.nivel === 'AGOTADO').length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    dashboardApi.getSummary({ dateFrom, dateTo })
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    ordersApi.getTimingStats({ dateFrom, dateTo })
      .then((res) => setTimingStats(res.data))
      .catch(() => {});
  }, [dateFrom, dateTo]);

  useEffect(() => {
    dashboardApi.getMonthlySales(today.slice(0, 7))
      .then((res) => setMonthly(res.data))
      .catch(() => {});
  }, [today]);

  if (loading || !data) return <PageLoader />;

  const summary = data;
  const monthlyTotal = (monthly?.days ?? []).reduce(
    (acc, day) => ({
      revenue: acc.revenue + day.revenue,
      orders: acc.orders + day.orders,
      cash: acc.cash + day.cash,
      card: acc.card + day.card,
      transfer: acc.transfer + day.transfer,
      nequi: acc.nequi + day.nequi,
    }),
    { revenue: 0, orders: 0, cash: 0, card: 0, transfer: 0, nequi: 0 }
  );
  // Table lists the newest day first; the chart keeps chronological order.
  const monthlyRows = [...(monthly?.days ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const methodColumns = [
    { key: 'cash', label: 'Efectivo' },
    { key: 'card', label: 'Tarjeta' },
    { key: 'transfer', label: 'Transferencia' },
    { key: 'nequi', label: 'Nequi' },
  ] as const;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Dashboard</h1>
          <p className="text-island-dark/70 font-body text-sm mt-1">
            {isRange
              ? `${formatDate(dateFrom, "d 'de' MMMM")} — ${formatDate(dateTo, "d 'de' MMMM yyyy")}`
              : formatDate(dateFrom, "EEEE d 'de' MMMM yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Desde"
            type="date"
            value={dateFrom}
            max={dateTo}
            onChange={(e) => e.target.value && setDateFrom(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={dateTo}
            min={dateFrom}
            max={today}
            onChange={(e) => e.target.value && setDateTo(e.target.value)}
          />
          {!isToday && (
            <button
              type="button"
              className="mb-2 font-body text-sm text-island-blue hover:underline"
              onClick={() => { setDateFrom(today); setDateTo(today); }}
            >
              Hoy
            </button>
          )}
        </div>
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
          label={isToday ? 'Ventas del día' : isRange ? 'Ventas del rango' : 'Ventas del día seleccionado'}
          value={formatCOP(summary.todaySales)}
          icon={<DollarSign size={22} />}
          color="blue"
        />
        <SummaryCard
          label={isToday ? 'Pedidos hoy' : isRange ? 'Pedidos del rango' : 'Pedidos del día'}
          value={String(summary.todayOrders)}
          icon={<ClipboardList size={22} />}
          color="sky"
        />
        <SummaryCard
          label="Mesas activas"
          value={String(summary.openTables)}
          icon={<Table2 size={22} />}
          color="yellow"
        />
        <SummaryCard
          label="Próximos eventos"
          value={String(summary.upcomingEvents.length)}
          icon={<CalendarDays size={22} />}
          color="dark"
        />
      </div>

      {balances && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-body text-lg font-semibold text-island-dark">Saldos actuales</h2>
            <Link to="/admin/caja/saldos" className="font-body text-sm text-island-blue hover:underline">Ver detalle</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <SummaryCard label="Caja menor" value={formatCOP(balances.cash.menor)} icon={<Banknote size={22} />} color="blue" />
            <SummaryCard label="Caja general" value={formatCOP(balances.cash.general)} icon={<Wallet size={22} />} color="sky" />
            <SummaryCard label="Transferencia" value={formatCOP(balances.transfer)} icon={<Landmark size={22} />} color="yellow" />
            <SummaryCard label="Nequi" value={formatCOP(balances.nequi)} icon={<Landmark size={22} />} color="yellow" />
            <SummaryCard label="Tarjeta" value={formatCOP(balances.card)} icon={<Landmark size={22} />} color="dark" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_18rem_minmax(0,1fr)] gap-4">
        <SummaryCard
          label="Promedio entrega"
          value={`${Math.round(timingStats?.avgDeliveryMinutes ?? 0)} min`}
          icon={<ClipboardList size={22} />}
          color="sky"
        />
        <SummaryCard
          label="Promedio permanencia"
          value={`${Math.round(timingStats?.avgStayMinutes ?? 0)} min`}
          icon={<Table2 size={22} />}
          color="yellow"
        />
        <div className="card">
          <h2 className="font-body text-lg font-semibold text-island-dark mb-4">Tiempos recientes</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
              <Tooltip
                formatter={(value: number, name: string) => [`${value} min`, name === 'entrega' ? 'Entrega' : 'Permanencia']}
                labelStyle={{ fontFamily: 'DM Sans' }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontFamily: 'DM Sans' }}
              />
              <Bar dataKey="entrega" fill="var(--color-island-blue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="permanencia" fill="var(--color-info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="font-body text-lg font-semibold text-island-dark mb-4">Ventas por hora — {dayLabel}</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={summary.hourlySales.filter((h) => h.revenue > 0 || parseInt(h.hour) >= 7 && parseInt(h.hour) <= 22)}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="hour" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <Tooltip
              formatter={(value: number) => [formatCOP(value), 'Ventas']}
              labelStyle={{ fontFamily: 'DM Sans' }}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontFamily: 'DM Sans' }}
            />
            <Bar dataKey="revenue" fill="var(--color-island-blue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <h2 className="font-body text-lg font-semibold text-island-dark">Ventas del mes</h2>
          <p className="font-body text-sm text-island-dark/70">
            {monthlyTotal.orders} pedidos · <strong className="text-island-dark">{formatCOP(monthlyTotal.revenue)}</strong>
          </p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={(monthly?.days ?? []).map((day) => ({ ...day, label: day.date.slice(8) }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
            <Tooltip
              formatter={(value: number) => [formatCOP(value), 'Ventas']}
              labelFormatter={(label) => `Día ${label}`}
              labelStyle={{ fontFamily: 'DM Sans' }}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontFamily: 'DM Sans' }}
            />
            <Bar dataKey="revenue" fill="var(--color-island-blue)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="overflow-x-auto mt-4 max-h-96 overflow-y-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-island-blue/20">
                <th className="px-3 py-2 text-left font-medium text-island-dark/70">Día</th>
                <th className="px-3 py-2 text-right font-medium text-island-dark/70">Pedidos</th>
                {methodColumns.map((column) => (
                  <th key={column.key} className="px-3 py-2 text-right font-medium text-island-dark/70">{column.label}</th>
                ))}
                <th className="px-3 py-2 text-right font-medium text-island-dark/70">Ventas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-island-blue/20">
              {monthlyRows.map((day) => (
                <tr
                  key={day.date}
                  className={`hover:bg-gray-100 cursor-pointer ${day.date >= dateFrom && day.date <= dateTo ? 'bg-gray-100 font-semibold' : ''}`}
                  onClick={() => { setDateFrom(day.date); setDateTo(day.date); }}
                >
                  <td className="px-3 py-2 text-island-dark">
                    {formatDate(day.date, 'EEE d MMM')}{day.date === today ? ' (hoy)' : ''}
                  </td>
                  <td className="px-3 py-2 text-right text-island-dark">{day.orders}</td>
                  {methodColumns.map((column) => (
                    <td key={column.key} className="px-3 py-2 text-right text-island-dark">{formatCOP(day[column.key])}</td>
                  ))}
                  <td className="px-3 py-2 text-right text-island-dark">{formatCOP(day.revenue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-island-blue/20 font-semibold">
                <td className="px-3 py-2 text-island-dark">Total</td>
                <td className="px-3 py-2 text-right text-island-dark">{monthlyTotal.orders}</td>
                {methodColumns.map((column) => (
                  <td key={column.key} className="px-3 py-2 text-right text-island-dark">{formatCOP(monthlyTotal[column.key])}</td>
                ))}
                <td className="px-3 py-2 text-right text-island-dark">{formatCOP(monthlyTotal.revenue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-body text-lg font-semibold text-island-dark mb-4">Acciones rápidas</h2>
          <div className="space-y-2">
            <QuickLink to="/admin/orders" icon={<ClipboardList size={18} />} label="Crear nuevo pedido" />
            <QuickLink to="/admin/tables" icon={<Table2 size={18} />} label="Ver estado de mesas" />
            <QuickLink to="/admin/events" icon={<Sparkles size={18} />} label="Gestionar eventos" />
            <QuickLink to="/admin/cashflow" icon={<DollarSign size={18} />} label="Cierre de caja" />
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <h2 className="font-body text-lg font-semibold text-island-dark mb-4">Próximos eventos</h2>
          {summary.upcomingEvents.length === 0 ? (
            <p className="text-island-dark/70 font-body text-sm">No hay eventos próximos.</p>
          ) : (
            <div className="space-y-3">
              {summary.upcomingEvents.map((event) => (
                <div key={event._id} className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                  <Sparkles size={22} className="text-island-blue shrink-0" />
                  <div>
                    <p className="font-body font-medium text-island-dark text-sm">{event.title}</p>
                    <p className="text-xs text-island-dark/70 font-body">
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
    blue: 'bg-gray-100 text-island-dark',
    sky: 'bg-gray-100 text-island-dark',
    yellow: 'bg-gray-100 text-island-dark',
    dark: 'bg-gray-100 text-island-dark',
  };

  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-island-dark/70 font-body uppercase tracking-wide">{label}</p>
        <p className="text-xl font-body font-bold text-island-dark">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors group"
    >
      <span className="text-island-dark/70 group-hover:text-island-blue transition-colors">{icon}</span>
      <span className="font-body text-sm text-island-dark group-hover:text-island-blue transition-colors">
        {label}
      </span>
      <ChevronRight size={16} className="ml-auto text-island-dark/70 group-hover:text-island-blue transition-colors" />
    </Link>
  );
}
