'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface HistoryStatsData {
  totalLocked: string;
  totalLockedUnit: string;
  totalTransactions: number;
  inProgress: number;
}

interface HistoryStatsProps {
  stats: HistoryStatsData;
  className?: string;
}

export function HistoryStats({ stats, className }: HistoryStatsProps) {
  const t = useTranslations('consumer.history');

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-3 gap-4',
        className
      )}
      role="region"
      aria-label={t('stats.totalLocked')}
    >
      {/* Total Locked */}
      <div
        className={cn(
          'bg-surface border border-border rounded-qs-lg p-5',
          'transition-all'
        )}
      >
        <p className="text-xs text-foreground-tertiary mb-2">
          {t('stats.totalLocked')}
        </p>
        <p className="text-2xl font-bold font-mono text-hinomaru">
          {stats.totalLocked}
          <span className="text-sm text-foreground-secondary font-medium ml-1">
            {stats.totalLockedUnit}
          </span>
        </p>
      </div>

      {/* Total Transactions */}
      <div
        className={cn(
          'bg-surface border border-border rounded-qs-lg p-5',
          'transition-all'
        )}
      >
        <p className="text-xs text-foreground-tertiary mb-2">
          {t('stats.totalTransactions')}
        </p>
        <p className="text-2xl font-bold font-mono text-foreground">
          {stats.totalTransactions}
        </p>
      </div>

      {/* In Progress */}
      <div
        className={cn(
          'bg-surface border border-border rounded-qs-lg p-5',
          'transition-all'
        )}
      >
        <p className="text-xs text-foreground-tertiary mb-2">
          {t('stats.inProgress')}
        </p>
        <p className="text-2xl font-bold font-mono text-foreground">
          {stats.inProgress}
        </p>
      </div>
    </div>
  );
}

export default HistoryStats;
