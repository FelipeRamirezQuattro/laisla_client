import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import { reportsApi, type SalesTrends } from '../../api/reports';
import { Combobox } from '../../components/ui/Combobox';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { exportToCsv } from '../../utils/exportCsv';
import { todayLocal } from '../../utils/formatDate';
import { formatCOP, formatNumber } from '../../utils/formatCurrency';

type Metric = 'units' | 'revenue';

const BLUE = '#2043A9';
const AMBER = '#FCA613';
const DAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;
const shiftDate = (ymd: string, days: number) =>
  new Date(Date.parse(`${ymd}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const shortDate = (ymd: string) => ymd.slice(5).split('-').reverse().join('/');

export function SalesTrendsPage() {
  const toast = useToast();
  const [dateTo, setDateTo] = useState(todayLocal());
  const [dateFrom, setDateFrom] = useState(() => shiftDate(todayLocal(), -55)); // 8 semanas
  const [productId, setProductId] = useState('');
  const [metric, setMetric] = useState<Metric>('units');
  const [data, setData] = useState<SalesTrends | null>(null);
  const [loading, setLoading] = useState(true);

  // Lista de productos para el selector: se conserva aunque se filtre por uno solo.
  const [productOptions, setProductOptions] = useState<SalesTrends['products']>([]);

  const load = useCallback(async () => {
    if (!dateFrom || !dateTo || dateFrom > dateTo) return;
    setLoading(true);
    try {
      const res = await reportsApi.getSalesTrends({ dateFrom, dateTo, productId: productId || undefined });
      setData(res.data);
      setProductOptions((current) => (productId && current.length ? current : res.data.products));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message ?? 'Error al cargar la tendencia de ventas');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, productId]);

  useEffect(() => {
    load();
  }, [load]);

  const money = metric === 'revenue';
  const fmt = (n: number) => (money ? formatCOP(n) : formatNumber(n));
  const unitWord = money ? 'ventas' : 'unidades';
  const productName = productOptions.find((p) => p.productId === productId)?.name;

  const quickRange = (weeks: number) => {
    const to = todayLocal();
    setDateTo(to);
    setDateFrom(shiftDate(to, -(weeks * 7 - 1)));
  };

  // ---- Mapa de calor: solo las horas con actividad (y una hora de margen) ----
  const heat = useMemo(() => {
    if (!data) return null;
    const active = data.heatmap.filter((c) => c.units > 0).map((c) => c.hour);
    const min = active.length ? Math.max(Math.min(...active) - 1, 0) : 7;
    const max = active.length ? Math.min(Math.max(...active) + 1, 23) : 20;
    const value = (c: { units: number; revenue: number }) => (money ? c.revenue : c.units);
    const top = Math.max(...data.heatmap.map(value), 0);
    return { hours: Array.from({ length: max - min + 1 }, (_, i) => min + i), value, top };
  }, [data, money]);

  const weekdayData = useMemo(
    () =>
      (data?.byWeekday ?? []).map((w) => ({
        name: w.label,
        value: money ? (w.occurrences ? Math.round(w.revenue / w.occurrences) : 0) : w.avgUnits,
      })),
    [data, money]
  );
  const hourData = useMemo(
    () =>
      (data?.byHour ?? [])
        .filter((h) => heat?.hours.includes(h.hour))
        .map((h) => ({
          name: hourLabel(h.hour),
          value: money ? (data!.range.days ? Math.round(h.revenue / data!.range.days) : 0) : h.avgUnitsPerDay,
        })),
    [data, heat, money]
  );
  const dailyData = useMemo(() => {
    const series = (data?.daily ?? []).map((d) => (money ? d.revenue : d.units));
    return (data?.daily ?? []).map((d, i) => {
      const window = series.slice(Math.max(0, i - 6), i + 1);
      return {
        name: shortDate(d.date),
        value: series[i],
        promedio: Math.round((window.reduce((s, v) => s + v, 0) / window.length) * 10) / 10,
      };
    });
  }, [data, money]);

  const maxOf = (rows: Array<{ value: number }>) => Math.max(...rows.map((r) => r.value), 0);
  const topProducts = (data?.products ?? []).slice(0, 10);
  const topUnits = Math.max(...topProducts.map((p) => (money ? p.revenue : p.units)), 1);

  const exportHeatmap = () => {
    if (!data) return;
    exportToCsv(
      'tendencia-dia-hora',
      data.heatmap
        .filter((c) => c.units > 0)
        .map((c) => ({ Día: data.byWeekday[c.dow - 1].label, Hora: hourLabel(c.hour), Unidades: c.units, 'Ventas (COP)': c.revenue }))
    );
    toast.success('CSV exportado');
  };

  const noSales = !!data && data.totals.units === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-island-dark">Tendencia de ventas</h1>
        <p className="text-sm font-body text-island-dark/70 mt-1">
          Qué día y a qué hora se vende más, por producto. Las cortesías no cuentan como venta.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[10rem_10rem_1fr]">
          <Input label="Desde" type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} />
          <Input label="Hasta" type="date" value={dateTo} min={dateFrom} onChange={(e) => setDateTo(e.target.value)} />
          <Combobox
            label="Producto"
            placeholder="Todos los productos"
            emptyText="Ningún producto con ese nombre"
            value={productId}
            onChange={setProductId}
            options={[
              { value: '', label: 'Todos los productos' },
              ...productOptions.map((p) => ({ value: p.productId, label: p.name, hint: `${formatNumber(p.units)} uds` })),
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-body text-island-dark/70 mr-1">Rango rápido:</span>
          {[4, 8, 12].map((w) => (
            <button key={w} type="button" onClick={() => quickRange(w)} className="px-3 py-1 rounded-lg text-sm font-body bg-gray-100 text-island-dark hover:bg-gray-200">
              {w} semanas
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div role="group" aria-label="Métrica" className="flex rounded-lg overflow-hidden border border-island-blue/30">
              {([['units', 'Unidades'], ['revenue', 'Ventas $']] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={metric === key}
                  onClick={() => setMetric(key)}
                  className={`px-3 py-1.5 text-sm font-body ${metric === key ? 'bg-island-dark text-white' : 'bg-white text-island-dark'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={exportHeatmap} disabled={noSales || !data} className="btn-ghost py-1.5 text-sm flex items-center gap-1 disabled:opacity-40">
              <Download size={14} /> CSV
            </button>
          </div>
        </div>
      </div>

      {dateFrom > dateTo && <p className="text-sm text-error-ink font-body">La fecha inicial no puede ser posterior a la final.</p>}

      {!data ? (
        <p className="text-sm font-body text-island-dark/70">Cargando…</p>
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {noSales ? (
            <div className="card text-center text-island-dark/70 font-body">
              No hay ventas {productName ? `de "${productName}" ` : ''}en este rango.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Insight label="Día más fuerte" value={data.peaks.weekday?.label ?? '—'} sub={data.peaks.weekday ? `${formatNumber(data.peaks.weekday.avgUnits)} uds en promedio` : ''} />
                <Insight label="Hora pico" value={data.peaks.hour ? hourLabel(data.peaks.hour.hour) : '—'} sub={data.peaks.hour ? `${formatNumber(data.peaks.hour.units)} uds en el rango` : ''} />
                <Insight label="Franja pico" value={data.peaks.cell ? `${data.peaks.cell.label} ${hourLabel(data.peaks.cell.hour)}` : '—'} sub={data.peaks.cell ? `${formatNumber(data.peaks.cell.units)} uds en el rango` : ''} />
                <Insight label="Total del rango" value={`${formatNumber(data.totals.units)} uds`} sub={formatCOP(data.totals.revenue)} />
              </div>

              {/* Mapa de calor día × hora */}
              <div className="card">
                <h2 className="font-body font-semibold text-island-dark">Día y hora de mayor venta</h2>
                <p className="text-xs font-body text-island-dark/70 mb-3">
                  {money ? 'Ventas en pesos' : 'Unidades vendidas'} en todo el rango, por día de la semana y hora. Más oscuro = más venta.
                </p>
                {heat && (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[40rem] border-separate border-spacing-1 text-xs font-body">
                      <thead>
                        <tr>
                          <th className="w-10" />
                          {heat.hours.map((h) => (
                            <th key={h} scope="col" className="font-medium text-island-dark/70">{String(h).padStart(2, '0')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {DAY_SHORT.map((day, i) => (
                          <tr key={day}>
                            <th scope="row" className="text-right pr-2 font-medium text-island-dark/80">{day}</th>
                            {heat.hours.map((h) => {
                              const cell = data.heatmap.find((c) => c.dow === i + 1 && c.hour === h)!;
                              const v = heat.value(cell);
                              const ratio = heat.top ? v / heat.top : 0;
                              const isPeak = data.peaks.cell?.dow === cell.dow && data.peaks.cell?.hour === cell.hour;
                              return (
                                <td
                                  key={h}
                                  title={`${data.byWeekday[i].label} ${hourLabel(h)} · ${formatNumber(cell.units)} uds · ${formatCOP(cell.revenue)}`}
                                  className={`h-9 text-center rounded ${isPeak ? 'ring-2 ring-sun-yellow' : ''}`}
                                  style={{
                                    backgroundColor: v > 0 ? `rgba(32, 67, 169, ${0.1 + 0.9 * ratio})` : 'rgba(16, 26, 58, 0.04)',
                                    color: ratio > 0.5 ? '#fff' : '#101A3A',
                                  }}
                                >
                                  {v > 0 ? (money ? `${Math.round(v / 1000)}k` : formatNumber(v)) : ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {data.peaks.cell && (
                  <p className="text-xs font-body text-island-dark/70 mt-3">
                    Mejor franja: <strong>{data.peaks.cell.label} a las {hourLabel(data.peaks.cell.hour)}</strong> ({formatNumber(data.peaks.cell.units)} unidades en el rango, marcada con borde amarillo).
                  </p>
                )}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card">
                  <h2 className="font-body font-semibold text-island-dark">Promedio por día de la semana</h2>
                  <p className="text-xs font-body text-island-dark/70 mb-2">{money ? 'Ventas' : 'Unidades'} promedio en cada día (más alto en amarillo).</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weekdayData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} tickFormatter={(v) => (money ? `${Math.round(v / 1000)}k` : String(v))} />
                      <Tooltip formatter={(v) => [fmt(Number(v)), `Promedio de ${unitWord}`]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {weekdayData.map((d, i) => <Cell key={i} fill={d.value === maxOf(weekdayData) ? AMBER : BLUE} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h2 className="font-body font-semibold text-island-dark">Promedio por hora del día</h2>
                  <p className="text-xs font-body text-island-dark/70 mb-2">{money ? 'Ventas' : 'Unidades'} promedio por día en cada hora (más alta en amarillo).</p>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={hourData} margin={{ left: 0, right: 8, top: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} />
                      <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} tickFormatter={(v) => (money ? `${Math.round(v / 1000)}k` : String(v))} />
                      <Tooltip formatter={(v) => [fmt(Number(v)), `Promedio de ${unitWord} por día`]} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {hourData.map((d, i) => <Cell key={i} fill={d.value === maxOf(hourData) ? AMBER : BLUE} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h2 className="font-body font-semibold text-island-dark">Evolución diaria</h2>
                <p className="text-xs font-body text-island-dark/70 mb-2">{money ? 'Ventas' : 'Unidades'} por día y su promedio móvil de 7 días (para ver la tendencia sin el ruido de cada día).</p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={dailyData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'DM Sans' }} tickFormatter={(v) => (money ? `${Math.round(v / 1000)}k` : String(v))} />
                    <Tooltip formatter={(v, name) => [fmt(Number(v)), name === 'promedio' ? 'Promedio 7 días' : 'Día']} />
                    <Legend formatter={(v) => (v === 'promedio' ? 'Promedio 7 días' : money ? 'Ventas del día' : 'Unidades del día')} wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="value" stroke={BLUE} strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="promedio" stroke={AMBER} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* Productos: clic para ver su propio mapa de calor */}
          <div className="card">
            <h2 className="font-body font-semibold text-island-dark">Productos más vendidos</h2>
            <p className="text-xs font-body text-island-dark/70 mb-3">Haz clic en un producto para ver su día y hora de mayor venta.</p>
            {topProducts.length === 0 ? (
              <p className="text-sm font-body text-island-dark/70">Sin ventas en el rango.</p>
            ) : (
              <ul className="space-y-1">
                {topProducts.map((p) => {
                  const value = money ? p.revenue : p.units;
                  const active = p.productId === productId;
                  return (
                    <li key={p.productId}>
                      <button
                        type="button"
                        onClick={() => setProductId(active ? '' : p.productId)}
                        aria-pressed={active}
                        className={`w-full text-left rounded-lg px-3 py-2 hover:bg-gray-100 ${active ? 'bg-gray-100 ring-1 ring-island-dark/30' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-3 text-sm font-body">
                          <span className="font-medium text-island-dark truncate">{p.name}</span>
                          <span className="tabular-nums text-island-dark/80 whitespace-nowrap">{fmt(value)}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                          <div className="h-1.5 rounded-full" style={{ width: `${(value / topUnits) * 100}%`, backgroundColor: BLUE }} />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Insight({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-xs font-body text-island-dark/70 uppercase tracking-wide">{label}</p>
      <p className="font-body text-xl font-bold text-island-dark mt-1">{value}</p>
      {sub && <p className="text-xs font-body text-island-dark/60 mt-0.5">{sub}</p>}
    </div>
  );
}
