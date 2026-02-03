'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Send,
  Search,
  Filter,
  Download,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTransferStats, useTreasuryTransfers } from '@/hooks/admin/useTreasury';
import {
  MOCK_TRANSFER_STATS,
  MOCK_TREASURY_TRANSFERS,
  type TransferStats,
  type TreasuryTransfer,
} from '@/lib/api/admin/mock';

// Fallback data
const FALLBACK_STATS = MOCK_TRANSFER_STATS;
const FALLBACK_TRANSFERS = MOCK_TREASURY_TRANSFERS;

const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
};

const STATUS_ICONS = {
  pending: Clock,
  completed: CheckCircle,
  rejected: XCircle,
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
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', highlight ? 'bg-warning/10' : 'bg-hinomaru/10')}>
            <Icon className={cn('h-6 w-6', highlight ? 'text-warning' : 'text-hinomaru')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function TransfersListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function TransfersListError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-danger mb-4" />
      <p className="text-foreground-secondary mb-4">{error.message || t('error')}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {t('retry')}
      </Button>
    </div>
  );
}

// Map API transfer to component format
function mapApiTransfer(data: unknown): TreasuryTransfer {
  if (!data || typeof data !== 'object') return FALLBACK_TRANSFERS[0];
  const d = data as Record<string, unknown>;
  return {
    id: (d.id as string) || '',
    from: (d.from as string) || '',
    to: (d.to as string) || '',
    amount: (d.amount as string) || '0 ETH',
    initiator: (d.initiator as string) || '',
    approvals: (d.approvals as number) || 0,
    required: (d.required as number) || 0,
    status: (d.status as string) || 'pending',
    timestamp: (d.timestamp as string) || '',
    purpose: (d.purpose as string) || '',
  };
}

export function TransfersList() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data with hooks
  const statsQuery = useTransferStats();
  const transfersQuery = useTreasuryTransfers();

  // Map API data or use fallback
  const stats: TransferStats = statsQuery.data ?? FALLBACK_STATS;
  const apiTransfers = transfersQuery.data?.transfers;
  const transfers: TreasuryTransfer[] = apiTransfers
    ? apiTransfers.map(mapApiTransfer)
    : FALLBACK_TRANSFERS;

  // Show skeleton only on initial load
  if (statsQuery.isLoading && !statsQuery.data && transfersQuery.isLoading && !transfersQuery.data) {
    return <TransfersListSkeleton />;
  }

  // Show error state
  if ((statsQuery.error || transfersQuery.error) && !statsQuery.data && !transfersQuery.data) {
    return <TransfersListError error={(statsQuery.error || transfersQuery.error) as Error} onRetry={() => { statsQuery.refetch(); transfersQuery.refetch(); }} />;
  }

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'pending', label: t('status.pending') },
    { key: 'completed', label: t('status.completed') },
    { key: 'rejected', label: t('status.rejected') },
  ];

  const filteredTransfers = transfers.filter(tx => {
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (searchQuery && !tx.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tx.purpose.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/treasury">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('transfers.title')}</h1>
            <p className="text-foreground-secondary">{t('transfersSubtitle')}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Link href="/qs-admin/treasury/transfers/new">
            <Button className="bg-gradient-hinomaru text-white">
              <Plus className="h-4 w-4 mr-2" />
              {t('transfers.newTransfer')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('transfers.pendingApprovals')} value={stats.pendingApprovals} icon={Clock} highlight />
        <StatCard title={t('transfers.transfersThisMonth')} value={stats.transfersThisMonth} icon={Send} />
        <StatCard title={t('transfers.totalVolume')} value={stats.totalVolume} icon={Send} />
        <StatCard title={t('transfers.avgTransferSize')} value={stats.avgTransferSize} icon={Send} />
      </div>

      {/* Transfers List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('transfers.title')}</CardTitle>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.route')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.amount')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.purpose')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.approvals')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.time')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.map((tx) => {
                  const StatusIcon = STATUS_ICONS[tx.status as keyof typeof STATUS_ICONS];
                  return (
                    <tr key={tx.id} className={cn('border-b border-border hover:bg-surface transition-colors', tx.status === 'pending' && 'bg-warning/5')}>
                      <td className="py-3 px-4"><code className="text-sm font-mono text-hinomaru">{tx.id}</code></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <span>{tx.from.includes('0x') ? tx.from : t(`wallets.${tx.from}`)}</span>
                          <ArrowRight className="h-4 w-4 text-foreground-tertiary" />
                          <span>{tx.to.includes('0x') ? <code className="font-mono">{tx.to}</code> : t(`wallets.${tx.to}`)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{tx.amount}</td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary max-w-xs truncate">{tx.purpose}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', tx.approvals >= tx.required ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {tx.approvals}/{tx.required}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[tx.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`status.${tx.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{tx.timestamp}</td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-1">
                          {tx.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="sm" className="text-success hover:text-success hover:bg-success/10">
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Link href={`/qs-admin/treasury/transfers/${tx.id}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredTransfers.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('empty')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
