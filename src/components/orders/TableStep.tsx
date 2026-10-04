import { Check } from 'lucide-react';
import { CafeTable, Order } from '../../types';
import { TableStatusBadge } from '../ui/Badge';

const tableBorder: Record<CafeTable['status'], string> = {
  available: 'border-l-success',
  occupied: 'border-l-error',
  reserved: 'border-l-warning',
};

interface TableSelectorProps {
  tableOptions: CafeTable[];
  selectedTableId: string;
  editingOrder?: Order;
  walkInId: string;
  tableIdOf: (table?: string | CafeTable | null) => string;
  onSelect: (tableId: string) => void;
}

export function TableSelector({ tableOptions, selectedTableId, editingOrder, walkInId, tableIdOf, onSelect }: TableSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {tableOptions.map((table) => {
        const isEditingCurrentTable = !!editingOrder && table._id === tableIdOf(editingOrder.tableId);
        const disabled = table._id !== walkInId && (table.status === 'occupied' || !!table.currentOrderId) && !isEditingCurrentTable;
        const selected = selectedTableId === table._id;
        return (
          <button
            key={table._id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(table._id)}
            className={`bg-white border border-island-blue/20 border-l-4 ${tableBorder[table.status]} rounded-xl p-4 text-left transition-all disabled:opacity-55 disabled:cursor-not-allowed ${
              selected ? 'ring-2 ring-island-blue shadow-sm' : 'hover:border-island-blue/40 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-body font-semibold text-island-dark">{table.name}</span>
              {selected && <Check size={16} className="text-island-blue" />}
            </div>
            <p className="text-xs text-island-dark/70 font-body mt-1">
              {table._id === walkInId ? 'Cliente sin mesa' : `${table.capacity} personas`}
            </p>
            <div className="mt-3"><TableStatusBadge status={table.status} /></div>
          </button>
        );
      })}
    </div>
  );
}

interface TableSummaryProps {
  table?: CafeTable;
  onChange: () => void;
}

export function TableSummary({ table, onChange }: TableSummaryProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-island-blue/20 bg-white px-4 py-3">
      <div>
        <p className="text-xs text-island-dark/70 font-body">Mesa</p>
        <p className="font-body font-semibold text-island-dark">{table?.name ?? 'Sin mesa'}</p>
      </div>
      <button type="button" onClick={onChange} className="text-sm font-body text-island-blue hover:underline">
        Cambiar
      </button>
    </div>
  );
}
