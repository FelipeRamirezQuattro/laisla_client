import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Edit3, History, PackagePlus, Plus, ReceiptText, RefreshCw, Trash2 } from 'lucide-react';
import { expensesApi, type LastInsumoPrice } from '../../api/expenses';
import { insumosInvApi } from '../../api/inventario';
import { providersApi } from '../../api/providers';
import { workersApi } from '../../api/workers';
import { laborOverheadApi } from '../../api/costs';
import type { DailyExpense, DailyExpenseType, ExpenseCategory, Insumo, InsumoCategoria, MeasurementUnit, PaymentMethod, Provider, Worker } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, todayLocal } from '../../utils/formatDate';
import { MEASUREMENT_UNITS } from '../../utils/measurementUnits';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';
import { useAuth } from '../../hooks/useAuth';
import { InsumoEditModal } from './inventario/InsumoEditModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Combobox } from '../../components/ui/Combobox';
import { PageLoader } from '../../components/ui/Spinner';
import { Drawer } from '../../components/ui/Drawer';

type ExpenseType = DailyExpenseType;

// Valor del select de concepto GIF que abre el campo de texto para un concepto nuevo.
const OTHER_CONCEPT = '__otro__';

const paymentOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'nequi', label: 'Nequi / Daviplata' },
  { value: 'card', label: 'Tarjeta' },
];

const categoryOptions: { value: ExpenseCategory; label: string }[] = [
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'ARRIENDO', label: 'Arriendo' },
  { value: 'NOMINA', label: 'Nómina' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'LIMPIEZA', label: 'Limpieza' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'OTROS', label: 'Otros' },
];

const categoryLabel = (category?: ExpenseCategory | null) =>
  categoryOptions.find((option) => option.value === category)?.label ?? 'Sin categoría';

// Suma días a una fecha 'YYYY-MM-DD' sin depender de la zona horaria del navegador.
const addDaysToDateString = (date: string, days: number) => {
  const [y, m, d] = date.split('-').map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + days));
  return result.toISOString().slice(0, 10);
};

const accountLabel = (expense: DailyExpense) => {
  const method = paymentOptions.find((option) => option.value === (expense.paymentMethod ?? 'cash'))?.label ?? 'Efectivo';
  if ((expense.paymentMethod ?? 'cash') !== 'cash') return method;
  return `${method} · ${(expense.cashAccount ?? 'menor') === 'menor' ? 'caja menor' : 'caja general'}`;
};

interface FormState {
  date: string;
  type: ExpenseType;
  description: string;
  amount: number | '';
  paymentMethod: PaymentMethod;
  cashAccount: 'menor' | 'general';
  categoriaGasto: ExpenseCategory | '';
  workerId: string;
  gifConcept: string; // concepto elegido, u OTHER_CONCEPT para escribir uno nuevo
  gifConceptCustom: string;
  fechaVencimiento: string;
  insumoId: string;
  providerId: string;
  quantity: number | '';
  unit: MeasurementUnit;
  notes: string;
}

const emptyForm = (date = todayLocal()): FormState => ({
  date,
  type: 'INSUMO',
  description: '',
  amount: '',
  paymentMethod: 'cash',
  cashAccount: 'menor',
  categoriaGasto: '',
  workerId: '',
  gifConcept: '',
  gifConceptCustom: '',
  fechaVencimiento: '',
  insumoId: '',
  providerId: '',
  quantity: '',
  unit: 'UND',
  notes: '',
});

function providerName(provider?: string | Provider) {
  return typeof provider === 'object' && provider ? provider.name : '';
}

function workerName(worker?: string | Worker | null) {
  return typeof worker === 'object' && worker ? worker.name : '';
}

// Texto de la columna "Relación" según el tipo de gasto.
function expenseRelation(expense: DailyExpense) {
  switch (expense.type) {
    case 'INSUMO':
      return `${insumoName(expense.insumoId)} · ${expense.quantity ?? 0} ${expense.unit ?? ''}`;
    case 'MANO_OBRA':
      return `Mano de obra · ${workerName(expense.workerId) || 'trabajador'}`;
    case 'GIF':
      return `GIF · ${expense.gifConcept ?? ''}`;
    default:
      return `Gasto general · ${categoryLabel(expense.categoriaGasto)}`;
  }
}

function insumoName(insumo?: string | Insumo) {
  return typeof insumo === 'object' && insumo ? insumo.nombre : '';
}

export function ExpensesPage() {
  const [selectedDate, setSelectedDate] = useState(todayLocal());
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [categoryByInsumo, setCategoryByInsumo] = useState<Record<string, string>>({});
  const [lastPrices, setLastPrices] = useState<Record<string, LastInsumoPrice>>({});
  const [insumoCategories, setInsumoCategories] = useState<InsumoCategoria[]>([]);
  const [createInsumoOpen, setCreateInsumoOpen] = useState(false);
  const { user } = useAuth();
  // Crear insumos exige rol de administrador en el backend.
  const canCreateInsumo = user?.role === 'admin' || user?.role === 'superadmin';
  // Pagos de nómina y gastos indirectos: solo administradores (el backend también lo exige).
  const canManagePayroll = canCreateInsumo;
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [gifConcepts, setGifConcepts] = useState<string[]>([]);
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
  const confirm = useConfirm();

  const loadExpenses = async (date = selectedDate) => {
    const res = await expensesApi.getAll({ date });
    setExpenses(res.data.expenses);
    setTotal(res.data.total);
  };

  const loadInsumos = () =>
    insumosInvApi.getAgrupados().then((res) => {
      setInsumos(res.data.flatMap((group) => group.insumos));
      setCategoryByInsumo(
        Object.fromEntries(res.data.flatMap((group) => group.insumos.map((i) => [i._id, group.categoria.nombre])))
      );
    });

  // El último precio es auxiliar: si falla, el formulario funciona igual.
  const loadLastPrices = () =>
    expensesApi
      .getLastPrices()
      .then((res) => setLastPrices(Object.fromEntries(res.data.map((row) => [row.insumoId, row]))))
      .catch(() => undefined);

  useEffect(() => {
    if (canCreateInsumo) insumosInvApi.getCategorias().then((res) => setInsumoCategories(res.data)).catch(() => undefined);
    if (canManagePayroll) {
      workersApi.getAll().then((res) => setWorkers(res.data.filter((w) => w.active))).catch(() => undefined);
      laborOverheadApi.get().then((res) => setGifConcepts(res.data.overheadItems.map((i) => i.concept).filter(Boolean))).catch(() => undefined);
    }
    loadLastPrices();
    Promise.all([
      loadExpenses(selectedDate),
      loadInsumos(),
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

  const insumoOptions = useMemo(
    () =>
      insumos.map((insumo) => ({
        value: insumo._id,
        label: insumo.nombre,
        hint: [
          categoryByInsumo[insumo._id],
          insumo.unidad,
          lastPrices[insumo._id] && `Último: ${formatCOP(lastPrices[insumo._id].unitPrice)}/${lastPrices[insumo._id].unit}`,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [insumos, categoryByInsumo, lastPrices]
  );

  const lastPrice = form.insumoId ? lastPrices[form.insumoId] : undefined;

  // Referencia de costo × cantidad, solo si la unidad coincide: primero lo último que se pagó,
  // y si nunca se ha comprado, el precio de lista (que es por presentación).
  const selectedWorker = useMemo(() => workers.find((w) => w._id === form.workerId), [workers, form.workerId]);
  const suggestion = useMemo(() => {
    if (form.type === 'MANO_OBRA' && selectedWorker) {
      return { amount: Math.round(selectedWorker.hourlyRate * selectedWorker.hoursPerDay * selectedWorker.daysPerMonth), label: 'Costo mensual del trabajador' };
    }
    if (form.type !== 'INSUMO' || !selectedInsumo || !form.quantity) return null;
    const quantity = Number(form.quantity);
    if (lastPrice && form.unit === lastPrice.unit) {
      return { amount: Math.round(lastPrice.unitPrice * quantity), label: 'Último precio' };
    }
    if (selectedInsumo.precioLista && form.unit === selectedInsumo.unidad) {
      const presentacion = selectedInsumo.cantidadPresentacion || 1;
      return { amount: Math.round((selectedInsumo.precioLista * quantity) / presentacion), label: 'Precio de lista' };
    }
    return null;
  }, [form.type, form.quantity, form.unit, selectedInsumo, lastPrice, selectedWorker]);

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
      const principal =
        typeof selectedInsumo.proveedorPrincipalId === 'object' && selectedInsumo.proveedorPrincipalId
          ? selectedInsumo.proveedorPrincipalId._id
          : selectedInsumo.proveedorPrincipalId ?? '';
      setForm((current) => ({
        ...current,
        unit: selectedInsumo.unidad,
        // Al editar no se cambia el proveedor guardado.
        providerId: editing ? current.providerId : current.providerId || principal,
        description: current.description || `Compra de ${selectedInsumo.nombre}`,
      }));
    }
  }, [form.type, selectedInsumo?._id]);

  // Vida útil: propone fecha de compra + N días (editable). Al editar un gasto no se toca el
  // vencimiento guardado salvo que el usuario escriba una fecha.
  useEffect(() => {
    if (editing || form.type !== 'INSUMO' || !selectedInsumo) return;
    const dias = selectedInsumo.vidaUtilDias;
    setForm((current) => ({
      ...current,
      fechaVencimiento:
        selectedInsumo.tipoVencimiento === 'VIDA_UTIL' && dias ? addDaysToDateString(current.date, dias) : '',
    }));
  }, [editing, form.type, form.date, selectedInsumo?._id]);

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
    if (form.type === 'INSUMO' && !editing && selectedInsumo?.tipoVencimiento === 'FECHA' && !form.fechaVencimiento) {
      toast.error('Este insumo vence por fecha: indica la fecha de vencimiento de la compra');
      return;
    }
    if (form.type === 'OTRO' && !form.description.trim()) {
      toast.error('Ingresa el detalle del gasto');
      return;
    }
    // La categoría se exige solo al crear: los gastos antiguos no la tienen.
    if (form.type === 'OTRO' && !editing && !form.categoriaGasto) {
      toast.error('Selecciona la categoría del gasto');
      return;
    }
    if (form.type === 'MANO_OBRA' && !form.workerId) {
      toast.error('Selecciona el trabajador');
      return;
    }
    const gifConcept = form.gifConcept === OTHER_CONCEPT ? form.gifConceptCustom.trim() : form.gifConcept;
    if (form.type === 'GIF' && !gifConcept) {
      toast.error('Selecciona o escribe el concepto del gasto indirecto');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date: form.date,
        type: form.type,
        description: form.description.trim(),
        amount,
        paymentMethod: form.paymentMethod,
        cashAccount: form.paymentMethod === 'cash' ? form.cashAccount : undefined,
        categoriaGasto: form.type === 'OTRO' && form.categoriaGasto ? form.categoriaGasto : undefined,
        workerId: form.type === 'MANO_OBRA' ? form.workerId : undefined,
        gifConcept: form.type === 'GIF' ? gifConcept : undefined,
        fechaVencimiento: form.type === 'INSUMO' && form.fechaVencimiento ? form.fechaVencimiento : undefined,
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
      loadLastPrices();
      if (historyOpen) await loadHistory();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message ?? 'Error al registrar gasto');
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (expense: DailyExpense) => {
    const accepted = await confirm({
      title: 'Eliminar gasto',
      confirmLabel: 'Eliminar',
      message: `Se eliminará "${expense.description}" por ${formatCOP(expense.amount)}.${
        expense.type === 'INSUMO' ? ' También se revertirá la entrada de stock de esa compra.' : ''
      }`,
    });
    if (!accepted) return;
    try {
      await expensesApi.remove(expense._id);
      toast.success('Gasto eliminado');
      if (editing?._id === expense._id) {
        setEditing(null);
        setForm(emptyForm(selectedDate));
      }
      await loadExpenses(selectedDate);
      loadLastPrices();
      if (historyOpen) await loadHistory();
    } catch {
      toast.error('Error al eliminar el gasto');
    }
  };

  const startEdit = (expense: DailyExpense) => {
    setEditing(expense);
    setForm({
      date: expense.date.slice(0, 10),
      type: expense.type,
      description: expense.description,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod ?? 'cash',
      cashAccount: expense.cashAccount ?? 'menor',
      categoriaGasto: expense.categoriaGasto ?? '',
      workerId: typeof expense.workerId === 'object' && expense.workerId ? expense.workerId._id : expense.workerId ?? '',
      gifConcept: expense.gifConcept ? (gifConcepts.includes(expense.gifConcept) ? expense.gifConcept : OTHER_CONCEPT) : '',
      gifConceptCustom: expense.gifConcept && !gifConcepts.includes(expense.gifConcept) ? expense.gifConcept : '',
      fechaVencimiento: '',
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
          <h1 className="font-body text-2xl font-bold text-island-dark">Gastos diarios</h1>
          <p className="text-island-dark/70 font-body text-sm">
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
              <h2 className="font-body text-lg font-semibold text-island-dark">Historial del día</h2>
              <p className="text-sm text-island-dark/70 font-body">{expenses.length} registro(s)</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-island-dark/70 font-body">Total gastos</p>
              <p className="text-xl font-body font-bold text-island-dark">{formatCOP(total)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead className="border-b border-island-blue/20">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-island-dark/70">Gasto</th>
                  <th className="px-3 py-2 text-left font-medium text-island-dark/70">Relación</th>
                  <th className="px-3 py-2 text-left font-medium text-island-dark/70">Proveedor</th>
                  <th className="px-3 py-2 text-right font-medium text-island-dark/70">Valor</th>
                  <th className="px-3 py-2 text-right font-medium text-island-dark/70">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-island-blue/20">
                {expenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-100">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {expense.type === 'INSUMO' ? <PackagePlus size={16} className="text-island-blue" /> : <ReceiptText size={16} className="text-island-dark/70" />}
                        <div>
                          <p className="font-medium text-island-dark">{expense.description}</p>
                          <p className="text-xs text-island-dark/70">{formatDate(expense.date)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-island-dark/70">
                      {expenseRelation(expense)}
                      <p className="text-xs">{accountLabel(expense)}{expense.cashShiftId ? '' : ' · fuera de turno'}</p>
                    </td>
                    <td className="px-3 py-3 text-island-dark/70">{providerName(expense.providerId) || '-'}</td>
                    <td className="px-3 py-3 text-right font-semibold text-island-dark">{formatCOP(expense.amount)}</td>
                    <td className="px-3 py-3 text-right">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(expense)}>
                        <Edit3 size={14} />
                        Editar
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => deleteExpense(expense)} title="Eliminar gasto">
                        <Trash2 size={14} />
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-island-dark/70">No hay gastos registrados para esta fecha.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="card h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-body text-lg font-semibold text-island-dark">{editing ? 'Editar gasto' : 'Registrar gasto'}</h2>
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
                { value: 'INSUMO', label: 'Compra de insumo' },
                { value: 'OTRO', label: 'Gasto general' },
                ...(canManagePayroll
                  ? [
                      { value: 'MANO_OBRA', label: 'Pago de mano de obra' },
                      { value: 'GIF', label: 'Gasto indirecto (GIF)' },
                    ]
                  : []),
              ]}
              onChange={(event) => setForm({ ...form, type: event.target.value as ExpenseType })}
            />

            {form.type === 'INSUMO' && (
              <>
                <Combobox
                  label="Insumo"
                  placeholder="Escribe para buscar un insumo…"
                  emptyText="No hay insumos con ese nombre"
                  value={form.insumoId}
                  options={insumoOptions}
                  onChange={(value) => setForm({ ...form, insumoId: value, description: '', providerId: '' })}
                />
                {lastPrice && (
                  <p className="-mt-2 text-xs text-island-dark/70 font-body">
                    Última compra: {lastPrice.quantity} {lastPrice.unit} por {formatCOP(lastPrice.amount)} (
                    {formatCOP(lastPrice.unitPrice)}/{lastPrice.unit}) · {formatDate(lastPrice.date)}
                  </p>
                )}
                {canCreateInsumo && (
                  <button
                    type="button"
                    onClick={() => setCreateInsumoOpen(true)}
                    className="-mt-2 inline-flex items-center gap-1 self-start text-xs font-medium text-island-blue hover:underline font-body"
                  >
                    <Plus size={12} /> ¿No está? Crear insumo nuevo
                  </button>
                )}
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
                {selectedInsumo && selectedInsumo.tipoVencimiento && selectedInsumo.tipoVencimiento !== 'NINGUNO' && (
                  <Input
                    label={selectedInsumo.tipoVencimiento === 'FECHA' ? 'Fecha de vencimiento' : 'Vence el (vida útil)'}
                    type="date"
                    value={form.fechaVencimiento}
                    min={form.date}
                    onChange={(event) => setForm({ ...form, fechaVencimiento: event.target.value })}
                  />
                )}
              </>
            )}

            {form.type === 'OTRO' && (
              <Select
                label="Categoría"
                placeholder="Selecciona una categoría"
                value={form.categoriaGasto}
                options={categoryOptions}
                onChange={(event) => setForm({ ...form, categoriaGasto: event.target.value as ExpenseCategory })}
              />
            )}

            {form.type === 'MANO_OBRA' && (
              <>
                <Combobox
                  label="Trabajador"
                  placeholder="Escribe para buscar un trabajador…"
                  emptyText="No hay trabajadores activos con ese nombre"
                  value={form.workerId}
                  options={workers.map((w) => ({ value: w._id, label: w.name, hint: w.role || undefined }))}
                  onChange={(value) => setForm({ ...form, workerId: value })}
                />
                {workers.length === 0 && (
                  <p className="-mt-2 text-xs text-island-dark/70 font-body">
                    Aún no hay trabajadores: regístralos en Costos &amp; Finanzas → Trabajadores.
                  </p>
                )}
              </>
            )}

            {form.type === 'GIF' && (
              <>
                <Select
                  label="Concepto del gasto indirecto"
                  placeholder="Selecciona un concepto"
                  value={form.gifConcept}
                  options={[...gifConcepts.map((c) => ({ value: c, label: c })), { value: OTHER_CONCEPT, label: 'Otro concepto…' }]}
                  onChange={(event) => setForm({ ...form, gifConcept: event.target.value })}
                />
                {form.gifConcept === OTHER_CONCEPT && (
                  <Input
                    label="Nombre del concepto"
                    value={form.gifConceptCustom}
                    onChange={(event) => setForm({ ...form, gifConceptCustom: event.target.value })}
                    placeholder="Ej: Seguro, mantenimiento de equipos"
                  />
                )}
              </>
            )}

            <Input
              label={form.type === 'INSUMO' ? 'Detalle del gasto' : form.type === 'MANO_OBRA' || form.type === 'GIF' ? 'Detalle (opcional)' : 'Detalle'}
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
            {suggestion !== null && Number(form.amount) !== suggestion.amount && (
              <button
                type="button"
                onClick={() => setForm({ ...form, amount: suggestion.amount })}
                className="-mt-2 text-left text-xs text-island-dark/70 underline font-body"
              >
                {suggestion.label}: {formatCOP(suggestion.amount)} · usar este valor
              </button>
            )}
            <Select
              label="Se paga con"
              value={form.paymentMethod}
              options={paymentOptions}
              onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-island-dark font-body">Notas</label>
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

      <InsumoEditModal
        isOpen={createInsumoOpen}
        insumo={null}
        categorias={insumoCategories}
        onClose={() => setCreateInsumoOpen(false)}
        onSaved={async (created) => {
          setCreateInsumoOpen(false);
          // Recarga el catálogo y deja el insumo nuevo ya seleccionado en el formulario.
          await loadInsumos().catch(() => toast.error('No se pudo actualizar la lista de insumos'));
          setForm((current) => ({ ...current, type: 'INSUMO', insumoId: created._id, description: '', providerId: '' }));
        }}
      />

      <Drawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        eyebrow="Gastos"
        title="Histórico de caja menor"
        size="lg"
        headerExtra={
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input label="Desde" type="date" value={historyFrom} onChange={(event) => setHistoryFrom(event.target.value)} />
            <Input label="Hasta" type="date" value={historyTo} onChange={(event) => setHistoryTo(event.target.value)} />
            <Button type="button" variant="secondary" onClick={loadHistory} loading={historyLoading}>
              <RefreshCw size={14} />
              Actualizar
            </Button>
          </div>
        }
      >
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-100 p-4">
                <p className="text-xs text-island-dark/70 font-body">Total del periodo</p>
                <p className="text-2xl font-body font-bold text-island-dark">{formatCOP(historyTotal)}</p>
              </div>
              <div className="space-y-2">
                {historyExpenses.map((expense) => (
                  <div key={expense._id} className="rounded-xl border border-island-blue/20 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-semibold text-island-dark">{expense.description}</p>
                        <p className="text-xs text-island-dark/70 font-body">
                          {formatDate(expense.date)} · {expenseRelation(expense)}
                        </p>
                        {providerName(expense.providerId) && (
                          <p className="mt-1 text-xs text-island-dark/70 font-body">Proveedor: {providerName(expense.providerId)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-body font-bold text-island-dark">{formatCOP(expense.amount)}</p>
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
                        <Button type="button" variant="ghost" size="sm" onClick={() => deleteExpense(expense)} title="Eliminar gasto">
                          <Trash2 size={14} />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {historyExpenses.length === 0 && (
                  <p className="py-10 text-center text-sm text-island-dark/70 font-body">No hay gastos en el periodo seleccionado.</p>
                )}
              </div>
            </div>
      </Drawer>
    </div>
  );
}
