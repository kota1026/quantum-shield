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
        'bg-card border border-border/50 rounded-xl p-6',
        className
      )}
    >
      <h3 className="text-base font-bold text-foreground mb-4">
        {t('title')}
      </h3>
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[28px] font-bold text-foreground">{stakeAmount}</div>
          <div className="text-sm text-foreground-secondary mt-1">
            {t('activeSince')}: {activeSince}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success">
          {t('statusActive')}
        </span>
      </div>
    </div>
  );
}
