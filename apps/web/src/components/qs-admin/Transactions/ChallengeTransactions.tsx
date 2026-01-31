'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  Search,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  Swords,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useChallengeStats, useChallengeTransactions } from '@/hooks/admin/useTransactions';
import type { ChallengeStats } from '@/lib/api/admin/mock';
import type { ChallengeTransaction } from '@/lib/api/admin/types';

// Fallback data - Used when API is unavailable
const FALLBACK_STATS: ChallengeStats = {
  totalChallenges: 342,
  activeChallenges: 5,
  successRate: '87.4%',
  totalSlashed: '125.5 QS',
};

interface FallbackChallengeTransaction {
  id: string;
  observer: string;
  target: string;
  amount: string;
  reason: string;
  status: string;
  startTime: string;
  bond: string;
  result: string;
}

const FALLBACK_CHALLENGE_TRANSACTIONS: FallbackChallengeTransaction[] = [
  { id: 'CH-001234', observer: '0x1234...5678', target: 'UL-001234', amount: '10.5 ETH', reason: 'Invalid proof signature', status: 'active', startTime: '2024-01-27 14:30', bond: '50 QS', result: '-' },
  { id: 'CH-001235', observer: '0x2345...6789', target: 'UL-001235', amount: '5.0 ETH', reason: 'Prover downtime detected', status: 'resolved', startTime: '2024-01-26 10:00', bond: '50 QS', result: 'upheld' },
  { id: 'CH-001236', observer: '0x3456...7890', target: 'UL-001236', amount: '100.0 ETH', reason: 'Suspicious transaction pattern', status: 'active', startTime: '2024-01-27 08:00', bond: '100 QS', result: '-' },
  { id: 'CH-001237', observer: '0x4567...8901', target: 'UL-001237', amount: '50.0 ETH', reason: 'Double unlock attempt', status: 'resolved', startTime: '2024-01-25 16:00', bond: '50 QS', result: 'rejected' },
  { id: 'CH-001238', observer: '0x5678...9012', target: 'UL-001238', amount: '25.0 ETH', reason: 'Timing violation', status: 'pending', startTime: '2024-01-27 12:00', bond: '50 QS', result: '-' },
  { id: 'CH-001239', observer: '0x6789...0123', target: 'UL-001239', amount: '75.0 ETH', reason: 'Invalid state transition', status: 'resolved', startTime: '2024-01-24 08:00', bond: '75 QS', result: 'upheld' },
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
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-32 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-14 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
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
  active: 'bg-info/10 text-info',
  investigating: 'bg-info/10 text-info',
  resolved: 'bg-success/10 text-success',
};

const RESULT_COLORS = {
  upheld: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
  '-': '',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-warning' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className={cn('text-2xl font-bold mt-2', highlight && 'text-warning')}>{value}</p>
          </div>
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', highlight ? 'bg-warning/10' : 'bg-warning/10')}>
            <Icon className={cn('h-6 w-6', highlight ? 'text-warning' : 'text-warning')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChallengeTransactions() {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useChallengeStats();
  const transactionsQuery = useChallengeTransactions();

  // Use API data or fallback
  const stats = statsQuery.data ?? FALLBACK_STATS;
  const transactions = transactionsQuery.data?.transactions ?? FALLBACK_CHALLENGE_TRANSACTIONS;

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.processing') },
    { key: 'pending', label: t('status.pending') },
    { key: 'resolved', label: t('status.completed') },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Map API status to filter status
      const txStatus = tx.status === 'investigating' ? 'active' : tx.status;
      if (statusFilter !== 'all' && txStatus !== statusFilter) return false;
      const observer = 'challengerAddress' in tx ? tx.challengerAddress : ('observer' in tx ? tx.observer : '');
      const target = 'unlockId' in tx ? tx.unlockId : ('target' in tx ? tx.target : '');
      if (searchQuery && !tx.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !observer.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !target.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
            <h1 className="text-2xl font-bold text-foreground">{t('challengeTitle')}</h1>
            <p className="text-foreground-secondary">{t('challengeSubtitle')}</p>
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
            <StatCard title={t('stats.totalChallenges')} value={stats.totalChallenges} icon={Shield} />
            <StatCard title={t('status.processing')} value={stats.activeChallenges} icon={Swords} highlight />
            <StatCard title={t('stats.challengeSuccessRate')} value={stats.successRate} icon={CheckCircle} />
            <StatCard title={t('stats.successfulChallenges')} value={stats.totalSlashed} icon={AlertTriangle} />
          </>
        )}
      </div>

      {/* Challenge List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('challengeTitle')}</CardTitle>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.challenger')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Target</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.reason')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Bond</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Result</th>
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
                    const statusKey = tx.status === 'investigating' ? 'active' : tx.status;
                    const observer = 'challengerAddress' in tx ? tx.challengerAddress : ('observer' in tx ? tx.observer : '-');
                    const target = 'unlockId' in tx ? tx.unlockId : ('target' in tx ? tx.target : '-');
                    const reason = 'reason' in tx ? tx.reason : '-';
                    const bond = 'bond' in tx ? tx.bond : '-';
                    const result = 'resolution' in tx ? (tx.resolution ? 'upheld' : '-') : ('result' in tx ? tx.result : '-');
                    return (
                      <tr key={tx.id} className={cn('border-b border-border hover:bg-surface transition-colors', statusKey === 'active' && 'bg-info/5')}>
                        <td className="py-3 px-4"><code className="text-sm font-mono text-warning">{tx.id}</code></td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4 text-foreground-tertiary" />
                            <code className="text-sm font-mono">{observer}</code>
                          </div>
                        </td>
                        <td className="py-3 px-4"><code className="text-sm font-mono text-info">{target}</code></td>
                        <td className="py-3 px-4 text-sm max-w-xs truncate">{reason}</td>
                        <td className="py-3 px-4 text-foreground-secondary">{bond}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[statusKey as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            {statusKey === 'active' && <Swords className="h-3 w-3 mr-1" />}
                            {statusKey === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                            {statusKey === 'resolved' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {result !== '-' ? (
                            <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', RESULT_COLORS[result as keyof typeof RESULT_COLORS] || 'bg-muted text-muted-foreground')}>
                              {result === 'upheld' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {result === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                              {result.charAt(0).toUpperCase() + result.slice(1)}
                            </span>
                          ) : (
                            <span className="text-foreground-tertiary">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/transactions/challenge/${tx.id}`}>
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
            <div className="text-center py-8 text-foreground-secondary">{t('empty.challenge')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
