'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  History,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVoteHistory } from '@/hooks/qs-hub/useQSHub';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/30',
  pending: 'bg-warning/10 text-warning border-warning/30',
  passed: 'bg-gold/10 text-gold border-gold/30',
  rejected: 'bg-danger/10 text-danger border-danger/30',
};

export function VoteHistory() {
  const t = useTranslations('qs-hub.vote.history');
  const tCommon = useTranslations('qs-hub.common');
  const [filter, setFilter] = useState<'all' | 'for' | 'against'>('all');

  // Fetch vote history from API
  const { data: votes, isLoading: votesLoading, error: votesError } = useVoteHistory();

  const allVotes = votes ?? [];
  const filteredVotes = allVotes.filter((vote) => {
    if (filter === 'all') return true;
    return vote.vote === filter;
  });

  // Calculate stats from actual data
  const voteStats = {
    totalVotes: allVotes.length,
    votesFor: allVotes.filter((v) => v.vote === 'for').length,
    votesAgainst: allVotes.filter((v) => v.vote === 'against').length,
    veQSUsed: allVotes.reduce((sum, v) => sum + (v.veQSUsed ?? 0), 0),
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
              <div className="text-[10px] text-gold tracking-wider">{tCommon('portalName')}</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <History className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" aria-label={t('stats.ariaLabel')}>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.totalVotes')}</div>
            <div className="text-2xl font-bold">{voteStats.totalVotes}</div>
          </Card>
          <Card className="p-4 border-success/30">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.votesFor')}</div>
            <div className="text-2xl font-bold text-success">{voteStats.votesFor}</div>
          </Card>
          <Card className="p-4 border-danger/30">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.votesAgainst')}</div>
            <div className="text-2xl font-bold text-danger">{voteStats.votesAgainst}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.veQSUsed')}</div>
            <div className="text-2xl font-bold">{voteStats.veQSUsed > 0 ? `${(voteStats.veQSUsed / 1000).toFixed(0)}K` : '0'}</div>
          </Card>
        </section>

        {/* Filters */}
        <div className="flex gap-2 mb-6" role="tablist" aria-label={t('filters.ariaLabel')}>
          {(['all', 'for', 'against'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              role="tab"
              aria-selected={filter === f}
              className={cn(
                'min-h-11 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-gold text-background'
                  : 'bg-surface text-foreground-secondary hover:text-foreground'
              )}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>

        {/* Vote List */}
        <div className="space-y-4" role="list" aria-label={t('listAriaLabel')}>
          {votesLoading ? (
            <div className="text-center py-8 text-foreground-tertiary">{t('loading')}</div>
          ) : votesError ? (
            <div className="text-center py-8 text-warning">{t('error')}</div>
          ) : filteredVotes.map((vote) => (
            <Card
              key={vote.id}
              className="p-5 hover:border-gold/30 transition-all duration-200"
              role="listitem"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-foreground-tertiary">
                      {vote.proposalId}
                    </span>
                    {vote.proposalStatus && (
                    <Badge className={cn('border', statusColors[vote.proposalStatus])}>
                      {t(`proposalStatus.${vote.proposalStatus}`)}
                    </Badge>
                    )}
                  </div>
                  <h3 className="font-medium mb-2">{vote.proposalTitle}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {vote.votedAt ?? vote.timestamp}
                    </span>
                    <span>{(vote.veQSUsed ?? vote.votePower ?? 0).toLocaleString()} veQS</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                      vote.vote === 'for'
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger'
                    )}
                  >
                    {vote.vote === 'for' ? (
                      <ThumbsUp className="w-4 h-4" />
                    ) : (
                      <ThumbsDown className="w-4 h-4" />
                    )}
                    {t(`vote.${vote.vote}`)}
                  </div>
                  {vote.result && (
                    <div className="flex items-center gap-1 text-xs">
                      {vote.result === 'passed' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          <span className="text-success">{t('result.passed')}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-danger" />
                          <span className="text-danger">{t('result.rejected')}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href={`/qs-hub/vote/proposals/${vote.proposalId.toLowerCase().replace('-', '')}`}
                  className="flex items-center gap-1 text-sm text-gold hover:underline"
                >
                  {t('viewProposal')}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!votesLoading && !votesError && filteredVotes.length === 0 && (
          <Card className="p-8 text-center">
            <History className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-foreground-secondary mb-4">{t('empty.description')}</p>
            <Link href="/qs-hub/vote/proposals">
              <Button variant="primary">{t('empty.viewProposals')}</Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}

export default VoteHistory;
