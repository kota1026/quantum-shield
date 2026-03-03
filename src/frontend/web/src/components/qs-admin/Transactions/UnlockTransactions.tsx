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
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Timer,
  RefreshCw,
  AlertTriangle,
  Wallet,
  Activity,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useUnlockStats, useUnlockTransactions } from '@/hooks/admin/useTransactions';
import type { UnlockStats } from '@/lib/api/admin/mock';
import type { UnlockTransaction } from '@/lib/api/admin/types';

// Default data - Used when API is unavailable
const DEFAULT_STATS: UnlockStats = {
  totalUnlocks: 0,
  unlockVolume: '0 ETH',
  pendingUnlocks: 0,
  avgWaitTime: '-',
};

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-4 bg-elevated rounded w-24 animate-pulse" />
            <div className="h-8 bg-elevated rounded w-32 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-[14px] bg-elevated animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/10">
      <td className="py-4 px-6"><div className="h-5 bg-elevated rounded w-24 animate-pulse" /></td>
      <td className="py-4 px-6"><div className="h-5 bg-elevated rounded w-28 animate-pulse" /></td>
      <td className="py-4 px-6"><div className="h-5 bg-elevated rounded w-20 animate-pulse" /></td>
      <td className="py-4 px-6"><div className="h-5 bg-elevated rounded w-24 animate-pulse" /></td>
      <td className="py-4 px-6"><div className="h-6 bg-elevated rounded-full w-20 animate-pulse" /></td>
      <td className="py-4 px-6"><div className="h-5 bg-elevated rounded w-32 animate-pulse" /></td>
      <td className="py-4 px-6"><div className="h-9 bg-elevated rounded-[10px] w-16 animate-pulse" /></td>
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-[20px] bg-error/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-[#E07040]" />
      </div>
      <p className="text-secondary mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="min-h-[44px] rounded-[10px]">
          <RefreshCw className="h-4 w-4 mr-2" />
          再読み込み
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

// Status configuration (following UI_DESIGN_GUIDELINES.md)
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-[#8080A0]',
    bg: 'bg-[#8080A0]/10',
    label: '承認待ち',
  },
  waiting: {
    icon: Clock,
    color: 'text-[#F0A030]',
    bg: 'bg-[#F0A030]/10',
    label: '待機中',
  },
  ready: {
    icon: CheckCircle,
    color: 'text-[#4A90D9]',
    bg: 'bg-[#4A90D9]/10',
    label: '準備完了',
  },
  challenged: {
    icon: AlertTriangle,
    color: 'text-[#E07040]',
    bg: 'bg-[#E07040]/10',
    label: 'チャレンジ中',
  },
  completed: {
    icon: CheckCircle,
    color: 'text-[#00C896]',
    bg: 'bg-[#00C896]/10',
    label: '完了',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-[#8080A0]',
    bg: 'bg-[#8080A0]/10',
    label: 'キャンセル',
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  highlight?: boolean;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, iconColor = 'text-hinomaru', iconBg = 'bg-hinomaru/10', highlight, trend }: StatCardProps) {
  return (
    <Card className={cn('bg-card border-border/10 rounded-[20px] hover:border-border/20 transition-colors', highlight && 'border-[#F0A030]/50')}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-secondary">{title}</p>
            <p className={cn('text-2xl font-bold mt-2 tracking-tight font-mono', highlight && 'text-[#F0A030]')}>{value}</p>
            {trend && (
              <p className={cn('text-xs mt-1', trend.isPositive ? 'text-success' : 'text-danger')}>
                {trend.isPositive ? '+' : '-'}{trend.value}%
              </p>
            )}
          </div>
          <div className={cn('h-12 w-12 rounded-[14px] flex items-center justify-center', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to truncate transaction ID
function truncateId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

// Helper function to calculate remaining time
function calculateRemainingTime(timelockEnd: number): string {
  const now = Date.now();
  if (timelockEnd <= now) return '-';

  const diff = timelockEnd - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}時間 ${minutes}分`;
  }
  return `${minutes}分`;
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
  const stats = statsQuery.data ?? DEFAULT_STATS;
  const transactions = transactionsQuery.data?.transactions ?? [];

  const statusFilters = [
    { key: 'all', label: 'すべて', count: transactions.length },
    { key: 'pending', label: '承認待ち', count: transactions.filter(tx => tx.status === 'pending' || tx.status === 'waiting').length },
    { key: 'ready', label: '準備完了', count: transactions.filter(tx => tx.status === 'ready').length },
    { key: 'completed', label: '完了', count: transactions.filter(tx => tx.status === 'completed').length },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const txStatus = tx.status === 'waiting' ? 'pending' : tx.status;
      if (statusFilter !== 'all' && txStatus !== statusFilter) return false;
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
        <div className="flex items-center gap-4">
          <Link href="/qs-admin/transactions">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">アンロックトランザクション</h1>
            <p className="text-secondary">ETHアンロックの履歴と管理</p>
          </div>
        </div>
        <Button variant="outline" className="min-h-[44px] rounded-[10px]">
          <Download className="h-4 w-4 mr-2" />
          エクスポート
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
              message="統計データの読み込みに失敗しました"
              onRetry={() => statsQuery.refetch()}
            />
          </div>
        ) : (
          <>
            <StatCard
              title="総アンロック数"
              value={stats.totalUnlocks.toLocaleString()}
              icon={Unlock}
              iconColor="text-[#4A90D9]"
              iconBg="bg-[#4A90D9]/10"
              trend={{ value: 5.2, isPositive: false }}
            />
            <StatCard
              title="アンロック総額"
              value={stats.unlockVolume}
              icon={Wallet}
              iconColor="text-[#00C896]"
              iconBg="bg-[#00C896]/10"
            />
            <StatCard
              title="承認待ち"
              value={stats.pendingUnlocks}
              icon={Clock}
              iconColor="text-[#F0A030]"
              iconBg="bg-[#F0A030]/10"
              highlight={stats.pendingUnlocks > 0}
            />
            <StatCard
              title="平均処理時間"
              value={stats.avgWaitTime}
              icon={Timer}
              iconColor="text-gold"
              iconBg="bg-gold/10"
            />
          </>
        )}
      </div>

      {/* Transaction List */}
      <Card className="bg-card border-border/10 rounded-[20px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">トランザクション一覧</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
              <Input
                type="text"
                placeholder="ID または アドレスで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-72 min-h-[44px] rounded-[14px] bg-secondary border-border/10"
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-[10px]">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-[14px] w-fit">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={cn(
                  'px-4 py-2 min-h-[40px] text-sm font-medium rounded-[10px] transition-all duration-normal',
                  statusFilter === filter.key
                    ? 'bg-card text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                )}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className={cn(
                    'ml-2 px-2 py-0.5 text-xs rounded-full',
                    statusFilter === filter.key
                      ? 'bg-hinomaru/10 text-hinomaru'
                      : 'bg-elevated text-secondary'
                  )}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[14px] border border-border/10">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    金額
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    残り時間
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    申請日時
                  </th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-secondary uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
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
                        message="トランザクションの読み込みに失敗しました"
                        onRetry={() => transactionsQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="text-center py-12">
                        <Unlock className="h-12 w-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">
                          {searchQuery || statusFilter !== 'all'
                            ? '条件に一致するトランザクションがありません'
                            : 'アンロックトランザクションはまだありません'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const statusKey = tx.status as keyof typeof STATUS_CONFIG;
                    const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
                    const StatusIcon = config.icon;
                    const userAddr = 'userAddress' in tx ? tx.userAddress : '-';
                    const requestTime = 'createdAt' in tx && typeof tx.createdAt === 'number' ? formatTimestamp(tx.createdAt) : '-';
                    const remainingTime = 'timelockEnd' in tx && typeof tx.timelockEnd === 'number' ? calculateRemainingTime(tx.timelockEnd) : '-';

                    return (
                      <tr
                        key={tx.id}
                        className="group hover:bg-elevated transition-colors"
                      >
                        <td className="py-4 px-6">
                          <code className="text-sm font-mono font-medium text-[#4A90D9]" title={tx.id}>
                            {truncateId(tx.id)}
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          <code className="text-sm font-mono text-secondary">
                            {userAddr}
                          </code>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold font-mono">{tx.amount}</span>
                        </td>
                        <td className="py-4 px-6">
                          {remainingTime !== '-' ? (
                            <span className="text-[#F0A030] font-medium font-mono">{remainingTime}</span>
                          ) : (
                            <span className="text-tertiary">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                            config.bg,
                            config.color
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-secondary font-mono">
                          {requestTime}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link href={`/qs-admin/transactions/unlock/${tx.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-[36px] rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity text-gold hover:text-gold-light"
                            >
                              詳細
                              <ChevronRight className="h-4 w-4 ml-1" />
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

          {/* Pagination placeholder */}
          {!transactionsQuery.isLoading && !transactionsQuery.isError && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/10">
              <p className="text-sm text-secondary">
                {filteredTransactions.length} 件のトランザクション
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="min-h-[36px] rounded-[6px]" disabled>
                  前へ
                </Button>
                <Button variant="outline" size="sm" className="min-h-[36px] rounded-[6px]" disabled>
                  次へ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
