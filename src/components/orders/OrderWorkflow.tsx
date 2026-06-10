import { useEffect, useMemo, useState } from 'react';
import { Clock, X } from 'lucide-react';
import { Order } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { OrderStatusBadge } from '../ui/Badge';

export const CANCEL_REASONS = [
  'Problemas con el producto',
  'Falta de Stock',
  'Problemas con el cliente',
  'Pedido duplicado',
  'Error al tomar el pedido',
];

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  'in-progress': 'En proceso',
  ready: 'Listo',
  delivered: 'Entregado',
  billed: 'Facturado',
  cancelled: 'Cancelado',
};

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function lastStatusAt(order: Order) {
  const last = order.statusHistory?.[order.statusHistory.length - 1];
  return last?.at ?? order.billedAt ?? order.deliveredAt ?? order.cancelledAt ?? order.createdAt;
}

export function elapsedInCurrentStatus(order: Order, now: number) {
  const terminalAt = order.status === 'billed'
    ? order.billedAt ?? order.closedAt
    : order.status === 'cancelled'
      ? order.cancelledAt ?? order.closedAt
      : null;
  const end = terminalAt ? new Date(terminalAt).getTime() : now;
  return formatDuration(end - new Date(lastStatusAt(order)).getTime());
}

export function deliveryMinutes(order: Order) {
  if (!order.deliveredAt) return null;
  return Math.round((new Date(order.deliveredAt).getTime() - new Date(order.createdAt).getTime()) / 60000);
}

export function stayMinutes(order: Order) {
  const end = order.billedAt ?? order.closedAt;
  if (!end) return null;
  return Math.round((new Date(end).getTime() - new Date(order.createdAt).getTime()) / 60000);
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function OrderDetailDrawer({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const now = useNow();
  const timeline = useMemo(() => {
    if (!order) return [];
    const history = order.statusHistory?.length
      ? order.statusHistory
      : [{ status: order.status, at: order.createdAt, notes: '' }];
    return history;
  }, [order]);

  if (!order) return null;

  const delivery = deliveryMinutes(order);
  const stay = stayMinutes(order);

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-ink/30" onClick={onClose} aria-label="Cerrar detalle" />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-paper shadow-2xl border-l border-rule">
        <div className="sticky top-0 z-10 bg-paper border-b border-rule px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-body text-xl font-bold text-espresso">Pedido</h2>
            <p className="text-sm text-stone font-body">{formatShortDate(order.createdAt)} · {order.items.length} ítem(s)</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 rounded-lg bg-white text-stone inline-flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section className="card flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-stone font-body">Estado actual</p>
              <div className="mt-1"><OrderStatusBadge status={order.status} /></div>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone font-body">Tiempo en estado</p>
              <p className="font-body text-2xl font-bold text-espresso tabular-nums">
                {elapsedInCurrentStatus(order, now)}
              </p>
            </div>
          </section>

          <section className="grid sm:grid-cols-3 gap-3">
            <div className="card">
              <p className="text-xs text-stone font-body">Total</p>
              <p className="font-body font-bold text-espresso">{formatCOP(order.total)}</p>
            </div>
            <div className="card">
              <p className="text-xs text-stone font-body">Entrega</p>
              <p className="font-body font-bold text-espresso">{delivery === null ? 'En curso' : `${delivery} min`}</p>
            </div>
            <div className="card">
              <p className="text-xs text-stone font-body">Permanencia</p>
              <p className="font-body font-bold text-espresso">{stay === null ? 'En curso' : `${stay} min`}</p>
            </div>
          </section>

          <section className="card">
            <h3 className="font-body font-semibold text-espresso mb-4">Línea de tiempo</h3>
            <div className="space-y-3">
              {timeline.map((entry, index) => (
                <div key={`${entry.status}-${entry.at}-${index}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-8 w-8 rounded-full bg-surface-tint border border-rule inline-flex items-center justify-center text-terracotta">
                      <Clock size={15} />
                    </span>
                    {index < timeline.length - 1 && <span className="w-px flex-1 bg-rule" />}
                  </div>
                  <div className="pb-3">
                    <p className="font-body font-semibold text-ink">{statusLabel[entry.status] ?? entry.status}</p>
                    <p className="text-xs text-stone font-body">{new Date(entry.at).toLocaleString('es-CO')}</p>
                    {entry.notes && <p className="text-xs text-stone mt-1">{entry.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-rule bg-surface-tint">
              <h3 className="font-body font-semibold text-espresso">Ítems</h3>
            </div>
            <div className="divide-y divide-rule">
              {order.items.map((item, index) => (
                <div key={`${item.productId}-${item.variantSize}-${index}`} className="px-4 py-3 flex justify-between gap-3 text-sm font-body">
                  <span>{item.productName} x {item.quantity}</span>
                  <strong>{formatCOP(item.quantity * item.unitPrice)}</strong>
                </div>
              ))}
            </div>
          </section>

          {order.status === 'cancelled' && (
            <section className="card border-error bg-error-tint">
              <p className="font-body font-semibold text-error-ink">Pedido eliminado</p>
              <p className="text-sm text-stone mt-1">{order.cancelReason}</p>
              {order.cancelReasonDetail && <p className="text-sm text-stone mt-1">{order.cancelReasonDetail}</p>}
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

export function CancelOrderModal({
  order,
  onCancel,
  onConfirm,
  loading,
}: {
  order: Order | null;
  onCancel: () => void;
  onConfirm: (reason: string, detail: string) => void;
  loading?: boolean;
}) {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [customReasons, setCustomReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState('');

  useEffect(() => {
    if (order) {
      setReason(CANCEL_REASONS[0]);
      setDetail('');
      setNewReason('');
    }
  }, [order]);

  const reasonOptions = [...CANCEL_REASONS, ...customReasons];

  const addCustomReason = () => {
    const value = newReason.trim();
    if (!value) return;
    if (!reasonOptions.some((item) => item.toLowerCase() === value.toLowerCase())) {
      setCustomReasons((prev) => [...prev, value]);
    }
    setReason(value);
    setNewReason('');
  };

  return (
    <Modal isOpen={!!order} onClose={onCancel} title="Eliminar pedido">
      <div className="space-y-4">
        <p className="text-sm text-stone font-body">
          Selecciona la razón para eliminar el pedido. Esta información quedará en la línea de tiempo y en caja.
        </p>

        <div>
          <span className="block text-sm font-medium text-ink font-body mb-2">Razón</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {reasonOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setReason(item)}
                className={`rounded-lg border px-3 py-2 text-left font-body text-sm transition-colors ${
                  reason === item
                    ? 'border-espresso bg-espresso text-cream'
                    : 'border-rule bg-white text-espresso hover:bg-surface-tint'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-rule bg-surface-tint p-3">
          <label className="block text-sm font-medium text-ink font-body mb-2">Agregar otra opción</label>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="input-base"
              value={newReason}
              onChange={(event) => setNewReason(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomReason();
                }
              }}
              placeholder="Ej: Cliente cambió el pedido"
            />
            <Button type="button" variant="secondary" onClick={addCustomReason} disabled={!newReason.trim()}>
              Agregar
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink font-body mb-1">Detalle opcional</label>
          <textarea
            className="input-base h-20 resize-none"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="Notas internas para caja o seguimiento"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button
            variant="danger"
            loading={loading}
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason.trim(), detail.trim())}
          >
            Eliminar pedido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
