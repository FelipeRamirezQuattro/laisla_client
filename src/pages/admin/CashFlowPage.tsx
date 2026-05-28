import { useEffect, useState } from 'react';
import { AlertTriangle, History, RefreshCw, X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cashClosingsApi, DailySalesSummary } from '../../api/cashClosings';
import { CashClosing } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatDate, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Spinner';

const schema = z.object({
  date: z.string().min(1, 'Fecha requerida'),
  openingCash: z.coerce.number().min(0),
  expenses: z.array(z.object({
    description: z.string().min(1, 'Descripción requerida'),
    amount: z.coerce.number().min(0),
  })).default([]),
  actualCash: z.coerce.number().min(0),
  notes: z.string().default(''),
});

type FormData = z.infer<typeof schema>;

export function CashFlowPage() {
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesLoading, setSalesLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dailySales, setDailySales] = useState<DailySalesSummary>({
    cashSales: 0,
    cardSales: 0,
    transferSales: 0,
    totalSales: 0,
    totalOrders: 0,
    totalDailyExpenses: 0,
    dailyExpenses: [],
    openOrdersCount: 0,
    openOrders: [],
    cancelledOrdersCount: 0,
    cancelledOrders: [],
  });
  const toast = useToast();

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayLocal(),
      expenses: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'expenses' });

  const watchedValues = watch(['date', 'openingCash', 'expenses', 'actualCash']);
  const selectedDate = watchedValues[0];
  const manualExpenses = (watchedValues[2] || []).reduce((s: number, e: { amount: number }) => s + (Number(e.amount) || 0), 0);
  const totalExpenses = manualExpenses + dailySales.totalDailyExpenses;
  const expectedCash = (Number(watchedValues[1]) || 0) + dailySales.cashSales - totalExpenses;
  const difference = (Number(watchedValues[3]) || 0) - expectedCash;

  useEffect(() => {
    Promise.all([
      cashClosingsApi.getAll().then((r) => setClosings(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setSalesLoading(true);
    cashClosingsApi.getDailySales(selectedDate)
      .then((r) => setDailySales(r.data))
      .catch(() => toast.error('Error al cargar ventas facturadas'))
      .finally(() => setSalesLoading(false));
  }, [selectedDate]);

  const onSubmit = async (data: FormData) => {
    if (dailySales.openOrdersCount > 0) {
      const ok = window.confirm(
        `Hay ${dailySales.openOrdersCount} pedido(s) sin facturar en la fecha seleccionada. ¿Deseas guardar el cierre de todos modos?`
      );
      if (!ok) return;
    }
    try {
      await cashClosingsApi.create(data);
      toast.success('Cierre de caja guardado');
      await Promise.all([
        cashClosingsApi.getAll().then((r) => setClosings(r.data)),
        cashClosingsApi.getDailySales(data.date).then((r) => setDailySales(r.data)),
      ]);
    } catch {
      toast.error('Error al guardar cierre');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Caja / Cierre del Día</h1>
          <p className="text-stone font-body text-sm">Registro de ventas y cierre diario</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setHistoryOpen(true)}>
          <History size={16} />
          Historial de cierres
        </Button>
      </div>

      <div className="card flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-body text-base font-semibold text-espresso">Fecha de cierre</h2>
          <p className="text-sm text-stone font-body">Selecciona hoy o un día anterior para calcular la caja facturada.</p>
        </div>
        <div className="sm:w-64">
          <Input
            label="Día a cerrar"
            type="date"
            value={selectedDate}
            error={errors.date?.message}
            onChange={(event) => setValue('date', event.target.value, { shouldDirty: true, shouldValidate: true })}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-body text-lg font-semibold text-espresso">Nuevo cierre</h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => cashClosingsApi.getDailySales(selectedDate).then((r) => setDailySales(r.data))}
            loading={salesLoading}
          >
            <RefreshCw size={14} /> Actualizar facturación
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <section className="space-y-4">
            <div className="grid sm:grid-cols-4 gap-3 text-sm font-body">
              <div className="rounded-lg bg-surface-tint p-4">
                <p className="text-stone text-xs">Ventas efectivo</p>
                <p className="font-bold text-espresso">{formatCOP(dailySales.cashSales)}</p>
              </div>
              <div className="rounded-lg bg-surface-tint p-4">
                <p className="text-stone text-xs">Ventas tarjeta</p>
                <p className="font-bold text-espresso">{formatCOP(dailySales.cardSales)}</p>
              </div>
              <div className="rounded-lg bg-surface-tint p-4">
                <p className="text-stone text-xs">Transferencias</p>
                <p className="font-bold text-espresso">{formatCOP(dailySales.transferSales)}</p>
              </div>
              <div className="rounded-lg border border-rule bg-white p-4">
                <p className="text-stone text-xs">Facturado</p>
                <p className="font-bold text-espresso">{dailySales.totalOrders} · {formatCOP(dailySales.totalSales)}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-rule bg-surface-tint p-4 font-body">
                <p className="text-sm text-stone">Gastos registrados en caja menor</p>
                <p className="font-semibold text-espresso">
                  {dailySales.dailyExpenses.length} gasto(s) · {formatCOP(dailySales.totalDailyExpenses)}
                </p>
                {dailySales.dailyExpenses.length > 0 && (
                  <div className="mt-3 grid gap-2">
                    {dailySales.dailyExpenses.slice(0, 4).map((expense) => (
                      <div key={expense._id} className="rounded-md bg-white/70 px-3 py-2 flex justify-between gap-3 text-xs">
                        <span>{expense.description}</span>
                        <strong>{formatCOP(expense.amount)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-rule bg-white p-4">
                <p className="mb-3 text-sm font-medium text-ink font-body">Conteo de efectivo</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Efectivo apertura (COP)" type="number" {...register('openingCash')} />
                  <Input label="Efectivo final contado (COP)" type="number" {...register('actualCash')} />
                </div>
              </div>
            </div>

            {(dailySales.openOrdersCount > 0 || dailySales.cancelledOrdersCount > 0) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {dailySales.openOrdersCount > 0 && (
                  <div className="rounded-lg border border-warning bg-warning-tint p-4 font-body">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-warning-ink shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-warning-ink">
                          {dailySales.openOrdersCount} pedido(s) sin facturar
                        </p>
                        <div className="mt-3 grid gap-2">
                          {dailySales.openOrders.slice(0, 4).map((order) => (
                            <div key={order._id} className="rounded-md bg-white/70 px-3 py-2 flex justify-between gap-3 text-xs">
                              <span>{order.tableName || 'Mesa'} · {order.itemsCount} ítem(s) · {order.status}</span>
                              <strong>{formatCOP(order.total)}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {dailySales.cancelledOrdersCount > 0 && (
                  <div className="rounded-lg border border-error bg-error-tint p-4 font-body">
                    <p className="font-semibold text-error-ink">
                      {dailySales.cancelledOrdersCount} pedido(s) eliminado(s)
                    </p>
                    <div className="mt-3 grid gap-2">
                      {dailySales.cancelledOrders.slice(0, 4).map((order) => (
                        <div key={order._id} className="rounded-md bg-white/70 px-3 py-2 text-xs">
                          <div className="flex justify-between gap-3">
                            <span>{order.tableName || 'Mesa'} · {order.itemsCount} ítem(s)</span>
                            <strong>{formatCOP(order.total)}</strong>
                          </div>
                          <p className="text-stone mt-1">
                            {order.cancelReason}{order.cancelReasonDetail ? ` · ${order.cancelReasonDetail}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Expenses */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink font-body">Gastos adicionales manuales</label>
                <Button variant="ghost" size="sm" type="button" onClick={() => append({ description: '', amount: 0 })}>
                  + Añadir gasto
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, i) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`expenses.${i}.description`)}
                      placeholder="Descripción"
                      className="input-base flex-1"
                    />
                    <input
                      {...register(`expenses.${i}.amount`)}
                      type="number"
                      placeholder="Monto"
                      className="input-base w-32"
                    />
                    <button type="button" onClick={() => remove(i)} className="text-error-ink hover:text-error-ink px-2" aria-label="Eliminar gasto">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink font-body block mb-1">Notas</label>
              <textarea className="input-base h-20 resize-none" {...register('notes')} />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="bg-surface-tint rounded-lg p-4 space-y-2 text-sm font-body">
              <div className="flex justify-between">
                <span className="text-stone">Gastos caja menor</span>
                <span className="font-medium">{formatCOP(dailySales.totalDailyExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Gastos manuales</span>
                <span className="font-medium">{formatCOP(manualExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Total gastos</span>
                <span className="font-medium">{formatCOP(totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone">Efectivo esperado</span>
                <span className="font-medium">{formatCOP(expectedCash)}</span>
              </div>
              <div className={`flex justify-between font-bold border-t border-rule pt-2 ${difference < 0 ? 'text-error-ink' : difference > 0 ? 'text-success-ink' : 'text-espresso'}`}>
                <span>Diferencia</span>
                <span>{formatCOP(difference)}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>Guardar cierre</Button>
          </aside>
        </div>
      </form>

      {historyOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-espresso bg-opacity-50 backdrop-blur-sm" onClick={() => setHistoryOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-white px-6 py-4">
              <div>
                <p className="text-xs font-body uppercase tracking-wide text-stone">Caja</p>
                <h2 className="font-body text-xl font-semibold text-espresso">Historial de cierres</h2>
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
            <div className="space-y-3 px-6 py-5">
              {closings.map((c) => (
                <div key={c._id} className="border border-rule rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-espresso font-body text-sm">{formatDate(c.date)}</span>
                    <span className={`text-sm font-bold font-body ${c.difference < 0 ? 'text-error-ink' : c.difference > 0 ? 'text-success-ink' : 'text-stone'}`}>
                      Dif: {formatCOP(c.difference)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-body text-stone">
                    <span>Efectivo: {formatCOP(c.cashSales)}</span>
                    <span>Tarjeta: {formatCOP(c.cardSales)}</span>
                    <span>Transf: {formatCOP(c.transferSales)}</span>
                    <span>Gastos: {formatCOP(c.totalExpenses)}</span>
                  </div>
                  {c.notes && <p className="text-xs text-stone font-body mt-2 italic">"{c.notes}"</p>}
                </div>
              ))}
              {closings.length === 0 && <p className="text-center text-stone font-body text-sm py-8">Sin historial de cierres.</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
