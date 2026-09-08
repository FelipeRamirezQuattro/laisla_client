import { NavLink } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { ADMIN_NAV, isAdminNavLeaf } from '../../config/adminNav';

const quickNavItems = ADMIN_NAV.filter(isAdminNavLeaf).filter((item) => item.quickNav);

export function ServiceQuickNav() {
  const { sidebarOpen } = useUiStore();

  if (sidebarOpen) return null;

  return (
    <nav className="shrink-0 border-b border-island-blue/20 bg-white px-4 py-2 shadow-sm">
      <div className="flex gap-2 overflow-x-auto">
        {quickNavItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 font-body text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-island-dark text-white shadow-sm'
                  : 'border border-island-blue/20 bg-gray-100 text-island-dark hover:border-island-blue/40 hover:bg-white'
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
