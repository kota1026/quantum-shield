'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ObserverStakeSidebarProps {
  stakeAmount: string;
  activeSince: string;
  className?: string;
}

export function ObserverStakeSidebar({
  stakeAmount,
  activeSince,
  className,
}: ObserverStakeSidebarProps) {
  const t = useTranslations('observer.dashboard.observerStake');

  return (
    <div
      className={cn(
        'bg-card border border-border/30 rounded-xl p-6',
        className
      )}
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {t('title')}
      </h3>
      <div className="flex justify-between items-center">
        <div>
          <div className="text-2xl font-bold text-foreground">{stakeAmount}</div>
          <div className="text-xs text-foreground-tertiary">
            {t('activeSince')}: {activeSince}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success">
          {t('statusActive')}
        </span>
      </div>
    </div>
  );
}
