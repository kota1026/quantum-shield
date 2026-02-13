'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Users,
  ArrowLeft,
  Search,
  TrendingUp,
  Vote,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQSHubDelegates } from '@/hooks/qs-hub/useQSHub';

export function DelegatesList() {
  const t = useTranslations('qs-hub.vote.delegates');
  const tCommon = useTranslations('qs-hub.common');

  // Fetch delegates from API
  const { data: delegates, isLoading: delegatesLoading, error: delegatesError } = useQSHubDelegates();

  // State
  const [searchQuery, setSearchQuery] = useState('');

  const allDelegates = delegates ?? [];

  // Filter delegates
  const filteredDelegates = useMemo(() => {
    if (!searchQuery) return allDelegates;
    const query = searchQuery.toLowerCase();
    return allDelegates.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        (d.address ?? '').toLowerCase().includes(query) ||
        (d.description ?? '').toLowerCase().includes(query)
    );
  }, [searchQuery, allDelegates]);

  // Featured delegates
  const featuredDelegates = useMemo(() => {
    return allDelegates.filter((d) => d.isFeatured);
  }, [allDelegates]);

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
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
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
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        {/* My Delegations Summary */}
        <Card className="p-5 mb-8 border-gold/30 bg-gradient-to-br from-background to-gold/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-semibold mb-1">{t('myDelegations.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('myDelegations.subtitle')}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold font-mono text-gold">-</div>
                <div className="text-xs text-foreground-tertiary">{t('myDelegations.delegatedVeQS')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">-</div>
                <div className="text-xs text-foreground-tertiary">{t('myDelegations.delegates')}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Featured Delegates */}
        {!delegatesLoading && !delegatesError && featuredDelegates.length > 0 && (
          <section className="mb-8" aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('featured.title')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {featuredDelegates.map((delegate) => (
                  <Card
                    key={delegate.id}
                    className="p-5 hover:border-gold/50 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-lg">
                        {delegate.initial}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{delegate.name}</span>
                          {delegate.isVerified && (
                            <CheckCircle2 className="w-4 h-4 text-success" aria-label={t('verified')} />
                          )}
                        </div>
                        <p className="text-xs text-foreground-tertiary mb-3">{delegate.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-foreground-secondary">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {(delegate.totalPower / 1000).toFixed(0)}K veQS
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {delegate.delegators} {t('delegators')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Vote className="w-3 h-3" />
                            {delegate.votingParticipation}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Search */}
        <div className="mb-6">
          <div
            className={cn(
              'flex items-center gap-3 p-3',
              'bg-background-secondary border border-border rounded-xl',
              'focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20'
            )}
          >
            <Search className="w-5 h-5 text-foreground-tertiary" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="flex-1 min-h-[44px] bg-transparent border-none outline-none text-foreground placeholder:text-foreground-tertiary"
              aria-label={t('searchAriaLabel')}
            />
          </div>
        </div>

        {/* All Delegates */}
        <section aria-labelledby="delegates-heading">
          <h2 id="delegates-heading" className="text-lg font-semibold mb-4">
            {t('allDelegates')}
          </h2>

          <div className="space-y-3" role="list" aria-label={t('listAriaLabel')}>
            {delegatesLoading ? (
              <div className="text-center py-8 text-foreground-tertiary">{t('loading')}</div>
            ) : delegatesError ? (
              <div className="text-center py-8 text-warning">{t('error')}</div>
            ) : filteredDelegates.map((delegate) => (
                <Card
                  key={delegate.id}
                  className="p-4 hover:border-gold/30 transition-all duration-200"
                  role="listitem"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold font-semibold">
                      {delegate.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{delegate.name}</span>
                        {delegate.isVerified && (
                          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" aria-label={t('verified')} />
                        )}
                      </div>
                      <div className="text-xs text-foreground-tertiary font-mono">{delegate.address}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{(delegate.totalPower / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-foreground-tertiary">veQS</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{delegate.delegators}</div>
                        <div className="text-xs text-foreground-tertiary">{t('delegators')}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-success">{delegate.votingParticipation}%</div>
                        <div className="text-xs text-foreground-tertiary">{t('participation')}</div>
                      </div>
                    </div>
                    <Button variant="primary" size="sm" className="min-h-[44px]">
                      {t('delegate')}
                    </Button>
                  </div>
                </Card>
              ))}
          </div>

          {/* Empty State */}
          {!delegatesLoading && !delegatesError && filteredDelegates.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-foreground-tertiary mx-auto mb-4" />
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

export default DelegatesList;
