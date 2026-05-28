import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { laborOverheadApi } from '../../../api/costs';
import { LaborAndOverheadParams } from '../../../types';
import { formatCOPDecimal, formatCOP } from '../../../utils/formatCurrency';
import { calcMODResult, calcGIFResult } from '../../../utils/costFormulas';
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
  }, []);

  const mod = calcMODResult({ hourlyWage, numberOfWorkers, hoursPerDay, numberOfShifts, monthlyCustomers, productsPerCustomer });
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
      });
      toast.success('Parámetros actualizados y recetas recalculadas');
      setCascadeModal(false);
      const res = await laborOverheadApi.get();
      setParams(res.data);
    } catch {
      toast.error('Error al guardar parámetros');
    } finally {
      setSaving(false);
    }
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
          <h1 className="font-body text-2xl font-bold text-espresso">Parámetros MOD / GIF</h1>
          <p className="text-stone font-body text-sm">Mano de obra directa y gastos indirectos de fabricación</p>
        </div>
        <Button onClick={handleSaveClick}>Guardar y recalcular</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* MOD */}
        <div className="card space-y-4">
          <h2 className="font-body text-lg font-semibold text-espresso border-b border-rule pb-2">
            MOD — Mano de Obra Directa
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Salario/hora (COP)" type="number" value={hourlyWage} onChange={(e) => setHourlyWage(+e.target.value)} />
            <Input label="N° trabajadores" type="number" value={numberOfWorkers} onChange={(e) => setNumberOfWorkers(+e.target.value)} />
            <Input label="Horas/día" type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(+e.target.value)} />
            <Input label="N° turnos" type="number" value={numberOfShifts} onChange={(e) => setNumberOfShifts(+e.target.value)} />
            <Input label="Clientes/mes" type="number" value={monthlyCustomers} onChange={(e) => setMonthlyCustomers(+e.target.value)} />
            <Input label="Productos/cliente" type="number" step="0.1" value={productsPerCustomer} onChange={(e) => setProductsPerCustomer(+e.target.value)} />
          </div>
          <div className="bg-surface-tint rounded-lg p-3 space-y-1 text-sm font-body">
            <div className="flex justify-between text-stone">
              <span>Costo hora total</span>
              <span className="font-medium text-ink">{formatCOP(mod.totalHourlyWage)}</span>
            </div>
            <div className="flex justify-between text-stone">
              <span>Mano de obra diaria</span>
              <span className="font-medium text-ink">{formatCOP(mod.dailyLabor)}</span>
            </div>
            <div className="flex justify-between text-stone">
              <span>Mano de obra mensual</span>
              <span className="font-medium text-ink">{formatCOP(mod.monthlyLabor)}</span>
            </div>
            <div className="flex justify-between border-t border-rule pt-1 mt-1">
              <span className="font-semibold text-espresso">MOD por ítem</span>
              <span className="font-bold text-espresso">{formatCOPDecimal(mod.laborPerItem)}</span>
            </div>
          </div>
        </div>

        {/* GIF */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between border-b border-rule pb-2">
            <h2 className="font-body text-lg font-semibold text-espresso">GIF — Gastos Indirectos</h2>
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
          <div className="bg-surface-tint rounded-lg p-3 space-y-1 text-sm font-body">
            <div className="flex justify-between text-stone">
              <span>Total mensual GIF</span>
              <span className="font-medium text-ink">{formatCOP(gif.totalMonthlyOverhead)}</span>
            </div>
            <div className="flex justify-between text-stone">
              <span>GIF diario</span>
              <span className="font-medium text-ink">{formatCOPDecimal(gif.dailyOverhead)}</span>
            </div>
            <div className="flex justify-between border-t border-rule pt-1 mt-1">
              <span className="font-semibold text-espresso">GIF por ítem</span>
              <span className="font-bold text-espresso">{formatCOPDecimal(gif.overheadPerItem)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* IVA */}
      <div className="card max-w-xs">
        <h2 className="font-body text-base font-semibold text-espresso mb-3">Configuración IVA</h2>
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
          <span className="text-stone font-body text-sm mt-5">{(ivaRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      {params && (
        <div className="text-xs text-stone font-body">
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
