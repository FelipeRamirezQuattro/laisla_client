import { Plus, X } from 'lucide-react';
import type { OrderPayment, PaymentMethod } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';
import { paymentOptions } from '../../utils/payments';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const MAX_LINES = 8;

interface Props {
  total: number;
  value: OrderPayment[];
  onChange: (payments: OrderPayment[]) => void;
}

// La última línea siempre toma lo que falta, así que la suma cuadra con el
// total sin cálculos manuales; solo se editan las líneas anteriores.
function withRemainder(payments: OrderPayment[], total: number): OrderPayment[] {
  if (payments.length === 0) return payments;
  const head = payments.slice(0, -1);
  const rest = Math.max(0, total - head.reduce((sum, p) => sum + p.amount, 0));
  return [...head, { ...payments[payments.length - 1], amount: rest }];
}

export function SplitPaymentEditor({ total, value, onChange }: Props) {
  const update = (next: OrderPayment[]) => onChange(withRemainder(next, total));

  const setMethod = (index: number, method: PaymentMethod) =>
    update(value.map((p, i) => (i === index ? { ...p, method } : p)));

  const setAmount = (index: number, amount: number) =>
    update(value.map((p, i) => (i === index ? { ...p, amount: Math.max(0, amount) } : p)));

  const addLine = () => {
    const used = new Set(value.map((p) => p.method));
    const method = paymentOptions.find((o) => !used.has(o.value))?.value ?? value[value.length - 1].method;
    const last = value[value.length - 1];
    // Parte el monto de la última línea para que la nueva no nazca en $0.
    const half = Math.floor(last.amount / 2);
    update([...value.slice(0, -1), { ...last, amount: last.amount - half }, { method, amount: half }]);
  };

  const removeLine = (index: number) => update(value.filter((_, i) => i !== index));

  const split = value.length > 1;

  return (
    <div className="space-y-3">
      {value.map((payment, index) => {
        const isLast = index === value.length - 1;
        return (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label={split ? `Método ${index + 1}` : 'Método de pago'}
                options={paymentOptions}
                value={payment.method}
                onChange={(event) => setMethod(index, event.target.value as PaymentMethod)}
              />
            </div>
            {split && (
              <div className="w-36">
                {isLast ? (
                  <Input label="Restante" value={formatCOP(payment.amount)} readOnly />
                ) : (
                  <Input
                    label="Monto"
                    type="number"
                    min={0}
                    value={payment.amount}
                    onChange={(event) => setAmount(index, Number(event.target.value))}
                  />
                )}
              </div>
            )}
            {split && (
              <button
                type="button"
                aria-label="Quitar método de pago"
                className="mb-2 p-1 text-island-dark/60 hover:text-island-dark"
                onClick={() => removeLine(index)}
              >
                <X size={16} />
              </button>
            )}
          </div>
        );
      })}
      {value.length < MAX_LINES && (
        <Button type="button" variant="secondary" onClick={addLine}>
          <Plus size={14} /> Dividir cuenta
        </Button>
      )}
    </div>
  );
}
