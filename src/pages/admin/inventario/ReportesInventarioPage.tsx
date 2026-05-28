import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportesInvApi } from '../../../api/inventario';
import { useToast } from '../../../hooks/useToast';
import { PageLoader } from '../../../components/ui/Spinner';
import type { ReporteAgotamiento, ReporteCumplimiento, ReporteInsumoCritico } from '../../../types';

type Period = 7 | 30 | 90;

export function ReportesInventarioPage() {
  const toast = useToast();
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [frecuencia, setFrecuencia] = useState<ReporteAgotamiento[]>([]);
  const [cumplimiento, setCumplimiento] = useState<ReporteCumplimiento[]>([]);
  const [criticos, setCriticos] = useState<ReporteInsumoCritico[]>([]);
  const [horaPromedio, setHoraPromedio] = useState<{ matutino: string | null; vespertino: string | null; counts: { matutino: number; vespertino: number } } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, cRes, crRes, hRes] = await Promise.all([
        reportesInvApi.frecuenciaAgotamiento(period),
        reportesInvApi.cumplimiento(period),
        reportesInvApi.insumosCriticos(period),
        reportesInvApi.horaPromedio(period),
      ]);
      setFrecuencia(fRes.data);
      setCumplimiento(cRes.data);
      setCriticos(crRes.data);
      setHoraPromedio(hRes.data);
    } catch {
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Reportes de Inventario</h1>
          <p className="text-stone font-body text-sm mt-1">Análisis del período seleccionado</p>
        </div>
        <div className="flex gap-2">
          {([7, 30, 90] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-body transition-all ${period === p ? 'bg-espresso text-cream' : 'bg-surface-tint text-espresso hover:bg-surface-tint'}`}
            >
              {p} días
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {/* Hora promedio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card text-center">
              <p className="text-xs font-body text-stone uppercase tracking-wide mb-1">Hora promedio Matutino</p>
              <p className="font-body text-3xl font-bold text-espresso">{horaPromedio?.matutino ?? '—'}</p>
              <p className="text-xs font-body text-stone mt-1">{horaPromedio?.counts.matutino ?? 0} revisiones</p>
            </div>
            <div className="card text-center">
              <p className="text-xs font-body text-stone uppercase tracking-wide mb-1">Hora promedio Vespertino</p>
              <p className="font-body text-3xl font-bold text-espresso">{horaPromedio?.vespertino ?? '—'}</p>
              <p className="text-xs font-body text-stone mt-1">{horaPromedio?.counts.vespertino ?? 0} revisiones</p>
            </div>
          </div>

          {/* Frecuencia de agotamiento */}
          <div className="card">
            <h2 className="font-body font-semibold text-espresso mb-4">Frecuencia de agotamiento (top 15)</h2>
            {frecuencia.length === 0 ? (
              <p className="text-sm font-body text-stone">Sin datos para este período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={frecuencia} layout="vertical" margin={{ left: 140, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fontFamily: 'DM Sans' }} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11, fontFamily: 'DM Sans' }} width={140} />
                  <Tooltip formatter={(v) => [`${v} veces`, 'Agotado']} />
                  <Bar dataKey="agotadoCount" fill="var(--color-error)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Insumos críticos */}
          <div className="card">
            <h2 className="font-body font-semibold text-espresso mb-4">Insumos críticos (top 10)</h2>
            {criticos.length === 0 ? (
              <p className="text-sm font-body text-stone">Sin insumos críticos en este período.</p>
            ) : (
              <div className="space-y-2">
                {criticos.map((c, i) => (
                  <div key={c.insumoId} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-stone w-5">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-body font-medium text-espresso">{c.nombre}</span>
                        <span className="text-xs font-body text-error-ink font-semibold">{c.agotadoCount}x</span>
                      </div>
                      <div className="w-full bg-rule rounded-full h-1.5">
                        <div
                          className="bg-error h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, (c.agotadoCount / (criticos[0]?.agotadoCount || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-body text-stone w-24 text-right truncate">{c.categoria}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cumplimiento por colaborador */}
          <div className="card">
            <h2 className="font-body font-semibold text-espresso mb-4">Tasa de cumplimiento por colaborador</h2>
            {cumplimiento.length === 0 ? (
              <p className="text-sm font-body text-stone">Sin revisiones en este período.</p>
            ) : (
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-stone text-xs uppercase tracking-wide">
                    <th className="py-2 text-left">Colaborador</th>
                    <th className="py-2 text-center">Completadas</th>
                    <th className="py-2 text-center">Esperadas</th>
                    <th className="py-2 text-center">%</th>
                    <th className="py-2 text-left">Progreso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {cumplimiento.map((c) => (
                    <tr key={c.colaboradorId}>
                      <td className="py-2 font-medium text-espresso">{c.nombre}</td>
                      <td className="py-2 text-center">{c.completadas}</td>
                      <td className="py-2 text-center text-stone">{c.esperadas}</td>
                      <td className="py-2 text-center">
                        <span className={`font-semibold ${c.pct >= 80 ? 'text-success-ink' : c.pct >= 50 ? 'text-warning-ink' : 'text-error-ink'}`}>
                          {c.pct}%
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="w-full bg-rule rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${c.pct >= 80 ? 'bg-success' : c.pct >= 50 ? 'bg-warning' : 'bg-error'}`}
                            style={{ width: `${Math.min(100, c.pct)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
