'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'warning' | 'offline';
  value?: string;
}

interface SystemStatusListProps {
  systems: SystemStatus[];
  className?: string;
}

const STATUS_STYLES = {
  online: 'bg-success shadow-[0_0_8px_theme(colors.success)]',
  warning: 'bg-warning',
  offline: 'bg-danger',
};

export function SystemStatusList({
  systems,
  className,
}: SystemStatusListProps) {
  const t = useTranslations('enterprise.dashboard.systemStatus');

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

      {/* Status List */}
      <div className="p-6">
        <ul className="space-y-2" role="list" aria-label={t('ariaLabel')}>
          {systems.map((system) => (
            <li
              key={system.id}
              className="flex items-center justify-between py-2"
            >
              <span className="text-sm text-foreground-secondary">{system.name}</span>
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    STATUS_STYLES[system.status]
                  )}
                  role="img"
                  aria-label={t(`statuses.${system.status}`)}
                />
                <span>{system.value || t(`statuses.${system.status}`)}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
