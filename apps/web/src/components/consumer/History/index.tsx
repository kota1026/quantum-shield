'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HistoryStats, HistoryStatsData } from './HistoryStats';
import { FilterTabs, FilterType } from './FilterTabs';
import { HistoryItem, HistoryTransaction, TransactionType } from './HistoryItem';

// Demo data - In production, this would come from API/hooks
const DEMO_STATS: HistoryStatsData = {
  totalLocked: '24.85',
  totalLockedUnit: 'ETH',
  totalTransactions: 15,
  inProgress: 2,
};

const DEMO_TRANSACTIONS: HistoryTransaction[] = [
  {
    id: '1',
    type: 'lock',
    status: 'complete',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    txHash: '0x7a3f...9c2d',
    blockConfirmed: 12,
  },
  {
    id: '2',
    type: 'normalUnlock',
    status: 'pending24h',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    txHash: '0x8b4c...1e5f',
    remainingTime: '23:41:02',
  },
  {
    id: '3',
    type: 'emergencyUnlock',
    status: 'pending7d',
    amount: '0.75 ETH',
    timestamp: '2026-01-04 18:00',
    txHash: '0x2d7a...4f8b',
    bondAmount: '0.5 ETH',
  },
  {
    id: '4',
    type: 'unlockComplete',
    status: 'complete',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    txHash: '0x5e9c...3a7d',
    blockConfirmed: 12,
  },
  {
    id: '5',
    type: 'lock',
    status: 'complete',
    amount: '10.00 ETH',
    timestamp: '2026-01-02 10:20',
    txHash: '0x1f4a...8c2e',
    blockConfirmed: 12,
  },
  {
    id: '6',
    type: 'lock',
    status: 'complete',
    amount: '5.35 ETH',
    timestamp: '2026-01-01 08:00',
    txHash: '0x9b3e...7d1a',
    blockConfirmed: 12,
  },
];

// Mapping filter types to transaction types
const FILTER_TO_TYPES: Record<FilterType, TransactionType[] | null> = {
  all: null,
  lock: ['lock'],
  unlock: ['unlockComplete'],
  pending: ['normalUnlock'],
  emergency: ['emergencyUnlock'],
};

export function History() {
  const t = useTranslations('consumer.history');
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredTransactions = useMemo(() => {
    const allowedTypes = FILTER_TO_TYPES[activeFilter];
    if (!allowedTypes) return DEMO_TRANSACTIONS;
    return DEMO_TRANSACTIONS.filter((tx) => allowedTypes.includes(tx.type));
  }, [activeFilter]);

  const handleExportCSV = useCallback(() => {
    alert(t('header.exportNotAvailable'));
  }, [t]);

  const handleLoadMore = useCallback(() => {
    alert(t('loadMoreNotAvailable'));
  }, [t]);

  const handleTransactionClick = useCallback((tx: HistoryTransaction) => {
    router.push(`/consumer/history/${tx.id}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/consumer/dashboard"
              className={cn(
                'w-10 h-10 flex items-center justify-center',
                'bg-surface border border-border rounded-qs',
                'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
                'transition-all'
              )}
              aria-label={t('header.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              {t('header.title')}
            </h1>
          </div>
          <button
            onClick={handleExportCSV}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary text-sm font-medium',
              'hover:border-gold hover:text-gold transition-all',
              'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold'
            )}
            aria-label={t('header.export')}
          >
            <FileText className="w-4 h-4" />
            {t('header.export')}
          </button>
        </header>

        {/* Stats Row */}
        <HistoryStats stats={DEMO_STATS} className="mb-6" />

        {/* Filter Tabs */}
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          className="mb-6"
        />

        {/* History List */}
        <div
          id="history-list"
          role="tabpanel"
          aria-label="Transaction history"
          className="space-y-3"
        >
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-16 bg-surface border border-border rounded-qs-xl">
              <HistoryIcon
                className="w-12 h-12 mx-auto mb-4 text-foreground-tertiary opacity-50"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {t('emptyState.title')}
              </h3>
              <p className="text-sm text-foreground-tertiary">
                {t('emptyState.description')}
              </p>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <HistoryItem
                key={transaction.id}
                transaction={transaction}
                onClick={handleTransactionClick}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {filteredTransactions.length > 0 && (
          <Button
            variant="ghost"
            fullWidth
            onClick={handleLoadMore}
            className="mt-4"
          >
            {t('loadMore')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default History;
export type { HistoryTransaction, HistoryStatsData, FilterType };
