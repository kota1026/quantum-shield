'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Vote,
  Users,
  FileText,
  Clock,
  ChevronRight,
  ThumbsUp,
  Plus,
  Shield,
  ExternalLink,
  Coins,
  ArrowRight,
  HelpCircle,
  BookOpen,
  MessageCircleQuestion,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GovernanceHeader } from './GovernanceHeader';
import {
  useGovernanceStats,
  useVotingPower,
  useDashboardProposals,
} from '@/hooks/governance';
import type { GovernanceStats, VotingPowerBreakdown, ProposalSummary } from '@/lib/api/governance/mock';

// Empty initial state (no fake data)
const FALLBACK_STATS: GovernanceStats = {
  activeProposals: 0,
  votingPower: 0,
  participationRate: 0,
  totalProposals: 0,
};

const FALLBACK_VOTING_POWER: VotingPowerBreakdown = {
  myVeqs: 0,
  delegatedToMe: 0,
  iDelegated: 0,
  delegators: 0,
  lockExpiry: '-',
};

const FALLBACK_PROPOSALS: ProposalSummary[] = [];

// Hover card with gradient border effect
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
    'relative bg-card rounded-xl overflow-hidden transition-all duration-300 group';
  const hoverClasses = href
    ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/10'
    : '';

  const content = (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {/* Gradient border effect on hover */}
      <div className="absolute inset-0 rounded-xl border border-border/50 group-hover:border-transparent transition-colors duration-300" />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-hinomaru via-gold to-hinomaru bg-clip-border" style={{ padding: '2px' }}>
          <div className="w-full h-full bg-card rounded-xl" />
        </div>
      </div>
      {/* Top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">{children}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Stat card with uniform height
function StatCard({
  icon,
  label,
  value,
  unit,
  badge,
  badgeColor = 'success',
  href,
  testId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeColor?: 'success' | 'hinomaru' | 'gold';
  href?: string;
  testId?: string;
}) {
  const badgeColors = {
    success: 'bg-success/10 text-success',
    hinomaru: 'bg-hinomaru/10 text-hinomaru-400',
    gold: 'bg-gold/10 text-gold',
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
        <p className="text-xs text-foreground-tertiary mb-1">{label}</p>
        <div className="mt-auto">
          <span className="text-2xl font-bold font-mono" data-testid={testId}>{value}</span>
          {unit && <span className="text-sm text-foreground-secondary ml-1">{unit}</span>}
        </div>
      </div>
    </HoverCard>
  );
}

// Proposal card - gradient border on hover only
function ProposalCard({
  id,
  title,
  status,
  timeLeft,
  forPercentage,
  t,
}: {
  id: string;
  title: string;
  status: 'active' | 'pending';
  timeLeft?: string;
  forPercentage: number;
  t: (key: string) => string;
}) {
  return (
    <Link href={`/governance/proposals/${id.replace('QIP-', '')}`}>
      <div className="relative bg-card rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer hover:scale-[1.01]">
        {/* Normal border */}
        <div className="absolute inset-0 rounded-xl border border-border group-hover:border-transparent transition-colors duration-300" />
        {/* Gradient border on hover */}
        <div className="absolute inset-0 rounded-xl p-[1px] bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-full h-full bg-card rounded-xl" />
        </div>
        <div className="relative z-10 p-4">
          <div className="flex items-start gap-4">
            {/* ID Badge */}
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-hinomaru/20 to-gold/20 border border-hinomaru/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gold">{id}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}
                >
                  {status === 'active' ? t('activeProposals.status.active') : t('activeProposals.status.pending')}
                </span>
                {timeLeft && (
                  <span className="flex items-center gap-1 text-xs text-warning">
                    <Clock className="w-3 h-3" />
                    {timeLeft}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold line-clamp-2 mb-3">{title}</h3>

              {/* Vote Progress */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-background rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-success to-success/70 transition-all"
                    style={{ width: `${forPercentage}%` }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-danger/70 to-danger"
                    style={{ width: `${100 - forPercentage}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-foreground-secondary w-12 text-right">
                  {forPercentage}%
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0" />
          </div>
        </div>
      </div>
    </Link>
  );
}

// Activity item - now clickable
function ActivityItem({
  icon,
  iconBg,
  text,
  time,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  text: React.ReactNode;
  time: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-secondary transition-colors cursor-pointer group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{text}</p>
        <p className="text-xs text-foreground-tertiary">{time}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export function GovernanceDashboard() {
  const t = useTranslations('governance.landing');

  // Fetch data using hooks
  const { data: statsApi } = useGovernanceStats();
  const { data: votingPowerApi } = useVotingPower();
  const { data: proposalsApi } = useDashboardProposals();

  // Use API data with fallback
  const stats = statsApi ?? FALLBACK_STATS;
  const votingPowerBreakdown = votingPowerApi ?? FALLBACK_VOTING_POWER;
  const proposals = proposalsApi ?? FALLBACK_PROPOSALS;

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background pb-8" role="main" aria-label={t('ariaLabel')}>
      {/* Premium Background Effect - Gold Glow */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)] opacity-50" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <GovernanceHeader />

        {/* Getting Started Section - For new users */}
        <section className="mb-8" aria-label={t('gettingStarted.ariaLabel')}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('gettingStarted.title')}
            </h2>
            <Link
              href="/governance/faq"
              className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1 min-h-[44px]"
            >
              {t('gettingStarted.viewAll')}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Learn Governance */}
            <Link
              href="/governance/onboarding"
              className="group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold hover:bg-gold/5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

            {/* Get veQS to Vote */}
            <Link
              href="/qs-hub/stake/lock"
              className="group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold hover:bg-gold/5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-colors">
                <Coins className="w-5 h-5 text-success" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium mb-1">{t('gettingStarted.getVeQS.title')}</div>
                <p className="text-sm text-foreground-tertiary line-clamp-2">
                  {t('gettingStarted.getVeQS.description')}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0 mt-2" aria-hidden="true" />
            </Link>

            {/* Become a Prover */}
            <Link
              href="/prover/landing"
              className="group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl hover:border-hinomaru hover:bg-hinomaru/5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="w-10 h-10 rounded-lg bg-hinomaru/10 flex items-center justify-center flex-shrink-0 group-hover:bg-hinomaru/20 transition-colors">
                <Cpu className="w-5 h-5 text-hinomaru" aria-hidden="true" />
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
              href="/governance/faq"
              className="group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl hover:border-gold hover:bg-gold/5 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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

        {/* Stats Grid - Equal Height */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10" aria-label={t('stats.ariaLabel')}>
          <StatCard
            icon={<FileText className="w-5 h-5 text-hinomaru" />}
            label={t('stats.activeProposals.label')}
            value={stats.activeProposals}
            badge={t('stats.activeProposals.badge')}
            badgeColor="success"
            href="/governance/proposals"
            testId="governance-active-proposals-value"
          />
          <StatCard
            icon={<Vote className="w-5 h-5 text-gold" />}
            label={t('stats.votingPower.label')}
            value={stats.votingPower.toLocaleString()}
            unit={t('stats.votingPower.unit')}
            badge={t('stats.votingPower.badge')}
            badgeColor="hinomaru"
            testId="governance-voting-power-value"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-success" />}
            label={t('stats.participationRate.label')}
            value={stats.participationRate}
            unit={t('stats.participationRate.unit')}
            testId="governance-participation-rate-value"
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-foreground-secondary" />}
            label={t('stats.totalProposals.label')}
            value={stats.totalProposals}
            testId="governance-total-proposals-value"
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Voting Power */}
            <HoverCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Vote className="w-5 h-5 text-hinomaru" />
                    {t('votingPower.title')}
                  </h2>
                  <Link href="/governance/activity" className="text-sm text-gold hover:underline flex items-center gap-1 min-h-[44px]">
                    {t('votingPower.viewDetails')}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold/30 rounded-xl p-5 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-foreground-secondary">{t('votingPower.totalLabel')}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-xs text-gold flex items-center gap-1 px-2 py-2 min-h-[44px] rounded hover:bg-surface-secondary transition-colors" aria-label={t('votingPower.ariaLabel')}>
                          <HelpCircle className="w-3 h-3" />
                          {t('votingPower.howCalculated')}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{t('votingPower.howCalculatedTooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold font-mono text-gold">{stats.votingPower.toLocaleString()}</span>
                    <span className="text-lg text-foreground-secondary ml-2">{t('votingPower.unit')}</span>
                  </div>
                  <div className="flex flex-wrap gap-6 pt-4 border-t border-border/50 text-sm">
                    <div>
                      <span className="text-xs text-foreground-tertiary block">{t('votingPower.breakdown.myVeqs')}</span>
                      <span className="font-mono font-semibold">{votingPowerBreakdown.myVeqs.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-foreground-tertiary block">{t('votingPower.breakdown.delegatedToMe')}</span>
                      <span className="font-mono font-semibold text-gold">+{votingPowerBreakdown.delegatedToMe.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-xs text-foreground-tertiary block">{t('votingPower.delegation.lockExpiry')}</span>
                      <span className="font-mono font-semibold">{votingPowerBreakdown.lockExpiry}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="primary" className="gap-2">
                    <Link href="/governance/proposals">
                      <ThumbsUp className="w-4 h-4" />
                      {t('votingPower.buttons.voteNow')}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="gap-2">
                    <Link href="/governance/create">
                      <Plus className="w-4 h-4" />
                      {t('votingPower.buttons.createProposal')}
                    </Link>
                  </Button>
                </div>
              </div>
            </HoverCard>

            {/* Active Proposals */}
            <HoverCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-hinomaru" />
                    {t('activeProposals.title')}
                  </h2>
                  <Link href="/governance/proposals" className="text-sm text-gold hover:underline flex items-center gap-1 min-h-[44px]">
                    {t('activeProposals.viewAll')}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <ProposalCard key={proposal.id} {...proposal} t={t} />
                  ))}
                </div>
              </div>
            </HoverCard>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Quorum Explanation - Simplified */}
            <HoverCard>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-hinomaru" />
                    {t('quorum.title')}
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-surface-secondary transition-colors" aria-label={t('quorum.ariaLabel')}>
                        <HelpCircle className="w-4 h-4 text-gold" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{t('quorum.explanation')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                <p className="text-xs text-foreground-tertiary mb-4">{t('quorum.description')}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <span className="text-sm">{t('quorum.types.parameter')}</span>
                    <span className="text-sm font-mono text-gold">4%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <span className="text-sm">{t('quorum.types.upgrade')}</span>
                    <span className="text-sm font-mono text-gold">8%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <span className="text-sm">{t('quorum.types.signal')}</span>
                    <span className="text-sm font-mono text-gold">3%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <span className="text-sm">{t('quorum.types.treasury')}</span>
                    <span className="text-sm font-mono text-gold">6%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                    <span className="text-sm">{t('quorum.types.emergency')}</span>
                    <span className="text-sm font-mono text-gold">15%</span>
                  </div>
                </div>
              </div>
            </HoverCard>

            {/* Recent Activity */}
            <HoverCard>
              <div className="p-5">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-hinomaru" />
                  {t('recentActivity.title')}
                </h2>

                <div className="space-y-1">
                  <ActivityItem
                    icon={<ThumbsUp className="w-4 h-4 text-success" />}
                    iconBg="bg-success/10"
                    text={<span>QIP-47 に<strong className="text-success">賛成</strong>投票</span>}
                    time={t('recentActivity.timeAgo.hoursAgo', { count: 2 })}
                    href="/governance/proposals/47"
                  />
                  <ActivityItem
                    icon={<Users className="w-4 h-4 text-hinomaru-400" />}
                    iconBg="bg-hinomaru/10"
                    text={<span>0x456...789 から委任を受領</span>}
                    time={t('recentActivity.timeAgo.daysAgo', { count: 1 })}
                  />
                  <ActivityItem
                    icon={<FileText className="w-4 h-4 text-gold" />}
                    iconBg="bg-gold/10"
                    text={<span>QIP-45 が91%で可決</span>}
                    time={t('recentActivity.timeAgo.daysAgo', { count: 3 })}
                    href="/governance/proposals/45"
                  />
                </div>
              </div>
            </HoverCard>

            {/* Council Status */}
            <HoverCard href="/governance/council">
              <div className="p-5">
                <h2 className="font-semibold flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-hinomaru" />
                  {t('councilStatus.title')}
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">{t('councilStatus.securityCouncil')}</span>
                    <span className="text-sm font-semibold text-success">5/7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">{t('councilStatus.purposeCommittee')}</span>
                    <span className="text-sm font-semibold text-success">3/3</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm text-gold">
                  <span>{t('councilStatus.viewCouncil')}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </HoverCard>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <nav className="flex flex-wrap gap-4 md:gap-6" aria-label={t('footer.navLabel')}>
              <a
                href="https://forum.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1 min-h-[44px] px-2 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.governanceForum')}
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://docs.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1 min-h-[44px] px-2 focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.documentation')}
                <ExternalLink className="w-3 h-3" />
              </a>
              <Link
                href="/consumer/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors min-h-[44px] px-2 inline-flex items-center focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors min-h-[44px] px-2 inline-flex items-center focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {t('footer.privacy')}
              </Link>
            </nav>
            <p className="text-xs text-foreground-tertiary text-center">{t('footer.copyright')}</p>
          </div>
        </footer>
      </main>
    </div>
    </TooltipProvider>
  );
}
