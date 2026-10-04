import type { DenominationInput } from '../../types';
import { formatCOP } from '../../utils/formatCurrency';

interface DenominationCounterProps {
  denominations: DenominationInput[];
  onChange: (next: DenominationInput[]) => void;
  showTotal?: boolean;
}

function denominationLabel(d: DenominationInput) {
  const kindLabel = d.kind === 'bill' ? 'Billete' : 'Moneda';
  return `${kindLabel} ${formatCOP(d.value)}`;
}

// Reused for both the opening float count and the closing arqueo count —
// one row per configured denomination, a per-row subtotal, and an optional
// running grand total. The caller decides whether to show the total: the
// blind-count close screen hides it until after the count is submitted.
export function DenominationCounter({ denominations, onChange, showTotal = true }: DenominationCounterProps) {
  const total = denominations.reduce((sum, d) => sum + d.value * d.quantity, 0);

  const handleQuantityChange = (index: number, quantity: number) => {
    const next = denominations.map((d, i) => (i === index ? { ...d, quantity } : d));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-2">
        {denominations.map((d, index) => (
          <div
            key={`${d.value}-${d.kind}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-island-blue/20 px-3 py-2"
          >
            <label htmlFor={`denom-${d.value}-${d.kind}`} className="text-sm font-body text-island-dark">
              {denominationLabel(d)}
            </label>
            <div className="flex items-center gap-3">
              <input
                id={`denom-${d.value}-${d.kind}`}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={d.quantity === 0 ? '' : d.quantity}
                placeholder="0"
                onChange={(event) => handleQuantityChange(index, Number(event.target.value) || 0)}
                className="input-base w-20 text-right"
              />
              <span className="w-24 text-right text-sm font-body text-island-dark/70">
                {formatCOP(d.value * d.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>
      {showTotal && (
        <div className="flex justify-between border-t border-island-blue/20 pt-3 font-body">
          <span className="font-medium text-island-dark">Total contado</span>
          <span className="text-lg font-bold text-island-dark">{formatCOP(total)}</span>
        </div>
      )}
    </div>
  );
}
