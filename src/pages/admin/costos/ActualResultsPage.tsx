import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { actualResultsApi } from '../../../api/costs';
import { ActualResult, ActualExpenses } from '../../../types';
import { formatCOP, formatPct } from '../../../utils/formatCurrency';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { PageLoader } from '../../../components/ui/Spinner';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const EXPENSE_LABELS: Record<keyof ActualExpenses, string> = {
  payroll: 'Nómina', founderPayroll: 'Nómina fundador', rent: 'Arriendo',
  bankFees: 'Comisiones bancarias', utilities: 'Servicios públicos',
  maintenance: 'Mantenimiento', marketing: 'Marketing', paidAds: 'Pauta digital',
  musicRights: 'Derechos musicales', accounting: 'Contabilidad', other: 'Otros',
};

const emptyExpenses = (): ActualExpenses => ({
  payroll: 0, founderPayroll: 0, rent: 0, bankFees: 0, utilities: 0,
  maintenance: 0, marketing: 0, paidAds: 0, musicRights: 0, accounting: 0, other: 0,
});

export function ActualResultsPage() {
  const { year } = useParams<{ year: string }>();
  const yearNum = parseInt(year ?? String(new Date().getFullYear()), 10);
  const toast = useToast();

  const [results, setResults] = useState<ActualResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActualResult | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [costOfSales, setCostOfSales] = useState(0);
  const [expenses, setExpenses] = useState<ActualExpenses>(emptyExpenses());
  const [insights, setInsights] = useState<string[]>([]);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await actualResultsApi.getYear(yearNum);
      setResults(res.data);
    } catch {
      toast.error('Error al cargar resultados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [yearNum]);

  const openCreate = () => {
    const existingMonths = new Set(results.map((r) => r.month));
    const nextMonth = [1,2,3,4,5,6,7,8,9,10,11,12].find((m) => !existingMonths.has(m)) ?? 1;
    setEditing(null);
    setSelectedMonth(nextMonth);
    setTotalSales(0);
    setCostOfSales(0);
    setExpenses(emptyExpenses());
    setInsights([]);
    setModalOpen(true);
  };

  const openEdit = (r: ActualResult) => {
    setEditing(r);
    setSelectedMonth(r.month);
    setTotalSales(r.totalSales);
    setCostOfSales(r.costOfSales);
    setExpenses({ ...r.expenses });
    setInsights(r.insights ?? []);
    setModalOpen(true);
  };

  const updateExpense = (key: keyof ActualExpenses, value: number) =>
    setExpenses((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { year: yearNum, month: selectedMonth, totalSales, costOfSales, expenses };
      if (editing) {
        await actualResultsApi.update(editing._id, payload);
        toast.success('Resultado actualizado');
      } else {
        await actualResultsApi.create(payload);
        toast.success('Resultado registrado');
      }
      setModalOpen(false);
      fetch();
    } catch {
      toast.error('Error al guardar resultado');
    } finally {
      setSaving(false);
    }
  };

  const totalOpExp = Object.values(expenses).reduce((a, b) => a + b, 0);
  const grossMargin = totalSales - costOfSales;
  const netProfit = grossMargin - totalOpExp;

  const annualTotals = results.reduce(
    (acc, r) => ({ sales: acc.sales + r.totalSales, profit: acc.profit + r.netProfit }),
    { sales: 0, profit: 0 }
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Resultados Reales {yearNum}</h1>
          <p className="text-island-dark/70 font-body text-sm">{results.length} meses registrados</p>
        </div>
        <Button onClick={openCreate} icon={<Plus size={15} />}>Registrar mes</Button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <p className="text-xs text-island-dark/70 font-body">Ventas acumuladas {yearNum}</p>
            <p className="text-xl font-body font-bold text-island-dark mt-1">{formatCOP(annualTotals.sales)}</p>
          </div>
          <div className="card">
            <p className="text-xs text-island-dark/70 font-body">Utilidad acumulada {yearNum}</p>
            <p className={`text-xl font-body font-bold mt-1 ${annualTotals.profit >= 0 ? 'text-success' : 'text-error-ink'}`}>
              {formatCOP(annualTotals.profit)}
            </p>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm font-body">
          <thead className="bg-sand border-b border-island-blue/20">
            <tr>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Mes</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Ventas</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Costo ventas</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Margen bruto</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Gastos op.</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Utilidad neta</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {results.map((r) => (
              <tr key={r._id} className="hover:bg-sand transition-colors">
                <td className="px-4 py-3 font-medium text-island-dark">{MONTHS[r.month - 1]}</td>
                <td className="px-4 py-3 text-right text-island-dark">{formatCOP(r.totalSales)}</td>
                <td className="px-4 py-3 text-right text-island-dark/70">
                  {formatCOP(r.costOfSales)} <span className="text-xs">({formatPct(r.costOfSalesPct)})</span>
                </td>
                <td className="px-4 py-3 text-right text-island-dark">
                  {formatCOP(r.grossMargin)} <span className="text-xs text-island-dark/70">({formatPct(r.grossMarginPct)})</span>
                </td>
                <td className="px-4 py-3 text-right text-island-dark/70">{formatCOP(r.totalOperatingExpenses)}</td>
                <td className={`px-4 py-3 text-right font-medium ${r.netProfit >= 0 ? 'text-success' : 'text-error-ink'}`}>
                  {formatCOP(r.netProfit)} <span className="text-xs">({formatPct(r.netProfitPct)})</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Editar</Button>
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-island-dark/70">
                  No hay resultados registrados para {yearNum}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      {editing?.insights && editing.insights.length > 0 && (
        <div className="card">
          <h3 className="font-body text-base font-semibold text-island-dark mb-3">
            Insights — {MONTHS[(editing.month ?? 1) - 1]}
          </h3>
          <ul className="space-y-1">
            {editing.insights.map((ins, i) => (
              <li key={i} className="text-sm font-body text-island-dark/70 flex gap-2">
                <span className="text-island-blue">•</span>
                <span>{ins}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${MONTHS[(selectedMonth ?? 1) - 1]} ${yearNum}` : `Registrar mes — ${yearNum}`}
        size="lg"
      >
        <div className="space-y-5">
          {!editing && (
            <div>
              <label className="text-sm font-medium text-island-dark font-body block mb-1">Mes</label>
              <select
                className="input-base"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(+e.target.value)}
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Ventas totales (COP)" type="number" value={totalSales} onChange={(e) => setTotalSales(+e.target.value)} />
            <Input label="Costo de ventas (COP)" type="number" value={costOfSales} onChange={(e) => setCostOfSales(+e.target.value)} />
          </div>

          <div>
            <p className="text-sm font-medium text-island-dark font-body mb-2">Gastos operativos</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(EXPENSE_LABELS) as (keyof ActualExpenses)[]).map((key) => (
                <div key={key}>
                  <label className="text-xs text-island-dark/70 font-body block mb-1">{EXPENSE_LABELS[key]}</label>
                  <input
                    className="input-base text-sm"
                    type="number"
                    min="0"
                    value={expenses[key]}
                    onChange={(e) => updateExpense(key, +e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <div className="bg-sand rounded-lg p-4 grid grid-cols-3 gap-3 text-sm font-body">
            <div>
              <p className="text-island-dark/70 text-xs">Margen bruto</p>
              <p className="font-medium text-island-dark">{formatCOP(grossMargin)}</p>
              <p className="text-xs text-island-dark/70">{totalSales > 0 ? formatPct(grossMargin / totalSales) : '—'}</p>
            </div>
            <div>
              <p className="text-island-dark/70 text-xs">Gastos totales</p>
              <p className="font-medium text-island-dark">{formatCOP(totalOpExp)}</p>
            </div>
            <div>
              <p className="text-island-dark/70 text-xs">Utilidad neta</p>
              <p className={`font-bold ${netProfit >= 0 ? 'text-success' : 'text-error-ink'}`}>{formatCOP(netProfit)}</p>
              <p className="text-xs text-island-dark/70">{totalSales > 0 ? formatPct(netProfit / totalSales) : '—'}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{editing ? 'Actualizar' : 'Registrar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
