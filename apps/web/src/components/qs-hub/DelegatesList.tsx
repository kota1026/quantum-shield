'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Users,
  ArrowLeft,
  Search,
  ChevronRight,
  TrendingUp,
  Vote,
  CheckCircle2,
  Star,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Demo delegates data
const DEMO_DELEGATES = [
  {
    id: '1',
    name: 'Watanabe DAO',
    address: '0x1234...5678',
    initial: 'W',
    totalPower: 285000,
    delegators: 156,
    votingParticipation: 98,
    proposalsCreated: 5,
    description: 'Active community member focused on protocol security and sustainable growth.',
    isVerified: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Sato Crypto',
    address: '0xabcd...efgh',
    initial: 'S',
    totalPower: 198000,
    delegators: 89,
    votingParticipation: 95,
    proposalsCreated: 3,
    description: 'DeFi researcher with expertise in tokenomics and governance design.',
    isVerified: true,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'QS Council',
    address: '0x9876...5432',
    initial: 'Q',
    totalPower: 450000,
    delegators: 342,
    votingParticipation: 100,
    proposalsCreated: 12,
    description: 'Official Quantum Shield Council multisig for emergency decisions.',
    isVerified: true,
    isFeatured: false,
  },
  {
    id: '4',
    name: 'Tanaka Labs',
    address: '0xdef0...1234',
    initial: 'T',
    totalPower: 125000,
    delegators: 67,
    votingParticipation: 87,
    proposalsCreated: 2,
    description: 'Research lab focused on quantum-resistant cryptography.',
    isVerified: false,
    isFeatured: false,
  },
  {
    id: '5',
    name: 'Tokyo Node',
    address: '0x5555...6666',
    initial: 'N',
    totalPower: 89000,
    delegators: 45,
    votingParticipation: 92,
    proposalsCreated: 1,
    description: 'Infrastructure provider running Observer and Prover nodes.',
    isVerified: true,
    isFeatured: false,
  },
];

// User's current delegation
const DEMO_MY_DELEGATIONS = [
  { delegateId: '1', amount: 3000 },
  { delegateId: '2', amount: 2000 },
];

export function DelegatesList() {
  const t = useTranslations('qs-hub.vote.delegates');
  const tCommon = useTranslations('qs-hub.common');

  // State
  const [searchQuery, setSearchQuery] = useState('');

  // Filter delegates
  const filteredDelegates = useMemo(() => {
    if (!searchQuery) return DEMO_DELEGATES;
    const query = searchQuery.toLowerCase();
    return DEMO_DELEGATES.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.address.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Featured delegates
  const featuredDelegates = useMemo(() => {
    return DEMO_DELEGATES.filter((d) => d.isFeatured);
  }, []);

  // Get my delegation for a delegate
  const getMyDelegation = (delegateId: string) => {
    return DEMO_MY_DELEGATIONS.find((d) => d.delegateId === delegateId);
  };

  // Total delegated
  const totalDelegated = useMemo(() => {
    return DEMO_MY_DELEGATIONS.reduce((sum, d) => sum + d.amount, 0);
  }, []);

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
                <div className="text-2xl font-bold font-mono text-gold">{totalDelegated.toLocaleString()}</div>
                <div className="text-xs text-foreground-tertiary">{t('myDelegations.delegatedVeQS')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{DEMO_MY_DELEGATIONS.length}</div>
                <div className="text-xs text-foreground-tertiary">{t('myDelegations.delegates')}</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Featured Delegates */}
        {featuredDelegates.length > 0 && (
          <section className="mb-8" aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('featured.title')}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {featuredDelegates.map((delegate) => {
                const myDelegation = getMyDelegation(delegate.id);
                return (
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
                        {myDelegation && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <span className="text-xs text-gold">
                              {t('myDelegation', { amount: myDelegation.amount.toLocaleString() })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
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
            {filteredDelegates.map((delegate) => {
              const myDelegation = getMyDelegation(delegate.id);
              return (
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
                    {myDelegation ? (
                      <Button variant="outline" size="sm" className="min-h-[44px]">
                        {t('manage')}
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" className="min-h-[44px]">
                        {t('delegate')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredDelegates.length === 0 && (
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
