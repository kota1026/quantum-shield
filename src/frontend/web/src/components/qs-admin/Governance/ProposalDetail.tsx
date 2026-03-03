'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Scale,
  Vote,
  Copy,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProposalDetail, useExecuteProposal } from '@/hooks/admin/useGovernance';
import type { ProposalDetail as ProposalDetailType } from '@/lib/api/admin/mock';

interface ProposalDetailProps {
  id: string;
}

// Empty default when API data is unavailable
const DEFAULT_PROPOSAL: ProposalDetailType = {
  id: '',
  title: '',
  description: '',
  proposer: '',
  status: 'pending',
  votes: 0,
  forVotes: 0,
  againstVotes: 0,
  turnout: '0%',
  quorum: 1,
  requiredVotes: 0,
  category: '',
  startDate: '',
  endDate: '',
  daysRemaining: 0,
  recentVotes: [],
};

const STATUS_CONFIG = {
  active: { icon: Clock, color: 'text-info', bg: 'bg-info/10' },
  passed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  rejected: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  executed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
};

const VOTE_COLORS = {
  for: 'bg-success/10 text-success',
  against: 'bg-danger/10 text-danger',
};

// Loading Skeleton
function ProposalDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-surface rounded-lg animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-surface rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface rounded animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 bg-surface rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 bg-surface rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Error State
function ProposalDetailError({ onRetry }: { onRetry: () => void }) {
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

export function ProposalDetail({ id }: ProposalDetailProps) {
  const t = useTranslations('qsAdmin.governance');
  const tCommon = useTranslations('qsAdmin.common');

  // Fetch data using hooks
  const { data: apiProposal, isLoading, error, refetch } = useProposalDetail(id);
  const executeMutation = useExecuteProposal();

  // Use API data with fallback
  const proposal = apiProposal ?? { ...DEFAULT_PROPOSAL, id };

  if (isLoading) {
    return <ProposalDetailSkeleton />;
  }

  if (error && !apiProposal) {
    return <ProposalDetailError onRetry={refetch} />;
  }
  const statusConfig = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;
  const forPercentage = (proposal.forVotes / proposal.votes) * 100;
  const quorumPercentage = (proposal.votes / proposal.quorum) * 100;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/governance/proposals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig.bg)}>
              <Scale className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
              <p className="text-foreground-secondary">{proposal.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`status.${proposal.status}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Proposal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.proposalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary">{t('table.title')}</p>
                <p className="font-medium text-lg mt-1">{proposal.title}</p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary">{t('detail.description')}</p>
                <p className="mt-1 text-foreground">{proposal.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.proposer')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="font-mono text-sm bg-surface px-2 py-1 rounded">{proposal.proposer.slice(0, 10)}...{proposal.proposer.slice(-8)}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(proposal.proposer)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('detail.category')}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-hinomaru/10 text-hinomaru mt-1">
                    {proposal.category}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voting Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.votingInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vote Progress */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">{t('table.forVotes')}</span>
                  <span className="text-sm font-medium text-success">{proposal.forVotes.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-success rounded-full" style={{ width: `${forPercentage}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-foreground-secondary">{t('table.againstVotes')}</span>
                  <span className="text-sm font-medium text-danger">{proposal.againstVotes.toLocaleString()}</span>
                </div>
              </div>

              {/* Quorum */}
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-foreground-secondary">{t('detail.quorum')}</span>
                  <span className="text-sm font-medium">{Math.min(quorumPercentage, 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', quorumPercentage >= 100 ? 'bg-success' : 'bg-warning')} style={{ width: `${Math.min(quorumPercentage, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-foreground-tertiary">
                  <span>{t('detail.currentVotes')}: {proposal.votes.toLocaleString()}</span>
                  <span>{t('detail.requiredVotes')}: {proposal.quorum.toLocaleString()}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="p-4 bg-surface rounded-lg text-center">
                  <Vote className="h-5 w-5 mx-auto text-hinomaru" />
                  <p className="text-2xl font-bold mt-2">{proposal.votes.toLocaleString()}</p>
                  <p className="text-xs text-foreground-secondary">{t('table.votes')}</p>
                </div>
                <div className="p-4 bg-surface rounded-lg text-center">
                  <Users className="h-5 w-5 mx-auto text-hinomaru" />
                  <p className="text-2xl font-bold mt-2">{proposal.turnout}</p>
                  <p className="text-xs text-foreground-secondary">{t('table.turnout')}</p>
                </div>
                <div className="p-4 bg-surface rounded-lg text-center">
                  <TrendingUp className="h-5 w-5 mx-auto text-success" />
                  <p className="text-2xl font-bold mt-2 text-success">{Math.round(forPercentage)}%</p>
                  <p className="text-xs text-foreground-secondary">{t('table.forVotes')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Votes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('detail.recentVotes')}</CardTitle>
              <Button variant="ghost" size="sm">
                {t('detail.viewAllVotes')}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Voter</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Vote</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.recentVotes.map((vote, index) => (
                      <tr key={index} className="border-b border-border hover:bg-surface transition-colors">
                        <td className="py-3 px-4 font-mono text-sm">{vote.voter}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium capitalize', VOTE_COLORS[vote.vote as keyof typeof VOTE_COLORS])}>
                            {vote.vote === 'for' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {vote.vote}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium">{vote.amount}</td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">{vote.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {proposal.status === 'passed' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('table.actions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full bg-gradient-hinomaru"
                  onClick={() => executeMutation.mutate(proposal.id)}
                  disabled={executeMutation.isPending}
                >
                  {executeMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {t('actions.execute')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('detail.votingPeriod')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-foreground-tertiary" />
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.startDate')}</p>
                  <p className="font-medium">{proposal.startDate}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-foreground-tertiary" />
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.endDate')}</p>
                  <p className="font-medium">{proposal.endDate}</p>
                </div>
              </div>
              {proposal.status === 'active' && (
                <div className="p-4 bg-info/10 rounded-lg">
                  <p className="text-sm text-info font-medium">
                    {proposal.daysRemaining} {t('detail.daysRemaining')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.turnout')}</p>
                  <p className="text-2xl font-bold">{proposal.turnout}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('table.votes')}</p>
                  <p className="text-2xl font-bold">{proposal.votes.toLocaleString()}</p>
                </div>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-foreground-secondary">{t('table.forVotes')}</p>
                    <p className="text-lg font-bold text-success">{proposal.forVotes.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground-secondary">{t('table.againstVotes')}</p>
                    <p className="text-lg font-bold text-danger">{proposal.againstVotes.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
