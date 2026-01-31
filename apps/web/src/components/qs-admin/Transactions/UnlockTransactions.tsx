'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Unlock,
  Search,
  Filter,
  Download,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Timer,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useUnlockStats, useUnlockTransactions } from '@/hooks/admin/useTransactions';
import type { UnlockStats } from '@/lib/api/admin/mock';
import type { UnlockTransaction } from '@/lib/api/admin/types';

// Fallback data - Used when API is unavailable
const FALLBACK_STATS: UnlockStats = {
  totalUnlocks: 8920,
  unlockVolume: '45,230 ETH',
  pendingUnlocks: 18,
  avgWaitTime: '23.5 hours',
};

interface FallbackUnlockTransaction {
  id: string;
  user: string;
  amount: string;
  token: string;
  requestTime: string;
  unlockTime: string;
  status: string;
  remainingTime: string;
}

const FALLBACK_UNLOCK_TRANSACTIONS: FallbackUnlockTransaction[] = [
  { id: 'UL-001234', user: '0x1234...5678', amount: '10.5 ETH', token: 'ETH', requestTime: '2024-01-26 14:30', unlockTime: '2024-01-27 14:30', status: 'completed', remainingTime: '-' },
  { id: 'UL-001235', user: '0x2345...6789', amount: '5.0 ETH', token: 'ETH', requestTime: '2024-01-27 10:00', unlockTime: '2024-01-28 10:00', status: 'pending', remainingTime: '19h 30m' },
  { id: 'UL-001236', user: '0x3456...7890', amount: '100.0 ETH', token: 'ETH', requestTime: '2024-01-27 08:00', unlockTime: '2024-01-28 08:00', status: 'pending', remainingTime: '17h 30m' },
  { id: 'UL-001237', user: '0x4567...8901', amount: '50.0 ETH', token: 'ETH', requestTime: '2024-01-26 20:00', unlockTime: '2024-01-27 20:00', status: 'processing', remainingTime: '5h 30m' },
  { id: 'UL-001238', user: '0x5678...9012', amount: '25.0 ETH', token: 'ETH', requestTime: '2024-01-26 12:00', unlockTime: '2024-01-27 12:00', status: 'completed', remainingTime: '-' },
  { id: 'UL-001239', user: '0x6789...0123', amount: '15.0 ETH', token: 'ETH', requestTime: '2024-01-25 14:00', unlockTime: '2024-01-26 14:00', status: 'failed', remainingTime: '-' },
];

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-8 bg-muted rounded w-32 animate-pulse" />
            <div className="h-3 bg-muted rounded w-16 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border">
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-24 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-28 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-28 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-8 bg-muted rounded w-16 animate-pulse" /></td>
    </tr>
  );
}

// Error state component
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertTriangle className="h-8 w-8 text-warning mb-2" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Format timestamp helper
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  waiting: 'bg-warning/10 text-warning',
  processing: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
};

const STATUS_ICONS = {
  pending: Clock,
  waiting: Clock,
  processing: Timer,
  completed: CheckCircle,
  failed: XCircle,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-warning' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className={cn('text-2xl font-bold mt-2', highlight && 'text-warning')}>{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', highlight ? 'bg-warning/10' : 'bg-info/10')}>
            <Icon className={cn('h-6 w-6', highlight ? 'text-warning' : 'text-info')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UnlockTransactions() {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useUnlockStats();
  const transactionsQuery = useUnlockTransactions();

  // Use API data or fallback
  const stats = statsQuery.data ?? FALLBACK_STATS;
  const transactions = transactionsQuery.data?.transactions ?? FALLBACK_UNLOCK_TRANSACTIONS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'pending', label: t('status.pending') },
    { key: 'processing', label: t('status.processing') },
    { key: 'completed', label: t('status.completed') },
    { key: 'failed', label: t('status.failed') },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Map API status to filter status
      const txStatus = tx.status === 'waiting' ? 'pending' : tx.status;
      if (statusFilter !== 'all' && txStatus !== statusFilter) return false;
      const userAddr = 'userAddress' in tx ? tx.userAddress : ('user' in tx ? tx.user : '');
      if (searchQuery && !tx.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !userAddr.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('unlockTitle')}</h1>
            <p className="text-foreground-secondary">{t('unlockSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsQuery.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : statsQuery.isError ? (
          <div className="col-span-4">
            <ErrorState
              message="Failed to load statistics"
              onRetry={() => statsQuery.refetch()}
            />
          </div>
        ) : (
          <>
            <StatCard title={t('stats.totalUnlocks')} value={stats.totalUnlocks.toLocaleString()} icon={Unlock} trend={{ value: 5.2, isPositive: false }} />
            <StatCard title={t('stats.unlockVolume')} value={stats.unlockVolume} icon={Unlock} />
            <StatCard title={t('stats.pendingUnlocks')} value={stats.pendingUnlocks} icon={Clock} highlight />
            <StatCard title={t('stats.avgUnlockAmount')} value={stats.avgWaitTime} icon={Timer} />
          </>
        )}
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('unlockTitle')}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {statusFilters.map((filter) => (
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.id')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.user')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.amount')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.timestamp')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('detail.unlockDate')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.duration')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {transactionsQuery.isLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : transactionsQuery.isError ? (
                  <tr>
                    <td colSpan={8}>
                      <ErrorState
                        message="Failed to load transactions"
                        onRetry={() => transactionsQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const statusKey = tx.status === 'waiting' ? 'pending' : tx.status;
                    const StatusIcon = STATUS_ICONS[statusKey as keyof typeof STATUS_ICONS] || Clock;
                    const userAddr = 'userAddress' in tx ? tx.userAddress : ('user' in tx ? tx.user : '-');
                    const requestTime = 'createdAt' in tx && typeof tx.createdAt === 'number' ? formatTimestamp(tx.createdAt) : ('requestTime' in tx ? tx.requestTime : '-');
                    const unlockTime = 'timelockEnd' in tx && typeof tx.timelockEnd === 'number' ? formatTimestamp(tx.timelockEnd) : ('unlockTime' in tx ? tx.unlockTime : '-');
                    const remainingTime = 'timelockEnd' in tx && typeof tx.timelockEnd === 'number' ? calculateRemainingTime(tx.timelockEnd) : ('remainingTime' in tx ? tx.remainingTime : '-');
                    return (
                      <tr key={tx.id} className="border-b border-border hover:bg-surface transition-colors">
                        <td className="py-3 px-4"><code className="text-sm font-mono text-info">{tx.id}</code></td>
                        <td className="py-3 px-4"><code className="text-sm font-mono">{userAddr}</code></td>
                        <td className="py-3 px-4 font-medium">{tx.amount}</td>
                        <td className="py-3 px-4 text-foreground-secondary">{requestTime}</td>
                        <td className="py-3 px-4 text-foreground-secondary">{unlockTime}</td>
                        <td className="py-3 px-4">
                          {remainingTime !== '-' ? (
                            <span className="text-warning font-medium">{remainingTime}</span>
                          ) : (
                            <span className="text-foreground-tertiary">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[statusKey as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(`status.${statusKey}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/transactions/unlock/${tx.id}`}>
                            <Button variant="outline" size="sm">{tCommon('detail')}</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!transactionsQuery.isLoading && !transactionsQuery.isError && filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('empty.unlock')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate remaining time
function calculateRemainingTime(timelockEnd: number): string {
  const now = Date.now();
  if (timelockEnd <= now) return '-';

  const diff = timelockEnd - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
