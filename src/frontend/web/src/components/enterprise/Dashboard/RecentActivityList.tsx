'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Lock, Unlock, User, Key } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'lock' | 'unlock' | 'user' | 'api';
  title: string;
  meta: string;
}

interface RecentActivityListProps {
  activities: ActivityItem[];
  className?: string;
}

const ACTIVITY_ICONS = {
  lock: { icon: Lock, style: 'bg-hinomaru/10 text-hinomaru-400' },
  unlock: { icon: Unlock, style: 'bg-gold/10 text-gold' },
  user: { icon: User, style: 'bg-info/10 text-info' },
  api: { icon: Key, style: 'bg-success/10 text-success' },
};

export function RecentActivityList({
  activities,
  className,
}: RecentActivityListProps) {
  const t = useTranslations('enterprise.dashboard.recentActivity');

  return (
    <div
      className={cn(
        'bg-card border border-white/5 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
      </div>

      {/* Activity List */}
      <div className="p-6">
        <ul className="space-y-0" role="list" aria-label={t('ariaLabel')}>
          {activities.map((activity, index) => {
            const { icon: Icon, style } = ACTIVITY_ICONS[activity.type];
            return (
              <li
                key={activity.id}
                className={cn(
                  'flex items-start gap-4 py-4',
                  index !== activities.length - 1 && 'border-b border-white/5'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    style
                  )}
                  aria-hidden="true"
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </div>
                  <div className="text-xs font-mono text-foreground-tertiary">
                    {activity.meta}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
