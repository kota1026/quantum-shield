'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, History as HistoryIcon } from 'lucide-react';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HistoryStats, HistoryStatsData } from './HistoryStats';
import { FilterTabs, FilterType } from './FilterTabs';
import { HistoryItem, HistoryTransaction, TransactionType, TransactionStatus } from './HistoryItem';
import { useUserDashboard, useUserTransactions } from '@/hooks/consumer';

// Empty state defaults (no mock data - shows real empty state)
const EMPTY_STATS: HistoryStatsData = {
  totalLocked: '0',
  totalLockedUnit: 'ETH',
  totalTransactions: 0,
  inProgress: 0,
};

// Mapping filter types to transaction types
const FILTER_TO_TYPES: Record<FilterType, TransactionType[] | null> = {
  all: null,
  lock: ['lock'],
  unlock: ['unlockComplete'],
  pending: ['normalUnlock'],
  emergency: ['emergencyUnlock'],
};

// Map API transaction type to component type
function mapTxType(txType: string): TransactionType {
  switch (txType) {
    case 'lock': return 'lock';
    case 'normal_unlock': return 'normalUnlock';
    case 'emergency_unlock': return 'emergencyUnlock';
    default: return 'lock';
  }
}

export function History() {
  const t = useTranslations('consumer.history');
  const router = useRouter();

  // Fetch data using new API hooks
  const { data: dashboardData } = useUserDashboard();
  const { data: txData } = useUserTransactions({ perPage: 50 });

  // Transform API data to component format (empty defaults, no mock data)
  const historyStats: HistoryStatsData = dashboardData ? {
    // Convert totalLocked to ETH - handle both wei format (integer string) and ETH format (decimal string)
    totalLocked: (() => {
      const total = dashboardData.totalLocked || '0';
      try {
        if (total.includes('.')) {
          // Already in ETH format
          return parseFloat(total).toString();
        } else {
          // In wei format - convert to ETH
          return parseFloat(formatEther(BigInt(total))).toString();
        }
      } catch {
        return parseFloat(total).toString();
      }
    })(),
    totalLockedUnit: 'ETH',
    totalTransactions: txData?.total || 0,
    inProgress: dashboardData.pendingUnlocks || 0,
  } : EMPTY_STATS;

  const historyTransactions: HistoryTransaction[] = (txData?.transactions || []).map(tx => {
    // Convert amount to ETH - handle both wei format (integer string) and ETH format (decimal string)
    let formattedAmount: string;
    try {
      // Check if amount contains a decimal point (already in ETH format)
      if (tx.amount.includes('.')) {
        // Already in ETH format
        formattedAmount = parseFloat(tx.amount).toString();
      } else {
        // In wei format - convert to ETH
        const amountEth = formatEther(BigInt(tx.amount));
        formattedAmount = parseFloat(amountEth).toString();
      }
    } catch {
      // Fallback: try parsing as float directly
      formattedAmount = parseFloat(tx.amount).toString();
    }

    return {
      id: tx.id,
      type: mapTxType(tx.txType),
      status: (tx.status === 'completed' ? 'complete' : 'pending24h') as TransactionStatus,
      amount: `${formattedAmount} ETH`,
      timestamp: new Date(tx.createdAt * 1000).toLocaleString('ja-JP'),
      txHash: tx.l1TxHash || '0x...',
      blockConfirmed: tx.status === 'completed' ? 12 : undefined,
      remainingTime: tx.releaseTime ? `${Math.max(0, Math.floor((tx.releaseTime * 1000 - Date.now()) / 3600000))}h` : undefined,
    };
  });

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredTransactions = useMemo(() => {
    const allowedTypes = FILTER_TO_TYPES[activeFilter];
    if (!allowedTypes) return historyTransactions;
    return historyTransactions.filter((tx) => allowedTypes.includes(tx.type));
  }, [activeFilter, historyTransactions]);

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
      <main role="main" className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/consumer/dashboard"
              className={cn(
                'w-11 h-11 flex items-center justify-center',
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
              'flex items-center gap-2 px-5 py-2.5 min-h-[44px]',
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
        <HistoryStats stats={historyStats} className="mb-6" />

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
      </main>
    </div>
  );
}

export default History;
export type { HistoryTransaction, HistoryStatsData, FilterType };
