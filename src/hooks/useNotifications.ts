import { useCallback, useEffect, useState } from 'react';
import { notificationsApi } from '../api/notifications';
import { useAuthStore } from '../store/authStore';
import type { Notification } from '../types';

export function useNotifications(limit = 10) {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationsApi.getAll({ page: 1, limit });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, limit]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    const res = await notificationsApi.getUnreadCount();
    setUnreadCount(res.data.unreadCount);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refetch();
    const intervalId = window.setInterval(refreshUnreadCount, 30000);
    return () => window.clearInterval(intervalId);
  }, [isAuthenticated, refetch, refreshUnreadCount]);

  const markAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    await refetch();
  };

  const markAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    await refetch();
  };

  return { unreadCount, notifications, loading, markAsRead, markAllAsRead, refetch };
}
