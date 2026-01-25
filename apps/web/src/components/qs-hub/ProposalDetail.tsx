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

interface ProposalDetailProps {
  proposalId: string;
}

// Demo data
const DEMO_PROPOSAL = {
  id: 'QIP-47',
  title: 'Increase Prover Rewards by 10%',
  status: 'active' as const,
  proposer: {
    name: 'Quantum Foundation',
    address: '0x1234...5678',
  },
  createdAt: '2024-01-20',
  endTime: '2d 14h',
  description: `## Summary
This proposal aims to increase the rewards allocated to Provers by 10% to incentivize more participation in the network.

## Motivation
The current reward structure has led to a decrease in active Provers. This adjustment will help maintain network security and decentralization.

## Specification
- Increase base Prover rewards from 0.01 ETH to 0.011 ETH per signature
- Adjust tier multipliers proportionally
- Implementation timeline: Immediately upon passing

## Rationale
Historical data shows that reward adjustments correlate positively with Prover participation rates.`,
  votes: {
    for: 2450000,
    against: 890000,
    quorum: 3000000,
    total: 3340000,
  },
  timeline: [
    { event: 'Created', date: '2024-01-20 14:30', status: 'done' },
    { event: 'Voting Started', date: '2024-01-21 00:00', status: 'done' },
    { event: 'Voting Ends', date: '2024-01-28 00:00', status: 'pending' },
    { event: 'Execution', date: '2024-01-30 00:00', status: 'pending' },
  ],
};

const statusColors = {
  active: 'bg-success/10 text-success border-success/30',
  pending: 'bg-warning/10 text-warning border-warning/30',
  passed: 'bg-gold/10 text-gold border-gold/30',
  rejected: 'bg-danger/10 text-danger border-danger/30',
};

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const t = useTranslations('qs-hub.vote.proposalDetail');
  const tCommon = useTranslations('qs-hub.common');
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<'for' | 'against' | null>(null);

  const proposal = DEMO_PROPOSAL;
  const forPercentage = Math.round((proposal.votes.for / proposal.votes.total) * 100);
  const againstPercentage = 100 - forPercentage;
  const quorumPercentage = Math.round((proposal.votes.total / proposal.votes.quorum) * 100);

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

        {/* Proposal Header */}
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
              <span className="font-mono text-foreground">{proposal.proposer.address}</span>
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
            <Card className="p-6">
              <h2 className="font-semibold mb-4">{t('timeline.title')}</h2>
              <div className="space-y-4">
                {proposal.timeline.map((item, index) => (
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
                  <div className="font-medium">{proposal.proposer.name}</div>
                  <div className="text-xs font-mono text-foreground-tertiary">
                    {proposal.proposer.address}
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
      </main>
    </div>
  );
}

export default ProposalDetail;
