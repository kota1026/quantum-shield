'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Scale,
  Vote,
  Search,
  Filter,
  Download,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useGovernanceStats, useGovernanceProposals } from '@/hooks/admin/useGovernance';
import type { GovernanceStats, GovernanceProposal } from '@/lib/api/admin/mock';

// Empty defaults when API data is unavailable
const DEFAULT_STATS: GovernanceStats = { activeProposals: 0, totalVotes: 0, participation: '0%', passedProposals: 0 };
const DEFAULT_PROPOSALS: GovernanceProposal[] = [];

const STATUS_COLORS = {
  active: 'bg-info/10 text-info',
  passed: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
  pending: 'bg-warning/10 text-warning',
  executed: 'bg-success/10 text-success',
};

const STATUS_ICONS = {
  active: Clock,
  passed: CheckCircle,
  rejected: XCircle,
  pending: Clock,
  executed: CheckCircle,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const tCommon = useTranslations('qsAdmin.common');
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
                {trend.isPositive ? '+' : ''}{trend.value}% {tCommon('trend.fromLastWeek')}
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
}

// Loading Skeleton
function ProposalsListSkeleton() {
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
function ProposalsListError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProposalsList() {
  const t = useTranslations('qsAdmin.governance');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Fetch data using hooks
  const { data: apiStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useGovernanceStats();
  const { data: proposalsData, isLoading: proposalsLoading, error: proposalsError, refetch: refetchProposals } = useGovernanceProposals();

  const isLoading = statsLoading || proposalsLoading;
  const hasError = statsError || proposalsError;

  // Use API data with fallback
  const stats = apiStats ?? DEFAULT_STATS;
  const proposals = proposalsData?.proposals ?? DEFAULT_PROPOSALS;

  const filters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.active') },
    { key: 'passed', label: t('status.passed') },
    { key: 'rejected', label: t('status.rejected') },
    { key: 'executed', label: t('status.executed') },
  ];

  const filteredProposals = proposals.filter(proposal => {
    if (activeFilter !== 'all' && proposal.status !== activeFilter) return false;
    if (searchQuery && !proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !proposal.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <ProposalsListSkeleton />;
  }

  if (hasError && !apiStats && !proposalsData) {
    return <ProposalsListError onRetry={() => { refetchStats(); refetchProposals(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/governance">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('proposalsTitle')}</h1>
            <p className="text-foreground-secondary">{t('proposalsSubtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.activeProposals')} value={stats.activeProposals} icon={Scale} />
        <StatCard title={t('stats.totalVotes')} value={stats.totalVotes.toLocaleString()} icon={Vote} trend={{ value: 18.5, isPositive: true }} />
        <StatCard title={t('stats.participation')} value={stats.participation} icon={TrendingUp} trend={{ value: 3.2, isPositive: true }} />
        <StatCard title={t('stats.passedProposals')} value={stats.passedProposals} icon={CheckCircle} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('proposalsTitle')} ({filteredProposals.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4 border-b border-border">
            {filters.map((filter) => (
              <button key={filter.key} onClick={() => setActiveFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', activeFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.id')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.title')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.proposer')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.votes')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.turnout')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.endDate')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((proposal) => {
                  const StatusIcon = STATUS_ICONS[proposal.status as keyof typeof STATUS_ICONS];
                  return (
                    <tr key={proposal.id} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="py-3 px-4"><code className="text-sm font-mono text-hinomaru">{proposal.id}</code></td>
                      <td className="py-3 px-4 font-medium max-w-xs truncate">{proposal.title}</td>
                      <td className="py-3 px-4"><code className="text-xs text-foreground-tertiary font-mono">{proposal.proposer}</code></td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[proposal.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`status.${proposal.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{proposal.votes.toLocaleString()}</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="h-1.5 w-16 bg-surface rounded-full overflow-hidden">
                              <div className="h-full bg-success rounded-full" style={{ width: `${(proposal.forVotes / proposal.votes) * 100}%` }} />
                            </div>
                            <span className="text-xs text-foreground-tertiary">{Math.round((proposal.forVotes / proposal.votes) * 100)}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">{proposal.turnout}</td>
                      <td className="py-3 px-4 text-foreground-secondary">{proposal.endDate}</td>
                      <td className="py-3 px-4">
                        <Link href={`/qs-admin/governance/proposals/${proposal.id}`}>
                          <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
