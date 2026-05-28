import { Eye, ReceiptText, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '../../api/orders';
import { tablesApi } from '../../api/tables';
import { CafeTable, Order, OrderItem, PaymentMethod } from '../../types';
import { formatCOP, formatCOPDecimal } from '../../utils/formatCurrency';
import { formatShortDate, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { CancelOrderModal, OrderDetailDrawer } from '../../components/orders/OrderWorkflow';

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

const statusOptions = [
  { value: 'open', label: 'Abiertos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'in-progress', label: 'En proceso' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'billed', label: 'Facturado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'all', label: 'Todos' },
];

function isOpenOrder(order: Order) {
  return !['billed', 'cancelled'].includes(order.status);
}

function lineTax(item: OrderItem) {
  if (item.taxAmount !== undefined) return item.taxAmount * item.quantity;
  const taxRate = item.taxRate ?? 0;
  if (taxRate <= 0) return 0;
  const lineTotal = item.unitPrice * item.quantity;
  return lineTotal - lineTotal / (1 + taxRate);
}

function taxLabel(item: OrderItem) {
  if (!item.taxRate || item.taxRate <= 0) return 'Sin impuesto';
  const name = item.taxType === 'CONSUMO_8' ? 'Impoconsumo' : 'IVA';
  return `${name} (${(item.taxRate * 100).toFixed(0)}%)`;
}

function todayInput() {
  return todayLocal();
}

export function BillingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [closeOrder, setCloseOrder] = useState<Order | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [statusFilter, setStatusFilter] = useState('delivered');
  const [dateFrom, setDateFrom] = useState(todayInput());
  const [dateTo, setDateTo] = useState(todayInput());
  const toast = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (!['open', 'all'].includes(statusFilter)) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const [ordersRes, tablesRes] = await Promise.all([
        ordersApi.getAll(params),
        tablesApi.getAll(),
      ]);
      setOrders(statusFilter === 'open' ? ordersRes.data.orders.filter(isOpenOrder) : ordersRes.data.orders);
      setTables(tablesRes.data);
    } catch {
      toast.error('Error al cargar facturación');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tableName = (id?: string | CafeTable | null) =>
    !id ? 'Sin mesa / Mostrador' : typeof id === 'object' ? id.name : tables.find((table) => table._id === id)?.name || id;

  const invoiceTax = (order: Order) => order.items.reduce((sum, item) => sum + lineTax(item), 0);
  const invoiceNet = (order: Order) => order.total - invoiceTax(order);

  const handleCloseOrder = async () => {
    if (!closeOrder) return;
    try {
      await ordersApi.close(closeOrder._id, paymentMethod);
      toast.success('Pedido facturado');
      setCloseOrder(null);
      fetchData();
    } catch {
      toast.error('Error al facturar pedido');
    }
  };

  const handleCancelOrder = async (reason: string, reasonDetail: string) => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await ordersApi.cancel(cancelTarget._id, { reason, reasonDetail });
      toast.success('Pedido eliminado');
      setCancelTarget(null);
      fetchData();
    } catch {
      toast.error('Error al eliminar pedido');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Facturación</h1>
          <p className="text-stone font-body text-sm">Pedidos creados y factura básica por mesa.</p>
        </div>
        <div className="card px-4 py-3 flex items-center gap-3">
          <ReceiptText size={20} className="text-terracotta" />
          <div>
            <p className="text-xs font-body text-stone">Pedidos visibles</p>
            <p className="font-body font-semibold text-espresso">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="card grid gap-3 md:grid-cols-4">
        <Select
          label="Estado"
          options={statusOptions}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        />
        <Input
          label="Desde"
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <Input
          label="Hasta"
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
        />
        <div className="flex items-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setStatusFilter('open');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="bg-surface-tint border-b border-rule">
              <tr>
                <th className="text-left px-4 py-3 text-stone font-medium">Mesa</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Productos</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Base</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Impuesto</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Total</th>
                <th className="text-center px-4 py-3 text-stone font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-stone font-medium">Fecha</th>
                <th className="text-right px-4 py-3 text-stone font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-surface-tint transition-colors">
                  <td className="px-4 py-3 font-medium text-espresso">{tableName(order.tableId)}</td>
                  <td className="px-4 py-3 text-stone">{order.items.length} producto(s)</td>
                  <td className="px-4 py-3 text-right text-stone">{formatCOPDecimal(invoiceNet(order))}</td>
                  <td className="px-4 py-3 text-right text-stone">{formatCOPDecimal(invoiceTax(order))}</td>
                  <td className="px-4 py-3 text-right font-semibold text-ink">{formatCOP(order.total)}</td>
                  <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-stone">{formatShortDate(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>Factura</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDetailOrder(order)}>
                        <Eye size={14} />
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="secondary" size="sm" onClick={() => setCloseOrder(order)}>Facturar</Button>
                      )}
                      {!['billed', 'cancelled'].includes(order.status) && (
                        <Button variant="danger" size="sm" onClick={() => setCancelTarget(order)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-stone">No hay pedidos para facturar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Factura básica" size="lg">
          <div className="space-y-4">
            <div className="rounded-xl bg-espresso text-cream px-5 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-xl font-semibold">La Isla Café Picnic</p>
                <p className="text-sm opacity-75 font-body">Factura de pedido</p>
              </div>
              <div className="text-right text-sm font-body opacity-80">
                <p>{tableName(selectedOrder.tableId)}</p>
                <p>{formatShortDate(selectedOrder.createdAt)}</p>
              </div>
            </div>

            <div className="border border-rule rounded-xl overflow-hidden">
              <table className="w-full text-sm font-body">
                <thead className="bg-surface-tint border-b border-rule">
                  <tr>
                    <th className="text-left px-4 py-2 text-stone font-medium">Producto</th>
                    <th className="text-center px-4 py-2 text-stone font-medium">Cant.</th>
                    <th className="text-right px-4 py-2 text-stone font-medium">Precio</th>
                    <th className="text-right px-4 py-2 text-stone font-medium">Impuesto</th>
                    <th className="text-right px-4 py-2 text-stone font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={`${item.productId}-${item.variantSize ?? ''}-${idx}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{item.productName}</p>
                        <p className="text-xs text-stone">{taxLabel(item)}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-stone">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-stone">{formatCOP(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-stone">{formatCOPDecimal(lineTax(item))}</td>
                      <td className="px-4 py-3 text-right font-medium text-ink">{formatCOP(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full sm:w-80 rounded-xl bg-surface-tint p-4 space-y-2 font-body text-sm">
              <div className="flex justify-between text-stone"><span>Base sin impuesto</span><span>{formatCOPDecimal(invoiceNet(selectedOrder))}</span></div>
              <div className="flex justify-between text-stone"><span>Impuesto incluido</span><span>{formatCOPDecimal(invoiceTax(selectedOrder))}</span></div>
              <div className="flex justify-between text-lg font-semibold text-espresso border-t border-rule pt-2"><span>Total</span><span>{formatCOP(selectedOrder.total)}</span></div>
            </div>
          </div>
        </Modal>
      )}

      {closeOrder && (
        <Modal isOpen={!!closeOrder} onClose={() => setCloseOrder(null)} title="Facturar pedido">
          <div className="space-y-4">
            <p className="text-sm text-stone font-body">
              Selecciona el método de pago para cerrar el pedido de {tableName(closeOrder.tableId)}.
            </p>
            <Select
              label="Método de pago"
              options={paymentOptions}
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCloseOrder(null)}>Cancelar</Button>
              <Button onClick={handleCloseOrder}>Confirmar factura</Button>
            </div>
          </div>
        </Modal>
      )}
      <OrderDetailDrawer order={detailOrder} onClose={() => setDetailOrder(null)} />
      <CancelOrderModal
        order={cancelTarget}
        onCancel={() => setCancelTarget(null)}
        onConfirm={handleCancelOrder}
        loading={cancelLoading}
      />
    </div>
  );
}
