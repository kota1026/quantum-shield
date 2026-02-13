'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Scale,
  Vote,
  ArrowLeft,
  TrendingUp,
  Users,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useVotingStats, useActiveVotes } from '@/hooks/admin/useGovernance';
import {
  type VotingStats,
  type ActiveVote,
} from '@/lib/api/admin/types';

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
function VotingStatusSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-surface rounded animate-pulse" />
        <div>
          <div className="h-6 w-48 bg-surface rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-40 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Error State
function VotingStatusError({ onRetry }: { onRetry: () => void }) {
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

export function VotingStatus() {
  const t = useTranslations('qsAdmin.governance');
  const tCommon = useTranslations('qsAdmin.common');

  // Fetch data using hooks
  const { data: apiStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useVotingStats();
  const { data: votesData, isLoading: votesLoading, error: votesError, refetch: refetchVotes } = useActiveVotes();

  const isLoading = statsLoading || votesLoading;
  const hasError = statsError || votesError;

  // Use API data with fallback
  const stats = apiStats!;
  const activeVotes = votesData?.votes ?? [];

  if (isLoading) {
    return <VotingStatusSkeleton />;
  }

  if (hasError && !apiStats && !votesData) {
    return <VotingStatusError onRetry={() => { refetchStats(); refetchVotes(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/qs-admin/governance">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('votingTitle')}</h1>
          <p className="text-foreground-secondary">{t('votingSubtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.activeProposals')} value={stats.activeVotes} icon={Scale} />
        <StatCard title={t('stats.totalVotes')} value={stats.totalVoters.toLocaleString()} icon={Users} trend={{ value: 5.2, isPositive: true }} />
        <StatCard title={t('stats.avgTurnout')} value={stats.avgTurnout} icon={TrendingUp} />
        <StatCard title={t('stats.activeProposals')} value={stats.endingSoon} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {activeVotes.map((vote) => {
          const totalVotes = vote.forVotes + vote.againstVotes;
          const forPercent = (vote.forVotes / totalVotes) * 100;
          const againstPercent = (vote.againstVotes / totalVotes) * 100;

          return (
            <Card key={vote.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <code className="text-sm font-mono text-hinomaru">{vote.id}</code>
                    <CardTitle className="text-lg mt-1">{vote.title}</CardTitle>
                  </div>
                  <span className={cn('px-2 py-1 rounded-md text-xs font-medium', vote.daysLeft <= 2 ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info')}>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {vote.daysLeft}d
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-success">{t('table.forVotes')}: {vote.forVotes.toLocaleString()}</span>
                      <span className="text-danger">{t('table.againstVotes')}: {vote.againstVotes.toLocaleString()}</span>
                    </div>
                    <div className="h-3 flex rounded-full overflow-hidden bg-surface">
                      <div className="h-full bg-success" style={{ width: `${forPercent}%` }} />
                      <div className="h-full bg-danger" style={{ width: `${againstPercent}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-foreground-secondary">
                    <span>{t('table.turnout')}: {vote.turnout}</span>
                    <span>{t('table.endDate')}: {vote.endDate}</span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/qs-admin/governance/proposals`}>
                      <Vote className="h-4 w-4 mr-2" />
                      {tCommon('view')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
