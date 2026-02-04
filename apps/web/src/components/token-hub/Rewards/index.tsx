'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Check,
  TrendingUp,
  Calendar,
  Percent,
  Clock,
  Lock,
  Vote,
  Users,
  ChevronRight,
  Sparkles,
  BarChart3,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { ApyTooltip } from './ApyTooltip';
import { EpochTooltip } from './EpochTooltip';
import {
  useRewardsSummary,
  useRewardsHistory,
  useRewardsBreakdown,
  useEpoch,
} from '@/hooks/token-hub/useTokenHub';
import {
  MOCK_REWARDS_SUMMARY,
  MOCK_REWARDS_HISTORY,
  MOCK_REWARDS_BREAKDOWN,
  MOCK_EPOCH,
} from '@/lib/api/token-hub/mock';

// Fallback data for when API is unavailable
const FALLBACK_REWARDS = MOCK_REWARDS_SUMMARY;
const FALLBACK_HISTORY = MOCK_REWARDS_HISTORY;
const FALLBACK_BREAKDOWN = MOCK_REWARDS_BREAKDOWN;
const FALLBACK_EPOCH = MOCK_EPOCH;

// Weekly chart data (8 weeks)
const CHART_DATA = [130, 150, 160, 140, 170, 155, 165, 175];
const CHART_MAX = Math.max(...CHART_DATA);

export function TokenHubRewards() {
  const t = useTranslations('token-hub.rewards');
  const tCommon = useTranslations('token-hub.common');
  const router = useRouter();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Fetch data from API with fallback
  const { data: rewardsApi } = useRewardsSummary();
  const { data: historyApi } = useRewardsHistory();
  const { data: breakdownApi } = useRewardsBreakdown();
  const { data: epochApi } = useEpoch();

  // Use API data or fallback
  const rewardsSummary = rewardsApi ?? FALLBACK_REWARDS;
  const history = historyApi ?? FALLBACK_HISTORY;
  const breakdown = breakdownApi ?? FALLBACK_BREAKDOWN;
  const epoch = epochApi ?? FALLBACK_EPOCH;

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Gold Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Coins className="w-8 h-8 text-gold" aria-hidden="true" />
            {t('title')}
          </h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Claim Banner */}
        <div
          className={cn(
            'bg-gradient-to-r from-background-secondary to-gold/10',
            'border-2 border-gold rounded-2xl p-6 md:p-8 mb-8',
            'flex flex-col md:flex-row justify-between items-center gap-6',
            'relative overflow-hidden'
          )}
        >
          {/* Background decoration */}
          <div
            className="absolute -right-20 -top-20 w-64 h-64 bg-gold/5 rounded-full blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 text-center md:text-left">
            <div className="flex items-center gap-2 text-sm text-foreground-secondary mb-2">
              <Sparkles className="w-4 h-4 text-gold" aria-hidden="true" />
              {t('claim.label')}
            </div>
            <div className="text-4xl md:text-5xl font-bold font-mono text-gold mb-1">
              {rewardsSummary.claimable.toLocaleString()} QS
            </div>
            <div className="text-lg text-foreground-secondary">
              {t('claim.usdValue', { amount: rewardsSummary.claimableUsd.toLocaleString() })}
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleNavigate('/token-hub/rewards/claim')}
            className="relative z-10 px-8 py-4 text-lg font-bold"
            aria-label={t('claim.buttonAriaLabel', { amount: rewardsSummary.claimable })}
          >
            <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
            {t('claim.button')}
          </Button>
        </div>

        {/* Stats Grid */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          {/* Total Earned */}
          <Card variant="hoverGradient" padding="md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary flex items-center gap-1">
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                {t('stats.totalEarned.label')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                +{rewardsSummary.totalEarnedChange.toLocaleString()}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-gold">
              {rewardsSummary.totalEarned.toLocaleString()}
              <span className="text-sm font-medium text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>

          {/* Weekly Average */}
          <Card variant="hoverGradient" padding="md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary flex items-center gap-1">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {t('stats.weeklyAverage.label')}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {rewardsSummary.weeklyAverage}
              <span className="text-sm font-medium text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>

          {/* Current APY */}
          <Card variant="hoverGradient" padding="md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-foreground-tertiary" aria-hidden="true" />
                <ApyTooltip label={t('stats.currentApy.label')} />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-gold">
              {rewardsSummary.currentApy}
              <span className="text-sm font-medium text-foreground-secondary ml-1">%</span>
            </div>
          </Card>

          {/* Next Reward */}
          <Card variant="hoverGradient" padding="md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {t('stats.nextReward.label')}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              ~{rewardsSummary.nextReward}
              <span className="text-sm font-medium text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column - Rewards History */}
          <Card padding="none" className="overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" aria-hidden="true" />
                {t('history.title')}
              </h2>
              <Link
                href="/token-hub/rewards/history"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
              >
                {t('history.viewAll')}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="p-6">
              {/* Chart */}
              <div className="h-48 mb-6" aria-label={t('history.chartAriaLabel')}>
                <svg className="w-full h-full" viewBox="0 0 600 180" role="img">
                  <title>{t('history.chartTitle')}</title>
                  {/* Grid lines */}
                  <line x1="40" y1="30" x2="580" y2="30" stroke="rgba(255,255,255,0.04)" />
                  <line x1="40" y1="70" x2="580" y2="70" stroke="rgba(255,255,255,0.04)" />
                  <line x1="40" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,0.04)" />
                  <line x1="40" y1="150" x2="580" y2="150" stroke="rgba(255,255,255,0.04)" />
                  {/* Y-axis labels */}
                  <text x="35" y="35" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">200</text>
                  <text x="35" y="75" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">150</text>
                  <text x="35" y="115" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">100</text>
                  <text x="35" y="155" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">50</text>
                  {/* Bars */}
                  {CHART_DATA.map((value, index) => {
                    const barWidth = 40;
                    const barGap = 60;
                    const x = 60 + index * barGap;
                    const maxHeight = 120;
                    const height = (value / 200) * maxHeight;
                    const y = 150 - height;
                    return (
                      <g key={index}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx="4"
                          className="fill-gold/80 hover:fill-gold transition-colors cursor-pointer"
                          role="img"
                          aria-label={`${t('history.week')} ${index + 1}: ${value} QS`}
                        />
                        <text
                          x={x + barWidth / 2}
                          y="175"
                          className="fill-foreground-tertiary text-[10px] font-mono"
                          textAnchor="middle"
                        >
                          W{index + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* History List */}
              <ul className="divide-y divide-border" role="list" aria-label={t('history.listAriaLabel')}>
                {history.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center gap-4 py-4">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Check className="w-5 h-5 text-success" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t('history.type.weeklyReward')}</div>
                        <div className="text-xs text-foreground-tertiary font-mono">{item.date}</div>
                      </div>
                      <div className="text-sm font-semibold font-mono text-success">
                        +{item.amount} QS
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Right Column - Reward Breakdown */}
          <Card padding="none" className="overflow-hidden h-fit">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Coins className="w-5 h-5 text-gold" aria-hidden="true" />
                {t('breakdown.title')}
              </h2>
            </div>
            <div className="p-6">
              {/* Breakdown List */}
              <ul className="divide-y divide-border mb-6" role="list" aria-label={t('breakdown.ariaLabel')}>
                <li className="flex justify-between items-center py-4">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold" aria-hidden="true" />
                    {t('breakdown.veqsHolding')}
                  </span>
                  <span className="font-mono font-semibold text-gold">
                    {breakdown.veqsHolding} QS
                  </span>
                </li>
                <li className="flex justify-between items-center py-4">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Vote className="w-4 h-4 text-gold" aria-hidden="true" />
                    {t('breakdown.votingParticipation')}
                  </span>
                  <span className="font-mono font-semibold text-gold">
                    {breakdown.votingParticipation} QS
                  </span>
                </li>
                <li className="flex justify-between items-center py-4">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Users className="w-4 h-4 text-gold" aria-hidden="true" />
                    {t('breakdown.delegationBonus')}
                  </span>
                  <span className="font-mono font-semibold text-gold">
                    {breakdown.delegationBonus} QS
                  </span>
                </li>
              </ul>

              {/* Epoch Box */}
              <div className="bg-background-secondary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-hinomaru" aria-hidden="true" />
                  <EpochTooltip label={t('epoch.title')} />
                </div>
                <div
                  className="h-2 bg-background rounded-full overflow-hidden mb-2"
                  role="progressbar"
                  aria-valuenow={epoch.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('epoch.progressAriaLabel', { progress: epoch.progress })}
                >
                  <div
                    className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all duration-500"
                    style={{ width: `${epoch.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-foreground-tertiary">
                  <span>{t('epoch.number', { number: epoch.number })}</span>
                  <span>{t('epoch.remaining', { time: epoch.remaining })}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-wrap gap-4 md:gap-6" aria-label={tCommon('footer.navLabel')}>
              <Link
                href="/consumer/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {tCommon('footer.terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {tCommon('footer.privacy')}
              </Link>
              <Link
                href="/consumer/security"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {tCommon('footer.security')}
              </Link>
            </nav>
            <p className="text-xs text-foreground-tertiary text-center max-w-xl">
              {tCommon('footer.disclaimer')}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default TokenHubRewards;
