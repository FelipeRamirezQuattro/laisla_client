import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat, FlaskConical, AlertTriangle, SlidersHorizontal,
  TrendingUp, PackageOpen, LineChart, Archive,
  type LucideIcon,
} from 'lucide-react';
import { recipesApi, actualResultsApi, laborOverheadApi } from '../../../api/costs';
import { insumosInvApi, stockInvApi } from '../../../api/inventario';
import { formatCOP, formatCOPDecimal, formatPct } from '../../../utils/formatCurrency';
import { PageLoader } from '../../../components/ui/Spinner';
import { useToast } from '../../../hooks/useToast';

interface Summary {
  totalRecipes: number;
  totalRawMaterials: number;
  alertsCount: number;
  laborPerItem: number;
  overheadPerItem: number;
  lastMonthResult: { month: number; sales: number; netProfit: number; netProfitPct: number } | null;
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function DashboardCostosPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const year = currentYear;
    Promise.all([
      recipesApi.getAll(),
      insumosInvApi.getAgrupados(),
      stockInvApi.getCurrent(),
      laborOverheadApi.get(),
      actualResultsApi.getYear(year).catch(() => ({ data: [] })),
    ]).then(([recipesRes, insumosRes, stockRes, paramsRes, resultsRes]) => {
      const results = resultsRes.data as import('../../../types').ActualResult[];
      const lastResult = results.length > 0 ? results[results.length - 1] : null;
      const insumos = insumosRes.data.flatMap((grupo) => grupo.insumos);
      const pendingCount = stockRes.data.reduce((sum, item) => sum + item.pendingCount, 0);
      setSummary({
        totalRecipes: (recipesRes.data as import('../../../types').Recipe[]).length,
        totalRawMaterials: insumos.length,
        alertsCount: pendingCount,
        laborPerItem: paramsRes.data.laborPerItem,
        overheadPerItem: paramsRes.data.overheadPerItem,
        lastMonthResult: lastResult
          ? { month: lastResult.month, sales: lastResult.totalSales, netProfit: lastResult.netProfit, netProfitPct: lastResult.netProfitPct }
          : null,
      });
    }).catch(() => {
      toast.error('Error al cargar dashboard');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-espresso">Dashboard de Costos</h1>
        <p className="text-stone font-body text-sm">Resumen del módulo de costos y finanzas</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Recetas activas"
          value={summary.totalRecipes.toString()}
          href="/admin/inventario/recetas"
          Icon={ChefHat}
        />
        <KpiCard
          label="Insumos catalogados"
          value={summary.totalRawMaterials.toString()}
          href="/admin/inventario/catalogo"
          Icon={FlaskConical}
        />
        <KpiCard
          label="Alertas de stock"
          value={summary.alertsCount.toString()}
          href="/admin/inventario/stock"
          Icon={AlertTriangle}
          highlight={summary.alertsCount > 0}
        />
        <KpiCard
          label="MOD + GIF / ítem"
          value={formatCOPDecimal(summary.laborPerItem + summary.overheadPerItem)}
          href="/admin/costos/parametros"
          Icon={SlidersHorizontal}
        />
      </div>

      {/* Last month result */}
      {summary.lastMonthResult && (
        <div className="card">
          <h2 className="font-body text-base font-semibold text-espresso mb-4">
            Resultado más reciente — {MONTHS[summary.lastMonthResult.month - 1]} {currentYear}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-stone font-body">Ventas</p>
              <p className="text-xl font-body font-bold text-espresso">{formatCOP(summary.lastMonthResult.sales)}</p>
            </div>
            <div>
              <p className="text-xs text-stone font-body">Utilidad neta</p>
              <p className={`text-xl font-body font-bold ${summary.lastMonthResult.netProfit >= 0 ? 'text-success' : 'text-error-ink'}`}>
                {formatCOP(summary.lastMonthResult.netProfit)}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone font-body">Margen neto</p>
              <p className={`text-xl font-body font-bold ${summary.lastMonthResult.netProfitPct >= 0 ? 'text-success' : 'text-error-ink'}`}>
                {formatPct(summary.lastMonthResult.netProfitPct)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to={`/admin/costos/resultados/${currentYear}`} className="text-sm text-terracotta hover:underline font-body">
              Ver resultados completos
            </Link>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickLink href="/admin/inventario/catalogo" Icon={FlaskConical} title="Catálogo de Insumos" desc="Gestionar inventario, categorías, precios y proveedores" />
        <QuickLink href="/admin/costos/parametros" Icon={SlidersHorizontal} title="Parámetros MOD/GIF" desc="Configurar mano de obra y gastos indirectos" />
        <QuickLink href="/admin/inventario/recetas" Icon={ChefHat} title="Recetas" desc="Editor de recetas y análisis de costos" />
        <QuickLink href="/admin/inventario/packs-desechables" Icon={PackageOpen} title="Packs Desechables" desc="Vasos, tapas y empaque por receta" />
        <QuickLink href={`/admin/costos/proyecciones/${currentYear}`} Icon={LineChart} title="Proyecciones" desc={`Plan financiero ${currentYear}`} />
        <QuickLink href="/admin/inventario/stock" Icon={Archive} title="Inventario" desc="Control de stock y movimientos" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, href, Icon, highlight }: {
  label: string; value: string; href: string; Icon: LucideIcon; highlight?: boolean;
}) {
  return (
    <Link to={href} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-stone font-body">{label}</p>
          <p className={`text-2xl font-body font-bold mt-1 ${highlight ? 'text-error-ink' : 'text-espresso'}`}>{value}</p>
        </div>
        <Icon size={22} strokeWidth={1.5} className={highlight ? 'text-error-ink' : 'text-stone'} />
      </div>
    </Link>
  );
}

function QuickLink({ href, Icon, title, desc }: { href: string; Icon: LucideIcon; title: string; desc: string }) {
  return (
    <Link to={href} className="card hover:shadow-md transition-shadow flex items-center gap-4">
      <Icon size={26} strokeWidth={1.5} className="text-terracotta shrink-0" />
      <div>
        <p className="font-medium text-ink font-body">{title}</p>
        <p className="text-xs text-stone font-body">{desc}</p>
      </div>
    </Link>
  );
}
