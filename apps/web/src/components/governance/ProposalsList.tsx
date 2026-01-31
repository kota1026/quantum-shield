'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FileText,
  Plus,
  Search,
  Clock,
  Lock,
  User,
  Calendar,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Vote,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { HinomaryLogo } from '@/components/consumer/Landing/HinomaryLogo';
import { cn } from '@/lib/utils';
import { useProposals } from '@/hooks/governance';
import { MOCK_PROPOSALS } from '@/lib/api/governance/mock';
import type { Proposal, ProposalStatus, ProposalType, UserVote } from '@/lib/api/governance/mock';

// Fallback data
const FALLBACK_PROPOSALS = MOCK_PROPOSALS;

type FilterType = 'all' | 'active' | 'passed' | 'defeated' | 'vetoed';

interface FilterTabProps {
  filter: FilterType;
  activeFilter: FilterType;
  count: number;
  label: string;
  onClick: (filter: FilterType) => void;
}

function FilterTab({ filter, activeFilter, count, label, onClick }: FilterTabProps) {
  const isActive = filter === activeFilter;
  return (
    <button
      type="button"
      onClick={() => onClick(filter)}
      className={cn(
        'min-h-11 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2',
        isActive
          ? 'bg-background-tertiary text-foreground'
          : 'text-foreground-secondary hover:text-foreground'
      )}
      aria-pressed={isActive}
    >
      {label}
      <span
        className={cn(
          'px-2 py-0.5 text-xs rounded-full',
          isActive
            ? 'bg-hinomaru/10 text-hinomaru-400'
            : 'bg-background-tertiary text-foreground-tertiary'
        )}
      >
        {count}
      </span>
    </button>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function ProposalCard({ proposal, t }: ProposalCardProps) {
  const statusConfig: Record<ProposalStatus, { icon: React.ReactNode; className: string }> = {
    active: {
      icon: <span className="w-2 h-2 rounded-full bg-success animate-pulse" />,
      className: 'bg-success/10 text-success border-success',
    },
    pending: {
      icon: <Clock className="w-3 h-3" />,
      className: 'bg-warning/10 text-warning border-warning',
    },
    passed: {
      icon: <Check className="w-3 h-3" />,
      className: 'bg-gold/10 text-gold border-gold',
    },
    executed: {
      icon: <Check className="w-3 h-3" />,
      className: 'bg-gold/10 text-gold border-gold',
    },
    defeated: {
      icon: <X className="w-3 h-3" />,
      className: 'bg-danger/10 text-danger border-danger',
    },
    vetoed: {
      icon: <AlertTriangle className="w-3 h-3" />,
      className: 'bg-foreground-tertiary/10 text-foreground-tertiary border-foreground-tertiary',
    },
  };

  const typeConfig: Record<ProposalType, string> = {
    parameter: 'bg-gold/10 text-gold',
    upgrade: 'bg-hinomaru/10 text-hinomaru-400',
    council: 'bg-success/10 text-success',
  };

  const { icon: statusIcon, className: statusClassName } = statusConfig[proposal.status];

  return (
    <Link
      href={`/governance/proposals/${proposal.id}`}
      className="grid grid-cols-1 lg:grid-cols-[80px_1fr_180px] gap-6 p-6 bg-card border border-border/50 rounded-2xl cursor-pointer transition-all duration-200 relative overflow-hidden hover:border-border hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background group"
      role="article"
      aria-label={t('proposalCard.ariaLabel', { id: `QIP-${proposal.id}`, title: proposal.title })}
    >
      {/* Top gradient border on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* Proposal ID */}
      <div className="flex lg:flex-col items-center lg:justify-center gap-3">
        <span className="text-2xl font-bold font-mono text-gold">{proposal.id}</span>
        <span
          className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-medium uppercase',
            typeConfig[proposal.type]
          )}
        >
          {t(`types.${proposal.type}`)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold border',
              statusClassName
            )}
          >
            {statusIcon}
            {t(`status.${proposal.status}`)}
          </span>
          {proposal.timeLeft && (
            <span className="flex items-center gap-1 text-xs text-warning font-mono">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {proposal.timeLeft} {t('proposalCard.timeLeft')}
            </span>
          )}
          {proposal.timeLock && (
            <span className="flex items-center gap-1 text-xs text-gold font-mono">
              <Lock className="w-3 h-3" aria-hidden="true" />
              {t('proposalCard.timeLock')}: {proposal.timeLock}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{proposal.title}</h3>
        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">{proposal.description}</p>

        <div className="flex flex-wrap gap-4 text-xs text-foreground-tertiary">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" aria-hidden="true" />
            {t('proposalCard.proposer')}: {proposal.proposer}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" aria-hidden="true" />
            {proposal.executedAt
              ? `${t('proposalCard.executed')}: ${proposal.executedAt}`
              : proposal.endedAt
              ? `${t('proposalCard.ended')}: ${proposal.endedAt}`
              : `${t('proposalCard.created')}: ${proposal.createdAt}`}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" aria-hidden="true" />
            {proposal.commentsCount} {t('proposalCard.comments')}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-3 lg:min-w-[180px]">
        {/* Vote distribution */}
        <div>
          <div
            className="h-2.5 bg-background rounded-full overflow-hidden flex mb-2"
            role="progressbar"
            aria-valuenow={proposal.forPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${proposal.forPercentage}% ${t('vote.for')}, ${proposal.againstPercentage}% ${t('vote.against')}`}
          >
            <div className="h-full bg-success" style={{ width: `${proposal.forPercentage}%` }} />
            <div className="h-full bg-danger" style={{ width: `${proposal.againstPercentage}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-success" />
              {proposal.forPercentage}% {t('vote.for')}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-danger" />
              {proposal.againstPercentage}% {t('vote.against')}
            </span>
          </div>
        </div>

        {/* Quorum */}
        {proposal.quorumPercentage !== undefined && (
          <div>
            <div className="flex justify-between text-xs text-foreground-tertiary mb-1">
              <SimpleTooltip content={t('vote.quorumTooltip')} side="top">
                <span className="flex items-center gap-1 cursor-help">
                  {t('vote.quorum')}
                  <HelpCircle className="w-3 h-3" aria-hidden="true" />
                </span>
              </SimpleTooltip>
              <span>
                {proposal.quorumReached
                  ? `${t('vote.quorumReached')} (${proposal.quorumPercentage}%)`
                  : `${proposal.quorumPercentage}% / ${proposal.quorumRequired}%`}
              </span>
            </div>
            <div className="h-1 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full"
                style={{ width: `${Math.min(100, (proposal.quorumPercentage / (proposal.quorumRequired || 100)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* User vote */}
        <div
          className={cn(
            'flex items-center gap-2 text-xs px-3 py-2 bg-background-secondary rounded-lg',
            proposal.userVote === 'for' && 'text-success',
            proposal.userVote === 'against' && 'text-danger',
            proposal.userVote === null && 'text-foreground-tertiary'
          )}
        >
          {proposal.userVote === 'for' && <ThumbsUp className="w-3 h-3" aria-hidden="true" />}
          {proposal.userVote === 'against' && <ThumbsDown className="w-3 h-3" aria-hidden="true" />}
          {proposal.userVote === null && <Vote className="w-3 h-3" aria-hidden="true" />}
          {proposal.userVote === 'for' && t('yourVote.votedFor')}
          {proposal.userVote === 'against' && t('yourVote.votedAgainst')}
          {proposal.userVote === null && t('yourVote.notVoted')}
        </div>
      </div>
    </Link>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function Pagination({ currentPage, totalPages, onPageChange, t }: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex justify-center items-center gap-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-11 h-11 flex items-center justify-center bg-background-secondary border border-border rounded-lg text-foreground-secondary hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('pagination.previous')}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-gold text-background border border-gold'
              : 'bg-background-secondary border border-border text-foreground-secondary hover:border-gold hover:text-gold'
          )}
          aria-label={t('pagination.page', { number: page })}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-11 h-11 flex items-center justify-center bg-background-secondary border border-border rounded-lg text-foreground-secondary hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('pagination.next')}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

export function ProposalsList() {
  const t = useTranslations('governance.landing.proposals');
  const tFooter = useTranslations('governance.landing.footer');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch data using hooks
  const { data: proposalsApi } = useProposals({ status: activeFilter, search: searchQuery });

  // Use API data with fallback
  const proposals = proposalsApi?.proposals ?? FALLBACK_PROPOSALS;

  const filterCounts = useMemo(() => ({
    all: proposals.length,
    active: proposals.filter((p) => p.status === 'active').length,
    passed: proposals.filter((p) => p.status === 'passed' || p.status === 'executed' || p.status === 'pending').length,
    defeated: proposals.filter((p) => p.status === 'defeated').length,
    vetoed: proposals.filter((p) => p.status === 'vetoed').length,
  }), [proposals]);

  const filteredProposals = useMemo(() => {
    let filtered = proposals;

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'passed') {
        filtered = filtered.filter((p) => p.status === 'passed' || p.status === 'executed' || p.status === 'pending');
      } else {
        filtered = filtered.filter((p) => p.status === activeFilter);
      }
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          `qip-${p.id}`.includes(query)
      );
    }

    return filtered;
  }, [proposals, activeFilter, searchQuery]);

  const totalPages = Math.ceil(filteredProposals.length / 5) || 1;

  return (
    <main
      className="min-h-screen bg-background"
      role="main"
      aria-label={t('ariaLabel')}
    >
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Back to Dashboard */}
        <Link
          href="/governance/landing"
          className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-gold transition-colors mb-6 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToDashboard')}
        </Link>

        {/* Page Header */}
        <header className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-3 mb-2">
            <HinomaryLogo size="md" aria-hidden="true" />
            <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
          </div>
          <p className="text-foreground-secondary mb-6">{t('pageSubtitle')}</p>
          <Button asChild variant="primary" className="gap-2">
            <Link href="/governance/create">
              <Plus className="w-4 h-4" aria-hidden="true" />
              {t('createProposal')}
            </Link>
          </Button>
        </header>

        {/* Filters Bar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Filter Tabs */}
          <div
            className="flex flex-wrap gap-1 bg-background-secondary p-1 rounded-full border border-border/50"
            role="group"
            aria-label="Filter proposals by status"
          >
            <FilterTab
              filter="all"
              activeFilter={activeFilter}
              count={filterCounts.all}
              label={t('filters.all')}
              onClick={setActiveFilter}
            />
            <FilterTab
              filter="active"
              activeFilter={activeFilter}
              count={filterCounts.active}
              label={t('filters.active')}
              onClick={setActiveFilter}
            />
            <FilterTab
              filter="passed"
              activeFilter={activeFilter}
              count={filterCounts.passed}
              label={t('filters.passed')}
              onClick={setActiveFilter}
            />
            <FilterTab
              filter="defeated"
              activeFilter={activeFilter}
              count={filterCounts.defeated}
              label={t('filters.defeated')}
              onClick={setActiveFilter}
            />
            <FilterTab
              filter="vetoed"
              activeFilter={activeFilter}
              count={filterCounts.vetoed}
              label={t('filters.vetoed')}
              onClick={setActiveFilter}
            />
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-background-secondary border border-border rounded-full px-4 min-h-[44px]">
            <Search className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm text-foreground placeholder:text-foreground-muted outline-none w-48 min-h-[44px]"
              aria-label={t('search.ariaLabel')}
            />
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-4" role="list" aria-label={t('pageTitle')}>
          {filteredProposals.length > 0 ? (
            filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} t={t} />
            ))
          ) : (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('emptyState.title')}</h3>
              <p className="text-foreground-secondary">{t('emptyState.description')}</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProposals.length > 0 && (
          <div className="mt-12">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              t={t}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <nav className="flex gap-4" aria-label="Footer navigation">
              <a
                href="https://forum.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors min-h-[44px] inline-flex items-center px-2"
              >
                {tFooter('governanceForum')}
              </a>
              <a
                href="https://docs.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors min-h-[44px] inline-flex items-center px-2"
              >
                {tFooter('documentation')}
              </a>
              <Link
                href="/consumer/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors min-h-[44px] min-w-[44px] inline-flex items-center px-2"
              >
                {tFooter('terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors min-h-[44px] inline-flex items-center px-2"
              >
                {tFooter('privacy')}
              </Link>
            </nav>
            <p className="text-xs text-foreground-muted">
              {tFooter('disclaimer')}
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
