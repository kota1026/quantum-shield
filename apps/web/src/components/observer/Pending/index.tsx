'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { PendingFilters } from './PendingFilters';
import { PendingUnlockRow } from './PendingUnlockRow';
import { Pagination } from './Pagination';
import { Card } from '@/components/ui/card';
import { usePendingUnlocks } from '@/hooks/observer';

export function PendingMonitor() {
  const t = useTranslations('observer.dashboard.pending');

  // Fetch data using hooks
  const { data: pendingUnlocksApi, isLoading, error } = usePendingUnlocks();

  const pendingUnlocks = pendingUnlocksApi?.items ?? [];
  const totalItems = pendingUnlocksApi?.total ?? 0;

  const [filters, setFilters] = useState({
    unlockType: 'all',
    minAmount: '',
    maxAmount: '',
    riskScore: 'all',
    sortBy: 'timeAsc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      <main
        className="relative z-10 max-w-[1400px] mx-auto px-8 py-8"
        role="main"
        aria-label={t('pageTitle')}
      >
        {/* Header */}
        <ObserverHeader />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground">
            {t('pageTitle')}
          </h1>
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2',
              'bg-success/10 border border-success rounded-full',
              'text-success text-xs font-medium'
            )}
            role="status"
            aria-label={t('liveMonitoring')}
          >
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            {t('liveMonitoring')}
          </div>
        </div>

        {/* Filters */}
        <PendingFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-foreground-tertiary">{t('loading')}</div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-12 text-warning">{t('error')}</div>
        )}

        {/* Data Table */}
        {!isLoading && !error && (
        <Card variant="default" padding="none">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr className="border-b border-border/30 bg-background-secondary">
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.userAddress')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.amount')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.type')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.timeRemaining')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.risk')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.status')}
                  </th>
                  <th className="text-left text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider px-4 py-3">
                    {t('table.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingUnlocks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-foreground-tertiary">
                      {t('empty')}
                    </td>
                  </tr>
                ) : (
                  pendingUnlocks.map((unlock) => (
                    <PendingUnlockRow key={unlock.id} unlock={unlock} />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
          )}
        </Card>
        )}
      </main>
    </div>
  );
}
