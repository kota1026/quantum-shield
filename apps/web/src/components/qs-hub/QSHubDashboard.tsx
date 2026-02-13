'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Lock,
  Clock,
  Users,
  Coins,
  ChevronRight,
  TrendingUp,
  Vote,
  FileText,
  Plus,
  Shield,
  ExternalLink,
  ArrowRight,
  Zap,
  Calendar,
  Award,
  ChevronDown,
  Eye,
  Cpu,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/shared/Tooltip';
import {
  useQSHubStats,
  useQSHubProposals,
  useQSHubRewards,
  useQSHubDelegates,
} from '@/hooks/qs-hub/useQSHub';
import type { QSHubStats, QSHubProposal, QSHubRewards, QSHubDelegate } from '@/lib/api/qs-hub/types';


// Hover card component
function HoverCard({
  children,
  className = '',
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const baseClasses =
    'relative bg-card rounded-xl overflow-hidden transition-all duration-300 group border border-border/50';
  const hoverClasses = href
    ? 'cursor-pointer hover:scale-[1.01] hover:shadow-lg hover:shadow-gold/10 hover:border-gold/50'
    : '';

  const content = (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  unit,
  badge,
  badgeColor = 'success',
  href,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeColor?: 'success' | 'hinomaru' | 'gold' | 'warning';
  href?: string;
  tooltip?: string;
}) {
  const badgeColors = {
    success: 'bg-success/10 text-success',
    hinomaru: 'bg-hinomaru/10 text-hinomaru-400',
    gold: 'bg-gold/10 text-gold',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <HoverCard href={href}>
      <div className="p-5 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-background-secondary flex items-center justify-center">
            {icon}
          </div>
          {badge && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badgeColors[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mb-1">
          {tooltip ? (
            <Tooltip content={tooltip} showHelpIcon>
              <span className="text-xs text-foreground-tertiary">{label}</span>
            </Tooltip>
          ) : (
            <p className="text-xs text-foreground-tertiary">{label}</p>
          )}
        </div>
        <div className="mt-auto">
          <span className="text-2xl font-bold text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-sm text-foreground-secondary ml-1">{unit}</span>}
        </div>
        {href && (
          <div className="mt-2 text-xs text-gold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            View details <ChevronRight className="w-3 h-3" />
          </div>
        )}
      </div>
    </HoverCard>
  );
}

interface QSHubDashboardProps {
  isLoading?: boolean;
  hasError?: boolean;
  isEmpty?: boolean;
}

export function QSHubDashboard({ isLoading = false, hasError = false, isEmpty = false }: QSHubDashboardProps) {
  const t = useTranslations('qs-hub.dashboard');
  const tCommon = useTranslations('qs-hub.common');
  const [activeTab, setActiveTab] = useState<'overview' | 'stake' | 'vote'>('overview');
  const [isEcosystemMenuOpen, setIsEcosystemMenuOpen] = useState(false);
  const ecosystemMenuRef = useRef<HTMLDivElement>(null);

  // Fetch data from API
  const { data: stats, isLoading: statsLoading, error: statsError } = useQSHubStats();
  const { data: proposals, isLoading: proposalsLoading, error: proposalsError } = useQSHubProposals();
  const { data: rewards, isLoading: rewardsLoading, error: rewardsError } = useQSHubRewards();
  const { data: delegates, isLoading: delegatesLoading, error: delegatesError } = useQSHubDelegates();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ecosystemMenuRef.current && !ecosystemMenuRef.current.contains(event.target as Node)) {
        setIsEcosystemMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusColors: Record<string, string> = {
    active: 'bg-success/10 text-success',
    pending: 'bg-warning/10 text-warning',
    passed: 'bg-gold/10 text-gold',
    rejected: 'bg-danger/10 text-danger',
    executed: 'bg-success/10 text-success',
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="status" aria-label={t('states.loading')}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground-secondary">{t('states.loading')}</p>
        </div>
      </div>
    );
  }

  // Error State
  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" role="alert">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('states.error.title')}</h2>
          <p className="text-foreground-secondary mb-6">{t('states.error.description')}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('states.error.retry')}
          </Button>
        </div>
      </div>
    );
  }

  // Empty State (no wallet connected or no data)
  if (isEmpty) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Coins className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('states.empty.title')}</h2>
          <p className="text-foreground-secondary mb-6">{t('states.empty.description')}</p>
          <Link href="/qs-hub/stake/lock">
            <Button variant="primary">
              <Lock className="w-4 h-4 mr-2" />
              {t('states.empty.cta')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" role="main">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/qs-hub/landing" className="flex items-center gap-3">
              <div className="w-11 h-11 relative flex items-center justify-center">
                <div
                  className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
                  style={{ animationDuration: '25s' }}
                />
                <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
              </div>
              <div>
                <div className="text-lg font-semibold">Quantum Shield</div>
                <div className="text-[10px] text-gold tracking-[1.5px]">QS HUB</div>
              </div>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/qs-hub/stake/lock" className="min-h-[44px] px-2 inline-flex items-center text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('nav.stake')}
            </Link>
            <Link href="/qs-hub/vote/proposals" className="min-h-[44px] px-2 inline-flex items-center text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('nav.vote')}
            </Link>
            <Link href="/qs-hub/rewards" className="min-h-[44px] px-2 inline-flex items-center text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('nav.rewards')}
            </Link>

            {/* Ecosystem Dropdown */}
            <div className="relative" ref={ecosystemMenuRef}>
              <button
                onClick={() => setIsEcosystemMenuOpen(!isEcosystemMenuOpen)}
                className={cn(
                  'min-h-[44px] px-2 inline-flex items-center gap-1 text-sm font-medium transition-colors',
                  isEcosystemMenuOpen
                    ? 'text-gold'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
                aria-expanded={isEcosystemMenuOpen}
                aria-haspopup="true"
              >
                {tCommon('ecosystem')}
                <ChevronDown className={cn('w-4 h-4 transition-transform', isEcosystemMenuOpen && 'rotate-180')} aria-hidden="true" />
              </button>

              {/* Dropdown Menu */}
              {isEcosystemMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg py-2 z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  {/* Consumer App */}
                  <Link
                    href="/consumer/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                    onClick={() => setIsEcosystemMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-hinomaru/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-hinomaru" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-medium">{tCommon('consumerApp')}</div>
                      <div className="text-xs text-foreground-tertiary">{tCommon('consumerAppDesc')}</div>
                    </div>
                  </Link>

                  {/* Observer Portal */}
                  <Link
                    href="/observer/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                    onClick={() => setIsEcosystemMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-success" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-medium">{tCommon('observerPortal')}</div>
                      <div className="text-xs text-foreground-tertiary">{tCommon('observerPortalDesc')}</div>
                    </div>
                  </Link>

                  {/* Prover Portal */}
                  <Link
                    href="/prover/landing"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                    onClick={() => setIsEcosystemMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Cpu className="w-4 h-4 text-warning" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-medium">{tCommon('proverPortal')}</div>
                      <div className="text-xs text-foreground-tertiary">{tCommon('proverPortalDesc')}</div>
                    </div>
                  </Link>

                  {/* Explorer */}
                  <Link
                    href="/explorer"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                    onClick={() => setIsEcosystemMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-info" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-medium">{tCommon('explorer')}</div>
                      <div className="text-xs text-foreground-tertiary">{tCommon('explorerDesc')}</div>
                    </div>
                  </Link>

                  {/* Divider */}
                  <div className="border-t border-border my-2" />

                  {/* Ecosystem Link */}
                  <Link
                    href="/ecosystem"
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-surface-secondary transition-colors"
                    role="menuitem"
                    onClick={() => setIsEcosystemMenuOpen(false)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="font-medium">{tCommon('ecosystemLink')}</div>
                      <div className="text-xs text-foreground-tertiary">{tCommon('ecosystemLinkDesc')}</div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Settings */}
            <Link
              href="/qs-hub/settings"
              className={cn(
                'w-11 h-11 flex items-center justify-center',
                'border border-border rounded-full',
                'text-foreground-secondary hover:border-gold hover:text-gold',
                'transition-colors'
              )}
              aria-label={t('nav.settings')}
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </Link>
          </nav>
        </header>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            <div className="col-span-full text-center py-8 text-foreground-tertiary">{t('states.loading')}</div>
          ) : statsError ? (
            <div className="col-span-full text-center py-8 text-warning">{t('states.error.title')}</div>
          ) : (
            <>
              <StatCard
                icon={<Coins className="w-5 h-5 text-gold" />}
                label={t('stats.veQSBalance')}
                value={stats?.veQSBalance ?? 0}
                unit="veQS"
                badge={`${((stats?.votingPower ?? 0) * 100).toFixed(2)}%`}
                badgeColor="gold"
                href="/qs-hub/stake/lock"
                tooltip={t('stats.veQSTooltip')}
              />
              <StatCard
                icon={<Lock className="w-5 h-5 text-hinomaru" />}
                label={t('stats.lockedQS')}
                value={stats?.lockedQS ?? 0}
                unit="QS"
                badge={stats?.timeRemaining ?? '-'}
                badgeColor="hinomaru"
                href="/qs-hub/stake/unlock"
                tooltip={t('stats.lockedTooltip')}
              />
              <StatCard
                icon={<Vote className="w-5 h-5 text-success" />}
                label={t('stats.activeProposals')}
                value={stats?.activeProposals ?? 0}
                badge={t('stats.votingOpen')}
                badgeColor="success"
                href="/qs-hub/vote/proposals"
              />
              <StatCard
                icon={<Award className="w-5 h-5 text-gold" />}
                label={t('stats.claimableRewards')}
                value={rewards?.claimable ?? 0}
                unit="QS"
                badge={`$${(rewards?.usdValue ?? 0).toLocaleString()}`}
                badgeColor="gold"
                href="/qs-hub/rewards"
              />
            </>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Proposals */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  {t('proposals.title')}
                </h2>
                <Link
                  href="/qs-hub/vote/proposals"
                  className="min-h-[44px] px-2 -mr-2 text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('proposals.viewAll')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3" role="list" aria-label={t('proposals.listAriaLabel')}>
                {proposalsLoading ? (
                  <div className="text-center py-8 text-foreground-tertiary">{t('states.loading')}</div>
                ) : proposalsError ? (
                  <div className="text-center py-8 text-warning">{t('states.error.title')}</div>
                ) : !proposals || proposals.length === 0 ? (
                  <div className="text-center py-8 text-foreground-tertiary">{t('proposals.empty')}</div>
                ) : proposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`/qs-hub/vote/proposals/${proposal.id}`}
                    className="block p-4 bg-background-secondary rounded-lg hover:bg-surface transition-colors"
                    role="listitem"
                    aria-label={`${proposal.id}: ${proposal.title} - ${t(`proposals.status.${proposal.status}`)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-foreground-tertiary">{proposal.id}</span>
                        <h3 className="font-medium">{proposal.title}</h3>
                      </div>
                      <span className={cn('text-xs px-2 py-1 rounded-full', statusColors[proposal.status])}>
                        {t(`proposals.status.${proposal.status}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-foreground-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {proposal.endTime}
                        </span>
                      </div>
                      {proposal.status === 'active' && (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-background rounded-full overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full"
                              style={{ width: `${proposal.votes.for}%` }}
                            />
                          </div>
                          <span className="text-xs text-success">{proposal.votes.for}%</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <Link href="/qs-hub/vote/proposals/create" className="block">
                  <Button variant="outline" className="w-full min-h-[44px]">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('proposals.createNew')}
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Lock Status Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lock className="w-5 h-5 text-hinomaru" />
                  {t('lockStatus.title')}
                </h2>
                <Link
                  href="/qs-hub/stake/extend"
                  className="min-h-[44px] px-2 -mr-2 text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('lockStatus.extend')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-background-secondary rounded-lg">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockStatus.locked')}</div>
                  <div className="text-xl font-bold">{(stats?.lockedQS ?? 0).toLocaleString()}</div>
                  <div className="text-xs text-foreground-secondary">QS</div>
                </div>
                <div className="text-center p-4 bg-background-secondary rounded-lg">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockStatus.duration')}</div>
                  <div className="text-xl font-bold">{stats?.lockDuration ?? '-'}</div>
                  <div className="text-xs text-foreground-secondary">{t('lockStatus.remaining', { time: stats?.timeRemaining ?? '-' })}</div>
                </div>
                <div className="text-center p-4 bg-background-secondary rounded-lg">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('lockStatus.lockRatio')}</div>
                  <div className="text-xl font-bold text-gold">{stats?.ratio ?? 0}</div>
                  <div className="text-xs text-foreground-secondary">{t('lockStatus.veQSRate')}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/qs-hub/stake/lock" className="flex-1">
                  <Button variant="primary" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('lockStatus.lockMore')}
                  </Button>
                </Link>
                <Link href="/qs-hub/stake/unlock" className="flex-1">
                  <Button variant="outline" className="w-full">
                    {t('lockStatus.unlock')}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Rewards Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-gold" />
                  {t('rewards.title')}
                </h2>
              </div>
              {rewardsLoading ? (
                <div className="text-center py-4 text-foreground-tertiary">{t('states.loading')}</div>
              ) : rewardsError ? (
                <div className="text-center py-4 text-warning">{t('states.error.title')}</div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gold mb-1">
                      {(rewards?.claimable ?? 0).toLocaleString()} QS
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      ≈ ${(rewards?.usdValue ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-foreground-tertiary mb-1">
                      <span>{t('rewards.epochProgress')}</span>
                      <span>{rewards?.epochProgress ?? 0}%</span>
                    </div>
                    <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold rounded-full transition-all"
                        style={{ width: `${rewards?.epochProgress ?? 0}%` }}
                      />
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-1">
                      {t('rewards.nextEpoch', { time: rewards?.nextEpoch ?? '-' })}
                    </div>
                  </div>
                </>
              )}
              <Link href="/qs-hub/rewards" className="block">
                <Button variant="gold" className="w-full min-h-[44px]">
                  {t('rewards.claim')}
                </Button>
              </Link>
            </Card>

            {/* Delegations Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-foreground-secondary" />
                  {t('delegations.title')}
                </h2>
                <Link
                  href="/qs-hub/vote/delegates"
                  className="min-h-[44px] px-2 -mr-2 text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('delegations.manage')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {delegatesLoading ? (
                  <div className="text-center py-4 text-foreground-tertiary">{t('states.loading')}</div>
                ) : delegatesError ? (
                  <div className="text-center py-4 text-warning">{t('states.error.title')}</div>
                ) : !delegates || delegates.length === 0 ? (
                  <div className="text-center py-4 text-foreground-tertiary">{t('delegations.empty')}</div>
                ) : delegates.map((delegate) => (
                  <div
                    key={delegate.id}
                    className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold text-sm">
                        {delegate.initial}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{delegate.name}</div>
                        <div className="text-xs text-foreground-tertiary">{delegate.totalPower}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{(delegate.delegatedAmount ?? 0).toLocaleString()}</div>
                      <div className="text-xs text-foreground-tertiary">veQS</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/qs-hub/vote/delegates" className="block mt-4">
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('delegations.addDelegate')}
                </Button>
              </Link>
            </Card>

            {/* Council Card */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-hinomaru" />
                  {t('council.title')}
                </h2>
                <Link
                  href="/qs-hub/council"
                  className="min-h-[44px] px-2 -mr-2 text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('council.viewAll')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold mb-1">{stats?.councilMembers ?? 0}</div>
                <div className="text-sm text-foreground-secondary">{t('council.members')}</div>
              </div>
              <p className="text-sm text-foreground-tertiary text-center">
                {t('council.description')}
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
