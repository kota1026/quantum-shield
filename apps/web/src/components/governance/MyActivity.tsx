'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import {
  BarChart3,
  Vote,
  FileText,
  Users,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle,
  XCircle,
} from 'lucide-react';

// Mock data for votes
const voteHistory = [
  {
    id: 'QIP-47',
    title: 'Increase Prover Bond Amount from 100 ETH to 150 ETH',
    vote: 'for',
    power: '125,000',
    date: '2026-01-10 14:32',
  },
  {
    id: 'QIP-45',
    title: 'Upgrade STARK Verifier Contract to v2.1',
    vote: 'for',
    power: '125,000',
    date: '2026-01-05 09:15',
  },
  {
    id: 'QIP-44',
    title: 'Reduce Challenge Period from 14 days to 7 days',
    vote: 'for',
    power: '120,000',
    date: '2025-12-20 16:45',
  },
  {
    id: 'QIP-40',
    title: 'Decrease Minimum Lock Period from 30 days to 7 days',
    vote: 'against',
    power: '115,000',
    date: '2025-12-10 11:20',
  },
  {
    id: 'QIP-38',
    title: 'Add Emergency Pause Functionality for Security Council',
    vote: 'for',
    power: '110,000',
    date: '2025-11-28 08:30',
  },
];

// Mock data for proposals created by user
const myProposals = [
  {
    id: 'QIP-35',
    title: 'Implement Quarterly Security Audits',
    status: 'passed',
    date: '2025-11-15',
  },
  {
    id: 'QIP-28',
    title: 'Add Dilithium Signature Verification',
    status: 'passed',
    date: '2025-10-01',
  },
  {
    id: 'QIP-22',
    title: 'Increase Validator Rewards by 10%',
    status: 'defeated',
    date: '2025-09-12',
  },
];

// Mock data for delegations received
const delegations = [
  {
    address: '0x456...789',
    initial: 'A',
    since: '2025-12-15',
    power: '12,500',
  },
  {
    address: '0x789...abc',
    initial: 'B',
    since: '2025-11-20',
    power: '8,000',
  },
  {
    address: '0xdef...123',
    initial: 'C',
    since: '2026-01-08',
    power: '4,500',
  },
];

// Stats
const stats = {
  totalVotes: 42,
  participationRate: 89,
  proposalsCreated: 3,
  delegationsReceived: 3,
};

type TabType = 'votes' | 'proposals' | 'delegations';

interface StatCardProps {
  label: string;
  value: string | number;
  colorClass?: string;
}

function StatCard({ label, value, colorClass = 'text-white' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#0e0e11] p-6">
      <div className="mb-2 text-xs text-gray-500">{label}</div>
      <div className={`font-mono text-3xl font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}

interface VoteBadgeProps {
  vote: string;
  label: string;
}

function VoteBadge({ vote, label }: VoteBadgeProps) {
  const getStyles = () => {
    switch (vote) {
      case 'for':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'against':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getIcon = () => {
    switch (vote) {
      case 'for':
        return <ThumbsUp className="h-3 w-3" aria-hidden="true" />;
      case 'against':
        return <ThumbsDown className="h-3 w-3" aria-hidden="true" />;
      default:
        return <Minus className="h-3 w-3" aria-hidden="true" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStyles()}`}
    >
      {getIcon()}
      {label}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  label: string;
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const getStyles = () => {
    switch (status) {
      case 'passed':
        return 'bg-emerald-500/10 text-emerald-500';
      case 'defeated':
        return 'bg-red-500/10 text-red-500';
      case 'active':
        return 'bg-hinomaru/10 text-hinomaru-light';
      default:
        return 'bg-yellow-500/10 text-yellow-500';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-3 w-3" aria-hidden="true" />;
      case 'defeated':
        return <XCircle className="h-3 w-3" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStyles()}`}
    >
      {getIcon()}
      {label}
    </span>
  );
}

interface DelegationCardProps {
  address: string;
  initial: string;
  since: string;
  power: string;
  sinceLabel: string;
  powerLabel: string;
}

function DelegationCard({
  address,
  initial,
  since,
  power,
  sinceLabel,
  powerLabel,
}: DelegationCardProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#111114] p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="bg-gradient-gold flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white">
          {initial}
        </div>
        <div>
          <div className="font-mono font-semibold text-white">{address}</div>
          <div className="text-xs text-gray-500">
            {sinceLabel} {since}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gold bg-gold/10 p-3 text-center">
        <div className="text-[10px] text-gray-500">{powerLabel}</div>
        <div className="font-mono text-lg font-bold text-gold">{power} veQS</div>
      </div>
    </div>
  );
}

export function MyActivity() {
  const t = useTranslations('governance.myActivity');
  const tFooter = useTranslations('governance.landing.footer');
  const [activeTab, setActiveTab] = useState<TabType>('votes');

  return (
    <main
      className="relative min-h-screen bg-[#0a0a0c] pb-12"
      aria-label={t('ariaLabel')}
      role="main"
    >
      {/* Premium background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-[-100px] h-[500px] w-[800px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-8">
        {/* Page Header */}
        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
            <BarChart3 className="h-8 w-8 text-gold" aria-hidden="true" />
            {t('pageTitle')}
          </h1>
        </header>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label={t('stats.totalVotes')} value={stats.totalVotes} />
          <StatCard
            label={t('stats.participationRate')}
            value={`${stats.participationRate}%`}
            colorClass="text-emerald-500"
          />
          <StatCard label={t('stats.proposalsCreated')} value={stats.proposalsCreated} />
          <StatCard
            label={t('stats.delegationsReceived')}
            value={stats.delegationsReceived}
            colorClass="text-gold"
          />
        </div>

        {/* Tabs */}
        <div
          className="mb-8 inline-flex gap-1 rounded-full border border-white/5 bg-[#111114] p-1"
          role="tablist"
          aria-label="Activity tabs"
        >
          <button
            role="tab"
            aria-selected={activeTab === 'votes'}
            aria-controls="votes-panel"
            id="votes-tab"
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
              activeTab === 'votes' ? 'bg-[#18181c] text-white' : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('votes')}
          >
            <Vote className="h-4 w-4" aria-hidden="true" />
            {t('tabs.votes')}
            <span className="rounded-full bg-hinomaru/10 px-2 py-0.5 text-xs text-hinomaru-light">
              {stats.totalVotes}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'proposals'}
            aria-controls="proposals-panel"
            id="proposals-tab"
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
              activeTab === 'proposals'
                ? 'bg-[#18181c] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('proposals')}
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            {t('tabs.proposals')}
            <span className="rounded-full bg-hinomaru/10 px-2 py-0.5 text-xs text-hinomaru-light">
              {stats.proposalsCreated}
            </span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'delegations'}
            aria-controls="delegations-panel"
            id="delegations-tab"
            className={`flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
              activeTab === 'delegations'
                ? 'bg-[#18181c] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('delegations')}
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            {t('tabs.delegations')}
            <span className="rounded-full bg-hinomaru/10 px-2 py-0.5 text-xs text-hinomaru-light">
              {stats.delegationsReceived}
            </span>
          </button>
        </div>

        {/* Tab Content: Votes */}
        <div
          id="votes-panel"
          role="tabpanel"
          aria-labelledby="votes-tab"
          className={activeTab === 'votes' ? 'block' : 'hidden'}
        >
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
            <div className="border-b border-white/5 p-6 font-semibold text-white">
              {t('votesTab.title')}
            </div>
            {voteHistory.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mb-4 text-5xl opacity-50">
                  <Vote className="mx-auto h-12 w-12" />
                </div>
                <div className="text-gray-500">{t('votesTab.emptyState.title')}</div>
                <div className="text-sm text-gray-600">{t('votesTab.emptyState.description')}</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {voteHistory.map((vote) => (
                  <Link
                    key={vote.id}
                    href={`/governance/proposals/${vote.id.replace('QIP-', '')}`}
                    className="grid grid-cols-[80px_1fr_120px_120px_150px] items-center gap-4 p-6 transition-colors hover:bg-[#111114] max-md:grid-cols-[60px_1fr_100px_100px] max-sm:grid-cols-1 max-sm:gap-2"
                  >
                    <div className="font-mono font-bold text-gold">{vote.id}</div>
                    <div className="truncate font-medium text-white max-sm:text-sm">
                      {vote.title}
                    </div>
                    <div>
                      <VoteBadge vote={vote.vote} label={t(`votesTab.voteBadge.${vote.vote}`)} />
                    </div>
                    <div className="font-mono text-sm text-gray-300">{vote.power} veQS</div>
                    <div className="text-xs text-gray-500 max-md:hidden">{vote.date}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content: Proposals */}
        <div
          id="proposals-panel"
          role="tabpanel"
          aria-labelledby="proposals-tab"
          className={activeTab === 'proposals' ? 'block' : 'hidden'}
        >
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
            <div className="border-b border-white/5 p-6 font-semibold text-white">
              {t('proposalsTab.title')}
            </div>
            {myProposals.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mb-4 text-5xl opacity-50">
                  <FileText className="mx-auto h-12 w-12" />
                </div>
                <div className="text-gray-500">{t('proposalsTab.emptyState.title')}</div>
                <div className="text-sm text-gray-600">
                  {t('proposalsTab.emptyState.description')}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {myProposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`/governance/proposals/${proposal.id.replace('QIP-', '')}`}
                    className="grid grid-cols-[80px_1fr_120px_150px] items-center gap-4 p-6 transition-colors hover:bg-[#111114] max-md:grid-cols-[60px_1fr_100px] max-sm:grid-cols-1 max-sm:gap-2"
                  >
                    <div className="font-mono font-bold text-gold">{proposal.id}</div>
                    <div className="truncate font-medium text-white max-sm:text-sm">
                      {proposal.title}
                    </div>
                    <div>
                      <StatusBadge
                        status={proposal.status}
                        label={t(`proposalsTab.status.${proposal.status}`)}
                      />
                    </div>
                    <div className="text-xs text-gray-500 max-md:hidden">{proposal.date}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab Content: Delegations */}
        <div
          id="delegations-panel"
          role="tabpanel"
          aria-labelledby="delegations-tab"
          className={activeTab === 'delegations' ? 'block' : 'hidden'}
        >
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0e0e11]">
            <div className="border-b border-white/5 p-6 font-semibold text-white">
              {t('delegationsTab.title')}
            </div>
            {delegations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mb-4 text-5xl opacity-50">
                  <Users className="mx-auto h-12 w-12" />
                </div>
                <div className="text-gray-500">{t('delegationsTab.emptyState.title')}</div>
                <div className="text-sm text-gray-600">
                  {t('delegationsTab.emptyState.description')}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                {delegations.map((delegation) => (
                  <DelegationCard
                    key={delegation.address}
                    {...delegation}
                    sinceLabel={t('delegationsTab.delegatedSince')}
                    powerLabel={t('delegationsTab.delegatedPower')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/5 pt-6">
          <div className="mb-4 flex flex-wrap justify-center gap-6 text-xs text-gray-500">
            <Link href="/governance" className="transition-colors hover:text-white">
              {tFooter('governanceForum')}
            </Link>
            <Link href="/docs" className="transition-colors hover:text-white">
              {tFooter('documentation')}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              {tFooter('terms')}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              {tFooter('privacy')}
            </Link>
          </div>
          <p className="text-center text-xs text-gray-600">{t('footer.disclaimer')}</p>
        </footer>
      </div>
    </main>
  );
}
