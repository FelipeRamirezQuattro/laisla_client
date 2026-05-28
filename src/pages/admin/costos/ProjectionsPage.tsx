import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, X } from 'lucide-react';
import { projectionsApi } from '../../../api/costs';
import { Projection, MonthProjection } from '../../../types';
import { formatCOP, formatPct } from '../../../utils/formatCurrency';
import { calcMonthProjection } from '../../../utils/costFormulas';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PageLoader } from '../../../components/ui/Spinner';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function ProjectionsPage() {
  const { year } = useParams<{ year: string }>();
  const yearNum = parseInt(year ?? String(new Date().getFullYear()), 10);
  const toast = useToast();

  const [projection, setProjection] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [editMonth, setEditMonth] = useState<number | null>(null);

  // Edit form state
  const [editDailyTickets, setEditDailyTickets] = useState(0);
  const [editAvgTicket, setEditAvgTicket] = useState(0);
  const [editCostOfSalesPct, setEditCostOfSalesPct] = useState(0);
  const [editOpExp, setEditOpExp] = useState(0);

  useEffect(() => {
    projectionsApi.get(yearNum).then((res) => {
      setProjection(res.data);
    }).catch(() => {
      setProjection(null);
    }).finally(() => setLoading(false));
  }, [yearNum]);

  const createProjection = async () => {
    setCreating(true);
    try {
      const res = await projectionsApi.create({ year: yearNum, growthRate: 0.02, workingDaysPerMonth: 26 });
      setProjection(res.data);
      toast.success('Proyección creada');
    } catch {
      toast.error('Error al crear proyección');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (m: MonthProjection) => {
    setEditMonth(m.month);
    setEditDailyTickets(m.dailyTickets);
    setEditAvgTicket(m.averageTicket);
    setEditCostOfSalesPct(m.costOfSalesPct);
    setEditOpExp(m.operatingExpenses);
  };

  const saveMonth = async () => {
    if (!projection || editMonth === null) return;
    setSaving(editMonth);
    try {
      const res = await projectionsApi.updateMonth(yearNum, editMonth, {
        isManualOverride: true,
        dailyTickets: editDailyTickets,
        averageTicket: editAvgTicket,
        costOfSalesPct: editCostOfSalesPct,
        operatingExpenses: editOpExp,
      });
      setProjection(res.data);
      setEditMonth(null);
      toast.success('Mes actualizado');
    } catch {
      toast.error('Error al guardar mes');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <PageLoader />;

  if (!projection) {
    return (
      <div className="space-y-6">
        <h1 className="font-body text-2xl font-bold text-espresso">Proyecciones {yearNum}</h1>
        <div className="card text-center py-12">
          <p className="text-stone font-body mb-4">No hay proyección para {yearNum}.</p>
          <Button onClick={createProjection} loading={creating}>Crear proyección {yearNum}</Button>
        </div>
      </div>
    );
  }

  const totals = projection.months.reduce(
    (acc, m) => {
      const calc = calcMonthProjection({
        dailyTickets: m.dailyTickets,
        workingDaysPerMonth: projection.workingDaysPerMonth,
        averageTicket: m.averageTicket,
        costOfSalesPct: m.costOfSalesPct,
        operatingExpenses: m.operatingExpenses,
      });
      return {
        sales: acc.sales + calc.monthlySales,
        cos: acc.cos + calc.costOfSales,
        opExp: acc.opExp + m.operatingExpenses,
        profit: acc.profit + calc.profit,
      };
    },
    { sales: 0, cos: 0, opExp: 0, profit: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Proyecciones {yearNum}</h1>
          <p className="text-stone font-body text-sm">
            Tasa de crecimiento: {(projection.growthRate * 100).toFixed(1)}% · {projection.workingDaysPerMonth} días/mes
          </p>
        </div>
      </div>

      {/* Annual totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Ventas anuales" value={formatCOP(totals.sales)} />
        <KpiCard label="Costo de ventas" value={formatCOP(totals.cos)} sub={formatPct(totals.sales > 0 ? totals.cos / totals.sales : 0)} />
        <KpiCard label="Gastos operativos" value={formatCOP(totals.opExp)} />
        <KpiCard label="Utilidad neta" value={formatCOP(totals.profit)} highlight={totals.profit > 0} />
      </div>

      {/* Monthly table */}
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm font-body">
          <thead className="bg-surface-tint border-b border-rule">
            <tr>
              <th className="text-left px-4 py-3 text-stone font-medium">Mes</th>
              <th className="text-right px-4 py-3 text-stone font-medium">Tickets/día</th>
              <th className="text-right px-4 py-3 text-stone font-medium">Ticket prom.</th>
              <th className="text-right px-4 py-3 text-stone font-medium">Ventas mes</th>
              <th className="text-right px-4 py-3 text-stone font-medium">Costo ventas</th>
              <th className="text-right px-4 py-3 text-stone font-medium">Gastos op.</th>
              <th className="text-right px-4 py-3 text-stone font-medium">Utilidad</th>
              <th className="text-center px-4 py-3 text-stone font-medium">Editar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {projection.months.map((m) => {
              const calc = calcMonthProjection({
                dailyTickets: m.dailyTickets,
                workingDaysPerMonth: projection.workingDaysPerMonth,
                averageTicket: m.averageTicket,
                costOfSalesPct: m.costOfSalesPct,
                operatingExpenses: m.operatingExpenses,
              });
              const isEditing = editMonth === m.month;
              return (
                <tr key={m.month} className={`hover:bg-surface-tint transition-colors ${m.isManualOverride ? 'bg-warning-tint' : ''}`}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {MONTHS[m.month - 1]}
                    {m.isManualOverride && <Pencil size={12} className="ml-1 inline-block text-warning" />}
                  </td>
                  {isEditing ? (
                    <>
                      <td className="px-2 py-2">
                        <input className="input-base text-sm w-20" type="number" value={editDailyTickets} onChange={(e) => setEditDailyTickets(+e.target.value)} />
                      </td>
                      <td className="px-2 py-2">
                        <input className="input-base text-sm w-24" type="number" value={editAvgTicket} onChange={(e) => setEditAvgTicket(+e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right text-stone">
                        {formatCOP(editDailyTickets * projection.workingDaysPerMonth * editAvgTicket)}
                      </td>
                      <td className="px-2 py-2">
                        <input className="input-base text-sm w-20" type="number" step="0.01" value={editCostOfSalesPct} onChange={(e) => setEditCostOfSalesPct(+e.target.value)} placeholder="0.35" />
                      </td>
                      <td className="px-2 py-2">
                        <input className="input-base text-sm w-28" type="number" value={editOpExp} onChange={(e) => setEditOpExp(+e.target.value)} />
                      </td>
                      <td className="px-4 py-3 text-right text-stone">—</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" onClick={saveMonth} loading={saving === m.month}>OK</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditMonth(null)} aria-label="Cancelar edición">
                            <X size={14} />
                          </Button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-right text-stone">{m.dailyTickets}</td>
                      <td className="px-4 py-3 text-right text-stone">{formatCOP(m.averageTicket)}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{formatCOP(calc.monthlySales)}</td>
                      <td className="px-4 py-3 text-right text-stone">{formatCOP(calc.costOfSales)}</td>
                      <td className="px-4 py-3 text-right text-stone">{formatCOP(m.operatingExpenses)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${calc.profit >= 0 ? 'text-success' : 'text-error-ink'}`}>
                        {formatCOP(calc.profit)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>Editar</Button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs text-stone font-body">{label}</p>
      <p className={`text-xl font-body font-bold mt-1 ${highlight ? 'text-success' : 'text-espresso'}`}>{value}</p>
      {sub && <p className="text-xs text-stone font-body mt-0.5">{sub}</p>}
    </div>
  );
}
