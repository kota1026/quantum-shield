'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock,
  Search,
  Filter,
  Download,
  TrendingUp,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useLockStats, useLockTransactions } from '@/hooks/admin/useTransactions';
import type { LockStats } from '@/lib/api/admin/mock';
import type { LockTransaction } from '@/lib/api/admin/types';

// Fallback data - Used when API is unavailable
const FALLBACK_STATS: LockStats = {
  totalLocks: 12450,
  lockVolume: '125,000 ETH',
  avgLockAmount: '10.04 ETH',
  avgLockDuration: '45 days',
};

interface FallbackLockTransaction {
  id: string;
  userAddress: string;
  amount: string;
  currency: string;
  duration: string;
  status: string;
  createdAt: number;
  prover: string;
}

const FALLBACK_LOCK_TRANSACTIONS: FallbackLockTransaction[] = [
  { id: 'LK-001234', userAddress: '0x1234...5678', amount: '10.5 ETH', currency: 'ETH', duration: '30 days', status: 'active', createdAt: Date.now() - 3600000, prover: 'Prover-A' },
  { id: 'LK-001235', userAddress: '0x2345...6789', amount: '5.0 ETH', currency: 'ETH', duration: '60 days', status: 'confirmed', createdAt: Date.now() - 7200000, prover: 'Prover-B' },
  { id: 'LK-001236', userAddress: '0x3456...7890', amount: '100.0 ETH', currency: 'ETH', duration: '90 days', status: 'pending', createdAt: Date.now() - 10800000, prover: '-' },
  { id: 'LK-001237', userAddress: '0x4567...8901', amount: '50.0 ETH', currency: 'ETH', duration: '30 days', status: 'active', createdAt: Date.now() - 14400000, prover: 'Prover-C' },
  { id: 'LK-001238', userAddress: '0x5678...9012', amount: '25.0 ETH', currency: 'ETH', duration: '180 days', status: 'unlocked', createdAt: Date.now() - 18000000, prover: '-' },
  { id: 'LK-001239', userAddress: '0x6789...0123', amount: '15.0 ETH', currency: 'ETH', duration: '30 days', status: 'active', createdAt: Date.now() - 21600000, prover: 'Prover-A' },
  { id: 'LK-001240', userAddress: '0x7890...1234', amount: '8.5 ETH', currency: 'ETH', duration: '60 days', status: 'pending', createdAt: Date.now() - 25200000, prover: '-' },
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
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-28 animate-pulse" /></td>
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
  processing: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
};

const STATUS_ICONS = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  failed: XCircle,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}%
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-success" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LockTransactions() {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useLockStats();
  const transactionsQuery = useLockTransactions();

  // Use API data or fallback
  const stats = statsQuery.data ?? FALLBACK_STATS;
  const transactions = transactionsQuery.data?.transactions ?? FALLBACK_LOCK_TRANSACTIONS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.completed') },
    { key: 'pending', label: t('status.pending') },
    { key: 'confirmed', label: t('status.processing') },
    { key: 'unlocked', label: t('status.failed') },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      const userAddr = 'userAddress' in tx ? tx.userAddress : '';
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
            <h1 className="text-2xl font-bold text-foreground">{t('lockTitle')}</h1>
            <p className="text-foreground-secondary">{t('lockSubtitle')}</p>
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
            <StatCard title={t('stats.totalLocks')} value={stats.totalLocks.toLocaleString()} icon={Lock} trend={{ value: 12.5, isPositive: true }} />
            <StatCard title={t('stats.lockVolume')} value={stats.lockVolume} icon={Lock} trend={{ value: 8.3, isPositive: true }} />
            <StatCard title={t('stats.avgLockAmount')} value={stats.avgLockAmount} icon={Lock} />
            <StatCard title={t('stats.avgLockDuration')} value={stats.avgLockDuration} icon={Lock} />
          </>
        )}
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('lockTitle')}</CardTitle>
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
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.duration')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.prover')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.timestamp')}</th>
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
                    const statusKey = tx.status === 'active' ? 'completed' : tx.status === 'confirmed' ? 'processing' : tx.status === 'unlocked' ? 'failed' : tx.status;
                    const StatusIcon = STATUS_ICONS[statusKey as keyof typeof STATUS_ICONS] || Clock;
                    const userAddr = 'userAddress' in tx ? tx.userAddress : '-';
                    const duration = 'duration' in tx ? tx.duration : '-';
                    const prover = 'prover' in tx ? tx.prover : '-';
                    return (
                      <tr key={tx.id} className="border-b border-border hover:bg-surface transition-colors">
                        <td className="py-3 px-4"><code className="text-sm font-mono text-success">{tx.id}</code></td>
                        <td className="py-3 px-4"><code className="text-sm font-mono">{userAddr}</code></td>
                        <td className="py-3 px-4 font-medium">{tx.amount}</td>
                        <td className="py-3 px-4 text-foreground-secondary">{duration}</td>
                        <td className="py-3 px-4 text-foreground-secondary">{prover}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[statusKey as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(`status.${statusKey}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">
                          {typeof tx.createdAt === 'number' ? formatTimestamp(tx.createdAt) : tx.createdAt}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/transactions/lock/${tx.id}`} className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors">
                            {tCommon('detail')}
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
            <div className="text-center py-8 text-foreground-secondary">{t('empty.lock')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
