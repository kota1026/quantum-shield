'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent, useMemo } from 'react';
import { Search as SearchIcon, SearchX } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock search results
const mockResults = {
  locks: [
    {
      id: '0x7a3f8b2c...e821d4f9',
      type: 'lock' as const,
      status: 'active',
      amount: '125.5',
      owner: '0x9b2c...f412',
      lockedAt: '2026-01-10 14:32',
      l2Tx: '0x4d8e...a923',
    },
    {
      id: '0x7a3f1d9e...c734b821',
      type: 'lock' as const,
      status: 'complete',
      amount: '50.0',
      owner: '0x1f6a...c734',
      lockedAt: '2026-01-08 09:15',
      unlockedAt: '2026-01-09 09:15',
    },
  ],
  unlocks: [
    {
      id: '0x7a3f2e7f...d934a127',
      type: 'unlock' as const,
      status: 'pending',
      unlockType: 'normal',
      lockId: '0x7a3f...e821',
      timeLock: '23h 14m remaining',
      proverSigs: '3 of 5',
    },
  ],
  addresses: [
    {
      id: '0x7a3f8b2c4d5e6f...e821d4f9a1b2c3',
      type: 'address' as const,
      totalLocked: '175.5',
      activeLocks: 2,
      totalTransactions: 15,
      firstSeen: '2025-12-15',
    },
  ],
  challenges: [] as Array<{
    id: string;
    type: 'challenge';
    status: string;
    targetUnlock: string;
    challenger: string;
    bond: string;
  }>,
};

type FilterType = 'all' | 'locks' | 'unlocks' | 'addresses' | 'challenges';

interface ExplorerSearchProps {
  locale?: string;
  initialQuery?: string;
}

export function ExplorerSearch({ locale = 'ja', initialQuery = '' }: ExplorerSearchProps) {
  const t = useTranslations('explorer');
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q') || initialQuery;
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/explorer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const filterCounts = useMemo(() => ({
    all: mockResults.locks.length + mockResults.unlocks.length + mockResults.addresses.length + mockResults.challenges.length,
    locks: mockResults.locks.length,
    unlocks: mockResults.unlocks.length,
    addresses: mockResults.addresses.length,
    challenges: mockResults.challenges.length,
  }), []);

  const filteredResults = useMemo(() => {
    switch (activeFilter) {
      case 'locks':
        return mockResults.locks;
      case 'unlocks':
        return mockResults.unlocks;
      case 'addresses':
        return mockResults.addresses;
      case 'challenges':
        return mockResults.challenges;
      default:
        return [
          ...mockResults.locks,
          ...mockResults.unlocks,
          ...mockResults.addresses,
          ...mockResults.challenges,
        ];
    }
  }, [activeFilter]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gold/10 text-gold';
      case 'pending':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary';
      case 'complete':
        return 'bg-success/10 text-success';
      default:
        return 'bg-surface-tertiary text-foreground-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return t('common.status.active');
      case 'pending':
        return t('common.status.pending');
      case 'complete':
        return t('common.status.complete');
      default:
        return status;
    }
  };

  const handleResultClick = (result: typeof filteredResults[number]) => {
    switch (result.type) {
      case 'lock':
        router.push(`/${locale}/explorer/locks/${result.id}`);
        break;
      case 'unlock':
        router.push(`/${locale}/explorer/unlocks/${result.id}`);
        break;
      case 'address':
        router.push(`/${locale}/explorer/address/${result.id}`);
        break;
      case 'challenge':
        router.push(`/${locale}/explorer/challenges/${result.id}`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Logo */}
          <Link href={`/${locale}/explorer/overview`} className="flex items-center gap-4">
            <div className="w-11 h-11 relative flex items-center justify-center">
              <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_25s_linear_infinite]">
                <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-gold rounded-full" />
              </div>
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">Quantum Shield</span>
              <span className="text-[10px] text-gold tracking-widest uppercase">Explorer</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="flex gap-1 bg-background-secondary p-1 rounded-full border border-surface-tertiary overflow-x-auto"
            role="navigation"
            aria-label="Explorer navigation"
          >
            <Link
              href={`/${locale}/explorer/overview`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.overview')}
            </Link>
            <Link
              href={`/${locale}/explorer/locks`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.locks')}
            </Link>
            <Link
              href={`/${locale}/explorer/unlocks`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.unlocks')}
            </Link>
            <Link
              href={`/${locale}/explorer/challenges`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.challenges')}
            </Link>
            <Link
              href={`/${locale}/explorer/provers`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.provers')}
            </Link>
            <Link
              href={`/${locale}/explorer/analytics`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.analytics')}
            </Link>
          </nav>
        </header>

        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex items-center bg-background-secondary border border-surface-tertiary rounded-xl px-6 py-4 gap-4 focus-within:border-hinomaru focus-within:ring-2 focus-within:ring-hinomaru/20 transition-all">
              <SearchIcon className="w-5 h-5 text-foreground-tertiary flex-shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search.placeholder')}
                aria-label={t('common.search.ariaLabel')}
                className="flex-1 bg-transparent border-none min-h-[44px] text-base text-foreground placeholder:text-foreground-tertiary outline-none"
              />
              <Button type="submit" variant="primary" size="md">
                {t('search.searchButton')}
              </Button>
            </div>
          </form>

          {/* Search Meta */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-secondary">
              {t('search.resultsFor', { query: queryParam })}
            </span>
            <span className="text-sm text-foreground-secondary">
              {t('search.foundResults', { count: filterCounts.all })}
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          className="flex gap-2 mb-6 flex-wrap"
          role="tablist"
          aria-label="Filter search results"
        >
          {(['all', 'locks', 'unlocks', 'addresses', 'challenges'] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru ${
                activeFilter === filter
                  ? 'bg-hinomaru/10 border-hinomaru text-hinomaru'
                  : 'bg-background-secondary border-surface-tertiary text-foreground-secondary hover:text-foreground hover:border-surface-secondary'
              }`}
              role="tab"
              aria-selected={activeFilter === filter}
              aria-controls="results-panel"
            >
              {t(`search.filters.${filter}`)}
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  activeFilter === filter
                    ? 'bg-hinomaru text-white'
                    : 'bg-background-tertiary text-foreground-tertiary'
                }`}
              >
                {filterCounts[filter]}
              </span>
            </button>
          ))}
        </div>

        {/* Results List */}
        <div id="results-panel" role="tabpanel" className="space-y-3">
          {filteredResults.length === 0 ? (
            <Card padding="lg" className="text-center py-16">
              <SearchX className="w-16 h-16 mx-auto mb-4 text-foreground-tertiary" aria-hidden="true" />
              <h2 className="text-lg font-semibold mb-2">{t('search.noResults.title')}</h2>
              <p className="text-foreground-secondary">{t('search.noResults.description')}</p>
            </Card>
          ) : (
            filteredResults.map((result) => (
              <Card
                key={result.id}
                padding="md"
                className="cursor-pointer hover:bg-background-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru"
                onClick={() => handleResultClick(result)}
                tabIndex={0}
                role="button"
                aria-label={`${t(`search.resultTypes.${result.type}`)} ${result.id}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResultClick(result);
                  }
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-gold mb-1">
                      {t(`search.resultTypes.${result.type}`)}
                    </div>
                    <div className="font-mono text-[15px]">{result.id}</div>
                  </div>
                  {'status' in result && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(result.status)}`}
                    >
                      {getStatusLabel(result.status)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.type === 'lock' && (
                    <>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.amount')}
                        </div>
                        <div className="text-sm">{result.amount} ETH</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.owner')}
                        </div>
                        <div className="text-sm font-mono">{result.owner}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.lockedAt')}
                        </div>
                        <div className="text-sm">{result.lockedAt}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {'unlockedAt' in result ? t('search.resultFields.unlockedAt') : t('search.resultFields.l2Tx')}
                        </div>
                        <div className="text-sm font-mono">
                          {'unlockedAt' in result ? result.unlockedAt : result.l2Tx}
                        </div>
                      </div>
                    </>
                  )}

                  {result.type === 'unlock' && (
                    <>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.type')}
                        </div>
                        <div className="text-sm">
                          {result.unlockType === 'normal' ? t('common.unlockType.normal') : t('common.unlockType.emergency')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.lockId')}
                        </div>
                        <div className="text-sm font-mono">{result.lockId}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.timeLock')}
                        </div>
                        <div className="text-sm">{result.timeLock}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.proverSigs')}
                        </div>
                        <div className="text-sm">{result.proverSigs}</div>
                      </div>
                    </>
                  )}

                  {result.type === 'address' && (
                    <>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.totalLocked')}
                        </div>
                        <div className="text-sm">{result.totalLocked} ETH</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.activeLocks')}
                        </div>
                        <div className="text-sm">{result.activeLocks}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.totalTransactions')}
                        </div>
                        <div className="text-sm">{result.totalTransactions}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-foreground-tertiary uppercase tracking-wider mb-1">
                          {t('search.resultFields.firstSeen')}
                        </div>
                        <div className="text-sm">{result.firstSeen}</div>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
