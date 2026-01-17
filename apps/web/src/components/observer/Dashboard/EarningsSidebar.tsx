'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EarningsSidebarProps {
  claimableAmount: string;
  className?: string;
}

export function EarningsSidebar({
  claimableAmount,
  className,
}: EarningsSidebarProps) {
  const t = useTranslations('observer.dashboard.claimableEarnings');

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
      <div className="text-center py-6">
        <div className="text-[32px] font-bold text-success">
          {claimableAmount}
        </div>
        <div className="text-xs text-foreground-tertiary mt-1">
          {t('available')}
        </div>
      </div>
      <Link href="/observer/earnings">
        <button
          className={cn(
            'w-full py-3 rounded-lg font-semibold text-sm text-white',
            'bg-gradient-to-r from-hinomaru to-hinomaru-400',
            'hover:translate-y-[-2px] hover:shadow-glow-hinomaru transition-all'
          )}
          aria-label={t('claimButton')}
        >
          {t('claimButton')}
        </button>
      </Link>
    </div>
  );
}
