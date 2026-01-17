'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface FilterState {
  unlockType: string;
  minAmount: string;
  maxAmount: string;
  riskScore: string;
  sortBy: string;
}

interface PendingFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  className?: string;
}

export function PendingFilters({
  filters,
  onFilterChange,
  className,
}: PendingFiltersProps) {
  const t = useTranslations('observer.dashboard.pending.filters');

  const inputClasses = cn(
    'px-3 py-2 bg-background-secondary border border-border rounded-lg',
    'text-sm text-foreground outline-none',
    'focus:border-hinomaru transition-colors'
  );

  return (
    <div className={cn('flex flex-wrap gap-4 mb-6', className)}>
      {/* Unlock Type */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-foreground-tertiary uppercase tracking-wider">
          {t('unlockType.label')}
        </label>
        <select
          className={inputClasses}
          value={filters.unlockType}
          onChange={(e) => onFilterChange('unlockType', e.target.value)}
          aria-label={t('unlockType.label')}
        >
          <option value="all">{t('unlockType.all')}</option>
          <option value="normal">{t('unlockType.normal')}</option>
          <option value="emergency">{t('unlockType.emergency')}</option>
        </select>
      </div>

      {/* Min Amount */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-foreground-tertiary uppercase tracking-wider">
          {t('minAmount.label')}
        </label>
        <input
          type="text"
          className={cn(inputClasses, 'w-[120px]')}
          placeholder={t('minAmount.placeholder')}
          value={filters.minAmount}
          onChange={(e) => onFilterChange('minAmount', e.target.value)}
          aria-label={t('minAmount.label')}
        />
      </div>

      {/* Max Amount */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-foreground-tertiary uppercase tracking-wider">
          {t('maxAmount.label')}
        </label>
        <input
          type="text"
          className={cn(inputClasses, 'w-[120px]')}
          placeholder={t('maxAmount.placeholder')}
          value={filters.maxAmount}
          onChange={(e) => onFilterChange('maxAmount', e.target.value)}
          aria-label={t('maxAmount.label')}
        />
      </div>

      {/* Risk Score */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-foreground-tertiary uppercase tracking-wider">
          {t('riskScore.label')}
        </label>
        <select
          className={inputClasses}
          value={filters.riskScore}
          onChange={(e) => onFilterChange('riskScore', e.target.value)}
          aria-label={t('riskScore.label')}
        >
          <option value="all">{t('riskScore.all')}</option>
          <option value="high">{t('riskScore.high')}</option>
          <option value="medium">{t('riskScore.medium')}</option>
          <option value="low">{t('riskScore.low')}</option>
        </select>
      </div>

      {/* Sort By */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-foreground-tertiary uppercase tracking-wider">
          {t('sortBy.label')}
        </label>
        <select
          className={inputClasses}
          value={filters.sortBy}
          onChange={(e) => onFilterChange('sortBy', e.target.value)}
          aria-label={t('sortBy.label')}
        >
          <option value="timeAsc">{t('sortBy.timeAsc')}</option>
          <option value="amountDesc">{t('sortBy.amountDesc')}</option>
          <option value="riskDesc">{t('sortBy.riskDesc')}</option>
        </select>
      </div>
    </div>
  );
}
