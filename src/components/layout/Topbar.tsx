import { useLocation, Link } from 'react-router-dom';
import { Banknote, Bell, ChevronDown, ClipboardList, FolderOpen, KeyRound, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useShiftStore } from '../../store/shiftStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNotifications } from '../../hooks/useNotifications';
import { buildBreadcrumbMap } from '../../config/adminNav';
import { ChangePasswordModal } from './ChangePasswordModal';
import type { Notification } from '../../types';

const breadcrumbMap = buildBreadcrumbMap();

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications(10);
  const { openShift, refresh: refreshShift } = useShiftStore();

  useEffect(() => {
    if (!user) return;
    refreshShift();
    const intervalId = window.setInterval(refreshShift, 30000);
    return () => window.clearInterval(intervalId);
  }, [user, refreshShift]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="h-16 bg-white border-b border-island-blue/20 flex items-center justify-between px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-island-dark/70 hover:text-island-dark transition-colors"
          aria-label="Mostrar u ocultar menú"
        >
          <Menu size={24} />
        </button>
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm font-body">
          <Link to="/admin" className="text-island-dark/70 hover:text-island-dark transition-colors">
            Inicio
          </Link>
          {pathname !== '/admin' && (
            <>
              <span className="text-island-dark/70">/</span>
              <span className="text-island-dark font-medium">{pageName}</span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin/caja')}
          className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-body font-medium transition-colors ${
            openShift
              ? 'bg-success-tint text-success-ink hover:bg-success-tint/80'
              : 'bg-warning-tint text-warning-ink hover:bg-warning-tint/80'
          }`}
        >
          <Banknote size={14} />
          {openShift
            ? `Turno abierto · ${typeof openShift.openedBy === 'object' ? openShift.openedBy.name : 'Responsable'}`
            : 'Sin turno abierto'}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative text-island-dark/70 hover:text-island-dark transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Ver notificaciones"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] bg-white border border-island-blue/20 rounded-lg shadow-xl z-40 overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-island-blue/20">
                <h2 className="font-body font-semibold text-island-dark">Notificaciones</h2>
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-island-dark/70 hover:text-island-dark"
                >
                  Marcar todas como leídas
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-island-blue/20">
                {notifications.map((notification) => (
                  <button
                    key={notification._id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${notification.isRead ? 'bg-white' : 'bg-gray-100'}`}
                  >
                    <div className="flex gap-3">
                      <span className={`${notification.isRead ? 'text-island-dark/70' : 'text-island-blue'} mt-0.5`}>
                        {notificationIcon(notification)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm ${notification.isRead ? 'font-medium text-island-dark' : 'font-bold text-island-dark'}`}>
                          {notification.title}
                        </span>
                        <span className="block text-xs text-island-dark/70 mt-1 line-clamp-2">{notification.message}</span>
                        <span className="block text-[11px] text-island-dark/70 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                        </span>
                      </span>
                      {!notification.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-island-blue shrink-0" />}
                    </div>
                  </button>
                ))}
                {notifications.length === 0 && (
                  <div className="px-4 py-10 text-center text-sm text-island-dark/70">
                    <Bell size={24} className="mx-auto mb-2 text-island-blue/40" />
                    Sin notificaciones por ahora
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setNotificationsOpen(false); navigate('/admin/notificaciones'); }}
                className="w-full px-4 py-3 text-sm text-island-dark font-medium hover:bg-gray-100 border-t border-island-blue/20"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            aria-label="Menú de usuario"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-island-dark font-body">{user?.name}</p>
              <p className="text-xs text-island-dark/70 font-body capitalize">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-island-dark flex items-center justify-center text-white text-sm font-medium font-body">
              {user?.avatarInitials || user?.name?.charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={16} className={`hidden sm:block text-island-dark/50 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-island-blue/20 rounded-lg shadow-xl z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-island-blue/20">
                <p className="text-sm font-medium text-island-dark truncate">{user?.name}</p>
                <p className="text-xs text-island-dark/70 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); setPasswordModalOpen(true); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-island-dark hover:bg-gray-100 transition-colors"
              >
                <KeyRound size={16} /> Cambiar contraseña
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error-ink hover:bg-error-tint transition-colors"
              >
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
      <ChangePasswordModal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} />
    </header>
  );
}
