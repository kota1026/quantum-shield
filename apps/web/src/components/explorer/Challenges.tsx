'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';
import {
  Search,
  AlertTriangle,
  Clock,
  Shield,
  Gavel,
  ChevronRight,
  Filter,
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
import { cn } from '@/lib/utils';
import { useChallengeStats, useChallenges } from '@/hooks/explorer';
import type { ChallengeStats, ChallengeDetail } from '@/lib/v1/explorer/mock';

// Fallback data (used when API is unavailable)
const FALLBACK_CHALLENGE_STATS: ChallengeStats = {
  totalChallenges: 156,
  active: 3,
  resolved: 153,
  successRate: 78.5,
};

const FALLBACK_CHALLENGES: ChallengeDetail[] = [
  {
    id: 'CHG-0x4f2c...891',
    targetUnlock: '0x7d4e...a563',
    challenger: '0x8b3c...d412',
    bond: '0.15',
    amount: '45.00',
    deadline: '47h 23m',
    status: 'defense',
    createdAt: '2026-01-17 14:32',
  },
  {
    id: 'CHG-0x9a1e...f23',
    targetUnlock: '0x2e7f...d934',
    challenger: '0x1c4d...e891',
    bond: '0.25',
    amount: '120.50',
    deadline: '23h 41m',
    status: 'judgment',
    createdAt: '2026-01-16 09:15',
  },
  {
    id: 'CHG-0x7b3f...a45',
    targetUnlock: '0x5c9a...e127',
    challenger: '0x9f2a...c734',
    bond: '0.50',
    amount: '250.00',
    deadline: '-',
    status: 'resolved',
    createdAt: '2026-01-15 18:42',
    result: 'challenger_won',
  },
  {
    id: 'CHG-0x3d8c...b67',
    targetUnlock: '0x8a4e...f912',
    challenger: '0x2b5f...d823',
    bond: '0.10',
    amount: '30.00',
    deadline: '-',
    status: 'resolved',
    createdAt: '2026-01-14 11:28',
    result: 'prover_won',
  },
  {
    id: 'CHG-0x1e9a...c89',
    targetUnlock: '0x6f3b...a456',
    challenger: '0x4c7d...e234',
    bond: '0.35',
    amount: '180.75',
    deadline: '-',
    status: 'resolved',
    createdAt: '2026-01-13 22:05',
    result: 'challenger_won',
  },
];

interface ExplorerChallengesProps {
  locale?: string;
}

export function ExplorerChallenges({ locale = 'ja' }: ExplorerChallengesProps) {
  const t = useTranslations('explorer');
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch data using hooks
  const { data: challengeStatsApi } = useChallengeStats();
  const { data: challengesApi } = useChallenges({ status: statusFilter });

  // Use API data with fallback
  const mockStats = challengeStatsApi ?? FALLBACK_CHALLENGE_STATS;
  const mockChallenges = challengesApi?.challenges ?? FALLBACK_CHALLENGES;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/explorer/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'defense':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'judgment':
        return 'bg-gold/10 text-gold border-gold/30';
      case 'resolved':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary border-foreground-tertiary/30';
      default:
        return 'bg-surface-tertiary text-foreground-secondary';
    }
  };

  const getResultBadgeClass = (result?: string) => {
    switch (result) {
      case 'challenger_won':
        return 'bg-success/10 text-success';
      case 'prover_won':
        return 'bg-hinomaru/10 text-hinomaru';
      default:
        return '';
    }
  };

  const filteredChallenges = mockChallenges.filter((challenge) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return challenge.status !== 'resolved';
    return challenge.status === statusFilter;
  });

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Premium Background */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-50"
            style={{
              background: 'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <Link href={`/${locale}/explorer/overview`} className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div
                  className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
                  aria-hidden="true"
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
                </div>
                <div className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                  Quantum Shield
                </span>
                <span className="text-[10px] text-gold tracking-[2px] uppercase">
                  Explorer
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex gap-1 bg-background-secondary rounded-full p-1 border border-border/30">
              {['overview', 'locks', 'unlocks', 'challenges', 'provers', 'analytics'].map((item) => (
                <Link
                  key={item}
                  href={`/${locale}/explorer/${item === 'overview' ? 'overview' : item}`}
                  className={cn(
                    'px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium rounded-full transition-all',
                    item === 'challenges'
                      ? 'bg-background-tertiary text-foreground'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {t(`common.header.${item}`)}
                </Link>
              ))}
            </nav>
          </header>

          {/* Page Title */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">{t('challenges.pageTitle')}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <span className="text-warning font-bold text-xl">{mockStats.active}</span>
                <span className="text-foreground-secondary ml-2">{t('challenges.stats.active')}</span>
              </div>
              <div className="text-right">
                <span className="text-foreground font-bold text-xl">{mockStats.resolved}</span>
                <span className="text-foreground-secondary ml-2">{t('challenges.stats.resolved')}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="text-sm text-foreground-secondary">{t('challenges.stats.totalChallenges')}</span>
              </div>
              <div className="text-2xl font-bold">{mockStats.totalChallenges}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-gold" />
                <span className="text-sm text-foreground-secondary">{t('challenges.stats.active')}</span>
              </div>
              <div className="text-2xl font-bold text-warning">{mockStats.active}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Gavel className="w-5 h-5 text-foreground-secondary" />
                <span className="text-sm text-foreground-secondary">{t('challenges.stats.resolved')}</span>
              </div>
              <div className="text-2xl font-bold">{mockStats.resolved}</div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-success" />
                <span className="text-sm text-foreground-secondary">{t('challenges.stats.successRate')}</span>
              </div>
              <div className="text-2xl font-bold text-success">{mockStats.successRate}%</div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-h-11 bg-background-secondary border border-border rounded-lg px-4 py-2 text-sm"
            >
              <option value="all">{t('challenges.filters.all')}</option>
              <option value="active">{t('challenges.filters.active')}</option>
              <option value="defense">{t('challenges.filters.defense')}</option>
              <option value="judgment">{t('challenges.filters.judgment')}</option>
              <option value="resolved">{t('challenges.filters.resolved')}</option>
            </select>
          </div>

          {/* Challenges Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background-secondary">
                    <th className="text-left text-xs font-semibold text-foreground-tertiary uppercase tracking-wider px-6 py-4">
                      {t('challenges.table.challengeId')}
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground-tertiary uppercase tracking-wider px-6 py-4">
                      {t('challenges.table.targetUnlock')}
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground-tertiary uppercase tracking-wider px-6 py-4">
                      {t('challenges.table.amount')}
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground-tertiary uppercase tracking-wider px-6 py-4">
                      <div className="flex items-center gap-1">
                        {t('challenges.table.bond')}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-surface-secondary transition-colors" aria-label={t('challenges.tooltip.bondAriaLabel')}>
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{t('challenges.tooltip.bond')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground-tertiary uppercase tracking-wider px-6 py-4">
                      {t('challenges.table.deadline')}
                    </th>
                    <th className="text-left text-xs font-semibold text-foreground-tertiary uppercase tracking-wider px-6 py-4">
                      <div className="flex items-center gap-1">
                        {t('challenges.table.status')}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-surface-secondary transition-colors" aria-label={t('challenges.tooltip.statusAriaLabel')}>
                              <HelpCircle className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{t('challenges.tooltip.status')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChallenges.map((challenge) => (
                    <tr
                      key={challenge.id}
                      className="border-b border-border/50 hover:bg-background-secondary/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/${locale}/explorer/challenges/${challenge.id}`)}
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm">{challenge.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/${locale}/explorer/unlocks/${challenge.targetUnlock}`}
                          className="font-mono text-sm text-gold hover:underline inline-flex items-center min-h-[44px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {challenge.targetUnlock}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono">{challenge.amount} ETH</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono">{challenge.bond} ETH</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'text-sm',
                          challenge.status !== 'resolved' && 'text-warning'
                        )}>
                          {challenge.deadline}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'px-3 py-1 rounded-full text-xs font-medium border',
                              getStatusBadgeClass(challenge.status)
                            )}
                          >
                            {t(`challenges.status.${challenge.status}`)}
                          </span>
                          {challenge.result && (
                            <span
                              className={cn(
                                'px-2 py-1 rounded text-xs',
                                getResultBadgeClass(challenge.result)
                              )}
                            >
                              {t(`challenges.result.${challenge.result}`)}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
