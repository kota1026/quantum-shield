'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Target,
  Vote,
  Users,
  FileText,
  Clock,
  ChevronRight,
  ThumbsUp,
  Plus,
  BarChart3,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTooltip } from '@/components/ui/tooltip';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  badgeVariant?: 'success' | 'hinomaru';
  isGold?: boolean;
  tooltip?: string;
}

function StatCard({ label, value, unit, badge, badgeVariant = 'success', isGold, tooltip }: StatCardProps) {
  const content = (
    <div className="bg-card border border-border/50 rounded-xl p-6 transition-all duration-200 relative overflow-hidden hover:border-border group">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-foreground-tertiary">{label}</span>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              badgeVariant === 'success'
                ? 'bg-success/10 text-success'
                : 'bg-hinomaru/10 text-hinomaru-400'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold font-mono ${isGold ? 'text-gold' : 'text-foreground'}`}>
        {value}
        {unit && <span className="text-sm font-medium text-foreground-secondary ml-1">{unit}</span>}
      </div>
    </div>
  );

  if (tooltip) {
    return <SimpleTooltip content={tooltip}>{content}</SimpleTooltip>;
  }
  return content;
}

interface ProposalCardProps {
  id: string;
  title: string;
  status: 'active' | 'pending';
  timeLeft?: string;
  proposedBy: string;
  type: string;
  forPercentage: number;
  t: (key: string) => string;
}

function ProposalCard({ id, title, status, timeLeft, proposedBy, type, forPercentage, t }: ProposalCardProps) {
  const againstPercentage = 100 - forPercentage;

  return (
    <Link
      href="/governance/proposals"
      className="flex gap-4 p-4 bg-background-secondary border border-border/50 rounded-xl cursor-pointer transition-all duration-200 hover:border-gold hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      role="article"
      aria-label={`${id}: ${title}`}
    >
      <div className="w-12 h-12 bg-hinomaru/10 border border-hinomaru rounded-lg flex items-center justify-center text-sm font-bold text-hinomaru-400 flex-shrink-0">
        {id}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              status === 'active'
                ? 'bg-success/10 text-success'
                : 'bg-warning/10 text-warning'
            }`}
          >
            {status === 'active' ? t('activeProposals.status.active') : t('activeProposals.status.pending')}
          </span>
          {timeLeft && (
            <span className="flex items-center gap-1 text-xs text-warning">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {timeLeft} {t('activeProposals.timeLeft')}
            </span>
          )}
        </div>
        <h3 className="text-sm font-semibold mb-2 truncate">{title}</h3>
        <div className="flex gap-4 text-xs text-foreground-tertiary">
          <span>{t('activeProposals.proposedBy')}: {proposedBy}</span>
          <span>{t('activeProposals.type')}: {type}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="w-28 h-1.5 bg-background rounded-full overflow-hidden flex" role="progressbar" aria-valuenow={forPercentage} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-success" style={{ width: `${forPercentage}%` }} />
          <div className="h-full bg-danger" style={{ width: `${againstPercentage}%` }} />
        </div>
        <span className="text-xs text-foreground-secondary font-mono">{forPercentage}% {t('activeProposals.forVote')}</span>
      </div>
    </Link>
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  iconBg: string;
  text: React.ReactNode;
  time: string;
}

function ActivityItem({ icon, iconBg, text, time }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/50 last:border-b-0">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-foreground-tertiary">{time}</p>
      </div>
    </div>
  );
}

export function GovernanceDashboard() {
  const t = useTranslations('governance.landing');

  // Mock data - will be replaced with real data from API
  const stats = {
    activeProposals: 5,
    votingPower: 125000,
    participationRate: 78,
    totalProposals: 47,
  };

  const votingPowerBreakdown = {
    myVeqs: 100000,
    delegatedToMe: 25000,
    iDelegated: 0,
    delegators: 3,
    lockExpiry: '2028-01-15',
  };

  const proposals = [
    {
      id: 'QIP-47',
      title: 'Increase Prover Bond Amount from 100 ETH to 150 ETH',
      status: 'active' as const,
      timeLeft: '2d 14h',
      proposedBy: '0xabc...def',
      type: 'Parameter',
      forPercentage: 72,
    },
    {
      id: 'QIP-46',
      title: 'Add New Security Council Member: quantum_expert.eth',
      status: 'active' as const,
      timeLeft: '5d 8h',
      proposedBy: '0x123...456',
      type: 'Council',
      forPercentage: 85,
    },
    {
      id: 'QIP-45',
      title: 'Upgrade STARK Verifier Contract to v2.1',
      status: 'pending' as const,
      proposedBy: '0x789...abc',
      type: 'Upgrade',
      forPercentage: 91,
    },
  ];

  const quorumRequirements = {
    totalVeqs: '12,500,000',
    parameter: 4,
    upgrade: 8,
    council: 15,
  };

  return (
    <main
      className="min-h-screen bg-background"
      role="main"
      aria-label={t('ariaLabel')}
    >
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-hinomaru" aria-hidden="true" />
            {t('pageTitle')}
          </h1>
          <p className="text-foreground-secondary">{t('pageSubtitle')}</p>
        </header>

        {/* Stats Bar */}
        <section
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          aria-label={t('stats.ariaLabel')}
        >
          <StatCard
            label={t('stats.activeProposals.label')}
            value={stats.activeProposals}
            badge={t('stats.activeProposals.badge')}
            badgeVariant="success"
          />
          <StatCard
            label={t('stats.votingPower.label')}
            value={stats.votingPower.toLocaleString()}
            unit={t('stats.votingPower.unit')}
            badge={t('stats.votingPower.badge')}
            badgeVariant="hinomaru"
            isGold
            tooltip={t('stats.votingPower.tooltip')}
          />
          <StatCard
            label={t('stats.participationRate.label')}
            value={stats.participationRate}
            unit={t('stats.participationRate.unit')}
          />
          <StatCard
            label={t('stats.totalProposals.label')}
            value={stats.totalProposals}
          />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column - Main Content */}
          <div className="space-y-6">
            {/* Voting Power Card */}
            <Card variant="default" padding="none">
              <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Vote className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  {t('votingPower.title')}
                </CardTitle>
                <Link
                  href="/governance/activity"
                  className="text-sm text-gold hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  {t('votingPower.viewDetails')}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent className="p-6">
                {/* Voting Power Box */}
                <div className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-6 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-foreground-secondary">{t('votingPower.totalLabel')}</span>
                    <SimpleTooltip content={t('votingPower.howCalculatedTooltip')}>
                      <span className="text-xs text-gold cursor-help">{t('votingPower.howCalculated')}</span>
                    </SimpleTooltip>
                  </div>
                  <div className="mb-4">
                    <span className="text-4xl font-bold font-mono text-gold">
                      {stats.votingPower.toLocaleString()}
                    </span>
                    <span className="text-lg text-foreground-secondary ml-2">{t('votingPower.unit')}</span>
                  </div>
                  <div className="flex gap-8 pt-4 border-t border-border/50">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-foreground-tertiary uppercase tracking-wide">
                        {t('votingPower.breakdown.myVeqs')}
                      </span>
                      <span className="text-base font-semibold font-mono">
                        {votingPowerBreakdown.myVeqs.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-foreground-tertiary uppercase tracking-wide">
                        {t('votingPower.breakdown.delegatedToMe')}
                      </span>
                      <span className="text-base font-semibold font-mono text-gold">
                        +{votingPowerBreakdown.delegatedToMe.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-foreground-tertiary uppercase tracking-wide">
                        {t('votingPower.breakdown.iDelegated')}
                      </span>
                      <span className="text-base font-semibold font-mono text-foreground-tertiary">
                        {votingPowerBreakdown.iDelegated}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delegation Status */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background-secondary rounded-xl p-4">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('votingPower.delegation.delegators')}</p>
                    <p className="text-lg font-semibold font-mono text-gold">
                      {votingPowerBreakdown.delegators} {t('votingPower.delegation.delegatorsUnit')}
                    </p>
                  </div>
                  <div className="bg-background-secondary rounded-xl p-4">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('votingPower.delegation.lockExpiry')}</p>
                    <p className="text-lg font-semibold font-mono">{votingPowerBreakdown.lockExpiry}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <Button asChild variant="primary" className="gap-2">
                    <Link href="/governance/proposals">
                      <ThumbsUp className="w-4 h-4" aria-hidden="true" />
                      {t('votingPower.buttons.voteNow')}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" className="gap-2">
                    <Link href="/governance/create">
                      <Plus className="w-4 h-4" aria-hidden="true" />
                      {t('votingPower.buttons.createProposal')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Active Proposals Card */}
            <Card variant="default" padding="none">
              <CardHeader className="flex flex-row items-center justify-between p-6 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  {t('activeProposals.title')}
                </CardTitle>
                <Link
                  href="/governance/proposals"
                  className="text-sm text-gold hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  {t('activeProposals.viewAll')}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4" role="list" aria-label={t('activeProposals.title')}>
                  {proposals.map((proposal) => (
                    <ProposalCard key={proposal.id} {...proposal} t={t} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <aside className="space-y-6" aria-label="Governance information">
            {/* Quorum Requirements */}
            <Card variant="default" padding="none">
              <CardHeader className="p-6 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  {t('quorum.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-xs text-foreground-tertiary">{t('quorum.currentTotal')}</span>
                    <span className="text-xs text-gold font-mono">{quorumRequirements.totalVeqs} veQS</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-background-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('quorum.types.parameter')}</p>
                    <p className="text-sm font-semibold text-gold">{quorumRequirements.parameter}%</p>
                  </div>
                  <div className="bg-background-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('quorum.types.upgrade')}</p>
                    <p className="text-sm font-semibold text-gold">{quorumRequirements.upgrade}%</p>
                  </div>
                  <div className="bg-background-secondary rounded-lg p-3 text-center">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('quorum.types.council')}</p>
                    <p className="text-sm font-semibold text-gold">{quorumRequirements.council}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card variant="default" padding="none">
              <CardHeader className="p-6 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  {t('recentActivity.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ActivityItem
                  icon={<ThumbsUp className="w-4 h-4 text-success" aria-hidden="true" />}
                  iconBg="bg-success/10"
                  text={
                    <span>
                      You voted <strong className="text-success">For</strong> on QIP-47
                    </span>
                  }
                  time={t('recentActivity.timeAgo.hoursAgo', { count: 2 })}
                />
                <ActivityItem
                  icon={<Users className="w-4 h-4 text-hinomaru-400" aria-hidden="true" />}
                  iconBg="bg-hinomaru/10"
                  text={<span>Received delegation from 0x456...789</span>}
                  time={t('recentActivity.timeAgo.daysAgo', { count: 1 })}
                />
                <ActivityItem
                  icon={<FileText className="w-4 h-4 text-gold" aria-hidden="true" />}
                  iconBg="bg-gold/10"
                  text={<span>QIP-45 passed with 91% approval</span>}
                  time={t('recentActivity.timeAgo.daysAgo', { count: 3 })}
                />
              </CardContent>
            </Card>

            {/* Council Status */}
            <Card variant="default" padding="none">
              <CardHeader className="p-6 border-b border-border/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  {t('councilStatus.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-background-secondary rounded-xl p-4">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('councilStatus.securityCouncil')}</p>
                    <p className="text-base font-semibold text-success">5/7 {t('councilStatus.active')}</p>
                  </div>
                  <div className="bg-background-secondary rounded-xl p-4">
                    <p className="text-xs text-foreground-tertiary mb-1">{t('councilStatus.purposeCommittee')}</p>
                    <p className="text-base font-semibold text-success">3/3 {t('councilStatus.active')}</p>
                  </div>
                </div>
                <Button asChild variant="secondary" fullWidth className="gap-2">
                  <Link href="/governance/council">
                    {t('councilStatus.viewCouncil')}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <nav className="flex gap-6" aria-label="Footer navigation">
              <a
                href="https://forum.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
              >
                {t('footer.governanceForum')}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <a
                href="https://docs.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
              >
                {t('footer.documentation')}
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              <Link
                href="/governance/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {t('footer.terms')}
              </Link>
              <Link
                href="/governance/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {t('footer.privacy')}
              </Link>
            </nav>
            <p className="text-xs text-foreground-muted max-w-lg text-center lg:text-left">
              {t('footer.disclaimer')}
            </p>
            <p className="text-xs text-foreground-muted">{t('footer.copyright')}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
