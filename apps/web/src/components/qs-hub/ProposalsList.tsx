'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FileText,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Plus,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Proposal status type
type ProposalStatus = 'active' | 'pending' | 'passed' | 'rejected' | 'executed';

// Demo proposals data
const DEMO_PROPOSALS = [
  {
    id: 'QIP-047',
    title: 'Increase Observer Rewards by 15%',
    description: 'Proposal to increase the base reward rate for Observer nodes to incentivize network security participation.',
    status: 'active' as ProposalStatus,
    proposer: '0x1234...5678',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    votes: { for: 67, against: 23, quorum: 10 },
    veQSRequired: 100000,
    totalVotes: 1250000,
  },
  {
    id: 'QIP-046',
    title: 'Add Support for Polygon zkEVM',
    description: 'Integration proposal to extend Quantum Shield protection to Polygon zkEVM network.',
    status: 'active' as ProposalStatus,
    proposer: '0xabcd...efgh',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    votes: { for: 82, against: 12, quorum: 6 },
    veQSRequired: 100000,
    totalVotes: 980000,
  },
  {
    id: 'QIP-045',
    title: 'Treasury Diversification Strategy',
    description: 'Proposal to diversify protocol treasury holdings into stable assets and yield-bearing positions.',
    status: 'pending' as ProposalStatus,
    proposer: '0x9876...5432',
    startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    votes: { for: 0, against: 0, quorum: 0 },
    veQSRequired: 100000,
    totalVotes: 0,
  },
  {
    id: 'QIP-044',
    title: 'Reduce Lock Period Minimum to 1 Week',
    description: 'Amendment to allow shorter lock periods for increased accessibility while maintaining token economics.',
    status: 'passed' as ProposalStatus,
    proposer: '0xdef0...1234',
    startTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    votes: { for: 78, against: 22, quorum: 55 },
    veQSRequired: 100000,
    totalVotes: 2100000,
  },
  {
    id: 'QIP-043',
    title: 'Emergency Council Expansion',
    description: 'Proposal to add two additional members to the Emergency Council for improved decentralization.',
    status: 'rejected' as ProposalStatus,
    proposer: '0x5555...6666',
    startTime: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    votes: { for: 35, against: 65, quorum: 48 },
    veQSRequired: 100000,
    totalVotes: 1850000,
  },
];

// Status config
const statusConfig: Record<ProposalStatus, { icon: typeof CheckCircle2; color: string; bgColor: string }> = {
  active: { icon: Clock, color: 'text-success', bgColor: 'bg-success/10' },
  pending: { icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10' },
  passed: { icon: CheckCircle2, color: 'text-gold', bgColor: 'bg-gold/10' },
  rejected: { icon: XCircle, color: 'text-danger', bgColor: 'bg-danger/10' },
  executed: { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
};

// Filter options
type FilterOption = 'all' | 'active' | 'pending' | 'passed' | 'rejected';

export function ProposalsList() {
  const t = useTranslations('qs-hub.vote.proposals');
  const tCommon = useTranslations('qs-hub.common');

  // State
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('all');

  // Filter proposals
  const filteredProposals = useMemo(() => {
    if (selectedFilter === 'all') return DEMO_PROPOSALS;
    return DEMO_PROPOSALS.filter((p) => p.status === selectedFilter);
  }, [selectedFilter]);

  // Calculate time remaining
  const formatTimeRemaining = (endTime: Date): string => {
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    if (diff <= 0) return t('timeExpired');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return t('timeRemaining.days', { days, hours });
    return t('timeRemaining.hours', { hours });
  };

  const filterOptions: { value: FilterOption; label: string }[] = [
    { value: 'all', label: t('filters.all') },
    { value: 'active', label: t('filters.active') },
    { value: 'pending', label: t('filters.pending') },
    { value: 'passed', label: t('filters.passed') },
    { value: 'rejected', label: t('filters.rejected') },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
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

      {/* Main Content */}
      <main className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/dashboard"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('backToHome')}
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
              <div className="text-[10px] text-gold tracking-wider">QS HUB</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gold" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
            </div>
          </div>
          <Link href="/qs-hub/vote/proposals/create">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              {t('createNew')}
            </Button>
          </Link>
        </div>

        {/* Stats Summary */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" aria-label={t('statsAriaLabel')}>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.total')}</div>
            <div className="text-2xl font-bold">{DEMO_PROPOSALS.length}</div>
          </Card>
          <Card className="p-4 border-success/30 bg-success/5">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.active')}</div>
            <div className="text-2xl font-bold text-success">
              {DEMO_PROPOSALS.filter((p) => p.status === 'active').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.passed')}</div>
            <div className="text-2xl font-bold text-gold">
              {DEMO_PROPOSALS.filter((p) => p.status === 'passed').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.participation')}</div>
            <div className="text-2xl font-bold">76%</div>
          </Card>
        </section>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2" role="tablist" aria-label={t('filtersAriaLabel')}>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selectedFilter === option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap',
                'border transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                selectedFilter === option.value
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-border bg-background-secondary text-foreground-secondary hover:border-gold/50'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        <section aria-labelledby="proposals-heading">
          <h2 id="proposals-heading" className="sr-only">
            {t('listAriaLabel')}
          </h2>

          <div className="space-y-4" role="list">
            {filteredProposals.map((proposal) => {
              const config = statusConfig[proposal.status];
              const StatusIcon = config.icon;
              const isActive = proposal.status === 'active';
              const isPending = proposal.status === 'pending';

              return (
                <Link
                  key={proposal.id}
                  href={`/qs-hub/vote/proposals/${proposal.id}`}
                  className="block group"
                  role="listitem"
                >
                  <Card className="p-5 transition-all duration-200 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Main Content */}
                      <div className="flex-1">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-foreground-tertiary">{proposal.id}</span>
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full font-medium',
                                  config.bgColor,
                                  config.color
                                )}
                              >
                                {t(`status.${proposal.status}`)}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold group-hover:text-gold transition-colors">
                              {proposal.title}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0 mt-1" />
                        </div>

                        {/* Description */}
                        <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
                          {proposal.description}
                        </p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-tertiary">
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" aria-hidden="true" />
                            {t('proposedBy')}: {proposal.proposer}
                          </span>
                          {(isActive || isPending) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                              {isPending ? t('startsIn', { time: formatTimeRemaining(proposal.startTime) }) : formatTimeRemaining(proposal.endTime)}
                            </span>
                          )}
                          {proposal.totalVotes > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                              {proposal.totalVotes.toLocaleString()} veQS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Voting Progress (for active proposals) */}
                      {isActive && (
                        <div className="sm:w-48 flex-shrink-0">
                          <div className="text-xs text-foreground-tertiary mb-2">{t('votingProgress')}</div>
                          <div className="h-3 bg-background-secondary rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-success transition-all"
                              style={{ width: `${proposal.votes.for}%` }}
                            />
                            <div
                              className="h-full bg-danger transition-all"
                              style={{ width: `${proposal.votes.against}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span className="text-success">{t('for')}: {proposal.votes.for}%</span>
                            <span className="text-danger">{t('against')}: {proposal.votes.against}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredProposals.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
              <p className="text-foreground-secondary">{t('empty.description')}</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            © 2024 Quantum Shield. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default ProposalsList;
