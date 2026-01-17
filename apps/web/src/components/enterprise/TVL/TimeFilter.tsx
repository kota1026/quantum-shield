'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type TimePeriod = '24h' | '7d' | '30d' | '90d' | '1y';

interface TimeFilterProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  className?: string;
}

const TIME_PERIODS: TimePeriod[] = ['24h', '7d', '30d', '90d', '1y'];

export function TimeFilter({
  selectedPeriod,
  onPeriodChange,
  className,
}: TimeFilterProps) {
  const t = useTranslations('enterprise.tvl.timeFilter');

  return (
    <div
      className={cn(
        'flex gap-1 bg-background-secondary p-1 rounded-lg',
        className
      )}
      role="group"
      aria-label={t('ariaLabel')}
    >
      {TIME_PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onPeriodChange(period)}
          className={cn(
            'px-4 py-2 rounded text-xs font-medium transition-colors',
            selectedPeriod === period
              ? 'bg-background-tertiary text-foreground'
              : 'text-foreground-secondary hover:text-foreground'
          )}
          aria-pressed={selectedPeriod === period}
        >
          {t(`periods.${period}`)}
        </button>
      ))}
    </div>
  );
}

export type { TimePeriod };
