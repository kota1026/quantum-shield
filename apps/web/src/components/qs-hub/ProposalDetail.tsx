'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProposalDetail } from '@/hooks/qs-hub/useQSHub';

interface ProposalDetailProps {
  proposalId: string;
}


const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  pending: 'bg-warning/10 text-warning border-warning/30',
  passed: 'bg-gold/10 text-gold border-gold/30',
  rejected: 'bg-danger/10 text-danger border-danger/30',
  executed: 'bg-success/10 text-success border-success/30',
};

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const t = useTranslations('qs-hub.vote.proposalDetail');
  const tCommon = useTranslations('qs-hub.common');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | null>(null);

  // Fetch proposal from API
  const { data: proposal, isLoading, error } = useProposalDetail(proposalId);

  const votesTotal = proposal?.votes ? (proposal.votes.total ?? (proposal.votes.for + proposal.votes.against)) : 0;
  const forPercentage = votesTotal ? Math.round((proposal!.votes.for / votesTotal) * 100) : 0;
  const againstPercentage = proposal ? 100 - forPercentage : 0;
  const quorumPercentage = proposal?.votes?.quorum ? Math.round((votesTotal / proposal.votes.quorum) * 100) : 0;

  // Helper to get proposer info (can be string or object)
  const proposerAddress = proposal?.proposer
    ? typeof proposal.proposer === 'string' ? proposal.proposer : proposal.proposer.address
    : '';
  const proposerName = proposal?.proposer
    ? typeof proposal.proposer === 'string' ? proposal.proposer : proposal.proposer.name
    : '';

  const handleVote = (vote: 'for' | 'against') => {
    setSelectedVote(vote);
    // In production, this would trigger a transaction
    setTimeout(() => setHasVoted(true), 1000);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      <main className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/vote/proposals"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToProposals')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">{tCommon('portalName')}</div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground-secondary">{t('loading')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <p className="text-warning mb-4">{t('error')}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t('retry')}
            </Button>
          </div>
        )}

        {/* Proposal Content */}
        {proposal && (<>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-mono text-foreground-tertiary">{proposal.id}</span>
            <Badge className={cn('border', statusColors[proposal.status])}>
              {t(`status.${proposal.status}`)}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold mb-4">{proposal.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-secondary">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{t('proposedBy')}</span>
              <span className="font-mono text-foreground">{proposerAddress}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{t('timeRemaining', { time: proposal.endTime })}</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Description */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t('description')}</h2>
              <div className="prose prose-sm prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-foreground-secondary text-sm leading-relaxed">
                  {proposal.description}
                </div>
              </div>
            </Card>

            {/* Timeline */}
            {proposal.timeline && proposal.timeline.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t('timeline.title')}</h2>
              <div className="space-y-4">
                {proposal.timeline.map((item: { event: string; date: string; status: string }, index: number) => (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                        item.status === 'done' ? 'bg-success/10' : 'bg-foreground-tertiary/10'
                      )}
                    >
                      {item.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-success" />
                      ) : (
                        <Clock className="w-4 h-4 text-foreground-tertiary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{item.event}</div>
                      <div className="text-sm text-foreground-tertiary">{item.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voting Card */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t('voting.title')}</h2>

              {/* Vote Progress */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-1 text-success">
                      <ThumbsUp className="w-4 h-4" />
                      {t('voting.for')} ({forPercentage}%)
                    </span>
                    <span>{(proposal.votes.for / 1000000).toFixed(2)}M veQS</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all duration-500"
                      style={{ width: `${forPercentage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="flex items-center gap-1 text-danger">
                      <ThumbsDown className="w-4 h-4" />
                      {t('voting.against')} ({againstPercentage}%)
                    </span>
                    <span>{(proposal.votes.against / 1000000).toFixed(2)}M veQS</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-danger rounded-full transition-all duration-500"
                      style={{ width: `${againstPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quorum */}
              <div className="mb-6 p-4 bg-surface rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground-secondary">{t('voting.quorum')}</span>
                  <span className={quorumPercentage >= 100 ? 'text-success' : 'text-warning'}>
                    {quorumPercentage}%
                  </span>
                </div>
                <div className="h-1 bg-background rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      quorumPercentage >= 100 ? 'bg-success' : 'bg-warning'
                    )}
                    style={{ width: `${Math.min(quorumPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Vote Buttons */}
              {!hasVoted ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleVote('for')}
                    disabled={selectedVote !== null}
                    className="border-success/50 text-success hover:bg-success/10"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    {t('voting.voteFor')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleVote('against')}
                    disabled={selectedVote !== null}
                    className="border-danger/50 text-danger hover:bg-danger/10"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    {t('voting.voteAgainst')}
                  </Button>
                </div>
              ) : (
                <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-center">
                  <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="text-sm text-success">{t('voting.voteSubmitted')}</p>
                </div>
              )}
            </Card>

            {/* Proposer Info */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t('proposer.title')}</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <span className="text-gold font-bold">Q</span>
                </div>
                <div>
                  <div className="font-medium">{proposerName}</div>
                  <div className="text-xs font-mono text-foreground-tertiary">
                    {proposerAddress}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('proposer.viewProfile')}
              </Button>
            </Card>
          </div>
        </div>
        </>)}
      </main>
    </div>
  );
}

export default ProposalDetail;
