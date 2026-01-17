'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Vote,
  Plus,
  Clock,
  Users,
  FileText,
  ChevronRight,
  Target,
  Shield,
  ThumbsUp,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GovernanceHeader } from './GovernanceHeader';
import { StatCard } from './StatCard';
import { VotingPowerCard } from './VotingPowerCard';
import { ProposalCard, type Proposal } from './ProposalCard';
import { QuorumCard } from './QuorumCard';
import { RecentActivityCard } from './RecentActivityCard';
import { CouncilStatusCard } from './CouncilStatusCard';

// Demo data - In production, this would come from API/hooks
const DEMO_STATS = {
  activeProposals: 5,
  votingPower: 125000,
  participationRate: 78,
  totalProposals: 47,
};

const DEMO_VOTING_POWER = {
  total: 125000,
  myVeqs: 100000,
  delegatedToMe: 25000,
  iDelegated: 0,
  delegators: 3,
  lockExpiry: '2028-01-15',
};

const DEMO_PROPOSALS: Proposal[] = [
  {
    id: 'QIP-47',
    title: 'Increase Prover Bond Amount from 100 ETH to 150 ETH',
    status: 'active',
    timeLeft: '2d 14h',
    author: '0xabc...def',
    type: 'parameter',
    forPercent: 72,
    againstPercent: 28,
  },
  {
    id: 'QIP-46',
    title: 'Add New Security Council Member: quantum_expert.eth',
    status: 'active',
    timeLeft: '5d 8h',
    author: '0x123...456',
    type: 'council',
    forPercent: 85,
    againstPercent: 15,
  },
  {
    id: 'QIP-45',
    title: 'Upgrade STARK Verifier Contract to v2.1',
    status: 'pending',
    author: '0x789...abc',
    type: 'upgrade',
    forPercent: 91,
    againstPercent: 9,
  },
];

const DEMO_ACTIVITY = [
  {
    id: '1',
    type: 'vote' as const,
    text: 'You voted For on QIP-47',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'delegate' as const,
    text: 'Received delegation from 0x456...789',
    time: '1 day ago',
  },
  {
    id: '3',
    type: 'proposal' as const,
    text: 'QIP-45 passed with 91% approval',
    time: '3 days ago',
  },
];

const DEMO_QUORUM = {
  currentTotalVeqs: 12500000,
  types: {
    parameter: 4,
    upgrade: 8,
    council: 15,
  },
};

const DEMO_COUNCIL = {
  securityCouncil: { active: 5, total: 7 },
  purposeCommittee: { active: 3, total: 3 },
};

const WALLET_ADDRESS = '0x1a2b3c4d5e6f7890abcdef1234567890abcd';

export function GovernanceLanding() {
  const t = useTranslations('governance.landing');
  const tCommon = useTranslations('governance.common');
  const tFooter = useTranslations('governance.footer');
  const router = useRouter();

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
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
      <main
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Header */}
        <GovernanceHeader walletAddress={WALLET_ADDRESS} />

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-gold" aria-hidden="true" />
            {t('pageTitle')}
          </h1>
          <p className="text-foreground-secondary">{t('pageSubtitle')}</p>
        </div>

        {/* Stats Bar */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          <StatCard
            label={t('stats.activeProposals.label')}
            value={DEMO_STATS.activeProposals}
            badge={{ text: t('stats.activeProposals.badge'), variant: 'success' }}
            onClick={() => router.push('/governance/proposals')}
          />
          <StatCard
            label={t('stats.yourVotingPower.label')}
            value={formatNumber(DEMO_STATS.votingPower)}
            unit={t('votingPower.unit')}
            badge={{ text: t('stats.yourVotingPower.badge'), variant: 'hinomaru' }}
            highlight
          />
          <StatCard
            label={t('stats.participationRate.label')}
            value={DEMO_STATS.participationRate}
            unit="%"
          />
          <StatCard
            label={t('stats.totalProposals.label')}
            value={DEMO_STATS.totalProposals}
          />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Voting Power Card */}
            <VotingPowerCard
              total={DEMO_VOTING_POWER.total}
              myVeqs={DEMO_VOTING_POWER.myVeqs}
              delegatedToMe={DEMO_VOTING_POWER.delegatedToMe}
              iDelegated={DEMO_VOTING_POWER.iDelegated}
              delegators={DEMO_VOTING_POWER.delegators}
              lockExpiry={DEMO_VOTING_POWER.lockExpiry}
              onVoteNow={() => router.push('/governance/proposals')}
              onCreateProposal={() => router.push('/governance/voting')}
            />

            {/* Active Proposals */}
            <section className="bg-surface rounded-qs-xl border border-border overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" aria-hidden="true" />
                  {t('proposals.title')}
                </h2>
                <Link
                  href="/governance/proposals"
                  className="text-sm text-gold hover:opacity-80 transition-opacity flex items-center gap-1"
                >
                  {t('proposals.viewAll')}
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
              <div className="p-6 space-y-4">
                {DEMO_PROPOSALS.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    onClick={() => router.push('/governance/proposal-detail')}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            <QuorumCard
              currentTotalVeqs={DEMO_QUORUM.currentTotalVeqs}
              types={DEMO_QUORUM.types}
            />
            <RecentActivityCard activities={DEMO_ACTIVITY} />
            <CouncilStatusCard
              securityCouncil={DEMO_COUNCIL.securityCouncil}
              purposeCommittee={DEMO_COUNCIL.purposeCommittee}
              onViewCouncil={() => router.push('/governance/council')}
            />
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <nav className="flex flex-wrap gap-6" aria-label="Footer links">
              <a
                href="https://forum.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {tFooter('forum')}
              </a>
              <a
                href="https://docs.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {tFooter('documentation')}
              </a>
              <Link
                href="/governance/terms"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {tFooter('terms')}
              </Link>
              <Link
                href="/governance/privacy"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {tFooter('privacy')}
              </Link>
            </nav>
            <p className="text-xs text-foreground-muted max-w-xl">
              {tFooter('disclaimer')}
            </p>
          </div>
          <p className="text-xs text-foreground-muted mt-4">
            &copy; {tFooter('copyright')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default GovernanceLanding;
