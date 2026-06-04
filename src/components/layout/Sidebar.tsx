import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Coffee, Grid3X3, ClipboardList, Users, Truck,
  CalendarDays, Calendar, Banknote, BarChart2,
  TrendingUp, SlidersHorizontal, ChefHat,
  PackageOpen, LineChart, Wallet, Archive, ChevronDown, ChevronUp,
  CircleDollarSign, ClipboardCheck, Package, ReceiptText, X,
  HandCoins,
  FolderOpen, ListChecks, UserCog,
} from 'lucide-react';
import { alertasInvApi } from '../../api/inventario';
import { useUiStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import type { LucideIcon } from 'lucide-react';

interface NavItemDef {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
}

const navItems: NavItemDef[] = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Productos', Icon: Coffee },
  { to: '/admin/tables', label: 'Mesas', Icon: Grid3X3 },
  { to: '/admin/orders', label: 'Pedidos', Icon: ClipboardList, end: true },
  { to: '/admin/orders/active', label: 'Pedidos activos', Icon: ClipboardCheck },
  { to: '/admin/billing', label: 'Facturación', Icon: ReceiptText },
  { to: '/admin/mis-tareas', label: 'Mis tareas', Icon: ListChecks },
  { to: '/admin/expenses', label: 'Gastos', Icon: HandCoins },
  { to: '/admin/cashflow', label: 'Caja / Cierre', Icon: Banknote },
  { to: '/admin/reservations', label: 'Reservaciones', Icon: Calendar },
];

const inventarioItems: NavItemDef[] = [
  { to: '/admin/inventario/control', label: 'Control Diario', Icon: ClipboardCheck },
  { to: '/admin/inventario/catalogo', label: 'Catálogo', Icon: Package },
  { to: '/admin/inventario/recetas', label: 'Recetas', Icon: ChefHat },
  { to: '/admin/inventario/packs-desechables', label: 'Packs Desechables', Icon: PackageOpen },
  { to: '/admin/inventario/stock', label: 'Inventario', Icon: Archive },
  { to: '/admin/inventario/reportes', label: 'Reportes', Icon: BarChart2 },
];

const costItems: NavItemDef[] = [
  { to: '/admin/costos/dashboard', label: 'Dashboard Costos', Icon: TrendingUp },
  { to: '/admin/costos/parametros', label: 'Parámetros MOD/GIF', Icon: SlidersHorizontal },
  { to: `/admin/costos/proyecciones/${new Date().getFullYear()}`, label: 'Proyecciones', Icon: LineChart },
  { to: `/admin/costos/resultados/${new Date().getFullYear()}`, label: 'Resultados P&L', Icon: Wallet },
];

const gestionItems: NavItemDef[] = [
  { to: '/admin/clients', label: 'Clientes', Icon: Users },
  { to: '/admin/providers', label: 'Proveedores', Icon: Truck },
  { to: '/admin/events', label: 'Eventos', Icon: CalendarDays },
  { to: '/admin/reports', label: 'Reportes', Icon: BarChart2 },
];

const projectItems: NavItemDef[] = [
  { to: '/admin/proyectos', label: 'Proyectos', Icon: FolderOpen },
];

const configItems: NavItemDef[] = [
  { to: '/admin/usuarios', label: 'Usuarios', Icon: UserCog },
];

function NavItem({ to, label, Icon, end }: NavItemDef) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-2.5 text-sm font-body transition-all duration-200 ${
          isActive
            ? 'bg-cream text-espresso font-medium'
            : 'text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10'
        }`
      }
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

export function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const { isAdmin, isSuperAdmin } = useAuthStore();
  const location = useLocation();
  const isCostRoute = location.pathname.startsWith('/admin/costos');
  const isInventarioRoute = location.pathname.startsWith('/admin/inventario');
  const isGestionRoute = gestionItems.some((item) => location.pathname.startsWith(item.to));
  const [costOpen, setCostOpen] = useState(isCostRoute);
  const [inventarioOpen, setInventarioOpen] = useState(isInventarioRoute);
  const [gestionOpen, setGestionOpen] = useState(isGestionRoute);
  const [projectOpen, setProjectOpen] = useState(location.pathname.startsWith('/admin/proyectos'));
  const [configOpen, setConfigOpen] = useState(location.pathname.startsWith('/admin/usuarios'));
  const [agotadoCount, setAgotadoCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) return;
    alertasInvApi.getAll()
      .then((res) => setAgotadoCount(res.data.filter((a) => a.detalle.nivel === 'AGOTADO').length))
      .catch(() => {});
  }, [location.pathname, isAdmin]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-espresso bg-opacity-50 z-20 lg:hidden"
          onClick={() => useUiStore.getState().setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 shrink-0 bg-espresso text-cream z-30 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0 lg:static' : '-translate-x-full lg:hidden'}
          shadow-xl lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white border-opacity-10 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-body text-xl font-bold text-cream">La Isla Café</h1>
            <p className="text-xs text-cream text-opacity-60 font-body mt-0.5">Panel de Administración</p>
          </div>
          <button
            type="button"
            onClick={() => useUiStore.getState().setSidebarOpen(false)}
            className="rounded-lg p-1 text-cream text-opacity-70 hover:bg-white hover:bg-opacity-10 hover:text-cream"
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}

          {/* Divider */}
          <div className="mx-6 my-3 border-t border-white border-opacity-10" />

          {/* Gestión del negocio collapsible group */}
          <button
            onClick={() => setGestionOpen((o) => !o)}
            className="flex items-center justify-between w-full px-6 py-2.5 text-sm font-body text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10 transition-all duration-200"
          >
            <span className="flex items-center gap-3">
              <Users size={16} strokeWidth={1.75} />
              Gestión del negocio
            </span>
            {gestionOpen
              ? <ChevronUp size={14} className="opacity-60" />
              : <ChevronDown size={14} className="opacity-60" />
            }
          </button>

          {gestionOpen && (
            <div className="pl-4">
              {gestionItems.map((item) => (
                <NavItem key={item.to} {...item} />
              ))}
            </div>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setProjectOpen((o) => !o)}
                className="flex items-center justify-between w-full px-6 py-2.5 text-sm font-body text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              >
                <span className="flex items-center gap-3">
                  <FolderOpen size={16} strokeWidth={1.75} />
                  Gestión de Proyecto
                </span>
                {projectOpen ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
              </button>

              {projectOpen && (
                <div className="pl-4">
                  {projectItems.map((item) => <NavItem key={item.to} {...item} />)}
                </div>
              )}

              {/* Control de Inventario collapsible group */}
              <button
                onClick={() => setInventarioOpen((o) => !o)}
                className="flex items-center justify-between w-full px-6 py-2.5 text-sm font-body text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              >
                <span className="flex items-center gap-3">
                  <ClipboardCheck size={16} strokeWidth={1.75} />
                  Control de Inventario
                  {agotadoCount > 0 && (
                    <span className="bg-error text-cream text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                      {agotadoCount}
                    </span>
                  )}
                </span>
                {inventarioOpen
                  ? <ChevronUp size={14} className="opacity-60" />
                  : <ChevronDown size={14} className="opacity-60" />
                }
              </button>

              {inventarioOpen && (
                <div className="pl-4">
                  {inventarioItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-6 py-2.5 text-sm font-body transition-all duration-200 ${
                          isActive
                            ? 'bg-cream text-espresso font-medium'
                            : 'text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10'
                        }`
                      }
                    >
                      <span className="flex items-center gap-3">
                        <item.Icon size={16} strokeWidth={1.75} />
                        {item.label}
                      </span>
                      {item.to.includes('stock') && agotadoCount > 0 && (
                        <span className="bg-error text-cream text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                          {agotadoCount}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}

              {/* Costos & Finanzas collapsible group */}
              <button
                onClick={() => setCostOpen((o) => !o)}
                className="flex items-center justify-between w-full px-6 py-2.5 text-sm font-body text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              >
                <span className="flex items-center gap-3">
                  <CircleDollarSign size={16} strokeWidth={1.75} />
                  Costos &amp; Finanzas
                </span>
                {costOpen
                  ? <ChevronUp size={14} className="opacity-60" />
                  : <ChevronDown size={14} className="opacity-60" />
                }
              </button>

              {costOpen && (
                <div className="pl-4">
                  {costItems.map((item) => (
                    <NavItem key={item.to} {...item} />
                  ))}
                </div>
              )}
            </>
          )}

          {isSuperAdmin && (
            <>
              <button
                onClick={() => setConfigOpen((o) => !o)}
                className="flex items-center justify-between w-full px-6 py-2.5 text-sm font-body text-cream text-opacity-70 hover:text-cream hover:bg-white hover:bg-opacity-10 transition-all duration-200"
              >
                <span className="flex items-center gap-3">
                  <UserCog size={16} strokeWidth={1.75} />
                  Configuración
                </span>
                {configOpen ? <ChevronUp size={14} className="opacity-60" /> : <ChevronDown size={14} className="opacity-60" />}
              </button>

              {configOpen && (
                <div className="pl-4">
                  {configItems.map((item) => <NavItem key={item.to} {...item} />)}
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white border-opacity-10">
          <p className="text-xs text-cream text-opacity-40 font-body">La Isla Café Picnic © {new Date().getFullYear()}</p>
          <p className="text-xs text-cream text-opacity-30 font-body">Ibagué, Colombia</p>
        </div>
      </aside>
    </>
  );
}
