'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useEmergencyStats, useEmergencyTransactions } from '@/hooks/admin/useTransactions';
import type { EmergencyStats } from '@/lib/api/admin/mock';
import type { EmergencyUnlock } from '@/lib/api/admin/types';

// Fallback data - Used when API is unavailable
const FALLBACK_STATS: EmergencyStats = {
  totalEmergency: 156,
  activeEmergency: 3,
  approvedRate: '92.3%',
  avgProcessTime: '4.2 hours',
};

interface FallbackEmergencyTransaction {
  id: string;
  user: string;
  amount: string;
  bond: string;
  reason: string;
  status: string;
  requestTime: string;
  challengeEnd: string;
  challenges: number;
}

const FALLBACK_EMERGENCY_TRANSACTIONS: FallbackEmergencyTransaction[] = [
  { id: 'EM-001234', user: '0x1234...5678', amount: '100.0 ETH', bond: '10.0 ETH', reason: 'Private key compromise suspected', status: 'completed', requestTime: '2024-01-27 14:30', challengeEnd: '2024-02-03 14:30', challenges: 0 },
  { id: 'EM-001235', user: '0x2345...6789', amount: '50.0 ETH', bond: '5.0 ETH', reason: 'Wallet migration required', status: 'challenge_period', requestTime: '2024-01-27 12:00', challengeEnd: '2024-02-03 12:00', challenges: 0 },
  { id: 'EM-001236', user: '0x3456...7890', amount: '200.0 ETH', bond: '20.0 ETH', reason: 'Security breach detected', status: 'challenge_period', requestTime: '2024-01-27 10:00', challengeEnd: '2024-02-03 10:00', challenges: 1 },
  { id: 'EM-001237', user: '0x4567...8901', amount: '25.0 ETH', bond: '2.5 ETH', reason: 'Account recovery', status: 'challenged', requestTime: '2024-01-26 16:00', challengeEnd: '2024-02-02 16:00', challenges: 2 },
  { id: 'EM-001238', user: '0x5678...9012', amount: '75.0 ETH', bond: '7.5 ETH', reason: 'Phishing attack victim', status: 'completed', requestTime: '2024-01-26 08:00', challengeEnd: '2024-02-02 08:00', challenges: 0 },
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
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-14 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-32 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-28 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-8 animate-pulse" /></td>
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

const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  challenge_period: 'bg-warning/10 text-warning',
  challenged: 'bg-danger/10 text-danger',
  completed: 'bg-success/10 text-success',
};

const STATUS_ICONS = {
  pending: Clock,
  challenge_period: Clock,
  challenged: AlertTriangle,
  completed: CheckCircle,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  critical?: boolean;
}

function StatCard({ title, value, icon: Icon, critical }: StatCardProps) {
  return (
    <Card className={critical ? 'border-danger' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className={cn('text-2xl font-bold mt-2', critical && 'text-danger')}>{value}</p>
          </div>
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', critical ? 'bg-danger/10' : 'bg-danger/10')}>
            <Icon className={cn('h-6 w-6', critical ? 'text-danger' : 'text-danger')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmergencyTransactions() {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useEmergencyStats();
  const transactionsQuery = useEmergencyTransactions();

  // Use API data or fallback
  const stats = statsQuery.data ?? FALLBACK_STATS;
  const transactions = transactionsQuery.data?.transactions ?? FALLBACK_EMERGENCY_TRANSACTIONS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'challenge_period', label: t('status.challenge_period') },
    { key: 'challenged', label: t('status.challenged') },
    { key: 'completed', label: t('status.completed') },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Map API status to filter status
      const txStatus = tx.status === 'pending' ? 'challenge_period' : tx.status;
      if (statusFilter !== 'all' && txStatus !== statusFilter) return false;
      const userAddr = 'userAddress' in tx ? tx.userAddress : ('user' in tx ? tx.user : '');
      if (searchQuery && !tx.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !userAddr.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="p-4 flex items-center space-x-3">
          <Clock className="h-5 w-5 text-warning" />
          <p className="text-sm text-warning">
            <span className="font-semibold">{stats.activeEmergency}</span> {t('emergency.activeChallenges')}
          </p>
          <p className="text-xs text-foreground-secondary ml-4">
            {t('emergency.challengePeriodNote')}
          </p>
        </CardContent>
      </Card>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('emergencyTitle')}</h1>
            <p className="text-foreground-secondary">{t('emergencySubtitle')}</p>
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
            <StatCard title={t('stats.totalEmergency')} value={stats.totalEmergency} icon={AlertTriangle} />
            <StatCard title={t('status.pending')} value={stats.activeEmergency} icon={AlertCircle} critical />
            <StatCard title={t('stats.challengeSuccessRate')} value={stats.approvedRate} icon={CheckCircle} />
            <StatCard title={t('stats.avgLockDuration')} value={stats.avgProcessTime} icon={Clock} />
          </>
        )}
      </div>

      {/* Transaction List */}
      <Card id="pending">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('emergencyTitle')}</CardTitle>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('emergency.bond')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.reason')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('emergency.challengeEnd')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('emergency.challenges')}</th>
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
                    <td colSpan={9}>
                      <ErrorState
                        message="Failed to load transactions"
                        onRetry={() => transactionsQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const statusKey = tx.status === 'pending' ? 'challenge_period' : tx.status;
                    const StatusIcon = STATUS_ICONS[statusKey as keyof typeof STATUS_ICONS] || Clock;
                    const userAddr = 'userAddress' in tx ? tx.userAddress : ('user' in tx ? tx.user : '-');
                    const reason = 'reason' in tx ? tx.reason : '-';
                    const bond = 'emergencyFee' in tx ? tx.emergencyFee : ('bond' in tx ? tx.bond : '-');
                    const challengeEnd = 'createdAt' in tx && typeof tx.createdAt === 'number'
                      ? formatTimestamp(tx.createdAt + 7 * 24 * 60 * 60 * 1000) // 7 days challenge period
                      : ('challengeEnd' in tx ? tx.challengeEnd : '-');
                    const challenges = 'challenges' in tx ? tx.challenges : 0;
                    return (
                      <tr key={tx.id} className={cn('border-b border-border hover:bg-surface transition-colors', statusKey === 'challenged' && 'bg-danger/5')}>
                        <td className="py-3 px-4"><code className="text-sm font-mono text-danger">{tx.id}</code></td>
                        <td className="py-3 px-4"><code className="text-sm font-mono">{userAddr}</code></td>
                        <td className="py-3 px-4 font-medium">{tx.amount}</td>
                        <td className="py-3 px-4 text-sm text-gold">{bond}</td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">{reason}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[statusKey as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(`status.${statusKey}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">{challengeEnd}</td>
                        <td className="py-3 px-4">
                          {challenges > 0 ? (
                            <span className="text-danger font-medium">{challenges}</span>
                          ) : (
                            <span className="text-foreground-tertiary">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/transactions/emergency/${tx.id}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
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
            <div className="text-center py-8 text-foreground-secondary">{t('empty.emergency')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
