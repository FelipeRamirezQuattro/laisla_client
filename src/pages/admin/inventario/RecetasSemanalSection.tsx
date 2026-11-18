import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Download } from 'lucide-react';
import { reportsApi, type RecipesWeeklyReport } from '../../../api/reports';
import { useToast } from '../../../hooks/useToast';
import { exportToCsv } from '../../../utils/exportCsv';
import { formatNumber } from '../../../utils/formatCurrency';

const WEEK_OPTIONS = [4, 8, 12] as const;
const LINE_COLORS = ['#2043A9', '#FCA613', '#101A3A', '#8498D0', '#C2410C'];

const weekLabel = (start: string) => {
  const [, m, d] = start.split('-');
  return `${d}/${m}`;
};

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-island-dark/50">—</span>;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? 'text-success-ink' : 'text-error-ink'}`}>
      <Icon size={14} />
      {up ? '+' : ''}
      {pct}%
    </span>
  );
}

export function RecetasSemanalSection() {
  const toast = useToast();
  const [weeks, setWeeks] = useState<number>(8);
  const [data, setData] = useState<RecipesWeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getRecipesWeekly(weeks);
      setData(res.data);
    } catch {
      toast.error('Error al cargar el reporte de recetas');
    } finally {
      setLoading(false);
    }
  }, [weeks]);

  useEffect(() => {
    load();
  }, [load]);

  // Gráfico: consumo (vendidas + cortesías) de las 5 recetas con más movimiento en la ventana.
  const top = useMemo(() => (data?.recipes ?? []).filter((r) => r.windowSold + r.windowComplimentary > 0).slice(0, 5), [data]);
  const chartData = useMemo(
    () =>
      (data?.weeks ?? []).map((w, i) => ({
        semana: weekLabel(w.start) + (w.partial ? '*' : ''),
        ...Object.fromEntries(top.map((r) => [r.name, r.weekly[i].sold + r.weekly[i].complimentary])),
      })),
    [data, top]
  );

  const exportCsv = () => {
    if (!data) return;
    exportToCsv(
      'recetas-por-semana',
      data.recipes.map((r) => ({
        Receta: r.name,
        ...Object.fromEntries(data.weeks.map((w, i) => [`Sem ${weekLabel(w.start)}`, r.weekly[i].sold + r.weekly[i].complimentary])),
        'Promedio semanal': r.avgWeekly,
        'Tendencia %': r.trendPct ?? '',
        'Vendidas a la fecha': r.totalSold,
        'Cortesías a la fecha': r.totalComplimentary,
      }))
    );
    toast.success('CSV exportado');
  };

  return (
    <div className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="font-body font-semibold text-island-dark">Recetas más vendidas por semana</h2>
          <p className="text-xs font-body text-island-dark/70 mt-0.5">
            Unidades por semana (lunes a domingo; cortesías incluidas porque también descuentan inventario). * semana en curso.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {WEEK_OPTIONS.map((w) => (
            <button
              key={w}
              onClick={() => setWeeks(w)}
              className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${weeks === w ? 'bg-island-dark text-white' : 'bg-gray-100 text-island-dark hover:bg-gray-100'}`}
            >
              {w} sem
            </button>
          ))}
          <button onClick={exportCsv} disabled={!data?.recipes.length} className="btn-ghost py-1.5 text-sm flex items-center gap-1 disabled:opacity-40">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm font-body text-island-dark/70">Cargando…</p>
      ) : !data || data.recipes.length === 0 ? (
        <p className="text-sm font-body text-island-dark/70">Aún no hay ventas registradas.</p>
      ) : (
        <>
          {top.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="semana" tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {top.map((r, i) => (
                  <Line key={r.name} type="monotone" dataKey={r.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="text-island-dark/70 text-xs uppercase tracking-wide border-b border-island-blue/20">
                  <th className="py-2 pr-3 text-left">Receta</th>
                  {data.weeks.map((w) => (
                    <th key={w.key} className="py-2 px-2 text-right whitespace-nowrap">
                      {weekLabel(w.start)}
                      {w.partial ? '*' : ''}
                    </th>
                  ))}
                  <th className="py-2 px-2 text-right">Prom./sem</th>
                  <th className="py-2 px-2 text-right">Tendencia</th>
                  <th className="py-2 pl-3 text-right">Vendidas a la fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {data.recipes.map((r) => (
                  <tr key={r.recipeId ?? 'none'}>
                    <td className="py-2 pr-3 font-medium text-island-dark">
                      {r.name}
                      {r.category && <span className="block text-xs font-normal text-island-dark/60">{r.category}</span>}
                    </td>
                    {r.weekly.map((w) => (
                      <td key={w.key} className="py-2 px-2 text-right tabular-nums">
                        {formatNumber(w.sold + w.complimentary)}
                        {w.complimentary > 0 && <span className="text-xs text-island-dark/50" title="Incluye cortesías"> ({w.complimentary}c)</span>}
                      </td>
                    ))}
                    <td className="py-2 px-2 text-right tabular-nums">{formatNumber(r.avgWeekly)}</td>
                    <td className="py-2 px-2 text-right"><Trend pct={r.trendPct} /></td>
                    <td className="py-2 pl-3 text-right font-semibold tabular-nums">
                      {formatNumber(r.totalSold)}
                      {r.totalComplimentary > 0 && <span className="block text-xs font-normal text-island-dark/60">+{formatNumber(r.totalComplimentary)} cortesías</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs font-body text-island-dark/60 mt-2">
            La tendencia compara la última semana completa con la anterior. "Vendidas a la fecha" es el acumulado histórico.
          </p>
        </>
      )}
    </div>
  );
}
