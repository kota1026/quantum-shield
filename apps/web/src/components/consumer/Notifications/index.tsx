'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/consumer';
import type { Notification } from '@/lib/api/consumer/mock';

// Notification types
type NotificationType = 'lockComplete' | 'unlockStarted' | 'unlockComplete' | 'emergencyStarted' | 'emergencyComplete' | 'securityAlert' | 'systemUpdate';

// Empty initial state (no fake notifications)
const FALLBACK_NOTIFICATIONS: Notification[] = [];

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ReactNode; iconBg: string }
> = {
  lockComplete: {
    icon: <Lock className="w-5 h-5 text-hinomaru" />,
    iconBg: 'bg-hinomaru/10',
  },
  unlockStarted: {
    icon: <Unlock className="w-5 h-5 text-gold" />,
    iconBg: 'bg-gold/10',
  },
  unlockComplete: {
    icon: <Unlock className="w-5 h-5 text-success" />,
    iconBg: 'bg-success/10',
  },
  emergencyStarted: {
    icon: <AlertTriangle className="w-5 h-5 text-warning" />,
    iconBg: 'bg-warning/10',
  },
  emergencyComplete: {
    icon: <AlertTriangle className="w-5 h-5 text-success" />,
    iconBg: 'bg-success/10',
  },
  securityAlert: {
    icon: <AlertTriangle className="w-5 h-5 text-danger" />,
    iconBg: 'bg-danger/10',
  },
  systemUpdate: {
    icon: <Info className="w-5 h-5 text-foreground-secondary" />,
    iconBg: 'bg-surface-elevated',
  },
};

export function Notifications() {
  const t = useTranslations('consumer.notifications');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Fetch data using hooks
  const { data: notificationsData } = useNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();

  // Use API data with fallback (local state for optimistic updates)
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(FALLBACK_NOTIFICATIONS);
  const notifications = notificationsData?.notifications ?? localNotifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  const handleMarkAllRead = useCallback(() => {
    setLocalNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllReadMutation.mutate();
  }, [markAllReadMutation]);

  const handleMarkRead = useCallback((id: string) => {
    setLocalNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/consumer/settings"
              className={cn(
                'w-11 h-11 flex items-center justify-center',
                'bg-surface border border-border rounded-qs',
                'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
                'transition-all',
                'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
              )}
              aria-label={t('header.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {t('header.title')}
              </h1>
              {unreadCount > 0 && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-semibold rounded-full',
                    'bg-hinomaru text-white'
                  )}
                  aria-label={`${unreadCount}件の未読通知`}
                >
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-sm min-h-[44px]"
            >
              <Check className="w-4 h-4 mr-1" />
              {t('header.markAllRead')}
            </Button>
          )}
        </header>

        {/* Tabs */}
        <div
          className="flex gap-2 mb-6"
          role="tablist"
          aria-label="通知フィルター"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'all'}
            aria-controls="notification-list"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2 min-h-[44px] text-sm font-medium rounded-full transition-all',
              activeTab === 'all'
                ? 'bg-hinomaru/10 border-2 border-hinomaru text-hinomaru'
                : 'bg-surface border border-border text-foreground-secondary hover:border-border-emphasis'
            )}
          >
            {t('tabs.all')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'unread'}
            aria-controls="notification-list"
            onClick={() => setActiveTab('unread')}
            className={cn(
              'px-4 py-2 min-h-[44px] text-sm font-medium rounded-full transition-all',
              activeTab === 'unread'
                ? 'bg-hinomaru/10 border-2 border-hinomaru text-hinomaru'
                : 'bg-surface border border-border text-foreground-secondary hover:border-border-emphasis'
            )}
          >
            {t('tabs.unread')}
            {unreadCount > 0 && (
              <span className="ml-1.5 text-xs">({unreadCount})</span>
            )}
          </button>
        </div>

        {/* Notification List */}
        <div
          id="notification-list"
          role="tabpanel"
          aria-label="通知一覧"
          className="space-y-3"
        >
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-border rounded-qs-xl">
              <Bell className="w-12 h-12 mx-auto mb-4 text-foreground-tertiary opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('emptyState.title')}
              </h3>
              <p className="text-sm text-foreground-tertiary">
                {t('emptyState.description')}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const { icon, iconBg } = TYPE_CONFIG[notification.type];
              const NotificationWrapper = notification.link ? Link : 'div';

              return (
                <NotificationWrapper
                  key={notification.id}
                  href={notification.link || '#'}
                  className={cn(
                    'flex items-start gap-4 p-4',
                    'bg-surface border rounded-qs-lg transition-all',
                    notification.read
                      ? 'border-border'
                      : 'border-hinomaru/30 bg-hinomaru/5',
                    notification.link && 'cursor-pointer hover:border-border-emphasis hover:bg-surface-elevated'
                  )}
                  onClick={
                    !notification.link
                      ? () => handleMarkRead(notification.id)
                      : undefined
                  }
                  aria-label={`${notification.title}: ${notification.message}`}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'w-10 h-10 flex items-center justify-center rounded-qs flex-shrink-0',
                      iconBg
                    )}
                    aria-hidden="true"
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span
                          className="w-2 h-2 rounded-full bg-hinomaru"
                          aria-label={t('item.unread')}
                        />
                      )}
                    </div>
                    <p className="text-sm text-foreground-secondary line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-foreground-tertiary mt-1">
                      {notification.timestamp}
                    </p>
                  </div>

                  {/* Arrow for linked notifications */}
                  {notification.link && (
                    <ChevronRight
                      className="w-5 h-5 text-foreground-tertiary flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </NotificationWrapper>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default Notifications;
