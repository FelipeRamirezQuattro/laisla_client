import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { laborOverheadApi } from '../../../api/costs';
import { workersApi } from '../../../api/workers';
import { LaborAndOverheadParams, MonthlySuggestion, Worker } from '../../../types';
import { formatCOPDecimal, formatCOP } from '../../../utils/formatCurrency';
import { calcMODResult, calcMODFromWorkersResult, calcGIFResult } from '../../../utils/costFormulas';
import { useToast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PageLoader } from '../../../components/ui/Spinner';
import { CascadeWarningModal } from '../../../components/costos/CascadeWarningModal';

export function ParametrosMODGIFPage() {
  const [params, setParams] = useState<LaborAndOverheadParams | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cascadeModal, setCascadeModal] = useState(false);
  const [cascadeCount, setCascadeCount] = useState(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [suggestion, setSuggestion] = useState<MonthlySuggestion | null>(null);
  // Mes cuyos datos se cargaron al formulario con "Usar estos datos" (se guarda junto con los parámetros).
  const [appliedMonth, setAppliedMonth] = useState<string | null>(null);

  // Form state
  const [hourlyWage, setHourlyWage] = useState(0);
  const [numberOfWorkers, setNumberOfWorkers] = useState(1);
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [numberOfShifts, setNumberOfShifts] = useState(1);
  const [monthlyCustomers, setMonthlyCustomers] = useState(1000);
  const [productsPerCustomer, setProductsPerCustomer] = useState(1.5);
  const [ivaRate, setIvaRate] = useState(0.19);
  const [overheadItems, setOverheadItems] = useState<{ concept: string; monthlyCost: number }[]>([]);

  const toast = useToast();

  useEffect(() => {
    laborOverheadApi.get().then((res) => {
      const p = res.data;
      setParams(p);
      setHourlyWage(p.hourlyWage);
      setNumberOfWorkers(p.numberOfWorkers);
      setHoursPerDay(p.hoursPerDay);
      setNumberOfShifts(p.numberOfShifts);
      setMonthlyCustomers(p.monthlyCustomers);
      setProductsPerCustomer(p.productsPerCustomer);
      setIvaRate(p.ivaRate);
      setOverheadItems(p.overheadItems.map((i) => ({ ...i })));
    }).catch(() => {
      toast.error('Error al cargar parámetros');
    }).finally(() => setLoading(false));
    // Auxiliares: si fallan, la página sigue funcionando con los campos manuales.
    workersApi.getAll().then((res) => setWorkers(res.data.filter((w) => w.active))).catch(() => undefined);
    laborOverheadApi.suggestion().then((res) => setSuggestion(res.data)).catch(() => undefined);
  }, []);

  // Con trabajadores activos la MOD sale de ellos; sin trabajadores, de los campos manuales de siempre.
  const workersMode = workers.length > 0;
  const mod = workersMode
    ? calcMODFromWorkersResult({ workers, monthlyCustomers, productsPerCustomer })
    : calcMODResult({ hourlyWage, numberOfWorkers, hoursPerDay, numberOfShifts, monthlyCustomers, productsPerCustomer });
  // Si cambiaron los trabajadores desde el último guardado, el costo de las recetas aún usa la MOD vieja.
  const laborOutdated = workersMode && !!params && Math.abs(params.monthlyLabor - mod.monthlyLabor) > 1;
  const gif = calcGIFResult({ overheadItems, monthlyCustomers, productsPerCustomer });

  const handleSaveClick = async () => {
    try {
      const preview = await laborOverheadApi.cascadePreview();
      setCascadeCount(preview.data.affectedRecipes);
      setCascadeModal(true);
    } catch {
      toast.error('Error al verificar impacto');
    }
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      await laborOverheadApi.update({
        hourlyWage, numberOfWorkers, hoursPerDay, numberOfShifts,
        monthlyCustomers, productsPerCustomer, ivaRate, overheadItems,
        ...(appliedMonth ? { baselineMonth: appliedMonth } : {}),
      });
      toast.success('Parámetros actualizados y recetas recalculadas');
      setCascadeModal(false);
      setAppliedMonth(null);
      const res = await laborOverheadApi.get();
      setParams(res.data);
    } catch {
      toast.error('Error al guardar parámetros');
    } finally {
      setSaving(false);
    }
  };

  // Carga los datos del mes anterior en el formulario; no guarda nada hasta "Guardar y recalcular".
  const useSuggestion = () => {
    if (!suggestion) return;
    if (suggestion.customers.available) {
      setMonthlyCustomers(suggestion.customers.monthlyCustomers);
      setProductsPerCustomer(suggestion.customers.productsPerCustomer);
    }
    setOverheadItems(suggestion.overhead.items.map((i) => ({ concept: i.concept, monthlyCost: i.suggested })));
    setAppliedMonth(suggestion.month);
    toast.success('Datos cargados en el formulario. Revísalos y pulsa "Guardar y recalcular".');
  };

  const updateOverhead = (idx: number, field: 'concept' | 'monthlyCost', value: string | number) =>
    setOverheadItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));

  const addOverhead = () =>
    setOverheadItems((prev) => [...prev, { concept: '', monthlyCost: 0 }]);

  const removeOverhead = (idx: number) =>
    setOverheadItems((prev) => prev.filter((_, i) => i !== idx));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-island-dark">Parámetros MOD / GIF</h1>
          <p className="text-island-dark/70 font-body text-sm">Mano de obra directa y gastos indirectos de fabricación</p>
        </div>
        <Button onClick={handleSaveClick}>Guardar y recalcular</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* MOD */}
        <div className="card space-y-4">
          <h2 className="font-body text-lg font-semibold text-island-dark border-b border-island-blue/20 pb-2">
            MOD — Mano de Obra Directa
          </h2>
          {workersMode ? (
            <div className="rounded-lg border border-island-blue/20 p-3 text-sm font-body">
              <p className="text-island-dark">
                Calculada con <strong>{workers.length} trabajador{workers.length === 1 ? '' : 'es'} activo{workers.length === 1 ? '' : 's'}</strong>, cada uno con su tarifa y sus horas.
              </p>
              <Link to="/admin/costos/trabajadores" className="text-island-blue underline">Administrar trabajadores</Link>
              {laborOutdated && (
                <p role="status" className="mt-2 rounded bg-warning-tint px-2 py-1 text-warning-ink">
                  Los trabajadores cambiaron: guarda con "Guardar y recalcular" para actualizar el costo de las recetas.
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs font-body text-island-dark/70">
              Sin trabajadores registrados se usan estos campos. <Link to="/admin/costos/trabajadores" className="text-island-blue underline">Registrar trabajadores</Link> para calcular la MOD con la tarifa y las horas de cada uno.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            {!workersMode && (
              <>
                <Input label="Salario/hora (COP)" type="number" value={hourlyWage} onChange={(e) => setHourlyWage(+e.target.value)} />
                <Input label="N° trabajadores" type="number" value={numberOfWorkers} onChange={(e) => setNumberOfWorkers(+e.target.value)} />
                <Input label="Horas/día" type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(+e.target.value)} />
                <Input label="N° turnos" type="number" value={numberOfShifts} onChange={(e) => setNumberOfShifts(+e.target.value)} />
              </>
            )}
            <Input label="Clientes/mes" type="number" value={monthlyCustomers} onChange={(e) => setMonthlyCustomers(+e.target.value)} />
            <Input label="Productos/cliente" type="number" step="0.1" value={productsPerCustomer} onChange={(e) => setProductsPerCustomer(+e.target.value)} />
          </div>
          <div className="bg-gray-100 rounded-lg p-3 space-y-1 text-sm font-body">
            <div className="flex justify-between text-island-dark/70">
              <span>Costo hora total</span>
              <span className="font-medium text-island-dark">{formatCOP(mod.totalHourlyWage)}</span>
            </div>
            <div className="flex justify-between text-island-dark/70">
              <span>Mano de obra diaria</span>
              <span className="font-medium text-island-dark">{formatCOP(mod.dailyLabor)}</span>
            </div>
            <div className="flex justify-between text-island-dark/70">
              <span>Mano de obra mensual</span>
              <span className="font-medium text-island-dark">{formatCOP(mod.monthlyLabor)}</span>
            </div>
            <div className="flex justify-between border-t border-island-blue/20 pt-1 mt-1">
              <span className="font-semibold text-island-dark">MOD por ítem</span>
              <span className="font-bold text-island-dark">{formatCOPDecimal(mod.laborPerItem)}</span>
            </div>
          </div>
        </div>

        {/* GIF */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-island-blue/20 pb-2">
            <h2 className="font-body text-lg font-semibold text-island-dark">GIF — Gastos Indirectos</h2>
            <Button variant="ghost" size="sm" onClick={addOverhead}>+ Agregar</Button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {overheadItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  className="input-base flex-1 text-sm"
                  placeholder="Concepto"
                  value={item.concept}
                  onChange={(e) => updateOverhead(idx, 'concept', e.target.value)}
                />
                <input
                  className="input-base w-32 text-sm"
                  type="number"
                  min="0"
                  value={item.monthlyCost}
                  onChange={(e) => updateOverhead(idx, 'monthlyCost', +e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeOverhead(idx)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-error-ink hover:bg-error-tint"
                  aria-label="Eliminar gasto fijo"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-gray-100 rounded-lg p-3 space-y-1 text-sm font-body">
            <div className="flex justify-between text-island-dark/70">
              <span>Total mensual GIF</span>
              <span className="font-medium text-island-dark">{formatCOP(gif.totalMonthlyOverhead)}</span>
            </div>
            <div className="flex justify-between text-island-dark/70">
              <span>GIF diario</span>
              <span className="font-medium text-island-dark">{formatCOPDecimal(gif.dailyOverhead)}</span>
            </div>
            <div className="flex justify-between border-t border-island-blue/20 pt-1 mt-1">
              <span className="font-semibold text-island-dark">GIF por ítem</span>
              <span className="font-bold text-island-dark">{formatCOPDecimal(gif.overheadPerItem)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Datos del mes anterior */}
      {suggestion && (
        <div className="card space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-island-blue/20 pb-2">
            <div>
              <h2 className="font-body text-lg font-semibold text-island-dark">Datos del mes anterior ({suggestion.label})</h2>
              <p className="text-xs font-body text-island-dark/70">
                Calculados con tus ventas y tus gastos GIF registrados. No cambian nada hasta que los uses y guardes.
                {params?.baselineMonth ? ` Última vez aplicados: ${params.baselineMonth}.` : ''}
              </p>
            </div>
            <Button variant="secondary" onClick={useSuggestion} disabled={!suggestion.customers.available && suggestion.overhead.totalPaid === 0}>
              Usar estos datos
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 text-sm font-body">
            <div className="space-y-2">
              <h3 className="font-semibold text-island-dark">Clientes y productos</h3>
              {suggestion.customers.available ? (
                <table className="w-full">
                  <thead><tr className="text-xs text-island-dark/70"><th className="text-left font-medium"></th><th className="text-right font-medium">Actual</th><th className="text-right font-medium">Mes anterior</th></tr></thead>
                  <tbody>
                    <tr><td>Clientes/mes</td><td className="text-right tabular-nums">{suggestion.customers.current.monthlyCustomers.toLocaleString('es-CO')}</td><td className="text-right tabular-nums font-semibold">{suggestion.customers.monthlyCustomers.toLocaleString('es-CO')}</td></tr>
                    <tr><td>Productos/cliente</td><td className="text-right tabular-nums">{suggestion.customers.current.productsPerCustomer.toLocaleString('es-CO')}</td><td className="text-right tabular-nums font-semibold">{suggestion.customers.productsPerCustomer.toLocaleString('es-CO')}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-island-dark/70">No hubo ventas facturadas el mes anterior: se conservan los valores actuales.</p>
              )}
              <p className="text-xs text-island-dark/60">
                Un cliente = un pedido facturado ({suggestion.customers.orders} pedidos, {suggestion.customers.units} unidades; sin cortesías).
              </p>
              <div className="rounded-lg bg-gray-100 p-3 text-xs space-y-1">
                <div className="flex justify-between"><span>MOD planificada (mes)</span><span className="font-medium">{formatCOP(suggestion.labor.plannedMonthly)}</span></div>
                <div className="flex justify-between"><span>Pagado en mano de obra</span><span className="font-medium">{formatCOP(suggestion.labor.paidInMonth)}</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-island-dark">Gastos indirectos (GIF) pagados</h3>
              {suggestion.overhead.items.length === 0 ? (
                <p className="text-island-dark/70">Aún no hay conceptos de GIF.</p>
              ) : (
                <table className="w-full">
                  <thead><tr className="text-xs text-island-dark/70"><th className="text-left font-medium">Concepto</th><th className="text-right font-medium">Actual</th><th className="text-right font-medium">Pagado</th></tr></thead>
                  <tbody>
                    {suggestion.overhead.items.map((item) => (
                      <tr key={item.concept}>
                        <td>
                          {item.concept}
                          {item.status === 'NUEVO' && <span className="ml-1 text-xs text-island-blue">(nuevo)</span>}
                        </td>
                        <td className="text-right tabular-nums">{formatCOP(item.current)}</td>
                        <td className="text-right tabular-nums font-semibold">
                          {item.status === 'SIN_PAGOS' ? <span className="text-xs font-normal text-island-dark/60" title="Sin pagos el mes anterior: se conserva el valor actual">sin pagos</span> : formatCOP(item.paid)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="text-xs text-island-dark/60">Los conceptos sin pagos el mes anterior conservan su valor actual.</p>
            </div>
          </div>
        </div>
      )}

      {/* IVA */}
      <div className="card max-w-xs">
        <h2 className="font-body text-base font-semibold text-island-dark mb-3">Configuración IVA</h2>
        <div className="flex items-center gap-3">
          <Input
            label="Tasa IVA"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={ivaRate}
            onChange={(e) => setIvaRate(+e.target.value)}
            className="w-32"
          />
          <span className="text-island-dark/70 font-body text-sm mt-5">{(ivaRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      {params && (
        <div className="text-xs text-island-dark/70 font-body">
          Última actualización: {new Date(params.updatedAt).toLocaleString('es-CO')}
        </div>
      )}

      <CascadeWarningModal
        isOpen={cascadeModal}
        affectedPacks={0}
        affectedRecipes={cascadeCount}
        loading={saving}
        onConfirm={confirmSave}
        onCancel={() => setCascadeModal(false)}
      />
    </div>
  );
}
