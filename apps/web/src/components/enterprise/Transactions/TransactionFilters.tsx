'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export type TransactionType = 'all' | 'lock' | 'unlock' | 'emergency';
export type TransactionStatus = 'all' | 'complete' | 'pending' | 'failed';

interface TransactionFiltersProps {
  type: TransactionType;
  status: TransactionStatus;
  dateFrom: string;
  dateTo: string;
  searchQuery: string;
  onTypeChange: (type: TransactionType) => void;
  onStatusChange: (status: TransactionStatus) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onSearchChange: (query: string) => void;
  onApplyFilters: () => void;
}

export function TransactionFilters({
  type,
  status,
  dateFrom,
  dateTo,
  searchQuery,
  onTypeChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  onSearchChange,
  onApplyFilters,
}: TransactionFiltersProps) {
  const t = useTranslations('enterprise.transactions.filters');

  return (
    <div
      className="flex flex-wrap items-center gap-4 mb-6"
      role="search"
      aria-label={t('ariaLabel')}
    >
      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="filter-type" className="text-xs text-muted-foreground">
          {t('type.label')}:
        </label>
        <select
          id="filter-type"
          value={type}
          onChange={(e) => onTypeChange(e.target.value as TransactionType)}
          className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-hinomaru"
        >
          <option value="all">{t('type.all')}</option>
          <option value="lock">{t('type.lock')}</option>
          <option value="unlock">{t('type.unlock')}</option>
          <option value="emergency">{t('type.emergency')}</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="filter-status" className="text-xs text-muted-foreground">
          {t('status.label')}:
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as TransactionStatus)}
          className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-hinomaru"
        >
          <option value="all">{t('status.all')}</option>
          <option value="complete">{t('status.complete')}</option>
          <option value="pending">{t('status.pending')}</option>
          <option value="failed">{t('status.failed')}</option>
        </select>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <label htmlFor="filter-date-from" className="text-xs text-muted-foreground">
          {t('date.label')}:
        </label>
        <input
          type="date"
          id="filter-date-from"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-hinomaru"
          aria-label={t('date.from')}
        />
        <span className="text-muted-foreground">{t('date.to')}</span>
        <input
          type="date"
          id="filter-date-to"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-hinomaru"
          aria-label={t('date.toDate')}
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="pl-10 pr-4 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm text-foreground w-[200px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-hinomaru"
            aria-label={t('search.ariaLabel')}
          />
        </div>
      </div>

      {/* Apply Button */}
      <Button onClick={onApplyFilters} variant="primary">
        {t('apply')}
      </Button>
    </div>
  );
}
