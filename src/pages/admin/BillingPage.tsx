import { AlertTriangle, Eye, Mail, Printer as PrinterIcon, ReceiptText, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ordersApi } from '../../api/orders';
import { tablesApi } from '../../api/tables';
import { useShiftStore } from '../../store/shiftStore';
import { CafeTable, Client, FiscalOrderTicket, Order, OrderItem, PaymentMethod, PrintJob } from '../../types';
import { formatCOP, formatCOPDecimal } from '../../utils/formatCurrency';
import { formatShortDate, todayLocal } from '../../utils/formatDate';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { FiscalDocumentStatusBadge, OrderStatusBadge, PrintJobStatusBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { CancelOrderModal, OrderDetailDrawer } from '../../components/orders/OrderWorkflow';
import { FiscalCustomerSelect } from '../../components/fiscal/FiscalCustomerSelect';
import { fiscalApi } from '../../api/fiscal';
import { printJobsApi } from '../../api/printing';

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'nequi', label: 'Nequi / Daviplata' },
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
  const [closeClientId, setCloseClientId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [statusFilter, setStatusFilter] = useState('delivered');
  const [dateFrom, setDateFrom] = useState(todayInput());
  const [dateTo, setDateTo] = useState(todayInput());
  const [fiscalTickets, setFiscalTickets] = useState<Record<string, FiscalOrderTicket>>({});
  const [printJobs, setPrintJobs] = useState<Record<string, PrintJob>>({});
  const [reprintingId, setReprintingId] = useState<string | null>(null);
  const [emailTarget, setEmailTarget] = useState<Order | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const toast = useToast();
  const { openShift } = useShiftStore();

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

  useEffect(() => {
    const billedIds = orders.filter((order) => order.status === 'billed').map((order) => order._id);
    if (billedIds.length === 0) { setFiscalTickets({}); return; }
    Promise.all(
      billedIds.map((id) =>
        fiscalApi
          .getOrderTicket(id)
          .then((res) => [id, res.data] as const)
          .catch(() => null)
      )
    ).then((results) => {
      const map: Record<string, FiscalOrderTicket> = {};
      for (const result of results) if (result) map[result[0]] = result[1];
      setFiscalTickets(map);
    });
  }, [orders]);

  const refreshPrintJob = useCallback(async (orderId: string) => {
    try {
      const res = await printJobsApi.getAll({ orderId, type: 'RECEIPT', limit: 1 });
      setPrintJobs((prev) => {
        const next = { ...prev };
        if (res.data.jobs[0]) next[orderId] = res.data.jobs[0];
        else delete next[orderId];
        return next;
      });
    } catch {
      // Best-effort — the print status badge just stays hidden for this order.
    }
  }, []);

  useEffect(() => {
    const billedIds = orders.filter((order) => order.status === 'billed').map((order) => order._id);
    if (billedIds.length === 0) { setPrintJobs({}); return; }
    billedIds.forEach(refreshPrintJob);
  }, [orders, refreshPrintJob]);

  const handleReprint = async (order: Order) => {
    setReprintingId(order._id);
    try {
      await printJobsApi.reprintOrder(order._id);
      toast.success('Reimpresión del ticket enviada');
      await refreshPrintJob(order._id);
    } catch {
      toast.error('Error al reimprimir el ticket');
    } finally {
      setReprintingId(null);
    }
  };

  const openSendEmail = (order: Order) => {
    setEmailTarget(order);
    setEmailAddress(typeof order.clientId === 'object' ? order.clientId?.email ?? '' : '');
  };

  const handleSendReceiptEmail = async () => {
    if (!emailTarget) return;
    setSendingEmail(true);
    try {
      await printJobsApi.sendReceiptEmail(emailTarget._id, emailAddress.trim());
      toast.success('Recibo enviado por correo');
      setEmailTarget(null);
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al enviar el recibo por correo';
      toast.error(message);
    } finally {
      setSendingEmail(false);
    }
  };

  const tableName = (id?: string | CafeTable | null) =>
    !id ? 'Sin mesa / Mostrador' : typeof id === 'object' ? id.name : tables.find((table) => table._id === id)?.name || id;

  const invoiceTax = (order: Order) => order.items.reduce((sum, item) => sum + lineTax(item), 0);
  const invoiceNet = (order: Order) => order.total - invoiceTax(order);

  const handleCloseOrder = async () => {
    if (!closeOrder) return;
    try {
      const parsedAmount = amountReceived.trim() ? Number(amountReceived) : undefined;
      await ordersApi.close(closeOrder._id, paymentMethod, closeClientId ?? undefined, parsedAmount);
      toast.success('Pedido facturado');
      setCloseOrder(null);
      setAmountReceived('');
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

  const renderStatusBadges = (order: Order) => (
    <>
      <OrderStatusBadge status={order.status} />
      {order.status === 'billed' && fiscalTickets[order._id]?.applicable && (
        <FiscalDocumentStatusBadge status={fiscalTickets[order._id].status ?? 'PENDING'} />
      )}
      {order.status === 'billed' && printJobs[order._id] && (
        <PrintJobStatusBadge status={printJobs[order._id].status} />
      )}
    </>
  );

  const renderActions = (order: Order) => (
    <>
      <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>Factura</Button>
      <Button variant="ghost" size="sm" onClick={() => setDetailOrder(order)}>
        <Eye size={14} />
      </Button>
      {order.status === 'delivered' && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setCloseOrder(order);
            setAmountReceived('');
            setCloseClientId(typeof order.clientId === 'object' ? order.clientId?._id ?? null : order.clientId ?? null);
          }}
        >
          Facturar
        </Button>
      )}
      {order.status === 'billed' && (
        <Button
          variant="ghost"
          size="sm"
          loading={reprintingId === order._id}
          onClick={() => handleReprint(order)}
        >
          <PrinterIcon size={14} /> Reimprimir
        </Button>
      )}
      {order.status === 'billed' && (
        <Button variant="ghost" size="sm" onClick={() => openSendEmail(order)}>
          <Mail size={14} /> Correo
        </Button>
      )}
      {!['billed', 'cancelled'].includes(order.status) && (
        <Button variant="danger" size="sm" onClick={() => setCancelTarget(order)}>
          <Trash2 size={14} />
        </Button>
      )}
    </>
  );

  const invoiceContent = (order: Order): ReactNode => (
    <div className="space-y-4">
      <div className="rounded-xl bg-island-dark text-white px-5 py-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-body text-xl font-semibold">La Isla Café Picnic</p>
          <p className="text-sm opacity-75 font-body">Factura de pedido</p>
        </div>
        <div className="text-right text-sm font-body opacity-80">
          <p>{tableName(order.tableId)}</p>
          <p>{formatShortDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Desktop/print: table */}
      <div className="hidden sm:block print:block border border-island-blue/20 rounded-xl overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead className="bg-gray-100 border-b border-island-blue/20">
            <tr>
              <th className="text-left px-4 py-2 text-island-dark/70 font-medium">Producto</th>
              <th className="text-center px-4 py-2 text-island-dark/70 font-medium">Cant.</th>
              <th className="text-right px-4 py-2 text-island-dark/70 font-medium">Precio</th>
              <th className="text-right px-4 py-2 text-island-dark/70 font-medium">Impuesto</th>
              <th className="text-right px-4 py-2 text-island-dark/70 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-island-blue/20">
            {order.items.map((item, idx) => (
              <tr key={`${item.productId}-${item.variantSize ?? ''}-${idx}`}>
                <td className="px-4 py-3">
                  <p className="font-medium text-island-dark">{item.productName}</p>
                  <p className="text-xs text-island-dark/70">{taxLabel(item)}</p>
                </td>
                <td className="px-4 py-3 text-center text-island-dark/70">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-island-dark/70">{formatCOP(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right text-island-dark/70">{formatCOPDecimal(lineTax(item))}</td>
                <td className="px-4 py-3 text-right font-medium text-island-dark">{formatCOP(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked item list */}
      <div className="sm:hidden print:hidden space-y-2">
        {order.items.map((item, idx) => (
          <div key={`${item.productId}-${item.variantSize ?? ''}-${idx}`} className="border border-island-blue/20 rounded-lg px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-island-dark text-sm">{item.productName}</p>
                <p className="text-xs text-island-dark/70">{taxLabel(item)}</p>
              </div>
              <p className="font-medium text-island-dark text-sm shrink-0">{formatCOP(item.quantity * item.unitPrice)}</p>
            </div>
            <p className="text-xs text-island-dark/70 mt-1">{item.quantity} x {formatCOP(item.unitPrice)}</p>
          </div>
        ))}
      </div>

      <div className="ml-auto w-full sm:w-80 rounded-xl bg-gray-100 p-4 space-y-2 font-body text-sm">
        <div className="flex justify-between text-island-dark/70"><span>Base sin impuesto</span><span>{formatCOPDecimal(invoiceNet(order))}</span></div>
        <div className="flex justify-between text-island-dark/70"><span>Impuesto incluido</span><span>{formatCOPDecimal(invoiceTax(order))}</span></div>
        <div className="flex justify-between text-lg font-semibold text-island-dark border-t border-island-blue/20 pt-2"><span>Total</span><span>{formatCOP(order.total)}</span></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-body text-2xl font-bold text-island-dark">Facturación</h1>
            <p className="text-island-dark/70 font-body text-sm">Pedidos creados y factura básica por mesa.</p>
          </div>
          <div className="card px-4 py-3 flex items-center gap-3">
            <ReceiptText size={20} className="text-island-blue" />
            <div>
              <p className="text-xs font-body text-island-dark/70">Pedidos visibles</p>
              <p className="font-body font-semibold text-island-dark">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Select
            label="Estado"
            options={statusOptions}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          />
          <div className="min-w-0">
            <Input
              label="Desde"
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </div>
          <div className="min-w-0">
            <Input
              label="Hasta"
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
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

        {orders.length === 0 ? (
          <div className="card p-10 text-center text-island-dark/70 font-body space-y-1">
            <p>No hay pedidos para facturar con estos filtros.</p>
            <p className="text-sm">Ajusta el estado o el rango de fechas, o usa "Limpiar filtros".</p>
          </div>
        ) : (
          <>
            {/* Desktop/tablet: table */}
            <div className="hidden sm:block card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead className="bg-gray-100 border-b border-island-blue/20">
                    <tr>
                      <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Mesa</th>
                      <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Productos</th>
                      <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Base</th>
                      <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Impuesto</th>
                      <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Total</th>
                      <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Estado</th>
                      <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Fecha</th>
                      <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-island-blue/20">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-3 font-medium text-island-dark">{tableName(order.tableId)}</td>
                        <td className="px-4 py-3 text-island-dark/70">{order.items.length} producto(s)</td>
                        <td className="px-4 py-3 text-right text-island-dark/70">{formatCOPDecimal(invoiceNet(order))}</td>
                        <td className="px-4 py-3 text-right text-island-dark/70">{formatCOPDecimal(invoiceTax(order))}</td>
                        <td className="px-4 py-3 text-right font-semibold text-island-dark">{formatCOP(order.total)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">{renderStatusBadges(order)}</div>
                        </td>
                        <td className="px-4 py-3 text-island-dark/70">{formatShortDate(order.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">{renderActions(order)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: stacked cards */}
            <div className="sm:hidden space-y-3">
              {orders.map((order) => (
                <div key={order._id} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-body font-semibold text-island-dark">{tableName(order.tableId)}</p>
                      <p className="text-xs text-island-dark/70 font-body">{formatShortDate(order.createdAt)} · {order.items.length} producto(s)</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">{renderStatusBadges(order)}</div>
                  </div>
                  <div className="flex items-baseline justify-between text-sm font-body">
                    <span className="text-island-dark/70">Base {formatCOPDecimal(invoiceNet(order))} · Imp. {formatCOPDecimal(invoiceTax(order))}</span>
                    <span className="font-semibold text-island-dark text-base">{formatCOP(order.total)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-island-blue/20">{renderActions(order)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {selectedOrder && (
          <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Factura básica" size="lg">
            <div className="space-y-4">
              {invoiceContent(selectedOrder)}
              <div className="flex justify-end">
                <Button onClick={() => window.print()}>
                  <PrinterIcon size={14} /> Imprimir
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {closeOrder && (
        <Modal isOpen={!!closeOrder} onClose={() => setCloseOrder(null)} title="Facturar pedido">
          <div className="space-y-4">
            <p className="text-sm text-island-dark/70 font-body">
              Selecciona el método de pago para cerrar el pedido de {tableName(closeOrder.tableId)}.
            </p>
            {!openShift && (
              <div className="rounded-lg border border-warning bg-warning-tint p-3 flex items-start gap-2 text-sm text-warning-ink font-body">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                No hay un turno de caja abierto. El pedido se facturará igual, pero quedará marcado "sin turno" en el arqueo.
              </div>
            )}
            <Select
              label="Método de pago"
              options={paymentOptions}
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            />
            {paymentMethod === 'cash' && (
              <Input
                label="Monto recibido (opcional)"
                type="number"
                min={0}
                placeholder={String(closeOrder.total)}
                value={amountReceived}
                onChange={(event) => setAmountReceived(event.target.value)}
                hint="Si lo indicas, el ticket impreso mostrará el cambio."
              />
            )}
            <FiscalCustomerSelect
              onChange={setCloseClientId}
              initialClient={typeof closeOrder.clientId === 'object' ? (closeOrder.clientId as Client) : null}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCloseOrder(null)}>Cancelar</Button>
              <Button onClick={handleCloseOrder}>Confirmar factura</Button>
            </div>
          </div>
        </Modal>
        )}

        {emailTarget && (
        <Modal isOpen={!!emailTarget} onClose={() => setEmailTarget(null)} title="Enviar recibo por correo">
          <div className="space-y-4">
            <p className="text-sm text-island-dark/70 font-body">
              Se enviará el recibo del pedido de {tableName(emailTarget.tableId)} al correo indicado.
            </p>
            <Input
              label="Correo electrónico"
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="cliente@correo.com"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEmailTarget(null)}>Cancelar</Button>
              <Button onClick={handleSendReceiptEmail} loading={sendingEmail} disabled={!emailAddress.trim()}>
                <Mail size={14} /> Enviar
              </Button>
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

      {selectedOrder && (
        <div id="invoice-print-area" className="hidden print:block">
          {invoiceContent(selectedOrder)}
        </div>
      )}
    </div>
  );
}
