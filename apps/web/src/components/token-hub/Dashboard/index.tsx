'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Clock,
  Users,
  Coins,
  ChevronRight,
  TrendingUp,
  HelpCircle,
  BarChart3,
  BookOpen,
  ShoppingCart,
  MessageCircleQuestion,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { TokenHubHeader } from './TokenHubHeader';
import { VeQSTooltip } from './VeQSTooltip';
import { VotingPowerTooltip } from './VotingPowerTooltip';

// Demo data - In production, this would come from API/hooks
const DEMO_STATS = {
  qsBalance: 12450,
  lockedQS: 8500,
  veQSBalance: 6225,
  votingPower: 0.12,
  lockEndDate: '2028-01-15',
  lockDuration: '3 Years',
  timeRemaining: '2Y 3M 7D',
  multiplier: 0.73,
};

const DEMO_DELEGATIONS = [
  {
    id: '1',
    name: 'Watanabe Delegate',
    initial: 'W',
    totalPower: '285K veQS',
    amount: 3000,
    percent: 48,
  },
  {
    id: '2',
    name: 'Sato Crypto',
    initial: 'S',
    totalPower: '198K veQS',
    amount: 2000,
    percent: 32,
  },
  {
    id: '3',
    name: 'Tanaka DeFi',
    initial: 'T',
    totalPower: '156K veQS',
    amount: 1225,
    percent: 20,
  },
];

const DEMO_REWARDS = {
  claimable: 847,
  usdValue: 4235,
  epochProgress: 65,
};

export function TokenHubDashboard() {
  const t = useTranslations('token-hub.dashboard');
  const router = useRouter();

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

        {/* Stats Grid */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          aria-label={t('stats.ariaLabel')}
        >
          {/* QS Balance */}
          <Card
            variant="hoverGradient"
            padding="md"
            className="group"
            role="button"
            tabIndex={0}
            onClick={() => handleNavigate('/token-hub/get-qs')}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/token-hub/get-qs')}
            aria-label={`${t('stats.qsBalance.label')}: ${DEMO_STATS.qsBalance.toLocaleString()} QS`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary">
                {t('stats.qsBalance.label')}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {DEMO_STATS.qsBalance.toLocaleString()}
              <span className="text-sm font-medium text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>

          {/* Locked QS */}
          <Card
            variant="hoverGradient"
            padding="md"
            className="group"
            role="button"
            tabIndex={0}
            onClick={() => handleNavigate('/token-hub/unlock')}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/token-hub/unlock')}
            aria-label={`${t('stats.lockedQS.label')}: ${DEMO_STATS.lockedQS.toLocaleString()} QS`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-foreground-tertiary">
                {t('stats.lockedQS.label')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">
                +5.2%
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {DEMO_STATS.lockedQS.toLocaleString()}
              <span className="text-sm font-medium text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>

          {/* veQS Balance with Tooltip */}
          <Card
            variant="hoverGradient"
            padding="md"
            className="group"
            role="button"
            tabIndex={0}
            onClick={() => handleNavigate('/token-hub/dashboard')}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/token-hub/dashboard')}
            aria-label={`${t('stats.veQSBalance.label')}: ${DEMO_STATS.veQSBalance.toLocaleString()} veQS`}
          >
            <div className="flex justify-between items-center mb-2">
              <VeQSTooltip label={t('stats.veQSBalance.label')} />
            </div>
            <div className="text-2xl font-bold font-mono text-gold">
              {DEMO_STATS.veQSBalance.toLocaleString()}
              <span className="text-sm font-medium text-foreground-secondary ml-1">veQS</span>
            </div>
          </Card>

          {/* Voting Power */}
          <Card
            variant="hoverGradient"
            padding="md"
            className="group"
            role="button"
            tabIndex={0}
            onClick={() => handleNavigate('/token-hub/delegate')}
            onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/token-hub/delegate')}
            aria-label={`${t('stats.votingPower.label')}: ${DEMO_STATS.votingPower}%`}
          >
            <div className="flex justify-between items-center mb-2">
              <VotingPowerTooltip label={t('stats.votingPower.label')} />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">
              {DEMO_STATS.votingPower}
              <span className="text-sm font-medium text-foreground-secondary ml-1">%</span>
            </div>
          </Card>
        </section>

        {/* Getting Started Section - For new users */}
        <section className="mb-8" aria-label={t('gettingStarted.ariaLabel')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('gettingStarted.title')}
            </h2>
            <Link
              href="/token-hub/faq"
              className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
            >
              {t('gettingStarted.viewAll')}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Learn Tokenomics */}
            <Link
              href="/token-hub/onboarding"
              className={cn(
                'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                <BookOpen className="w-5 h-5 text-gold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{t('gettingStarted.onboarding.title')}</div>
                <p className="text-sm text-foreground-tertiary line-clamp-2">
                  {t('gettingStarted.onboarding.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0 mt-2" aria-hidden="true" />
            </Link>

            {/* Get QS Tokens */}
            <Link
              href="/token-hub/get-qs"
              className={cn(
                'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-colors">
                <ShoppingCart className="w-5 h-5 text-success" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{t('gettingStarted.getQS.title')}</div>
                <p className="text-sm text-foreground-tertiary line-clamp-2">
                  {t('gettingStarted.getQS.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0 mt-2" aria-hidden="true" />
            </Link>

            {/* Become a Prover */}
            <Link
              href="/prover/landing"
              className={cn(
                'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                'hover:border-hinomaru hover:bg-hinomaru/5 transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-hinomaru/10 flex items-center justify-center flex-shrink-0 group-hover:bg-hinomaru/20 transition-colors">
                <Shield className="w-5 h-5 text-hinomaru" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{t('gettingStarted.prover.title')}</div>
                <p className="text-sm text-foreground-tertiary line-clamp-2">
                  {t('gettingStarted.prover.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-hinomaru transition-colors flex-shrink-0 mt-2" aria-hidden="true" />
            </Link>

            {/* FAQ */}
            <Link
              href="/token-hub/faq"
              className={cn(
                'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0 group-hover:bg-warning/20 transition-colors">
                <MessageCircleQuestion className="w-5 h-5 text-warning" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{t('gettingStarted.faq.title')}</div>
                <p className="text-sm text-foreground-tertiary line-clamp-2">
                  {t('gettingStarted.faq.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0 mt-2" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column - Voting Power Decay */}
          <Card padding="none" className="overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gold" aria-hidden="true" />
                {t('chart.title')}
              </h2>
              <span className="text-xs text-foreground-tertiary">
                {t('chart.subtitle')}
              </span>
            </div>
            <div className="p-6">
              {/* Chart SVG */}
              <div className="h-48 mb-6">
                <svg className="w-full h-full" viewBox="0 0 600 180" role="img" aria-label={t('chart.ariaLabel')}>
                  <title>{t('chart.title')}</title>
                  <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(201, 169, 98)" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="rgb(201, 169, 98)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  <line x1="40" y1="30" x2="580" y2="30" stroke="rgba(255,255,255,0.04)" />
                  <line x1="40" y1="70" x2="580" y2="70" stroke="rgba(255,255,255,0.04)" />
                  <line x1="40" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,0.04)" />
                  <line x1="40" y1="150" x2="580" y2="150" stroke="rgba(255,255,255,0.04)" />
                  {/* Y-axis labels */}
                  <text x="35" y="35" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">6,225</text>
                  <text x="35" y="75" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">4,500</text>
                  <text x="35" y="115" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">2,500</text>
                  <text x="35" y="155" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="end">0</text>
                  {/* Area fill */}
                  <path className="fill-[url(#goldGradient)]" d="M 60,30 L 160,45 L 260,65 L 360,90 L 460,120 L 560,150 L 560,150 L 60,150 Z" />
                  {/* Line */}
                  <path className="stroke-gold stroke-2 fill-none" d="M 60,30 L 160,45 L 260,65 L 360,90 L 460,120 L 560,150" />
                  {/* Dots */}
                  <circle className="fill-gold" cx="60" cy="30" r="4" />
                  <circle className="fill-gold" cx="160" cy="45" r="3" />
                  <circle className="fill-gold" cx="260" cy="65" r="3" />
                  <circle className="fill-gold" cx="360" cy="90" r="3" />
                  <circle className="fill-gold" cx="460" cy="120" r="3" />
                  <circle className="fill-gold" cx="560" cy="150" r="3" />
                  {/* X-axis labels */}
                  <text x="60" y="170" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="middle">Now</text>
                  <text x="160" y="170" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="middle">6M</text>
                  <text x="260" y="170" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="middle">1Y</text>
                  <text x="360" y="170" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="middle">18M</text>
                  <text x="460" y="170" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="middle">2Y</text>
                  <text x="560" y="170" className="fill-foreground-tertiary text-[10px] font-mono" textAnchor="middle">End</text>
                </svg>
              </div>

              {/* veQS Box */}
              <div className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-foreground-secondary flex items-center gap-2">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                    {t('veqsBox.currentVeQS')}
                  </span>
                  <span className="text-xs text-gold">
                    {t('veqsBox.lockEnds')}: {DEMO_STATS.lockEndDate}
                  </span>
                </div>
                <div className="text-3xl font-bold font-mono text-gold mb-1">
                  {DEMO_STATS.veQSBalance.toLocaleString()} veQS
                </div>
                <div className="text-sm text-foreground-secondary">
                  = {DEMO_STATS.lockedQS.toLocaleString()} QS × {DEMO_STATS.multiplier} ({t('veqsBox.remaining')})
                </div>
              </div>

              {/* Lock Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-background-secondary rounded-lg p-4">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockInfo.lockedAmount')}</div>
                  <div className="text-base font-semibold font-mono">{DEMO_STATS.lockedQS.toLocaleString()} QS</div>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockInfo.lockDuration')}</div>
                  <div className="text-base font-semibold font-mono">{DEMO_STATS.lockDuration}</div>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockInfo.timeRemaining')}</div>
                  <div className="text-base font-semibold font-mono">{DEMO_STATS.timeRemaining}</div>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockInfo.multiplier')}</div>
                  <div className="text-base font-semibold font-mono">{DEMO_STATS.multiplier}x</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNavigate('/token-hub/lock')}
                  className="flex flex-col items-center gap-2 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={t('actions.lockMore')}
                >
                  <Lock className="w-6 h-6 text-gold" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('actions.lockMore')}</span>
                </button>
                <button
                  onClick={() => handleNavigate('/token-hub/lock')}
                  className="flex flex-col items-center gap-2 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={t('actions.extendLock')}
                >
                  <Clock className="w-6 h-6 text-gold" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('actions.extendLock')}</span>
                </button>
                <button
                  onClick={() => handleNavigate('/token-hub/delegate')}
                  className="flex flex-col items-center gap-2 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={t('actions.delegatePower')}
                >
                  <Users className="w-6 h-6 text-gold" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('actions.delegatePower')}</span>
                </button>
                <button
                  onClick={() => handleNavigate('/token-hub/rewards')}
                  className="flex flex-col items-center gap-2 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={t('actions.claimRewards')}
                >
                  <Coins className="w-6 h-6 text-gold" aria-hidden="true" />
                  <span className="text-sm font-medium">{t('actions.claimRewards')}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            {/* My Delegations */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" aria-hidden="true" />
                  {t('delegations.title')}
                </h2>
              </div>
              <div className="p-6">
                <ul className="divide-y divide-border" role="list" aria-label={t('delegations.ariaLabel')}>
                  {DEMO_DELEGATIONS.map((delegation) => (
                    <li key={delegation.id}>
                      <button
                        onClick={() => handleNavigate('/token-hub/delegate')}
                        className="flex items-center gap-4 py-4 w-full text-left hover:bg-background-secondary -mx-6 px-6 transition-colors"
                        aria-label={`${delegation.name}: ${delegation.amount.toLocaleString()} veQS (${delegation.percent}%)`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-hinomaru flex items-center justify-center text-white font-semibold">
                          {delegation.initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{delegation.name}</div>
                          <div className="text-xs text-foreground-tertiary">{delegation.totalPower} {t('delegations.totalPower')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold font-mono text-gold">
                            {delegation.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-foreground-tertiary">{delegation.percent}%</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Rewards Preview */}
            <Card padding="none" className="overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Coins className="w-5 h-5 text-success" aria-hidden="true" />
                  {t('rewards.title')}
                </h2>
              </div>
              <div className="p-6">
                {/* Rewards Box */}
                <div className="bg-gradient-to-br from-background-secondary to-success/5 border border-success rounded-xl p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-foreground-secondary">{t('rewards.claimable')}</span>
                    <button
                      onClick={() => handleNavigate('/token-hub/rewards')}
                      className="text-xs text-success hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                      aria-label={`${t('rewards.claimButton')} ${DEMO_REWARDS.claimable.toLocaleString()} QS`}
                    >
                      {t('rewards.claimButton')}
                      <ChevronRight className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="text-2xl font-bold font-mono text-success mb-1">
                    {DEMO_REWARDS.claimable.toLocaleString()} QS
                  </div>
                  <div className="text-xs text-foreground-tertiary">
                    ≈ ${DEMO_REWARDS.usdValue.toLocaleString()} USD
                  </div>
                </div>

                {/* Epoch Progress */}
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-foreground-tertiary">{t('rewards.epochProgress')}</span>
                    <span className="text-xs font-mono text-gold">{DEMO_REWARDS.epochProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all duration-500"
                      style={{ width: `${DEMO_REWARDS.epochProgress}%` }}
                      role="progressbar"
                      aria-valuenow={DEMO_REWARDS.epochProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${t('rewards.epochProgress')}: ${DEMO_REWARDS.epochProgress}%`}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

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
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.docs')}
              </a>
              <a
                href="https://github.com/kota1026/quantum-shield"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.github')}
              </a>
            </nav>
            <p className="text-xs text-foreground-tertiary text-center max-w-xl">
              {t('footer.disclaimer')}
            </p>
            <p className="text-xs text-foreground-tertiary">
              {t('footer.copyright')}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default TokenHubDashboard;
