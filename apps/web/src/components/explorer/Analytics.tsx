'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Shield,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAnalyticsStats,
  useTvlData,
  useVolumeData,
  useProverPerformance,
  useLockDistribution,
  useUnlockDistribution,
} from '@/hooks/explorer';
import type {
  TvlDataPoint,
  VolumeDataPoint,
  ProverPerformance,
  AnalyticsStats,
  LockStatusDistribution,
  UnlockTypeDistribution,
} from '@/lib/api/explorer/types';


type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

interface ExplorerAnalyticsProps {
  locale?: string;
}

export function ExplorerAnalytics({ locale = 'ja' }: ExplorerAnalyticsProps) {
  const t = useTranslations('explorer');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // Fetch data using hooks
  const { data: analyticsStatsApi, isLoading: statsLoading, error: statsError } = useAnalyticsStats();
  const { data: tvlDataApi, isLoading: tvlLoading, error: tvlError } = useTvlData(timeRange);
  const { data: volumeDataApi, isLoading: volumeLoading, error: volumeError } = useVolumeData(timeRange);
  const { data: proverPerformanceApi, isLoading: proverLoading, error: proverError } = useProverPerformance();
  const { data: lockDistributionApi, isLoading: lockDistLoading, error: lockDistError } = useLockDistribution();
  const { data: unlockDistributionApi, isLoading: unlockDistLoading, error: unlockDistError } = useUnlockDistribution();

  // Use API data directly (no silent fallbacks per GR-1)
  const stats = analyticsStatsApi;
  const tvlData = tvlDataApi ?? [];
  const volumeData = volumeDataApi ?? [];
  const proverData = proverPerformanceApi ?? [];
  const lockStatusData = lockDistributionApi;
  const unlockTypeData = unlockDistributionApi;

  const timeRangeOptions: TimeRange[] = ['7d', '30d', '90d', '1y', 'all'];

  const maxTvl = tvlData.length > 0 ? Math.max(...tvlData.map(d => d.value)) : 1;
  const maxVolume = volumeData.length > 0 ? Math.max(...volumeData.map(d => Math.max(d.locks, d.unlocks))) : 1;

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
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium bg-background-tertiary text-foreground rounded-full transition-colors"
              aria-current="page"
            >
              {t('common.header.analytics')}
            </Link>
          </nav>
        </header>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <span className="w-1 h-7 bg-hinomaru rounded-sm" aria-hidden="true" />
            {t('analytics.pageTitle')}
          </h1>

          <div className="flex items-center gap-4">
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-secondary">{t('analytics.timeRange.label')}:</span>
              <div className="flex gap-1 bg-background-secondary p-1 rounded-lg border border-surface-tertiary">
                {timeRangeOptions.map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 min-h-[44px] text-sm font-medium rounded-md transition-colors ${
                      timeRange === range
                        ? 'bg-gold text-background'
                        : 'text-foreground-secondary hover:text-foreground'
                    }`}
                    aria-pressed={timeRange === range}
                  >
                    {t(`analytics.timeRange.${range}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" aria-hidden="true" />
              {t('analytics.export.button')}
            </Button>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {statsLoading ? (
            <>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Card key={i} padding="md" className="text-center">
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-surface-tertiary rounded w-2/3 mx-auto" />
                    <div className="h-3 bg-surface-tertiary rounded w-1/2 mx-auto" />
                  </div>
                </Card>
              ))}
            </>
          ) : statsError ? (
            <Card padding="md" className="text-center col-span-full">
              <div className="text-warning">{t('common.errors.loadFailed')}</div>
            </Card>
          ) : (
            <>
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold text-gold">{stats?.currentTvl ?? '$0'}</div>
                <div className="text-xs text-foreground-secondary mt-1 flex items-center justify-center gap-1">
                  {t('analytics.charts.tvl.current')} (ETH)
                  <span className={`flex items-center ${(stats?.tvlTrend ?? 'up') === 'up' ? 'text-success' : 'text-error'}`}>
                    {(stats?.tvlTrend ?? 'up') === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stats?.tvlChange ?? '0%'}
                  </span>
                </div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold">{stats?.totalLocks ?? '0'}</div>
                <div className="text-xs text-foreground-secondary mt-1">{t('analytics.stats.totalLocks')}</div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold">{stats?.totalUnlocks ?? '0'}</div>
                <div className="text-xs text-foreground-secondary mt-1">{t('analytics.stats.totalUnlocks')}</div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold">{stats?.avgLockAmount ?? '0 ETH'}</div>
                <div className="text-xs text-foreground-secondary mt-1">{t('analytics.stats.avgLockAmount')} (ETH)</div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold flex items-center justify-center gap-1">
                  {stats?.avgLockDuration ?? '-'}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary">
                          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{t('analytics.stats.avgLockDurationTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xs text-foreground-secondary mt-1">{t('analytics.stats.avgLockDuration')} (days)</div>
              </Card>
              <Card padding="md" className="text-center">
                <div className="text-2xl font-bold text-success flex items-center justify-center gap-1">
                  {stats?.successRate ?? '-'}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary">
                          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{t('analytics.stats.successRateTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="text-xs text-foreground-secondary mt-1">{t('analytics.stats.successRate')}</div>
              </Card>
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* TVL Chart */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] uppercase tracking-wider text-gold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" aria-hidden="true" />
                {t('analytics.sections.tvl')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('analytics.sections.tvlTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h2>
            </div>
            {/* Simple bar chart visualization */}
            <div className="h-48 flex items-end gap-1" role="img" aria-label={t('analytics.charts.tvl.title')}>
              {tvlLoading ? (
                <div className="w-full h-full flex items-center justify-center text-foreground-tertiary">
                  <div className="animate-pulse">{t('common.loading')}</div>
                </div>
              ) : tvlError ? (
                <div className="w-full h-full flex items-center justify-center text-warning">
                  {t('common.errors.loadFailed')}
                </div>
              ) : tvlData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-foreground-tertiary">
                  {t('common.noData')}
                </div>
              ) : tvlData.map((d, i) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-hinomaru to-gold rounded-t transition-all hover:opacity-80"
                    style={{ height: `${(d.value / maxTvl) * 100}%` }}
                    title={`${d.date}: ${d.value.toLocaleString()} ETH`}
                  />
                  <span className="text-[10px] text-foreground-tertiary">{d.date}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-foreground-tertiary text-center mt-2">
              {t('analytics.charts.tvl.yAxis')}
            </div>
          </Card>

          {/* Volume Chart */}
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] uppercase tracking-wider text-gold flex items-center gap-2">
                <Activity className="w-4 h-4" aria-hidden="true" />
                {t('analytics.sections.volume')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('analytics.sections.volumeTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-gold rounded" aria-hidden="true" />
                  {t('analytics.charts.volume.locks')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-hinomaru rounded" aria-hidden="true" />
                  {t('analytics.charts.volume.unlocks')}
                </span>
              </div>
            </div>
            {/* Grouped bar chart */}
            <div className="h-48 flex items-end gap-2" role="img" aria-label={t('analytics.charts.volume.title')}>
              {volumeLoading ? (
                <div className="w-full h-full flex items-center justify-center text-foreground-tertiary">
                  <div className="animate-pulse">{t('common.loading')}</div>
                </div>
              ) : volumeError ? (
                <div className="w-full h-full flex items-center justify-center text-warning">
                  {t('common.errors.loadFailed')}
                </div>
              ) : volumeData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-foreground-tertiary">
                  {t('common.noData')}
                </div>
              ) : volumeData.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-0.5 items-end h-[180px]">
                    <div
                      className="flex-1 bg-gold rounded-t transition-all hover:opacity-80"
                      style={{ height: `${(d.locks / maxVolume) * 100}%` }}
                      title={`${t('analytics.charts.volume.locks')}: ${d.locks}`}
                    />
                    <div
                      className="flex-1 bg-hinomaru rounded-t transition-all hover:opacity-80"
                      style={{ height: `${(d.unlocks / maxVolume) * 100}%` }}
                      title={`${t('analytics.charts.volume.unlocks')}: ${d.unlocks}`}
                    />
                  </div>
                  <span className="text-[10px] text-foreground-tertiary">{d.date}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-foreground-tertiary text-center mt-2">
              {t('analytics.charts.volume.yAxis')}
            </div>
          </Card>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Lock Status Distribution */}
          <Card padding="lg">
            <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4" aria-hidden="true" />
              {t('analytics.charts.locksByStatus.title')}
            </h2>
            {lockDistLoading ? (
              <div className="animate-pulse space-y-3">
                {[0, 1, 2].map((i) => <div key={i} className="h-6 bg-surface-tertiary rounded" />)}
              </div>
            ) : lockDistError ? (
              <div className="text-warning text-sm">{t('common.errors.loadFailed')}</div>
            ) : !lockStatusData ? (
              <div className="text-foreground-tertiary text-sm">{t('common.noData')}</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(lockStatusData).map(([status, count]) => {
                  const total = Object.values(lockStatusData).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                  const colorClass = status === 'active' ? 'bg-gold' : status === 'unlocking' ? 'bg-foreground-tertiary' : 'bg-success';
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t(`analytics.charts.locksByStatus.${status}`)}</span>
                        <span className="text-foreground-secondary">{count.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Unlock Type Distribution */}
          <Card padding="lg">
            <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4" aria-hidden="true" />
              {t('analytics.charts.unlocksByType.title')}
            </h2>
            {unlockDistLoading ? (
              <div className="animate-pulse space-y-3">
                {[0, 1].map((i) => <div key={i} className="h-6 bg-surface-tertiary rounded" />)}
              </div>
            ) : unlockDistError ? (
              <div className="text-warning text-sm">{t('common.errors.loadFailed')}</div>
            ) : !unlockTypeData ? (
              <div className="text-foreground-tertiary text-sm">{t('common.noData')}</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(unlockTypeData).map(([type, count]) => {
                  const total = Object.values(unlockTypeData).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
                  const colorClass = type === 'normal' ? 'bg-gold' : 'bg-warning';
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className={type === 'emergency' ? 'text-warning' : ''}>
                          {t(`analytics.charts.unlocksByType.${type}`)}
                        </span>
                        <span className="text-foreground-secondary">{count.toLocaleString()} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                        <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Challenge Rate */}
          <Card padding="lg">
            <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" aria-hidden="true" />
              {t('analytics.charts.challengeRate.title')}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary">
                      <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{t('analytics.charts.challengeRate.rateTooltip')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </h2>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-warning">{stats?.challengeRate ?? '-'}</div>
              <div className="text-xs text-foreground-secondary">{t('analytics.charts.challengeRate.rate')}</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-success">{t('analytics.charts.challengeRate.resolved')}</span>
                <span>{stats?.resolvedChallenges ?? 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-warning">{t('analytics.charts.challengeRate.pending')}</span>
                <span>{stats?.pendingChallenges ?? 0}</span>
              </div>
            </div>
          </Card>

          {/* Prover Stats Summary */}
          <Card padding="lg">
            <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" aria-hidden="true" />
              {t('analytics.sections.provers')}
            </h2>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-success">
                {proverData.length > 0 ? (proverData.reduce((a, b) => a + b.uptime, 0) / proverData.length).toFixed(1) : '0.0'}%
              </div>
              <div className="text-xs text-foreground-secondary">{t('analytics.charts.proverUptime.uptime')}</div>
              <div className="text-[10px] text-success mt-1">{t('analytics.charts.proverUptime.target')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                {proverData.length > 0 ? (proverData.reduce((a, b) => a + b.avgResponse, 0) / proverData.length).toFixed(1) : '0.0'}s
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('analytics.charts.proverUptime.avgResponseTimeTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="text-xs text-foreground-secondary">{t('analytics.charts.proverUptime.avgResponseTime')}</div>
            </div>
          </Card>
        </div>

        {/* Prover Performance Table */}
        <Card padding="lg">
          <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
            {t('analytics.charts.proverUptime.title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={t('analytics.charts.proverUptime.title')}>
              <thead>
                <tr className="border-b border-surface-tertiary">
                  <th scope="col" className="text-left py-3 text-sm font-medium text-foreground-secondary">Prover</th>
                  <th scope="col" className="text-right py-3 text-sm font-medium text-foreground-secondary">
                    {t('analytics.charts.proverUptime.uptime')}
                  </th>
                  <th scope="col" className="text-right py-3 text-sm font-medium text-foreground-secondary">
                    {t('analytics.charts.proverUptime.avgResponseTime')}
                  </th>
                  <th scope="col" className="text-right py-3 text-sm font-medium text-foreground-secondary" style={{ width: '40%' }}>
                    {t('analytics.charts.proverUptime.uptime')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {proverLoading ? (
                  <tr><td colSpan={4} className="py-8 text-center text-foreground-tertiary">
                    <div className="animate-pulse">{t('common.loading')}</div>
                  </td></tr>
                ) : proverError ? (
                  <tr><td colSpan={4} className="py-8 text-center text-warning">
                    {t('common.errors.loadFailed')}
                  </td></tr>
                ) : proverData.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-foreground-tertiary">
                    {t('common.noData')}
                  </td></tr>
                ) : proverData.map((prover) => (
                  <tr key={prover.name} className="border-b border-surface-tertiary last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/${locale}/explorer/provers`}
                        className="text-gold hover:underline inline-flex items-center min-h-[44px]"
                      >
                        {prover.name}
                      </Link>
                    </td>
                    <td className="py-3 text-right text-success">{prover.uptime}%</td>
                    <td className="py-3 text-right">{prover.avgResponse}s</td>
                    <td className="py-3">
                      <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-success rounded-full"
                          style={{ width: `${prover.uptime}%` }}
                        />
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
  );
}
