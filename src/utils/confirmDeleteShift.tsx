import { cashShiftsApi } from '../api/cashShifts';
import type { useConfirm } from '../hooks/useConfirm';
import type { CashShift } from '../types';
import { formatCOP } from './formatCurrency';
import { formatDateTime } from './formatDate';

/** Shows what deleting a shift would remove, asks for confirmation and deletes it (cascade).
 * Resolves true only when the shift was actually deleted. Errors propagate to the caller. */
export async function confirmAndDeleteShift(shift: CashShift, confirm: ReturnType<typeof useConfirm>): Promise<boolean> {
  const { data: preview } = await cashShiftsApi.getDeletionPreview(shift._id);
  const accepted = await confirm({
    title: shift.status === 'OPEN' ? 'Eliminar turno ABIERTO' : 'Eliminar turno',
    confirmLabel: 'Eliminar todo',
    message: (
      <div className="space-y-2 text-sm font-body">
        <p>Se eliminará el turno del {formatDateTime(shift.openedAt)} y todo lo asociado. Esta acción no se puede deshacer:</p>
        <ul className="list-disc pl-5">
          <li>{preview.orders} pedido(s) por {formatCOP(preview.ordersTotal)}</li>
          <li>{preview.expenses} gasto(s) por {formatCOP(preview.expensesTotal)}</li>
          <li>{preview.movements} movimiento(s) de caja</li>
        </ul>
        {shift.status === 'OPEN' && <p className="font-semibold">Es el turno abierto: la caja quedará sin turno hasta que abras otro.</p>}
        <p>Si solo quieres conservar las ventas, primero reasigna los pedidos a otro turno.</p>
      </div>
    ),
  });
  if (!accepted) return false;
  await cashShiftsApi.remove(shift._id);
  return true;
}
