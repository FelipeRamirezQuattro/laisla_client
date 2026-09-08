import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter, Routes, Route, Navigate, useParams, generatePath } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { RoleGuard } from './components/RoleGuard';

// Admin pages
import { LoginPage } from './pages/admin/LoginPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { TablesPage } from './pages/admin/TablesPage';
import { OrdersPage } from './pages/admin/OrdersPage';
import { ActiveOrdersPage } from './pages/admin/ActiveOrdersPage';
import { BillingPage } from './pages/admin/BillingPage';
import { ClientsPage } from './pages/admin/ClientsPage';
import { ProvidersPage } from './pages/admin/ProvidersPage';
import { EventsPage } from './pages/admin/EventsPage';
import { ReservationsPage } from './pages/admin/ReservationsPage';
import { ExpensesPage } from './pages/admin/ExpensesPage';
import { CashFlowPage } from './pages/admin/CashFlowPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { UsuariosPage } from './pages/admin/UsuariosPage';
import { NotificacionesPage } from './pages/admin/NotificacionesPage';
import { BoletinesPage } from './pages/admin/BoletinesPage';
import { ProyectosPage } from './pages/admin/proyectos/ProyectosPage';
import { ProyectoDetailPage } from './pages/admin/proyectos/ProyectoDetailPage';
import { MisTareasPage } from './pages/admin/proyectos/MisTareasPage';

// Inventario diario pages
import { ControlDiarioPage } from './pages/admin/inventario/ControlDiarioPage';
import { CatalogoInsumosPage } from './pages/admin/inventario/CatalogoInsumosPage';
import { ReportesInventarioPage } from './pages/admin/inventario/ReportesInventarioPage';

// Cost module pages
import { DashboardCostosPage } from './pages/admin/costos/DashboardCostosPage';
import { ParametrosMODGIFPage } from './pages/admin/costos/ParametrosMODGIFPage';
import { RecipesPage } from './pages/admin/costos/RecipesPage';
import { RecipeEditorPage } from './pages/admin/costos/RecipeEditorPage';
import { CostSheetPage } from './pages/admin/costos/CostSheetPage';
import { DisposablePacksPage } from './pages/admin/costos/DisposablePacksPage';
import { ProjectionsPage } from './pages/admin/costos/ProjectionsPage';
import { ActualResultsPage } from './pages/admin/costos/ActualResultsPage';
import { InventoryPage } from './pages/admin/costos/InventoryPage';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { MenuPage } from './pages/public/MenuPage';
import { TableReservationPage } from './pages/public/TableReservationPage';
import { ReservationSuccessPage } from './pages/public/ReservationSuccessPage';
import { EventsListPage } from './pages/public/EventsListPage';
import { EventDetailPage } from './pages/public/EventDetailPage';
import { DinnerWithStrangersPage } from './pages/public/DinnerWithStrangersPage';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Preserves route params (e.g. :id) when redirecting an old URL to its new location.
function ReplaceRoute({ to }: { to: string }) {
  const params = useParams();
  return <Navigate to={generatePath(to, params)} replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin login (public) */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/products" element={<ProductsPage />} />
            <Route path="/admin/tables" element={<TablesPage />} />
            <Route path="/admin/orders" element={<OrdersPage />} />
            <Route path="/admin/orders/active" element={<ActiveOrdersPage />} />
            <Route path="/admin/billing" element={<BillingPage />} />
            <Route path="/admin/clients" element={<ClientsPage />} />
            <Route path="/admin/providers" element={<ProvidersPage />} />
            <Route path="/admin/events" element={<EventsPage />} />
            <Route path="/admin/reservations" element={<ReservationsPage />} />
            <Route path="/admin/expenses" element={<ExpensesPage />} />
            <Route path="/admin/cashflow" element={<CashFlowPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/mis-tareas" element={<MisTareasPage />} />
            <Route path="/admin/notificaciones" element={<NotificacionesPage />} />
            <Route path="/admin/boletines" element={<RoleGuard roles={['admin', 'superadmin']}><BoletinesPage /></RoleGuard>} />
            <Route path="/admin/proyectos" element={<RoleGuard roles={['admin', 'superadmin']}><ProyectosPage /></RoleGuard>} />
            <Route path="/admin/proyectos/:id" element={<RoleGuard roles={['admin', 'superadmin']}><ProyectoDetailPage /></RoleGuard>} />
            <Route path="/admin/usuarios" element={<RoleGuard roles={['superadmin']}><UsuariosPage /></RoleGuard>} />
            {/* Costos & Finanzas (unifies the former "Costos" and "Inventario" sections — recipes,
                cost sheets, disposable packs, and stock/insumos are the same features either way) */}
            <Route path="/admin/costos/dashboard" element={<RoleGuard roles={['admin', 'superadmin']}><DashboardCostosPage /></RoleGuard>} />
            <Route path="/admin/costos/parametros" element={<RoleGuard roles={['admin', 'superadmin']}><ParametrosMODGIFPage /></RoleGuard>} />
            <Route path="/admin/costos/recetas" element={<RoleGuard roles={['admin', 'superadmin']}><RecipesPage /></RoleGuard>} />
            <Route path="/admin/costos/recetas/:id" element={<RoleGuard roles={['admin', 'superadmin']}><RecipeEditorPage /></RoleGuard>} />
            <Route path="/admin/costos/recetas/:id/ficha" element={<RoleGuard roles={['admin', 'superadmin']}><CostSheetPage /></RoleGuard>} />
            <Route path="/admin/costos/packs-desechables" element={<RoleGuard roles={['admin', 'superadmin']}><DisposablePacksPage /></RoleGuard>} />
            <Route path="/admin/costos/proyecciones/:year" element={<RoleGuard roles={['admin', 'superadmin']}><ProjectionsPage /></RoleGuard>} />
            <Route path="/admin/costos/resultados/:year" element={<RoleGuard roles={['admin', 'superadmin']}><ActualResultsPage /></RoleGuard>} />
            <Route path="/admin/costos/inventario/control" element={<RoleGuard roles={['admin', 'superadmin']}><ControlDiarioPage /></RoleGuard>} />
            <Route path="/admin/costos/inventario/catalogo" element={<RoleGuard roles={['admin', 'superadmin']}><CatalogoInsumosPage /></RoleGuard>} />
            <Route path="/admin/costos/inventario/stock" element={<RoleGuard roles={['admin', 'superadmin']}><InventoryPage /></RoleGuard>} />
            <Route path="/admin/costos/inventario/reportes" element={<RoleGuard roles={['admin', 'superadmin']}><ReportesInventarioPage /></RoleGuard>} />

            {/* Legacy redirects — kept temporarily so old bookmarks/links keep working */}
            <Route path="/admin/inventario/control" element={<Navigate to="/admin/costos/inventario/control" replace />} />
            <Route path="/admin/inventario/alertas" element={<Navigate to="/admin/costos/inventario/stock" replace />} />
            <Route path="/admin/inventario/catalogo" element={<Navigate to="/admin/costos/inventario/catalogo" replace />} />
            <Route path="/admin/inventario/recetas" element={<Navigate to="/admin/costos/recetas" replace />} />
            <Route path="/admin/inventario/recetas/:id" element={<ReplaceRoute to="/admin/costos/recetas/:id" />} />
            <Route path="/admin/inventario/recetas/:id/ficha" element={<ReplaceRoute to="/admin/costos/recetas/:id/ficha" />} />
            <Route path="/admin/inventario/packs-desechables" element={<Navigate to="/admin/costos/packs-desechables" replace />} />
            <Route path="/admin/inventario/stock" element={<Navigate to="/admin/costos/inventario/stock" replace />} />
            <Route path="/admin/inventario/historial" element={<Navigate to="/admin/costos/inventario/control?tab=historial" replace />} />
            <Route path="/admin/inventario/reportes" element={<Navigate to="/admin/costos/inventario/reportes" replace />} />
            <Route path="/admin/costos/inventario" element={<Navigate to="/admin/costos/inventario/stock" replace />} />
          </Route>
        </Route>

        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/reservar/mesa" element={<TableReservationPage />} />
          <Route path="/reservar/mesa/exito" element={<ReservationSuccessPage />} />
          <Route path="/reservar/eventos" element={<EventsListPage />} />
          <Route path="/reservar/eventos/:id" element={<EventDetailPage />} />
          <Route path="/reservar/cena-con-desconocidos" element={<DinnerWithStrangersPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  if (!googleClientId) return <AppRoutes />;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppRoutes />
    </GoogleOAuthProvider>
  );
}
