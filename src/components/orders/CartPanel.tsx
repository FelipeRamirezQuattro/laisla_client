import { useState } from 'react';
import { Gift, Minus, Plus, X } from 'lucide-react';
import { OrderItem } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { formatCOP, formatCOPDecimal } from '../../utils/formatCurrency';

export function itemKey(item: OrderItem) {
  return `${item.productId}:${item.variantSize ?? ''}${item.complimentary ? ':comp' : ''}`;
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
  onComplimentary: (key: string, units: number, reason: string) => void;
  onRemoveComplimentary: (key: string) => void;
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
  onComplimentary,
  onRemoveComplimentary,
  onConfirm,
  disabled,
}: CartPanelProps) {
  const [compKey, setCompKey] = useState<string | null>(null);
  const [compUnits, setCompUnits] = useState('1');
  const [compReason, setCompReason] = useState('');
  const compItem = compKey ? cart.find((item) => itemKey(item) === compKey) : undefined;

  const openComplimentary = (item: OrderItem) => {
    setCompKey(itemKey(item));
    setCompUnits(String(item.quantity));
    setCompReason('');
  };
  const units = Number(compUnits);
  const unitsValid = !!compItem && Number.isInteger(units) && units >= 1 && units <= compItem.quantity;
  const confirmComplimentary = () => {
    if (!compKey || !unitsValid || !compReason.trim()) return;
    onComplimentary(compKey, units, compReason.trim());
    setCompKey(null);
  };

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
                  {item.complimentary ? (
                    <p className="text-xs text-island-dark/70 font-body">
                      <span className="font-semibold text-success-ink">Cortesía</span>{' '}
                      <span className="line-through">{formatCOP(item.originalUnitPrice ?? 0)}</span>
                      {item.complimentaryReason && <span> · {item.complimentaryReason}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-island-dark/70 font-body">{formatCOP(item.unitPrice)} c/u</p>
                  )}
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
              <div className="mt-1">
                {item.complimentary ? (
                  <button type="button" className="text-xs text-island-dark/70 underline font-body" onClick={() => onRemoveComplimentary(key)}>
                    Quitar cortesía
                  </button>
                ) : (
                  <button type="button" className="text-xs text-island-dark/70 underline font-body inline-flex items-center gap-1" onClick={() => openComplimentary(item)}>
                    <Gift size={12} /> Marcar cortesía
                  </button>
                )}
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
      {compItem && (
        <Modal isOpen onClose={() => setCompKey(null)} title="Marcar como cortesía">
          <div className="space-y-4">
            <p className="text-sm text-island-dark/70 font-body">
              {compItem.productName} pasa a $0. Los insumos se descuentan igual al facturar.
            </p>
            {compItem.quantity > 1 && (
              <Input
                label={`Unidades de cortesía (de ${compItem.quantity})`}
                type="number"
                min={1}
                max={compItem.quantity}
                value={compUnits}
                onChange={(event) => setCompUnits(event.target.value)}
              />
            )}
            <Input
              label="Motivo (obligatorio)"
              value={compReason}
              placeholder="Ej: invitación de la casa, error de cocina"
              onChange={(event) => setCompReason(event.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCompKey(null)}>Cancelar</Button>
              <Button onClick={confirmComplimentary} disabled={!unitsValid || !compReason.trim()}>Confirmar cortesía</Button>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}
