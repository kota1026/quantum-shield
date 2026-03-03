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
  ChevronRight,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useChallengeStats, useChallengeTransactions } from '@/hooks/admin/useTransactions';
import type { ChallengeStats } from '@/lib/api/admin/mock';

// UI_DESIGN_GUIDELINES.md Colors
const COLORS = {
  success: '#00C896',
  warning: '#F0A030',
  error: '#E07040',
  info: '#4A90D9',
  pending: '#8080A0',
  hinomaru: '#BC002D',
  gold: '#C9A962',
};

// Default data - Used when API is unavailable
const DEFAULT_STATS: ChallengeStats = {
  totalChallenges: 0,
  activeChallenges: 0,
  successRate: '-',
  totalSlashed: '0 QS',
};

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <div className="h-4 bg-[#1a1a1f] rounded-[6px] w-24 animate-pulse" />
            <div className="h-8 bg-[#1a1a1f] rounded-[6px] w-32 animate-pulse" />
          </div>
          <div className="h-12 w-12 rounded-[14px] bg-[#1a1a1f] animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-[#1a1a1f]">
      <td className="py-4 px-4"><div className="h-5 bg-[#1a1a1f] rounded-[6px] w-24 animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-5 bg-[#1a1a1f] rounded-[6px] w-28 animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-5 bg-[#1a1a1f] rounded-[6px] w-24 animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-5 bg-[#1a1a1f] rounded-[6px] w-32 animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-6 bg-[#1a1a1f] rounded-full w-20 animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-6 bg-[#1a1a1f] rounded-full w-16 animate-pulse" /></td>
      <td className="py-4 px-4"><div className="h-9 bg-[#1a1a1f] rounded-[10px] w-16 animate-pulse" /></td>
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
      <div
        className="h-16 w-16 rounded-[20px] flex items-center justify-center mb-4"
        style={{ backgroundColor: `${COLORS.error}15` }}
      >
        <AlertTriangle className="h-8 w-8" style={{ color: COLORS.error }} />
      </div>
      <p className="text-[#808080] mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="min-h-[44px] rounded-[10px] border-[#1a1a1f] hover:border-[#2a2a2f]"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          再読み込み
        </Button>
      )}
    </div>
  );
}

// Helper to truncate transaction ID
function truncateId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

// Status configuration - Following UI_DESIGN_GUIDELINES.md
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: COLORS.pending,
    label: '審査待ち',
  },
  investigating: {
    icon: Swords,
    color: COLORS.info,
    label: '調査中',
  },
  resolved: {
    icon: CheckCircle,
    color: COLORS.success,
    label: '解決済み',
  },
  escalated: {
    icon: AlertTriangle,
    color: COLORS.error,
    label: 'エスカレーション',
  },
};

const RESULT_CONFIG = {
  upheld: {
    icon: CheckCircle,
    color: COLORS.success,
    label: '認容',
  },
  rejected: {
    icon: XCircle,
    color: COLORS.error,
    label: '棄却',
  },
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, iconColor, highlight }: StatCardProps) {
  return (
    <Card
      className={cn(
        'bg-[#0E0E11] border-[#1a1a1f] rounded-[20px] hover:border-[#2a2a2f] transition-colors',
        highlight && 'border-[#F0A030]/50'
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-[#808080]">{title}</p>
            <p
              className="text-2xl font-bold mt-2 tracking-tight font-mono"
              style={{ color: highlight ? COLORS.warning : undefined }}
            >
              {value}
            </p>
          </div>
          <div
            className="h-12 w-12 rounded-[14px] flex items-center justify-center"
            style={{ backgroundColor: `${iconColor}15` }}
          >
            <Icon className="h-6 w-6" style={{ color: iconColor }} />
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
  const stats = statsQuery.data ?? DEFAULT_STATS;
  const transactions = transactionsQuery.data?.transactions ?? [];

  const statusFilters = [
    { key: 'all', label: 'すべて', count: transactions.length },
    { key: 'investigating', label: '調査中', count: transactions.filter(tx => tx.status === 'investigating').length },
    { key: 'pending', label: '審査待ち', count: transactions.filter(tx => tx.status === 'pending').length },
    { key: 'resolved', label: '解決済み', count: transactions.filter(tx => tx.status === 'resolved').length },
  ];

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
      const observer = 'challengerAddress' in tx ? tx.challengerAddress : '';
      const target = 'unlockId' in tx ? tx.unlockId : '';
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
        <div className="flex items-center gap-4">
          <Link href="/qs-admin/transactions">
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-[10px] hover:bg-[#1a1a1f]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">チャレンジ</h1>
            <p className="text-[#808080]">アンロック要求への異議申し立て</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="min-h-[44px] rounded-[10px] border-[#1a1a1f] hover:border-[#2a2a2f]"
        >
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
              title="総チャレンジ数"
              value={stats.totalChallenges}
              icon={Shield}
              iconColor={COLORS.warning}
            />
            <StatCard
              title="審査中"
              value={stats.activeChallenges}
              icon={Swords}
              iconColor={COLORS.info}
              highlight={stats.activeChallenges > 0}
            />
            <StatCard
              title="認容率"
              value={stats.successRate}
              icon={CheckCircle}
              iconColor={COLORS.success}
            />
            <StatCard
              title="没収総額"
              value={stats.totalSlashed}
              icon={AlertTriangle}
              iconColor={COLORS.error}
            />
          </>
        )}
      </div>

      {/* Challenge List */}
      <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">チャレンジ一覧</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#606060]" />
              <Input
                type="text"
                placeholder="ID または アドレスで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-72 min-h-[44px] rounded-[14px] bg-[#0a0a0c] border-[#1a1a1f] focus:border-[#2a2a2f]"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-[10px] border-[#1a1a1f] hover:border-[#2a2a2f]"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-[#0a0a0c] rounded-[14px] w-fit">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={cn(
                  'px-4 py-2 min-h-[40px] text-sm font-medium rounded-[10px] transition-all duration-200',
                  statusFilter === filter.key
                    ? 'bg-[#1a1a1f] text-foreground shadow-sm'
                    : 'text-[#808080] hover:text-foreground'
                )}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span
                    className={cn(
                      'ml-2 px-2 py-0.5 text-xs rounded-full',
                      statusFilter === filter.key
                        ? 'text-white'
                        : 'bg-[#1a1a1f] text-[#808080]'
                    )}
                    style={statusFilter === filter.key ? {
                      backgroundColor: `${COLORS.hinomaru}20`,
                      color: COLORS.hinomaru
                    } : undefined}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-[14px] border border-[#1a1a1f]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0a0a0c]">
                  <th className="text-left py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    ID
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    チャレンジャー
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    対象
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    理由
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    結果
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-semibold text-[#606060] uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1f]">
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
                        message="チャレンジの読み込みに失敗しました"
                        onRetry={() => transactionsQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-[#404040] mx-auto mb-4" />
                        <p className="text-[#808080]">
                          {searchQuery || statusFilter !== 'all'
                            ? '条件に一致するチャレンジがありません'
                            : 'チャレンジはまだありません'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const statusConfig = STATUS_CONFIG[tx.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                    const StatusIcon = statusConfig.icon;

                    const observer = 'challengerAddress' in tx ? tx.challengerAddress : '-';
                    const target = 'unlockId' in tx ? tx.unlockId : '-';
                    const reason = 'reason' in tx ? tx.reason : '-';
                    const result = 'resolution' in tx ? (tx.resolution ? 'upheld' : null) : null;
                    const resultConfig = result ? RESULT_CONFIG[result as keyof typeof RESULT_CONFIG] : null;

                    return (
                      <tr
                        key={tx.id}
                        className={cn(
                          'group hover:bg-[#0a0a0c] transition-colors',
                          tx.status === 'investigating' && 'bg-[#4A90D9]/5'
                        )}
                      >
                        <td className="py-4 px-4">
                          <code
                            className="text-sm font-mono font-medium"
                            style={{ color: COLORS.warning }}
                            title={tx.id}
                          >
                            {truncateId(tx.id)}
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-[#606060]" />
                            <code className="text-sm font-mono text-[#808080]">
                              {typeof observer === 'string' && observer.length > 20
                                ? `${observer.slice(0, 6)}...${observer.slice(-4)}`
                                : observer}
                            </code>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-[#606060]" />
                            <code
                              className="text-sm font-mono"
                              style={{ color: COLORS.info }}
                            >
                              {target}
                            </code>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm max-w-xs truncate block text-[#a0a0a0]">{reason}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${statusConfig.color}15`,
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.color}30`
                            }}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {resultConfig ? (
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${resultConfig.color}15`,
                                color: resultConfig.color,
                                border: `1px solid ${resultConfig.color}30`
                              }}
                            >
                              <resultConfig.icon className="h-3 w-3" />
                              {resultConfig.label}
                            </span>
                          ) : (
                            <span className="text-[#606060] text-sm">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link href={`/qs-admin/transactions/challenge/${tx.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-[36px] rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#1a1a1f]"
                              style={{ color: COLORS.gold }}
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

          {/* Pagination */}
          {!transactionsQuery.isLoading && !transactionsQuery.isError && filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1a1a1f]">
              <p className="text-sm text-[#808080]">
                {filteredTransactions.length} 件のチャレンジ
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[36px] rounded-[10px] border-[#1a1a1f]"
                  disabled
                >
                  前へ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[36px] rounded-[10px] border-[#1a1a1f]"
                  disabled
                >
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
