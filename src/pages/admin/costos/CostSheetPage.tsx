import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, List, Printer } from 'lucide-react';
import { recipesApi } from '../../../api/costs';
import { Recipe, LaborAndOverheadParams } from '../../../types';
import { formatCOPDecimal, formatPct, formatCOP } from '../../../utils/formatCurrency';
import { formatMeasurementUnit } from '../../../utils/measurementUnits';
import { PageLoader } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function CostSheetPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [params, setParams] = useState<LaborAndOverheadParams | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    recipesApi.getCostSheet(id).then((res) => {
      setRecipe(res.data.recipe);
      setParams(res.data.params);
    }).catch(() => {
      toast.error('Error al cargar ficha técnica');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;
  if (!recipe || !params) return null;

  const now = new Date();
  const laborCostPerMinute = (params.hourlyWage * params.numberOfWorkers) / 60;

  const handlePrint = () => {
    window.requestAnimationFrame(() => window.print());
  };

  return (
    <div className="cost-sheet-page max-w-4xl mx-auto">
      {/* Screen-only controls */}
      <div className="print:hidden flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/inventario/recetas">
            <Button variant="secondary" icon={<List size={15} />}>Volver al listado</Button>
          </Link>
          <Link to={`/admin/inventario/recetas/${id}`}>
            <Button variant="secondary" icon={<ArrowLeft size={15} />}>Volver al editor</Button>
          </Link>
        </div>
        <Button type="button" onClick={handlePrint} icon={<Printer size={15} />}>Imprimir ficha</Button>
      </div>

      {/* Printable content */}
      <div id="cost-sheet-print-area" className="bg-white print:shadow-none shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-espresso text-cream px-8 py-6 print:bg-espresso">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-body text-2xl font-bold">{recipe.name}</h1>
              <p className="font-body text-sm opacity-70 mt-1">Ficha Técnica de Costos — La Isla Café Picnic</p>
            </div>
            <div className="text-right text-sm font-body opacity-70">
              <p>{now.getDate()} {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</p>
              <p>{recipe.category.replace(/_/g, ' ')}</p>
              {recipe.isSubRecipe && <p className="text-terracotta font-medium opacity-100">Sub-receta</p>}
            </div>
          </div>
        </div>

        {/* Params summary */}
        <div className="px-8 py-4 bg-surface-tint border-b border-rule grid grid-cols-5 gap-4 text-sm font-body">
          <Kpi label="MOD/ítem" value={formatCOPDecimal(params.laborPerItem)} />
          <Kpi label="MOD/min" value={formatCOPDecimal(laborCostPerMinute)} />
          <Kpi label="GIF/ítem" value={formatCOPDecimal(params.overheadPerItem)} />
          <Kpi label="Impuesto base" value={`${(params.ivaRate * 100).toFixed(0)}%`} />
          <Kpi label="Clientes/mes" value={params.monthlyCustomers.toString()} />
        </div>

        {/* Variants */}
        {recipe.variants.map((v) => (
          <div key={v.size} className="px-8 py-6 border-b border-rule last:border-0">
            <h2 className="font-body text-lg font-semibold text-espresso mb-4">
              Variante {v.size}
              {v.salePrice > 0 && (
                <span className="ml-3 text-sm font-body text-stone font-normal">
                  {v.taxIncluded ?? true ? 'Precio final' : 'Precio base'}: {formatCOP(v.salePrice)}
                </span>
              )}
            </h2>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Ingredients */}
              <div>
                <p className="text-xs font-body text-stone uppercase tracking-wide mb-2">Ingredientes</p>
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-rule">
                      <th className="text-left py-1 text-stone font-medium">Ingrediente</th>
                      <th className="text-right py-1 text-stone font-medium">Cant.</th>
                      <th className="text-center py-1 text-stone font-medium">Tiempo</th>
                      <th className="text-right py-1 text-stone font-medium">Costo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.ingredients.map((ing, idx) => (
                      <tr key={idx} className="border-b border-rule border-opacity-50">
                        <td className="py-1.5 text-ink">{ing.name ?? ing.ingredientRefId}</td>
                        <td className="py-1.5 text-right text-stone">{ing.quantity} {formatMeasurementUnit(ing.unit)}</td>
                        <td className="py-1.5 text-center text-stone">
                          {ing.ingredientType === 'recipe' ? (ing.includePreparationTime ? 'Suma' : 'No suma') : '-'}
                        </td>
                        <td className="py-1.5 text-right text-ink">{formatCOPDecimal(ing.cost)}</td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td colSpan={3} className="pt-2 text-stone text-xs">Mat. directos</td>
                      <td className="pt-2 text-right text-espresso">{formatCOPDecimal(v.directMaterialCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-body text-stone uppercase tracking-wide mb-2">
                  Estructura de costos · {v.costingMethod === 'full-cost' ? 'MOD + GIF' : 'Food cost'}
                </p>
                <CostRow label="Materiales directos" value={formatCOPDecimal(v.directMaterialCost)} />
                <CostRow label="Tiempo preparación" value={`${(v.totalPreparationTimeMinutes ?? recipe.preparationTimeMinutes ?? 0).toFixed(1)} min`} />
                {v.costingMethod === 'full-cost' ? (
                  <>
                    <CostRow label="Mano de obra (MOD)" value={formatCOPDecimal(v.laborCost)} />
                    <CostRow label="Gastos indirectos (GIF)" value={formatCOPDecimal(v.overheadCost)} />
                  </>
                ) : (
                  <CostRow label="Food cost objetivo" value={formatPct(v.targetFoodCostPct ?? 0.3)} />
                )}
                <div className="border-t border-espresso pt-2 mt-2">
                  <CostRow label={v.costingMethod === 'full-cost' ? 'Costo total' : 'Costo base'} value={formatCOPDecimal(v.totalCost)} bold />
                </div>
                <div className="border-t border-rule pt-2 mt-2 space-y-2">
                  <CostRow label={v.taxIncluded ?? true ? 'Precio final ingresado' : 'Precio base ingresado'} value={formatCOP(v.salePrice)} />
                  {(v.taxRate ?? 0) > 0 && (
                    <>
                      <CostRow label="Venta neta sin impuesto" value={formatCOPDecimal(v.salePriceWithoutTax)} />
                      <CostRow
                        label={`${v.taxType === 'CONSUMO_8' ? 'Impoconsumo' : 'IVA'} (${((v.taxRate ?? 0) * 100).toFixed(0)}%)`}
                        value={formatCOPDecimal(v.taxAmount ?? 0)}
                      />
                      <CostRow label="Precio final al cliente" value={formatCOPDecimal(v.finalPrice ?? v.salePrice)} />
                    </>
                  )}
                  <CostRow label="Utilidad neta" value={formatCOPDecimal(v.profitAmount)} />
                  <CostRow label={v.costingMethod === 'full-cost' ? 'Margen sobre venta neta' : 'Margen bruto sobre venta neta'} value={formatPct(v.grossMarginPct)} />
                  <CostRow label="Markup sobre costo" value={formatPct(v.profitPct)} />
                  {v.suggestedPrice > 0 && (
                    <CostRow
                      label={
                        v.costingMethod === 'full-cost'
                          ? `Precio sugerido final (${((v.targetMargin ?? 0) * 100).toFixed(0)}% margen)`
                          : `Precio sugerido final (${((v.targetFoodCostPct ?? 0.3) * 100).toFixed(0)}% food cost)`
                      }
                      value={formatCOPDecimal(v.suggestedPrice)}
                      bold
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div className="px-8 py-4 bg-surface-tint text-xs text-stone font-body flex justify-between">
          <span>La Isla Café Picnic — Ibagué, Colombia</span>
          <span>Documento interno — No distribuir</span>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body,
          #root {
            background: white !important;
            min-height: auto !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print\\:hidden { display: none !important; }

          #cost-sheet-print-area,
          #cost-sheet-print-area * {
            visibility: visible !important;
          }

          #cost-sheet-print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
          }

          .cost-sheet-page {
            max-width: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-stone text-xs">{label}</p>
      <p className="font-medium text-espresso">{value}</p>
    </div>
  );
}

function CostRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between text-sm font-body ${bold ? 'font-semibold text-espresso' : 'text-stone'}`}>
      <span>{label}</span>
      <span className={bold ? '' : 'text-ink'}>{value}</span>
    </div>
  );
}
