'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock,
  Unlock,
  AlertTriangle,
  Shield,
  Search,
  Filter,
  Download,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  useTransactionStats,
  useAllTransactions,
  type CombinedTransaction,
} from '@/hooks/admin/useTransactions';
import type { TransactionStats } from '@/lib/api/admin/mock';

// Fallback data - Used when API is unavailable
const FALLBACK_STATS: TransactionStats = {
  totalTransactions: 45230,
  lockVolume: '125,000 ETH',
  unlockVolume: '45,230 ETH',
  pendingUnlocks: 18,
  emergencyUnlocks: 3,
  activeChallenges: 5,
};

const FALLBACK_TRANSACTIONS: CombinedTransaction[] = [
  {
    id: 'TX-001234',
    type: 'lock',
    userAddress: '0x1234...5678',
    amount: '10.5 ETH',
    status: 'completed',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'TX-001235',
    type: 'unlock',
    userAddress: '0x2345...6789',
    amount: '5.0 ETH',
    status: 'pending',
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'TX-001236',
    type: 'emergency',
    userAddress: '0x3456...7890',
    amount: '100.0 ETH',
    status: 'processing',
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'TX-001237',
    type: 'challenge',
    challengerAddress: '0x4567...8901',
    amount: '50.0 ETH',
    status: 'challenged',
    createdAt: Date.now() - 14400000,
  },
  {
    id: 'TX-001238',
    type: 'lock',
    userAddress: '0x5678...9012',
    amount: '25.0 ETH',
    status: 'completed',
    createdAt: Date.now() - 18000000,
  },
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
            <div className="h-3 bg-muted rounded w-20 animate-pulse" />
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
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-24 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-28 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-8 bg-muted rounded w-8 animate-pulse" /></td>
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean; label: string };
  href?: string;
}

function StatCard({ title, value, icon: Icon, trend, href }: StatCardProps) {
  const content = (
    <Card className={cn(href && 'hover:border-hinomaru/50 transition-colors cursor-pointer')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-2 flex items-center',
                trend.isPositive ? 'text-success' : 'text-danger'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.isPositive ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

const TYPE_ICONS = {
  lock: Lock,
  unlock: Unlock,
  emergency: AlertTriangle,
  challenge: Shield,
};

// Using design system colors
const TYPE_COLORS = {
  lock: 'text-success bg-success/10',
  unlock: 'text-info bg-info/10',
  emergency: 'text-danger bg-danger/10',
  challenge: 'text-warning bg-warning/10',
};

const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  processing: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  challenged: 'bg-warning/10 text-warning',
};

export function TransactionsDashboard() {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // React Query hooks
  const statsQuery = useTransactionStats();
  const transactionsQuery = useAllTransactions();

  // Use API data or fallback
  const stats = statsQuery.data ?? FALLBACK_STATS;
  const transactions = transactionsQuery.data?.transactions ?? FALLBACK_TRANSACTIONS;

  const filters = [
    { key: 'all', label: t('filters.all') },
    { key: 'lock', label: t('filters.lock') },
    { key: 'unlock', label: t('filters.unlock') },
    { key: 'emergency', label: t('filters.emergency') },
    { key: 'challenge', label: t('filters.challenge') },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (activeFilter !== 'all' && tx.type !== activeFilter) return false;
      const userAddr = tx.userAddress || tx.challengerAddress || '';
      if (searchQuery && !tx.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !userAddr.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsQuery.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : statsQuery.isError ? (
          <div className="col-span-3">
            <ErrorState
              message="Failed to load statistics"
              onRetry={() => statsQuery.refetch()}
            />
          </div>
        ) : (
          <>
            <StatCard
              title={t('filters.lock')}
              value={stats.lockVolume}
              icon={Lock}
              trend={{ value: 12.5, isPositive: true, label: tCommon('trend.fromLastWeek') }}
              href="/qs-admin/transactions/lock"
            />
            <StatCard
              title={t('filters.unlock')}
              value={stats.unlockVolume}
              icon={Unlock}
              trend={{ value: 5.2, isPositive: false, label: tCommon('trend.fromLastWeek') }}
              href="/qs-admin/transactions/unlock"
            />
            <StatCard
              title={t('filters.emergency')}
              value={stats.emergencyUnlocks}
              icon={AlertTriangle}
              href="/qs-admin/transactions/emergency"
            />
          </>
        )}
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('title')}</CardTitle>
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input
                type="text"
                placeholder={tCommon('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            {/* Filter */}
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeFilter === filter.key
                    ? 'border-hinomaru text-hinomaru'
                    : 'border-transparent text-foreground-secondary hover:text-foreground'
                )}
              >
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.type')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.user')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.amount')}</th>
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
                    <td colSpan={7}>
                      <ErrorState
                        message="Failed to load transactions"
                        onRetry={() => transactionsQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const TypeIcon = TYPE_ICONS[tx.type as keyof typeof TYPE_ICONS];
                    const userDisplay = tx.userAddress || tx.challengerAddress || '-';
                    return (
                      <tr
                        key={tx.id}
                        className="border-b border-border hover:bg-surface transition-colors"
                      >
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{tx.id}</code>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                            TYPE_COLORS[tx.type as keyof typeof TYPE_COLORS]
                          )}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {t(`filters.${tx.type}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono">{userDisplay}</code>
                        </td>
                        <td className="py-3 px-4 font-medium">{tx.amount || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-md text-xs font-medium',
                            STATUS_COLORS[tx.status as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground'
                          )}>
                            {t(`status.${tx.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">
                          {formatTimestamp(tx.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/transactions/${tx.type}/${tx.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
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
            <div className="text-center py-8 text-foreground-secondary">
              {t('empty.lock')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
