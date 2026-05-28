import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { reportsApi, SalesReport, ProductsReport } from '../../api/reports';
import { formatCOP } from '../../utils/formatCurrency';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageLoader } from '../../components/ui/Spinner';
import { exportToCsv } from '../../utils/exportCsv';
import { todayLocal } from '../../utils/formatDate';

const COLORS = [
  'var(--color-terracotta)',
  'var(--color-espresso)',
  'var(--color-olive)',
  'var(--color-lagoon)',
  'var(--color-maize)',
];

const categoryLabels: Record<string, string> = {
  coffee: 'Café',
  food: 'Comida',
  beverage: 'Bebida',
  experience: 'Experiencia',
  'work-cafe': 'Work Café',
  other: 'Otro',
  null: 'Sin categoría',
  undefined: 'Sin categoría',
};

export function ReportsPage() {
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [products, setProducts] = useState<ProductsReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateTo, setDateTo] = useState(todayLocal);
  const toast = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes] = await Promise.all([
        reportsApi.getSales({ dateFrom, dateTo }),
        reportsApi.getProducts({ dateFrom, dateTo }),
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
    } catch {
      toast.error('Error al generar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const exportSales = () => {
    if (!sales) return;
    exportToCsv('reporte-ventas', sales.dailyRevenue.map((r) => ({ Fecha: r.date, Ventas: r.revenue })));
    toast.success('CSV exportado');
  };

  const exportProducts = () => {
    if (!products) return;
    exportToCsv('reporte-productos', products.topProducts.map((p) => ({
      Producto: p.productName,
      Cantidad: p.totalQuantity,
      'Ingresos (COP)': p.totalRevenue,
    })));
    toast.success('CSV exportado');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-body text-2xl font-bold text-espresso">Reportes de Ventas</h1>
      </div>

      {/* Date Range */}
      <div className="card flex flex-col sm:flex-row items-end gap-4">
        <Input label="Desde" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="sm:w-44" />
        <Input label="Hasta" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="sm:w-44" />
        <Button onClick={fetchReports} loading={loading}>Generar reporte</Button>
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={exportSales}>Exportar ventas CSV</Button>
          <Button variant="secondary" size="sm" onClick={exportProducts}>Exportar productos CSV</Button>
        </div>
      </div>

      {loading ? <PageLoader /> : sales && products ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Ingresos totales" value={formatCOP(sales.totalRevenue)} />
            <StatCard label="Total pedidos" value={String(sales.totalOrders)} />
            <StatCard label="Ventas efectivo" value={formatCOP(sales.revenueByMethod.cash)} />
            <StatCard label="Ventas tarjeta" value={formatCOP(sales.revenueByMethod.card)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Line Chart */}
            <div className="card">
              <h2 className="font-body text-base font-semibold text-espresso mb-4">Ventas por día</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sales.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: 'DM Sans' }} />
                  <Tooltip formatter={(v: number) => formatCOP(v)} contentStyle={{ borderRadius: 8 }} />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-terracotta)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Category Pie */}
            <div className="card">
              <h2 className="font-body text-base font-semibold text-espresso mb-4">Ingresos por categoría</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={products.categoryRevenue}
                    dataKey="revenue"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ _id, percent }) =>
                      `${categoryLabels[_id] || _id}: ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {products.categoryRevenue.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCOP(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Products Bar Chart */}
            <div className="card lg:col-span-2">
              <h2 className="font-body text-base font-semibold text-espresso mb-4">Top 10 productos más vendidos</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={products.topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" />
                  <XAxis type="number" tickFormatter={(v) => String(v)} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="productName" tick={{ fontSize: 10, fontFamily: 'DM Sans' }} width={130} />
                  <Tooltip formatter={(v: number) => [v, 'Unidades']} contentStyle={{ borderRadius: 8 }} />
                  <Bar dataKey="totalQuantity" fill="var(--color-espresso)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="card">
            <h2 className="font-body text-base font-semibold text-espresso mb-4">Ingresos por método de pago</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Efectivo', value: sales.revenueByMethod.cash, color: 'bg-success-tint text-success-ink' },
                { label: 'Tarjeta', value: sales.revenueByMethod.card, color: 'bg-info-tint text-info-ink' },
                { label: 'Transferencia', value: sales.revenueByMethod.transfer, color: 'bg-surface-tint text-espresso' },
              ].map((m) => (
                <div key={m.label} className={`rounded-xl p-4 text-center ${m.color}`}>
                  <p className="text-xs font-body uppercase tracking-wide mb-1">{m.label}</p>
                  <p className="font-body font-bold text-lg">{formatCOP(m.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-stone font-body uppercase tracking-wide mb-1">{label}</p>
      <p className="font-body font-bold text-xl text-espresso">{value}</p>
    </div>
  );
}
