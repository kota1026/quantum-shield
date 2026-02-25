'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import {
  Search,
  ChevronRight,
  TrendingUp,
  Lock,
  Unlock,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import {
  useExplorerStats,
  useRecentLocks,
  useRecentUnlocks,
  useActiveChallenges,
} from '@/hooks/explorer';
import type { ExplorerStats, RecentLock, RecentUnlock, ActiveChallenge } from '@/lib/api/explorer/mock';

// Empty initial state (no fake data)
const FALLBACK_STATS: ExplorerStats = {
  tvl: '$0',
  tvlChange: 0,
  totalLocks: 0,
  locksChange: 0,
  pendingUnlocks: 0,
  pendingInTimeLock: 0,
  activeProvers: 0,
  proverUptime: 0,
};

const FALLBACK_RECENT_LOCKS: RecentLock[] = [];

const FALLBACK_RECENT_UNLOCKS: RecentUnlock[] = [];

const FALLBACK_ACTIVE_CHALLENGES: ActiveChallenge[] = [];

interface ExplorerOverviewProps {
  locale?: string;
}

export function ExplorerOverview({ locale = 'ja' }: ExplorerOverviewProps) {
  const t = useTranslations('explorer');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data using hooks
  const { data: statsApi } = useExplorerStats();
  const { data: recentLocksApi } = useRecentLocks();
  const { data: recentUnlocksApi } = useRecentUnlocks();
  const { data: activeChallengesApi } = useActiveChallenges();

  // Use API data with fallback (ensure arrays are always arrays)
  const mockStats = statsApi ? { ...FALLBACK_STATS, ...statsApi } : FALLBACK_STATS;
  const mockRecentLocks = Array.isArray(recentLocksApi) ? recentLocksApi : FALLBACK_RECENT_LOCKS;
  const mockRecentUnlocks = Array.isArray(recentUnlocksApi) ? recentUnlocksApi : FALLBACK_RECENT_UNLOCKS;
  const mockActiveChallenges = Array.isArray(activeChallengesApi) ? activeChallengesApi : FALLBACK_ACTIVE_CHALLENGES;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/explorer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-gold/10 text-gold';
      case 'pending':
      case 'unlocking':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary';
      case 'complete':
        return 'bg-success/10 text-success';
      case 'challenged':
      case 'open':
        return 'bg-warning/10 text-warning';
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
      case 'unlocking':
        return t('common.status.unlocking');
      case 'complete':
        return t('common.status.complete');
      case 'challenged':
        return t('common.status.challenged');
      case 'open':
        return t('common.status.open');
      default:
        return status;
    }
  };

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background">
      {/* Background glow effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Logo */}
          <div className="flex items-center gap-4">
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
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-[500px] w-full lg:mx-6"
          >
            <div className="flex items-center bg-background-secondary border border-surface-tertiary rounded-full px-4 py-2 min-h-[44px] gap-3 focus-within:border-hinomaru focus-within:ring-2 focus-within:ring-hinomaru/20 transition-all">
              <Search className="w-[18px] h-[18px] text-foreground-tertiary" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search.placeholder')}
                aria-label={t('common.search.ariaLabel')}
                className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-foreground-tertiary outline-none min-h-[44px]"
              />
            </div>
          </form>

          {/* Navigation */}
          <nav
            className="flex gap-1 bg-background-secondary p-1 rounded-full border border-surface-tertiary overflow-x-auto"
            role="navigation"
            aria-label="Explorer navigation"
          >
            <Link
              href={`/${locale}/explorer/overview`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground bg-background-tertiary rounded-full"
              aria-current="page"
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

        {/* Stats Grid */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
          aria-label={t('overview.stats.ariaLabel')}
        >
          {/* TVL Card */}
          <Card variant="hoverGradient" padding="md" className="relative" data-testid="explorer-tvl-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-secondary uppercase tracking-wider flex items-center gap-1">
                {t('overview.stats.tvl.label')}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru rounded-full" aria-label="TVLについて">
                      <HelpCircle className="w-3 h-3 text-foreground-tertiary hover:text-foreground-secondary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t('overview.stats.tvl.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1">
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                +{mockStats.tvlChange}%
              </span>
            </div>
            <div className="text-[28px] font-bold text-gold" data-testid="explorer-tvl-value">{mockStats.tvl}</div>
            <div className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              {t('overview.stats.tvl.change', { change: mockStats.tvlChange })}
            </div>
          </Card>

          {/* Total Locks Card */}
          <Card variant="hoverGradient" padding="md" className="relative" data-testid="explorer-total-locks-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-secondary uppercase tracking-wider">
                {t('overview.stats.totalLocks.label')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1">
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                +{mockStats.locksChange}
              </span>
            </div>
            <div className="text-[28px] font-bold" data-testid="explorer-total-locks-value">{mockStats.totalLocks.toLocaleString()}</div>
            <div className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
              {t('overview.stats.totalLocks.change', { count: mockStats.locksChange })}
            </div>
          </Card>

          {/* Pending Unlocks Card */}
          <Card variant="hoverGradient" padding="md" className="relative" data-testid="explorer-pending-unlocks-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-secondary uppercase tracking-wider">
                {t('overview.stats.pendingUnlocks.label')}
              </span>
            </div>
            <div className="text-[28px] font-bold" data-testid="explorer-pending-unlocks-value">{mockStats.pendingUnlocks}</div>
            <div className="text-xs text-foreground-secondary mt-1">
              {t('overview.stats.pendingUnlocks.detail', { count: mockStats.pendingInTimeLock })}
            </div>
          </Card>

          {/* Active Provers Card */}
          <Card variant="hoverGradient" padding="md" className="relative" data-testid="explorer-active-provers-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-secondary uppercase tracking-wider flex items-center gap-1">
                {t('overview.stats.activeProvers.label')}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru rounded-full" aria-label="Proverについて">
                      <HelpCircle className="w-3 h-3 text-foreground-tertiary hover:text-foreground-secondary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{t('overview.stats.activeProvers.tooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </span>
            </div>
            <div className="text-[28px] font-bold" data-testid="explorer-active-provers-value">{mockStats.activeProvers}</div>
            <div className="text-xs text-success mt-1">
              {t('overview.stats.activeProvers.uptime', { uptime: mockStats.proverUptime })}
            </div>
          </Card>
        </section>

        {/* Two Column Layout: Recent Locks & Unlocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Locks */}
          <section aria-label={t('overview.recentLocks.ariaLabel')}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-[3px] h-[18px] bg-hinomaru rounded" aria-hidden="true" />
                {t('overview.recentLocks.title')}
              </h2>
              <Link
                href={`/${locale}/explorer/locks`}
                className="text-sm text-gold flex items-center gap-1 min-h-[44px] hover:opacity-80 transition-opacity"
              >
                {t('common.viewAll')}
                <ChevronRight className="w-[14px] h-[14px]" aria-hidden="true" />
              </Link>
            </div>
            <Card padding="none" className="overflow-hidden">
              <table className="w-full border-collapse" role="table">
                <thead>
                  <tr className="bg-background-secondary border-b border-surface-tertiary">
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentLocks.table.lockId')}
                    </th>
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentLocks.table.amount')}
                    </th>
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentLocks.table.status')}
                    </th>
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentLocks.table.time')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecentLocks.map((lock, index) => (
                    <tr
                      key={lock.id}
                      className="border-b border-surface-tertiary last:border-b-0 hover:bg-background-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-inset"
                      onClick={() => router.push(`/${locale}/explorer/locks/${lock.id}`)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Lock ${lock.id}, ${lock.amount} ETH, ${getStatusLabel(lock.status)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/${locale}/explorer/locks/${lock.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{lock.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{lock.amount}</span>
                        <span className="text-foreground-secondary font-normal ml-1">ETH</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(lock.status)}`}
                        >
                          {getStatusLabel(lock.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground-secondary text-sm">{lock.time}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          {/* Recent Unlocks */}
          <section aria-label={t('overview.recentUnlocks.ariaLabel')}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <span className="w-[3px] h-[18px] bg-hinomaru rounded" aria-hidden="true" />
                {t('overview.recentUnlocks.title')}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-success">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" aria-hidden="true" />
                  {t('common.live')}
                </div>
                <Link
                  href={`/${locale}/explorer/unlocks`}
                  className="text-sm text-gold flex items-center gap-1 min-h-[44px] hover:opacity-80 transition-opacity"
                >
                  {t('common.viewAll')}
                  <ChevronRight className="w-[14px] h-[14px]" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <Card padding="none" className="overflow-hidden">
              <table className="w-full border-collapse" role="table">
                <thead>
                  <tr className="bg-background-secondary border-b border-surface-tertiary">
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentUnlocks.table.unlockId')}
                    </th>
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentUnlocks.table.type')}
                    </th>
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentUnlocks.table.status')}
                    </th>
                    <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                      {t('overview.recentUnlocks.table.timeLock')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockRecentUnlocks.map((unlock, index) => (
                    <tr
                      key={unlock.id}
                      className="border-b border-surface-tertiary last:border-b-0 hover:bg-background-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-inset"
                      onClick={() => router.push(`/${locale}/explorer/unlocks/${unlock.id}`)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Unlock ${unlock.id}, ${unlock.type === 'emergency' ? t('common.unlockType.emergency') : t('common.unlockType.normal')}, ${getStatusLabel(unlock.status)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(`/${locale}/explorer/unlocks/${unlock.id}`);
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{unlock.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            unlock.type === 'emergency'
                              ? 'text-warning'
                              : 'text-foreground-secondary'
                          }
                        >
                          {unlock.type === 'emergency'
                            ? t('common.unlockType.emergency')
                            : t('common.unlockType.normal')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(unlock.status)}`}
                        >
                          {getStatusLabel(unlock.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-foreground-secondary text-sm">{unlock.timeLock}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        </div>

        {/* Active Challenges */}
        <section aria-label={t('overview.activeChallenges.ariaLabel')}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-[3px] h-[18px] bg-hinomaru rounded" aria-hidden="true" />
              {t('overview.activeChallenges.title')}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru rounded-full" aria-label="Challengeについて">
                    <HelpCircle className="w-4 h-4 text-foreground-tertiary hover:text-foreground-secondary" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t('overview.activeChallenges.titleTooltip')}</p>
                </TooltipContent>
              </Tooltip>
            </h2>
            <Link
              href={`/${locale}/explorer/challenges`}
              className="text-sm text-gold flex items-center gap-1 min-h-[44px] hover:opacity-80 transition-opacity"
            >
              {t('common.viewAll')}
              <ChevronRight className="w-[14px] h-[14px]" aria-hidden="true" />
            </Link>
          </div>
          <Card padding="none" className="overflow-hidden">
            <table className="w-full border-collapse" role="table">
              <thead>
                <tr className="bg-background-secondary border-b border-surface-tertiary">
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('overview.activeChallenges.table.challengeId')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('overview.activeChallenges.table.targetUnlock')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('overview.activeChallenges.table.challenger')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('overview.activeChallenges.table.bond')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('overview.activeChallenges.table.defenseDeadline')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('overview.activeChallenges.table.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockActiveChallenges.map((challenge) => (
                  <tr
                    key={challenge.id}
                    className="border-b border-surface-tertiary last:border-b-0 hover:bg-background-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-inset"
                    onClick={() => router.push(`/${locale}/explorer/challenges/${challenge.id}`)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Challenge ${challenge.id}, Bond ${challenge.bond} ETH, ${getStatusLabel(challenge.status)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/${locale}/explorer/challenges/${challenge.id}`);
                      }
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{challenge.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/explorer/unlocks/${challenge.targetUnlock}`}
                        className="font-mono text-sm text-gold hover:underline inline-flex items-center min-h-[44px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {challenge.targetUnlock}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/explorer/address/${challenge.challenger}`}
                        className="font-mono text-sm hover:underline inline-flex items-center min-h-[44px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {challenge.challenger}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{challenge.bond}</span>
                      <span className="text-foreground-secondary font-normal ml-1">ETH</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-warning text-sm">{challenge.deadline}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(challenge.status)}`}
                      >
                        {getStatusLabel(challenge.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-center text-foreground-tertiary py-4 text-sm">
            {t('overview.activeChallenges.summary', { active: 1, total: 142 })}
          </p>
        </section>
      </div>
    </div>
    </TooltipProvider>
  );
}
