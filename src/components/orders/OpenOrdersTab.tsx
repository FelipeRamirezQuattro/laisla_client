import { CafeTable, Order } from '../../types';
import { Button } from '../ui/Button';
import { OrderStatusBadge } from '../ui/Badge';
import { formatCOP } from '../../utils/formatCurrency';
import { formatShortDate } from '../../utils/formatDate';

interface OpenOrdersTabProps {
  openOrders: Order[];
  tableName: (table?: string | CafeTable | null) => string;
  onEdit: (order: Order) => void;
}

export function OpenOrdersTab({ openOrders, tableName, onEdit }: OpenOrdersTabProps) {
  return (
    <section className="card p-0 overflow-hidden">
      <div className="px-4 py-3 bg-gray-100 border-b border-island-blue/20">
        <h2 className="font-body text-lg font-semibold text-island-dark">Pedidos abiertos</h2>
        <p className="text-xs text-island-dark/70 font-body">Edita pedidos vigentes si el cliente agrega productos o cambia de mesa.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead className="border-b border-island-blue/20">
            <tr>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Mesa</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Items</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Total</th>
              <th className="text-center px-4 py-3 text-island-dark/70 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-island-dark/70 font-medium">Fecha</th>
              <th className="text-right px-4 py-3 text-island-dark/70 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-island-blue/20">
            {openOrders.map((order) => (
              <tr key={order._id} className="hover:bg-gray-100 transition-colors">
                <td className="px-4 py-3 font-medium text-island-dark">{tableName(order.tableId)}</td>
                <td className="px-4 py-3 text-island-dark/70">{order.items.length} ítem(s)</td>
                <td className="px-4 py-3 text-right font-medium text-island-dark">{formatCOP(order.total)}</td>
                <td className="px-4 py-3 text-center"><OrderStatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-island-dark/70">{formatShortDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" size="sm" onClick={() => onEdit(order)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {openOrders.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-island-dark/70">No hay pedidos abiertos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
