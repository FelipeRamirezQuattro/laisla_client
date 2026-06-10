import { NavLink } from 'react-router-dom';
import { Banknote, Calendar, ClipboardCheck, ClipboardList, HandCoins, ReceiptText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

interface ServiceNavItem {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
}

const serviceItems: ServiceNavItem[] = [
  { to: '/admin/orders', label: 'Pedidos', Icon: ClipboardList, end: true },
  { to: '/admin/orders/active', label: 'Pedidos Activos', Icon: ClipboardCheck },
  { to: '/admin/billing', label: 'Facturación', Icon: ReceiptText },
  { to: '/admin/expenses', label: 'Gastos', Icon: HandCoins },
  { to: '/admin/cashflow', label: 'Caja', Icon: Banknote },
  { to: '/admin/reservations', label: 'Reservaciones', Icon: Calendar },
];

export function ServiceQuickNav() {
  const { sidebarOpen } = useUiStore();

  if (sidebarOpen) return null;

  return (
    <nav className="shrink-0 border-b border-rule bg-white px-4 py-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {serviceItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 font-body text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-espresso text-cream shadow-sm'
                  : 'border border-rule bg-surface-tint text-espresso hover:border-rule-strong hover:bg-white'
              }`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
