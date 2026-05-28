import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit3, History, PackagePlus, ReceiptText, RefreshCw, X } from 'lucide-react';
import { expensesApi } from '../../api/expenses';
import { insumosInvApi } from '../../api/inventario';
import { providersApi } from '../../api/providers';
import type { DailyExpense, Insumo, MeasurementUnit, Provider } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, todayLocal } from '../../utils/formatDate';
import { MEASUREMENT_UNITS } from '../../utils/measurementUnits';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { PageLoader } from '../../components/ui/Spinner';

type ExpenseType = 'INSUMO' | 'OTRO';

interface FormState {
  date: string;
  type: ExpenseType;
  description: string;
  amount: number | '';
  insumoId: string;
  providerId: string;
  quantity: number | '';
  unit: MeasurementUnit;
  notes: string;
}

const emptyForm = (date = todayLocal()): FormState => ({
  date,
  type: 'OTRO',
  description: '',
  amount: '',
  insumoId: '',
  providerId: '',
  quantity: '',
  unit: 'UND',
  notes: '',
});

function providerName(provider?: string | Provider) {
  return typeof provider === 'object' && provider ? provider.name : '';
}

function insumoName(insumo?: string | Insumo) {
  return typeof insumo === 'object' && insumo ? insumo.nombre : '';
}

export function ExpensesPage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editing, setEditing] = useState<DailyExpense | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFrom, setHistoryFrom] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
  const [historyTo, setHistoryTo] = useState(todayLocal());
  const [historyExpenses, setHistoryExpenses] = useState<DailyExpense[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadExpenses = async (date = selectedDate) => {
    const res = await expensesApi.getAll({ date });
    setExpenses(res.data.expenses);
    setTotal(res.data.total);
  };

  useEffect(() => {
    Promise.all([
      loadExpenses(selectedDate),
      insumosInvApi.getAgrupados().then((res) => setInsumos(res.data.flatMap((group) => group.insumos))),
      providersApi.getAll({ limit: 200 }).then((res) => setProviders(res.data.providers)),
    ])
      .catch(() => toast.error('Error al cargar gastos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setForm((current) => ({ ...current, date: selectedDate }));
    loadExpenses(selectedDate).catch(() => toast.error('Error al cargar gastos'));
  }, [selectedDate]);

  const selectedInsumo = useMemo(
    () => insumos.find((item) => item._id === form.insumoId),
    [form.insumoId, insumos]
  );

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await expensesApi.getAll({ dateFrom: historyFrom, dateTo: historyTo });
      setHistoryExpenses(res.data.expenses);
      setHistoryTotal(res.data.total);
    } catch {
      toast.error('Error al cargar histórico de gastos');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (historyOpen) loadHistory();
  }, [historyOpen, historyFrom, historyTo]);

  useEffect(() => {
    if (form.type === 'INSUMO' && selectedInsumo) {
      setForm((current) => ({
        ...current,
        unit: selectedInsumo.unidad,
        description: current.description || `Compra de ${selectedInsumo.nombre}`,
      }));
    }
  }, [form.type, selectedInsumo?._id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Ingresa el valor del gasto');
      return;
    }
    if (form.type === 'INSUMO' && (!form.insumoId || !form.quantity)) {
      toast.error('Selecciona el insumo y la cantidad comprada');
      return;
    }
    if (form.type === 'OTRO' && !form.description.trim()) {
      toast.error('Ingresa el detalle del gasto');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: form.date,
        type: form.type,
        description: form.description.trim(),
        amount,
        insumoId: form.type === 'INSUMO' ? form.insumoId : undefined,
        providerId: form.type === 'INSUMO' && form.providerId ? form.providerId : undefined,
        quantity: form.type === 'INSUMO' ? Number(form.quantity) : undefined,
        unit: form.type === 'INSUMO' ? form.unit : undefined,
        notes: form.notes,
      };
      if (editing) {
        await expensesApi.update(editing._id, payload);
        toast.success('Gasto actualizado');
      } else {
        await expensesApi.create(payload);
        toast.success(form.type === 'INSUMO' ? 'Compra y gasto registrados' : 'Gasto registrado');
      }
      setEditing(null);
      setForm(emptyForm(selectedDate));
      await loadExpenses(selectedDate);
      if (historyOpen) await loadHistory();
    } catch {
      toast.error('Error al registrar gasto');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (expense: DailyExpense) => {
    setEditing(expense);
    setForm({
      date: expense.date.slice(0, 10),
      type: expense.type,
      description: expense.description,
      amount: expense.amount,
      insumoId: typeof expense.insumoId === 'object' && expense.insumoId ? expense.insumoId._id : expense.insumoId ?? '',
      providerId: typeof expense.providerId === 'object' && expense.providerId ? expense.providerId._id : expense.providerId ?? '',
      quantity: expense.quantity ?? '',
      unit: expense.unit ?? 'UND',
      notes: expense.notes ?? '',
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm(selectedDate));
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Gastos diarios</h1>
          <p className="text-stone font-body text-sm">
            Caja menor, compras de insumos y gastos operativos del día.
          </p>
        </div>
        <div className="card px-4 py-3 sm:w-64">
          <Input
            label="Fecha"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || todayLocal())}
          />
        </div>
        <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
          <History size={16} />
          Histórico
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-body text-lg font-semibold text-espresso">Historial del día</h2>
              <p className="text-sm text-stone font-body">{expenses.length} registro(s)</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone font-body">Total gastos</p>
              <p className="text-xl font-body font-bold text-espresso">{formatCOP(total)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="border-b border-rule">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-stone">Gasto</th>
                  <th className="px-3 py-2 text-left font-medium text-stone">Relación</th>
                  <th className="px-3 py-2 text-left font-medium text-stone">Proveedor</th>
                  <th className="px-3 py-2 text-right font-medium text-stone">Valor</th>
                  <th className="px-3 py-2 text-right font-medium text-stone">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-surface-tint">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {expense.type === 'INSUMO' ? <PackagePlus size={16} className="text-terracotta" /> : <ReceiptText size={16} className="text-stone" />}
                        <div>
                          <p className="font-medium text-espresso">{expense.description}</p>
                          <p className="text-xs text-stone">{formatDate(expense.date)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-stone">
                      {expense.type === 'INSUMO'
                        ? `${insumoName(expense.insumoId)} · ${expense.quantity ?? 0} ${expense.unit ?? ''}`
                        : 'Gasto general'}
                    </td>
                    <td className="px-3 py-3 text-stone">{providerName(expense.providerId) || '-'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-ink">{formatCOP(expense.amount)}</td>
                    <td className="px-3 py-3 text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(expense)}>
                        <Edit3 size={14} />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-stone">No hay gastos registrados para esta fecha.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-body text-lg font-semibold text-espresso">{editing ? 'Editar gasto' : 'Registrar gasto'}</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => loadExpenses(selectedDate)} title="Actualizar">
              <RefreshCw size={14} />
            </Button>
          </div>
          {editing && (
            <div className="mb-4 rounded-lg border border-warning bg-warning-tint px-3 py-2 text-sm font-body text-warning-ink">
              Editando un gasto existente. Los cambios en compras de insumo actualizan el movimiento de inventario relacionado.
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <Select
              label="Tipo"
              value={form.type}
              options={[
                { value: 'OTRO', label: 'Gasto general' },
                { value: 'INSUMO', label: 'Compra de insumo' },
              ]}
              onChange={(event) => setForm({ ...form, type: event.target.value as ExpenseType })}
            />

            {form.type === 'INSUMO' && (
              <>
                <Select
                  label="Insumo"
                  placeholder="Selecciona un insumo"
                  value={form.insumoId}
                  options={insumos.map((insumo) => ({ value: insumo._id, label: insumo.nombre }))}
                  onChange={(event) => setForm({ ...form, insumoId: event.target.value, description: '' })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Cantidad"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: event.target.value === '' ? '' : +event.target.value })}
                  />
                  <Select
                    label="Unidad"
                    value={form.unit}
                    options={MEASUREMENT_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
                    onChange={(event) => setForm({ ...form, unit: event.target.value as MeasurementUnit })}
                  />
                </div>
                <Select
                  label="Proveedor"
                  placeholder="Sin proveedor"
                  value={form.providerId}
                  options={providers.map((provider) => ({ value: provider._id, label: provider.name }))}
                  onChange={(event) => setForm({ ...form, providerId: event.target.value })}
                />
              </>
            )}

            <Input
              label={form.type === 'INSUMO' ? 'Detalle del gasto' : 'Detalle'}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder={form.type === 'INSUMO' ? 'Ej: Compra urgente de leche' : 'Ej: Transporte, papelería, arreglo menor'}
            />
            <Input
              label="Valor pagado (COP)"
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value === '' ? '' : +event.target.value })}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-ink font-body">Notas</label>
              <textarea
                className="input-base h-20 resize-none"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Button type="submit" className="w-full" loading={saving}>
                {editing ? 'Guardar cambios' : 'Guardar gasto'}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" className="w-full" onClick={cancelEdit}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </aside>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-espresso bg-opacity-50 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 border-b border-rule bg-white px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-body uppercase tracking-wide text-stone">Gastos</p>
                  <h2 className="font-body text-xl font-semibold text-espresso">Histórico de caja menor</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-lg p-1 text-stone transition-colors hover:bg-surface-tint hover:text-espresso"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <Input label="Desde" type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} />
                <Input label="Hasta" type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} />
                <Button type="button" variant="secondary" onClick={loadHistory} loading={historyLoading}>
                  <RefreshCw size={14} />
                  Actualizar
                </Button>
              </div>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl bg-surface-tint p-4">
                <p className="text-xs text-stone font-body">Total del periodo</p>
                <p className="text-2xl font-body font-bold text-espresso">{formatCOP(historyTotal)}</p>
              </div>
              <div className="space-y-2">
                {historyExpenses.map((expense) => (
                  <div key={expense._id} className="rounded-xl border border-rule bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-semibold text-espresso">{expense.description}</p>
                        <p className="text-xs text-stone font-body">
                          {formatDate(expense.date)} · {expense.type === 'INSUMO'
                            ? `${insumoName(expense.insumoId)} · ${expense.quantity ?? 0} ${expense.unit ?? ''}`
                            : 'Gasto general'}
                        </p>
                        {providerName(expense.providerId) && (
                          <p className="mt-1 text-xs text-stone font-body">Proveedor: {providerName(expense.providerId)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-body font-bold text-ink">{formatCOP(expense.amount)}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            startEdit(expense);
                            setHistoryOpen(false);
                          }}
                        >
                          <Edit3 size={14} />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {historyExpenses.length === 0 && (
                  <p className="py-10 text-center text-sm text-stone font-body">No hay gastos en el periodo seleccionado.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
