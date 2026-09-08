import {
  LayoutDashboard,
  Coffee,
  Grid3X3,
  ClipboardList,
  ClipboardCheck,
  ReceiptText,
  ListChecks,
  HandCoins,
  Banknote,
  Calendar,
  Users,
  Truck,
  CalendarDays,
  Mail,
  BarChart2,
  FolderOpen,
  TrendingUp,
  SlidersHorizontal,
  ChefHat,
  PackageOpen,
  LineChart,
  Wallet,
  Archive,
  Package,
  CircleDollarSign,
  UserCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AdminNavGate = 'admin' | 'superadmin';

export interface AdminNavLeaf {
  to: string;
  label: string;
  Icon: LucideIcon;
  end?: boolean;
  /** Shown as a quick-access chip in ServiceQuickNav. */
  quickNav?: boolean;
  /** Not rendered in the sidebar — only contributes a Topbar breadcrumb label. */
  hidden?: boolean;
  /** Shows the low-stock alert badge (agotado count) next to this item. */
  badge?: 'agotado';
}

export interface AdminNavGroup {
  id: string;
  label: string;
  Icon: LucideIcon;
  items: AdminNavLeaf[];
  /** Visibility gate: undefined = any authenticated admin user. */
  gate?: AdminNavGate;
  badge?: 'agotado';
  /**
   * Path prefix used to decide whether this group should start expanded.
   * Defaults to matching any of `items`' paths — set this instead when the
   * group contains dynamic-year links (proyecciones/resultados) that
   * wouldn't otherwise prefix-match every route inside the group.
   */
  openMatch?: string;
}

export type AdminNavEntry = AdminNavLeaf | AdminNavGroup;

export function isAdminNavGroup(entry: AdminNavEntry): entry is AdminNavGroup {
  return 'items' in entry;
}

export function isAdminNavLeaf(entry: AdminNavEntry): entry is AdminNavLeaf {
  return !isAdminNavGroup(entry);
}

const currentYear = new Date().getFullYear();

// Single source of truth for the admin sidebar, the ServiceQuickNav chips, and
// the Topbar breadcrumb labels — Sidebar/ServiceQuickNav/Topbar all derive from this.
export const ADMIN_NAV: AdminNavEntry[] = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Productos', Icon: Coffee },
  { to: '/admin/tables', label: 'Mesas', Icon: Grid3X3 },
  { to: '/admin/orders', label: 'Pedidos', Icon: ClipboardList, end: true, quickNav: true },
  { to: '/admin/orders/active', label: 'Pedidos activos', Icon: ClipboardCheck, quickNav: true },
  { to: '/admin/billing', label: 'Facturación', Icon: ReceiptText, quickNav: true },
  { to: '/admin/mis-tareas', label: 'Mis tareas', Icon: ListChecks },
  { to: '/admin/expenses', label: 'Gastos', Icon: HandCoins, quickNav: true },
  { to: '/admin/cashflow', label: 'Caja / Cierre', Icon: Banknote, quickNav: true },
  { to: '/admin/reservations', label: 'Reservaciones', Icon: Calendar, quickNav: true },

  {
    id: 'gestion',
    label: 'Gestión del negocio',
    Icon: Users,
    items: [
      { to: '/admin/clients', label: 'Clientes', Icon: Users },
      { to: '/admin/providers', label: 'Proveedores', Icon: Truck },
      { to: '/admin/events', label: 'Eventos', Icon: CalendarDays },
      { to: '/admin/boletines', label: 'Boletines', Icon: Mail },
      { to: '/admin/reports', label: 'Reportes', Icon: BarChart2 },
    ],
  },

  {
    id: 'proyectos',
    label: 'Gestión de Proyecto',
    Icon: FolderOpen,
    gate: 'admin',
    openMatch: '/admin/proyectos',
    items: [
      { to: '/admin/proyectos', label: 'Proyectos', Icon: FolderOpen },
    ],
  },

  // Unifies the former separate "Control de Inventario" and "Costos & Finanzas"
  // sidebar groups — both pointed at the same underlying pages/routes.
  {
    id: 'costos',
    label: 'Costos & Finanzas',
    Icon: CircleDollarSign,
    gate: 'admin',
    badge: 'agotado',
    openMatch: '/admin/costos',
    items: [
      { to: '/admin/costos/dashboard', label: 'Dashboard Costos', Icon: TrendingUp },
      { to: '/admin/costos/parametros', label: 'Parámetros MOD/GIF', Icon: SlidersHorizontal },
      { to: '/admin/costos/inventario/control', label: 'Control Diario', Icon: ClipboardCheck },
      { to: '/admin/costos/inventario/catalogo', label: 'Catálogo de Insumos', Icon: Package },
      { to: '/admin/costos/recetas', label: 'Recetas', Icon: ChefHat },
      { to: '/admin/costos/packs-desechables', label: 'Packs Desechables', Icon: PackageOpen },
      { to: '/admin/costos/inventario/stock', label: 'Inventario', Icon: Archive, badge: 'agotado' },
      { to: '/admin/costos/inventario/reportes', label: 'Reportes de Inventario', Icon: BarChart2 },
      { to: `/admin/costos/proyecciones/${currentYear}`, label: 'Proyecciones', Icon: LineChart },
      { to: `/admin/costos/resultados/${currentYear}`, label: 'Resultados P&L', Icon: Wallet },
    ],
  },

  {
    id: 'config',
    label: 'Configuración',
    Icon: UserCog,
    gate: 'superadmin',
    openMatch: '/admin/usuarios',
    items: [
      { to: '/admin/usuarios', label: 'Usuarios', Icon: UserCog },
    ],
  },

  // Reachable only via the Topbar notification bell — kept here so it still
  // gets a correct breadcrumb label instead of falling back to "Admin".
  { to: '/admin/notificaciones', label: 'Notificaciones', Icon: LayoutDashboard, hidden: true },
];

/** Flat `path -> label` map for Topbar breadcrumbs, built from every leaf in ADMIN_NAV. */
export function buildBreadcrumbMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of ADMIN_NAV) {
    if (isAdminNavGroup(entry)) {
      for (const item of entry.items) map[item.to] = item.label;
    } else {
      map[entry.to] = entry.label;
    }
  }
  return map;
}
