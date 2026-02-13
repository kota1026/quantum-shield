'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Server,
  Search,
  Filter,
  Download,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Coins,
  ExternalLink,
  Eye,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useProverRequestStats, useProverRequests } from '@/hooks/admin/useProvers';
import type { ProverApplication, ProverRequestStats } from '@/lib/api/admin/types';

// Request item type from API
type RequestItem = ProverApplication;

// Loading skeleton components
function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
            <div className="h-8 bg-muted rounded w-16 animate-pulse" />
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
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-32 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-24 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-8 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-32 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-6 bg-muted rounded w-16 animate-pulse" /></td>
      <td className="py-3 px-4"><div className="h-8 bg-muted rounded w-20 animate-pulse" /></td>
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

const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning',
  under_review: 'bg-info/10 text-info',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
};

const STATUS_ICONS = {
  pending: Clock,
  under_review: Eye,
  approved: CheckCircle,
  rejected: XCircle,
};

const TIER_COLORS = {
  standard: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  professional: 'bg-info/10 text-info',
  enterprise: 'bg-gold/10 text-gold',
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

export function ProverRequests() {
  const t = useTranslations('qsAdmin.prover');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query hooks
  const statsQuery = useProverRequestStats();
  const requestsQuery = useProverRequests();

  const stats = statsQuery.data;
  const requests: RequestItem[] = requestsQuery.data?.applications ?? [];

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'pending', label: t('status.pending') },
    { key: 'under_review', label: t('status.under_review') },
    { key: 'approved', label: t('status.approved') },
    { key: 'rejected', label: t('status.rejected') },
  ];

  const filteredRequests: RequestItem[] = useMemo(() => {
    return requests.filter((req: RequestItem) => {
      if (statusFilter !== 'all' && req.status !== statusFilter) return false;
      const applicant = req.organizationName ?? '';
      const wallet = req.applicantAddress ?? '';
      if (searchQuery && !applicant.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !wallet.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !req.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  const pendingCount = useMemo(() => {
    return requests.filter((r: RequestItem) => r.status === 'pending').length;
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {pendingCount > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4 flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <button
              onClick={() => setStatusFilter('pending')}
              className="text-sm text-warning hover:underline cursor-pointer"
            >
              <span className="font-semibold">{pendingCount}</span> {t('alert.pendingReview')}
            </button>
            <Button variant="outline" size="sm" className="ml-auto border-warning text-warning hover:bg-warning/10" onClick={() => setStatusFilter('pending')}>
              {t('actions.reviewNow')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/prover">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('requestsTitle')}</h1>
            <p className="text-foreground-secondary">{t('requestsSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats */}
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
            <StatCard title={t('stats.pendingRequests')} value={stats?.pendingRequests ?? 0} icon={Clock} highlight />
            <StatCard title={t('stats.approvedThisMonth')} value={stats?.approvedThisMonth ?? 0} icon={CheckCircle} />
            <StatCard title={t('stats.rejectedThisMonth')} value={stats?.rejectedThisMonth ?? 0} icon={XCircle} />
            <StatCard title={t('stats.avgProcessTime')} value={stats?.avgProcessTime ?? '-'} icon={Clock} />
          </>
        )}
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('requestsTitle')} ({filteredRequests.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={t('searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-72" />
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.applicant')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.tier')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.staked')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.infrastructure')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.documents')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.submittedAt')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {requestsQuery.isLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : requestsQuery.isError ? (
                  <tr>
                    <td colSpan={9}>
                      <ErrorState
                        message="Failed to load requests"
                        onRetry={() => requestsQuery.refetch()}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req: RequestItem) => {
                    const StatusIcon = STATUS_ICONS[req.status as keyof typeof STATUS_ICONS] || Clock;
                    const applicant = req.organizationName ?? '-';
                    const wallet = req.applicantAddress ?? '-';
                    const stakeAmount = req.stakeAmount ?? '-';
                    const tier = req.tier || 'standard';
                    const infrastructure = req.infrastructure ?? '-';
                    const documents = typeof req.documents === 'number' ? req.documents : (Array.isArray(req.documents) ? req.documents.length : 0);
                    const submittedAt = typeof req.submittedAt === 'number' ? new Date(req.submittedAt * 1000).toLocaleString('ja-JP') : '-';
                    return (
                      <tr key={req.id} className={cn('border-b border-border hover:bg-surface transition-colors', req.status === 'pending' && 'bg-warning/5')}>
                        <td className="py-3 px-4">
                          <code className="text-sm font-mono text-hinomaru" title={req.id}>
                            {req.id.length > 16 ? `${req.id.slice(0, 10)}...${req.id.slice(-4)}` : req.id}
                          </code>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{applicant}</p>
                            <code className="text-xs text-foreground-tertiary font-mono">{wallet}</code>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.standard)}>
                            {t(`tier.${tier}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Coins className="h-4 w-4 text-gold" />
                            <span className="font-medium">{stakeAmount}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">{infrastructure}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-foreground-tertiary" />
                            <span>{documents}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">{submittedAt}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[req.status as keyof typeof STATUS_COLORS] || 'bg-muted text-muted-foreground')}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(`status.${req.status}`)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link href={`/qs-admin/prover/requests/${req.id}`}>
                            <Button variant="outline" size="sm">
                              {t('actions.viewDetail')}
                              <ExternalLink className="h-4 w-4 ml-1" />
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

          {!requestsQuery.isLoading && !requestsQuery.isError && filteredRequests.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('empty')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
