import { useLocation, Link } from 'react-router-dom';
import { Bell, ClipboardList, FolderOpen, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types';

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
  '/admin/proyectos': 'Proyectos',
  '/admin/mis-tareas': 'Mis tareas',
  '/admin/notificaciones': 'Notificaciones',
  '/admin/usuarios': 'Usuarios',
};

function notificationIcon(notification: Notification) {
  if (notification.entityType === 'task') return <ClipboardList size={16} />;
  if (notification.entityType === 'project') return <FolderOpen size={16} />;
  return <Bell size={16} />;
}

export function Topbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications(10);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) await markAsRead(notification._id);
    setNotificationsOpen(false);
    if (notification.linkTo) navigate(notification.linkTo);
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative text-stone hover:text-espresso transition-colors p-1.5 rounded-lg hover:bg-surface-tint"
            aria-label="Ver notificaciones"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-error text-cream text-[10px] font-bold flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] bg-white border border-rule rounded-lg shadow-xl z-40 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-rule">
                <h2 className="font-body font-semibold text-espresso">Notificaciones</h2>
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-stone hover:text-espresso"
                >
                  Marcar todas como leídas
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-rule">
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-surface-tint transition-colors ${notification.isRead ? 'bg-white' : 'bg-cream'}`}
                  >
                    <div className="flex gap-3">
                      <span className={`${notification.isRead ? 'text-stone' : 'text-lagoon'} mt-0.5`}>
                        {notificationIcon(notification)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${notification.isRead ? 'font-medium text-ink' : 'font-bold text-espresso'}`}>
                          {notification.title}
                        </span>
                        <span className="block text-xs text-stone mt-1 line-clamp-2">{notification.message}</span>
                        <span className="block text-[11px] text-stone mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </span>
                      {!notification.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-lagoon shrink-0" />}
                    </div>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-stone">
                    <Bell size={24} className="mx-auto mb-2 text-rule-strong" />
                    Sin notificaciones por ahora
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setNotificationsOpen(false); navigate('/admin/notificaciones'); }}
                className="w-full px-4 py-3 text-sm text-espresso font-medium hover:bg-surface-tint border-t border-rule"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>
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
