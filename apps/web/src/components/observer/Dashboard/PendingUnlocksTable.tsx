'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface PendingUnlock {
  id: string;
  address: string;
  amount: string;
  type: 'normal' | 'emergency';
  timeRemaining: string;
  status: 'pending' | 'monitoring';
}

interface PendingUnlocksTableProps {
  unlocks: PendingUnlock[];
  className?: string;
}

export function PendingUnlocksTable({
  unlocks,
  className,
}: PendingUnlocksTableProps) {
  const t = useTranslations('observer.dashboard.pendingUnlocks');

  const typeBadgeStyles = {
    normal: 'bg-foreground-secondary/15 text-foreground-secondary',
    emergency: 'bg-warning/20 text-warning',
  };

  const statusBadgeStyles = {
    pending: 'bg-foreground-secondary/15 text-foreground-secondary',
    monitoring: 'bg-warning/20 text-warning',
  };

  return (
    <Card variant="default" padding="none" className={cn(className)}>
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">
            {t('title')}
          </h2>
          <div
            className="flex items-center gap-2 text-sm font-medium text-success"
            aria-label="Live updates enabled"
          >
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            {t('live')}
          </div>
        </div>
        <Link
          href="/observer/pending"
          className="text-sm font-medium text-gold hover:text-gold/80 hover:underline transition-colors"
        >
          {t('viewAll')} →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="grid">
          <thead>
            <tr className="border-b border-border/50 bg-background-secondary/50">
              <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-4 py-3.5">
                {t('table.address')}
              </th>
              <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-4 py-3.5">
                {t('table.amount')}
              </th>
              <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-4 py-3.5">
                {t('table.type')}
              </th>
              <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-4 py-3.5">
                {t('table.timeRemaining')}
              </th>
              <th className="text-left text-xs font-semibold text-foreground-secondary uppercase tracking-wider px-4 py-3.5">
                {t('table.status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {unlocks.map((unlock) => (
              <tr
                key={unlock.id}
                className="border-b border-border/30 hover:bg-background-secondary/80 cursor-pointer transition-colors"
                onClick={() => {
                  window.location.href = '/observer/pending';
                }}
                role="row"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.location.href = '/observer/pending';
                  }
                }}
              >
                <td className="px-4 py-4">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {unlock.address}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-base font-bold text-foreground">
                    {unlock.amount}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
                      typeBadgeStyles[unlock.type]
                    )}
                  >
                    {t(`types.${unlock.type}`)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-base font-semibold text-warning">
                    {unlock.timeRemaining}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold',
                      statusBadgeStyles[unlock.status]
                    )}
                  >
                    {t(`statuses.${unlock.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
