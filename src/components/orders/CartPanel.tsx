import { Minus, Plus, X } from 'lucide-react';
import { OrderItem } from '../../types';
import { Button } from '../ui/Button';
import { formatCOP, formatCOPDecimal } from '../../utils/formatCurrency';

export function itemKey(item: OrderItem) {
  return `${item.productId}:${item.variantSize ?? ''}`;
}

interface CartPanelProps {
  cart: OrderItem[];
  cartTotal: number;
  cartTax: number;
  cartNet: number;
  hasTable: boolean;
  editingOrderId: string;
  onClear: () => void;
  onChangeQty: (key: string, delta: number) => void;
  onRemoveItem: (key: string) => void;
  onConfirm: () => void;
  disabled: boolean;
}

export function CartPanel({
  cart,
  cartTotal,
  cartTax,
  cartNet,
  hasTable,
  editingOrderId,
  onClear,
  onChangeQty,
  onRemoveItem,
  onConfirm,
  disabled,
}: CartPanelProps) {
  return (
    <aside className="card p-4 sticky top-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-body text-lg font-semibold text-island-dark">Pedido</h2>
        {cart.length > 0 && (
          <button type="button" className="text-xs text-error-ink font-body" onClick={onClear}>
            Limpiar
          </button>
        )}
      </div>
      <div className="space-y-2">
        {!hasTable && <p className="text-sm text-island-dark/70 font-body">Selecciona una mesa para empezar.</p>}
        {cart.map((item) => {
          const key = itemKey(item);
          return (
            <div key={key} className="rounded-lg bg-gray-100 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-body font-medium text-island-dark">{item.productName}</p>
                  <p className="text-xs text-island-dark/70 font-body">{formatCOP(item.unitPrice)} c/u</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveItem(key)}
                  className="text-error-ink hover:text-error"
                  aria-label="Eliminar producto"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => onChangeQty(key, -1)} className="h-7 w-7 rounded-md bg-white text-island-dark/70 inline-flex items-center justify-center">
                    <Minus size={14} />
                  </button>
                  <span className="w-7 text-center text-sm font-body text-island-dark">{item.quantity}</span>
                  <button type="button" onClick={() => onChangeQty(key, 1)} className="h-7 w-7 rounded-md bg-white text-island-dark/70 inline-flex items-center justify-center">
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-body font-semibold text-island-dark">{formatCOP(item.quantity * item.unitPrice)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-island-blue/20 mt-4 pt-3 space-y-1 text-sm font-body">
        <div className="flex justify-between text-island-dark/70"><span>Base aprox.</span><span>{formatCOPDecimal(cartNet)}</span></div>
        <div className="flex justify-between text-island-dark/70"><span>Impuesto incluido</span><span>{formatCOPDecimal(cartTax)}</span></div>
        <div className="flex justify-between font-semibold text-island-dark text-base"><span>Total</span><span>{formatCOP(cartTotal)}</span></div>
      </div>
      <Button className="w-full mt-4" disabled={disabled} onClick={onConfirm}>
        {editingOrderId ? 'Actualizar pedido' : 'Confirmar pedido'}
      </Button>
    </aside>
  );
}
