'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
        'bg-card border border-border/50 rounded-xl p-6',
        className
      )}
    >
      <h3 className="text-base font-bold text-foreground mb-4">
        {t('title')}
      </h3>
      <div className="text-center py-6">
        <div className="text-[36px] font-bold text-success tracking-tight">
          {claimableAmount}
        </div>
        <div className="text-sm text-foreground-secondary mt-2">
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
