'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ChallengeStatsSidebarProps {
  successful: number;
  failed: number;
  className?: string;
}

export function ChallengeStatsSidebar({
  successful,
  failed,
  className,
}: ChallengeStatsSidebarProps) {
  const t = useTranslations('observer.dashboard.challengeStats');
  const total = successful + failed;
  const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : '0';

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
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-background-secondary rounded-lg">
          <div className="text-2xl font-bold text-success">{successful}</div>
          <div className="text-[11px] text-foreground-tertiary mt-1">
            {t('successful')}
          </div>
        </div>
        <div className="text-center p-4 bg-background-secondary rounded-lg">
          <div className="text-2xl font-bold text-danger">{failed}</div>
          <div className="text-[11px] text-foreground-tertiary mt-1">
            {t('failed')}
          </div>
        </div>
      </div>
      <div className="text-center mt-4 text-sm text-foreground-secondary">
        {t('successRate')}:{' '}
        <span className="text-success font-semibold">{successRate}%</span>
      </div>
    </div>
  );
}
