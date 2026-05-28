import { useLocation, Link } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Productos',
  '/admin/tables': 'Mesas',
  '/admin/orders': 'Pedidos',
  '/admin/orders/active': 'Pedidos activos',
  '/admin/billing': 'Facturación',
  '/admin/expenses': 'Gastos diarios',
  '/admin/clients': 'Clientes',
  '/admin/providers': 'Proveedores',
  '/admin/events': 'Eventos',
  '/admin/reservations': 'Reservaciones',
  '/admin/cashflow': 'Caja / Cierre del Día',
  '/admin/reports': 'Reportes',
};

export function Topbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const pageName = breadcrumbMap[pathname] || 'Admin';

  return (
    <header className="h-16 bg-white border-b border-rule flex items-center justify-between px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-stone hover:text-espresso transition-colors"
          aria-label="Mostrar u ocultar menú"
        >
          <Menu size={24} />
        </button>
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-body">
          <Link to="/admin" className="text-stone hover:text-espresso transition-colors">
            Inicio
          </Link>
          {pathname !== '/admin' && (
            <>
              <span className="text-stone">/</span>
              <span className="text-ink font-medium">{pageName}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-ink font-body">{user?.name}</p>
          <p className="text-xs text-stone font-body capitalize">{user?.role}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-espresso flex items-center justify-center text-cream text-sm font-medium font-body">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="text-stone hover:text-error-ink transition-colors p-1.5 rounded-lg hover:bg-error-tint"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
