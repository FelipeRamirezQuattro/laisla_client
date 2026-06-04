import { Bell, ClipboardList, FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../hooks/useToast';
import { formatDateTime } from '../../utils/formatDate';
import type { Notification } from '../../types';

function iconFor(notification: Notification) {
  if (notification.entityType === 'task') return <ClipboardList size={18} />;
  if (notification.entityType === 'project') return <FolderOpen size={18} />;
  return <Bell size={18} />;
}

export function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({ page: 1, limit: 50, onlyUnread });
      setNotifications(res.data.notifications);
    } catch {
      toast.error('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, [onlyUnread]);

  const openNotification = async (notification: Notification) => {
    if (!notification.isRead) await notificationsApi.markAsRead(notification._id);
    if (notification.linkTo) navigate(notification.linkTo);
    else fetchNotifications();
  };

  const markAll = async () => {
    await notificationsApi.markAllAsRead();
    toast.success('Notificaciones marcadas como leídas');
    fetchNotifications();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-body text-2xl font-bold text-espresso">Notificaciones</h1>
          <p className="text-stone font-body text-sm">{notifications.length} notificaciones</p>
        </div>
        <div className="flex gap-2">
          <Button variant={onlyUnread ? 'primary' : 'secondary'} onClick={() => setOnlyUnread((value) => !value)}>
            {onlyUnread ? 'Ver todas' : 'No leídas'}
          </Button>
          <Button variant="secondary" onClick={markAll}>Marcar todas como leídas</Button>
        </div>
      </div>

      {loading ? <PageLoader /> : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-rule">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => openNotification(notification)}
                className={`w-full text-left px-5 py-4 transition-colors hover:bg-surface-tint ${notification.isRead ? 'bg-white' : 'bg-cream'}`}
              >
                <div className="flex gap-3">
                  <div className={`mt-1 ${notification.isRead ? 'text-stone' : 'text-lagoon'}`}>
                    {iconFor(notification)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className={`font-body text-sm ${notification.isRead ? 'font-medium text-ink' : 'font-bold text-espresso'}`}>
                        {notification.title}
                      </h2>
                      {!notification.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-lagoon shrink-0" />}
                    </div>
                    <p className={`mt-1 text-sm ${notification.isRead ? 'text-stone' : 'text-ink'}`}>{notification.message}</p>
                    <p className="mt-2 text-xs text-stone">{formatDateTime(notification.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
            {notifications.length === 0 && (
              <div className="py-14 text-center text-stone">
                <Bell className="mx-auto mb-3 text-rule-strong" size={30} />
                Sin notificaciones por ahora
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
