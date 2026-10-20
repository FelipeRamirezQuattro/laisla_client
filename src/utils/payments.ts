import type { Order, OrderPayment, PaymentMethod } from '../types';
import { formatCOP } from './formatCurrency';

export const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'nequi', label: 'Nequi / Daviplata' },
  { value: 'transfer', label: 'Transferencia' },
];

export const paymentLabel: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  nequi: 'Nequi / Daviplata',
  transfer: 'Transferencia',
};

// Pedidos anteriores a los pagos divididos solo tienen `paymentMethod`.
export function getOrderPayments(order: Pick<Order, 'total' | 'paymentMethod' | 'payments'>): OrderPayment[] {
  if (order.payments && order.payments.length > 0) return order.payments;
  if (order.paymentMethod && order.paymentMethod !== 'mixed') {
    return [{ method: order.paymentMethod, amount: order.total }];
  }
  return [];
}

export function formatOrderPayments(order: Pick<Order, 'total' | 'paymentMethod' | 'payments'>): string {
  const payments = getOrderPayments(order);
  if (payments.length === 0) return order.total === 0 ? 'Cortesía' : '—';
  if (payments.length === 1) return paymentLabel[payments[0].method];
  return payments.map((p) => `${paymentLabel[p.method]} ${formatCOP(p.amount)}`).join(' + ');
}

export function paymentsAreValid(payments: OrderPayment[], total: number): boolean {
  if (payments.length === 0 || payments.some((p) => !(p.amount > 0))) return false;
  return Math.abs(payments.reduce((sum, p) => sum + p.amount, 0) - total) <= 0.5;
}
