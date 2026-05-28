import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { PublicLayout } from './components/layout/PublicLayout';

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

export default function App() {
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
            {/* Cost module */}
            <Route path="/admin/costos/dashboard" element={<DashboardCostosPage />} />
            <Route path="/admin/costos/parametros" element={<ParametrosMODGIFPage />} />
            <Route path="/admin/costos/recetas" element={<RecipesPage />} />
            <Route path="/admin/costos/recetas/:id" element={<RecipeEditorPage />} />
            <Route path="/admin/costos/recetas/:id/ficha" element={<CostSheetPage />} />
            <Route path="/admin/costos/packs-desechables" element={<DisposablePacksPage />} />
            <Route path="/admin/costos/proyecciones/:year" element={<ProjectionsPage />} />
            <Route path="/admin/costos/resultados/:year" element={<ActualResultsPage />} />
            <Route path="/admin/costos/inventario" element={<InventoryPage />} />
            {/* Inventario diario */}
            <Route path="/admin/inventario/control" element={<ControlDiarioPage />} />
            <Route path="/admin/inventario/alertas" element={<InventoryPage />} />
            <Route path="/admin/inventario/catalogo" element={<CatalogoInsumosPage />} />
            <Route path="/admin/inventario/recetas" element={<RecipesPage />} />
            <Route path="/admin/inventario/recetas/:id" element={<RecipeEditorPage />} />
            <Route path="/admin/inventario/recetas/:id/ficha" element={<CostSheetPage />} />
            <Route path="/admin/inventario/packs-desechables" element={<DisposablePacksPage />} />
            <Route path="/admin/inventario/stock" element={<InventoryPage />} />
            <Route path="/admin/inventario/historial" element={<ControlDiarioPage initialTab="historial" />} />
            <Route path="/admin/inventario/reportes" element={<ReportesInventarioPage />} />
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
