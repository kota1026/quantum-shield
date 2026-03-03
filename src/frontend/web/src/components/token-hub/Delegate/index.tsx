'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Users,
  ChevronRight,
  Shield,
  Sparkles,
  Server,
  Vote,
  FlaskConical,
  Building2,
  ExternalLink,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { DelegateTooltip, ParticipationTooltip } from './DelegateTooltip';
import { useUserDelegation, useDelegateList } from '@/hooks/token-hub/useTokenHub';
import type { DelegateInfo } from '@/lib/api/token-hub/mock';

// Empty data (used when API is unavailable)
const EMPTY_USER_DELEGATION = {
  totalDelegated: 25000,
  delegateCount: 2,
};
const EMPTY_DELEGATES: DelegateInfo[] = [
  {
    id: '1',
    name: 'delegates.watanabe',
    initial: 'W',
    address: '0x1a2b...3c4d',
    rank: 1,
    veQS: '285K',
    delegators: 1247,
    participation: 98,
    tags: ['securityCouncil', 'defiExpert'],
    bio: 'delegates.watanabeBio',
    lastVote: '2',
  },
  {
    id: '2',
    name: 'delegates.sato',
    initial: 'S',
    address: '0x5e6f...7g8h',
    rank: 2,
    veQS: '198K',
    delegators: 892,
    participation: 95,
    tags: ['research', 'governance'],
    bio: 'delegates.satoBio',
    lastVote: '5',
  },
];

type FilterType = 'all' | 'top10' | 'mostActive' | 'securityCouncil';

function getTagIcon(tag: string) {
  switch (tag) {
    case 'securityCouncil':
      return <Shield className="w-3 h-3" aria-hidden="true" />;
    case 'purposeCommittee':
      return <Shield className="w-3 h-3" aria-hidden="true" />;
    case 'defiExpert':
    case 'defi':
    case 'yieldStrategy':
      return <Sparkles className="w-3 h-3" aria-hidden="true" />;
    case 'infrastructure':
    case 'prover':
      return <Server className="w-3 h-3" aria-hidden="true" />;
    case 'daoGovernance':
    case 'governance':
      return <Vote className="w-3 h-3" aria-hidden="true" />;
    case 'research':
    case 'cryptography':
      return <FlaskConical className="w-3 h-3" aria-hidden="true" />;
    case 'community':
      return <Building2 className="w-3 h-3" aria-hidden="true" />;
    default:
      return null;
  }
}

export function TokenHubDelegate() {
  const t = useTranslations('token-hub.delegate');
  const tCommon = useTranslations('token-hub.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Fetch data from API with fallback
  const { data: userDelegationApi, isLoading, error } = useUserDelegation();
  const { data: delegatesApi } = useDelegateList();

  // Use API data or fallback
  const userDelegation = userDelegationApi ?? EMPTY_USER_DELEGATION;
  const delegatesList = delegatesApi ?? EMPTY_DELEGATES;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t('filters.all') },
    { key: 'top10', label: t('filters.top10') },
    { key: 'mostActive', label: t('filters.mostActive') },
    { key: 'securityCouncil', label: t('filters.securityCouncil') },
  ];

  const filteredDelegates = useMemo(() => {
    let result = [...delegatesList];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (delegate) =>
          t(delegate.name).toLowerCase().includes(query) ||
          delegate.address.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    switch (activeFilter) {
      case 'top10':
        result = result.filter((d) => d.rank <= 10);
        break;
      case 'mostActive':
        result = result.filter((d) => d.participation >= 95);
        break;
      case 'securityCouncil':
        result = result.filter((d) => d.tags.includes('securityCouncil') || d.tags.includes('purposeCommittee'));
        break;
    }

    return result;
  }, [searchQuery, activeFilter, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-8" aria-label={tCommon('loading.ariaLabel')}>
        <div className="animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          <div className="h-10 w-48 rounded bg-surface-secondary" />
          <div className="h-6 w-32 rounded bg-surface-secondary" />
          <div className="flex justify-between items-center">
            <div className="h-12 w-64 rounded bg-surface-secondary" />
            <div className="h-20 w-60 rounded-xl bg-surface-secondary" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-surface-secondary" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-danger" aria-hidden="true" />
          <p className="mt-4 text-lg font-semibold text-foreground">{tCommon('error.loadFailed')}</p>
          <p className="mt-2 text-sm text-foreground-secondary">{tCommon('error.tryAgain')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Gold Glow */}
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" role="main">
        {/* Header */}
        <TokenHubHeader />

        {/* Back to Dashboard Link */}
        <Link
          href="/token-hub/dashboard"
          className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          {t('backToDashboard')}
        </Link>

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-gold" aria-hidden="true" />
              {t('title')}
              <DelegateTooltip label="" className="ml-1" />
            </h1>
            <p className="text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* My Delegation Summary */}
          <div
            className={cn(
              'bg-gradient-to-br from-background-secondary to-gold/10',
              'border border-gold rounded-xl p-4 lg:p-6',
              'flex items-center gap-4'
            )}
            role="region"
            aria-label={t('myDelegation.ariaLabel')}
          >
            <div>
              <div className="text-sm text-foreground-secondary">{t('myDelegation.label')}</div>
              <div className="text-2xl font-bold font-mono text-gold">
                {userDelegation.totalDelegated.toLocaleString()}
              </div>
              <div className="text-xs text-foreground-tertiary">
                {t('myDelegation.delegateCount', { count: userDelegation.delegateCount })}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder={t('search.placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full pl-12 pr-4 py-3',
                'bg-background-secondary border border-border rounded-xl',
                'text-foreground placeholder:text-foreground-tertiary',
                'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold',
                'transition-colors'
              )}
              aria-label={t('search.ariaLabel')}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2" role="group" aria-label={t('filters.ariaLabel')}>
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  activeFilter === filter.key
                    ? 'bg-gold/10 border-gold text-gold border'
                    : 'bg-background-secondary border border-border text-foreground-secondary hover:border-gold hover:text-gold'
                )}
                aria-pressed={activeFilter === filter.key}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Screen reader announcement for search results */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {filteredDelegates.length > 0
            ? `${filteredDelegates.length} ${t('list.ariaLabel')}`
            : t('empty.title')
          }
        </div>

        {/* Delegates Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          role="list"
          aria-label={t('list.ariaLabel')}
        >
          {filteredDelegates.map((delegate) => (
            <Link
              key={delegate.id}
              href={`/token-hub/delegate/${delegate.id}`}
              className={cn(
                'group block',
                'bg-card border border-border rounded-2xl p-6',
                'hover:border-gold hover:-translate-y-1',
                'transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
              role="listitem"
              aria-label={`${t(delegate.name)} - ${t('list.rank')} #${delegate.rank}`}
            >
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={cn(
                    'w-14 h-14 rounded-full',
                    'bg-gradient-to-br from-gold to-hinomaru',
                    'flex items-center justify-center',
                    'text-2xl font-semibold text-white'
                  )}
                  aria-hidden="true"
                >
                  {delegate.initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-semibold truncate">{t(delegate.name)}</div>
                  <div className="text-xs text-foreground-tertiary font-mono">
                    {delegate.address}
                  </div>
                </div>
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    'bg-gold/10 border border-gold text-gold'
                  )}
                >
                  #{delegate.rank}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-base font-semibold font-mono text-gold">
                    {delegate.veQS}
                  </div>
                  <div className="text-[10px] text-foreground-tertiary uppercase tracking-wide">
                    veQS
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-base font-semibold font-mono text-gold">
                    {delegate.delegators.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-foreground-tertiary uppercase tracking-wide">
                    {t('list.delegators')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-base font-semibold font-mono text-gold">
                    {delegate.participation}%
                  </div>
                  <ParticipationTooltip />
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {delegate.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1',
                      'bg-background-secondary rounded-full',
                      'text-[11px] text-foreground-secondary'
                    )}
                  >
                    {getTagIcon(tag)}
                    {t(`tags.${tag}`)}
                  </span>
                ))}
              </div>

              {/* Bio */}
              <p className="text-sm text-foreground-secondary line-clamp-2 mb-4">
                {t(delegate.bio)}
              </p>

              {/* Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-xs text-foreground-tertiary">
                  {t('list.lastVote', { days: delegate.lastVote })}
                </span>
                <span className="text-sm text-gold font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                  {t('list.viewProfile')}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredDelegates.length === 0 && (
          <div className="text-center py-16" role="status" aria-live="polite">
            <Users className="w-16 h-16 text-foreground-tertiary mx-auto mb-4" aria-hidden="true" />
            <p className="text-lg text-foreground-secondary">{t('empty.title')}</p>
            <p className="text-sm text-foreground-tertiary mt-2">{t('empty.description')}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-wrap gap-4 md:gap-6" aria-label={t('footer.navLabel')}>
              <Link
                href="/consumer/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.privacy')}
              </Link>
              <a
                href="https://docs.quantumshield.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded inline-flex items-center gap-1"
              >
                {t('footer.docs')}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </nav>
            <p className="text-xs text-foreground-tertiary text-center max-w-xl">
              {t('footer.disclaimer')}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default TokenHubDelegate;
