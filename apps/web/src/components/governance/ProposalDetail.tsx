'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  FileText,
  User,
  Calendar,
  MessageCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Check,
  Circle,
  HelpCircle,
  ChevronRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type ProposalStatus = 'active' | 'pending' | 'passed' | 'executed' | 'defeated' | 'vetoed';
type ProposalType = 'parameter' | 'upgrade' | 'council';
type VoteChoice = 'for' | 'against' | 'abstain';

interface ProposalData {
  id: number;
  title: string;
  status: ProposalStatus;
  type: ProposalType;
  proposer: string;
  createdAt: string;
  votingEndTime: Date;
  forPercentage: number;
  againstPercentage: number;
  abstainPercentage: number;
  quorumPercentage: number;
  quorumRequired: number;
  quorumReached: boolean;
  commentsCount: number;
  userVotingPower: number;
  content: {
    summary: string;
    motivation: string;
    specification: string[];
    securityConsiderations: string;
  };
  timeline: {
    createdAt: string;
    votingEnds: string;
    timeLockEnds?: string;
    executedAt?: string;
  };
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface VoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  voteChoice: VoteChoice;
  proposalId: number;
  votingPower: number;
  onConfirm: () => void;
  t: ReturnType<typeof useTranslations>;
}

function VoteModal({ isOpen, onClose, voteChoice, proposalId, votingPower, onConfirm, t }: VoteModalProps) {
  if (!isOpen) return null;

  const voteIcons = {
    for: <ThumbsUp className="w-12 h-12 text-success" />,
    against: <ThumbsDown className="w-12 h-12 text-danger" />,
    abstain: <MinusCircle className="w-12 h-12 text-foreground-tertiary" />,
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-modal-title"
    >
      <div className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-border/50">
          <h2 id="vote-modal-title" className="text-lg font-semibold">
            {t('voteModal.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground-tertiary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-center mb-4">{voteIcons[voteChoice]}</div>
          <p className="text-center text-lg mb-6">
            {t('voteModal.confirmText', {
              vote: t(`vote.${voteChoice}`),
              id: `QIP-${proposalId}`,
            })}
          </p>
          <div className="bg-background-secondary rounded-lg p-4 text-center mb-6">
            <p className="text-xs text-foreground-tertiary mb-1">{t('voteModal.votingPower')}</p>
            <p className="text-2xl font-bold text-gold font-mono">
              {votingPower.toLocaleString()} veQS
            </p>
          </div>
          <Button onClick={onConfirm} variant="primary" className="w-full mb-2">
            {t('voteModal.submit')}
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full">
            {t('voteModal.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface VoteSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: number;
  voteChoice: VoteChoice;
  votingPower: number;
  txHash: string;
  t: ReturnType<typeof useTranslations>;
}

function VoteSuccess({ isOpen, onClose, proposalId, voteChoice, votingPower, txHash, t }: VoteSuccessProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-success-title"
    >
      <div className="text-center p-8">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>
        <h2 id="vote-success-title" className="text-2xl font-bold mb-2">
          {t('voteSuccess.title')}
        </h2>
        <p className="text-foreground-secondary mb-8">{t('voteSuccess.subtitle')}</p>
        <div className="bg-card border border-border rounded-2xl p-6 text-left max-w-sm mx-auto mb-8">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-foreground-tertiary text-sm">{t('voteSuccess.proposal')}</span>
            <span className="font-semibold text-sm">QIP-{proposalId}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-foreground-tertiary text-sm">{t('voteSuccess.yourVote')}</span>
            <span className="font-semibold text-sm">{t(`vote.${voteChoice}`)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-foreground-tertiary text-sm">{t('voteSuccess.votingPower')}</span>
            <span className="font-semibold text-sm">{votingPower.toLocaleString()} veQS</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-foreground-tertiary text-sm">{t('voteSuccess.txHash')}</span>
            <span className="font-semibold text-sm text-gold">{txHash}</span>
          </div>
        </div>
        <Button asChild variant="primary">
          <Link href="/governance/proposals">{t('voteSuccess.backToProposals')}</Link>
        </Button>
      </div>
    </div>
  );
}

interface ProposalDetailProps {
  proposalId: number;
}

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const t = useTranslations('governance.proposalDetail');
  const tFooter = useTranslations('governance.landing.footer');
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [isVoteSuccessOpen, setIsVoteSuccessOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteChoice>('for');

  // Mock data - will be replaced with real data from API
  const proposal: ProposalData = {
    id: proposalId,
    title: 'Increase Prover Bond Amount from 100 ETH to 150 ETH',
    status: 'active',
    type: 'parameter',
    proposer: '0xabc...def',
    createdAt: '2026-01-08',
    votingEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000),
    forPercentage: 72,
    againstPercentage: 23,
    abstainPercentage: 5,
    quorumPercentage: 6.5,
    quorumRequired: 4,
    quorumReached: true,
    commentsCount: 24,
    userVotingPower: 125000,
    content: {
      summary:
        'This proposal seeks to increase the minimum bond requirement for Provers from 100 ETH to 150 ETH to improve network security and reduce the risk of malicious behavior.',
      motivation:
        'As the Quantum Shield network has grown, the economic incentives for potential attacks have increased. By raising the bond requirement, we create a stronger economic disincentive for malicious behavior while maintaining accessibility for qualified Provers.',
      specification: [
        'Current bond: 100 ETH',
        'Proposed bond: 150 ETH',
        'Effective: Immediately after Time Lock expires',
        'Existing Provers: Must increase bond within 30 days',
      ],
      securityConsiderations:
        'This change has been reviewed by the Security Council and is consistent with CP-3 (Security First) principles. The higher bond amount provides additional protection against coordinated attacks.',
    },
    timeline: {
      createdAt: '2026-01-08 14:30 UTC',
      votingEnds: '2026-01-15 14:30 UTC',
    },
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = proposal.votingEndTime.getTime();
      const difference = end - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [proposal.votingEndTime]);

  const handleVote = (choice: VoteChoice) => {
    setSelectedVote(choice);
    setIsVoteModalOpen(true);
  };

  const handleConfirmVote = () => {
    setIsVoteModalOpen(false);
    setIsVoteSuccessOpen(true);
  };

  const statusConfig: Record<ProposalStatus, { className: string }> = {
    active: { className: 'bg-success/10 text-success border-success' },
    pending: { className: 'bg-warning/10 text-warning border-warning' },
    passed: { className: 'bg-gold/10 text-gold border-gold' },
    executed: { className: 'bg-gold/10 text-gold border-gold' },
    defeated: { className: 'bg-danger/10 text-danger border-danger' },
    vetoed: { className: 'bg-foreground-tertiary/10 text-foreground-tertiary border-foreground-tertiary' },
  };

  const typeConfig: Record<ProposalType, string> = {
    parameter: 'bg-gold/10 text-gold',
    upgrade: 'bg-hinomaru/10 text-hinomaru-400',
    council: 'bg-success/10 text-success',
  };

  return (
    <main className="min-h-screen bg-background" role="main" aria-label={t('ariaLabel')}>
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-foreground-tertiary mb-6" aria-label="Breadcrumb">
          <Link href="/governance/proposals" className="text-gold hover:underline">
            {t('breadcrumb.proposals')}
          </Link>
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
          <span>QIP-{proposal.id}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main Content */}
          <div>
            {/* Proposal Header */}
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold border',
                    statusConfig[proposal.status].className
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {t(`status.${proposal.status}`)}
                </span>
                <span
                  className={cn(
                    'text-xs px-3 py-1 rounded-full font-medium',
                    typeConfig[proposal.type]
                  )}
                >
                  {t(`types.${proposal.type}`)}
                </span>
              </div>
              <p className="text-gold font-mono font-semibold mb-2">QIP-{proposal.id}</p>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{proposal.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-foreground-secondary">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" aria-hidden="true" />
                  {t('header.proposer')}: {proposal.proposer}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {t('header.created')}: {proposal.createdAt}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  {proposal.commentsCount} {t('header.comments')}
                </span>
              </div>
            </header>

            {/* Countdown */}
            {proposal.status === 'active' && (
              <div className="bg-warning/10 border border-warning rounded-xl p-4 flex items-center gap-4 mb-8">
                <Clock className="w-8 h-8 text-warning" aria-hidden="true" />
                <div>
                  <p className="text-xs text-foreground-tertiary">{t('countdown.label')}</p>
                  <p className="text-xl font-bold text-warning font-mono">
                    {timeLeft.days}{t('countdown.days')} {timeLeft.hours}{t('countdown.hours')} {timeLeft.minutes}{t('countdown.minutes')} {timeLeft.seconds}{t('countdown.seconds')}
                  </p>
                </div>
              </div>
            )}

            {/* Proposal Content */}
            <section className="bg-card border border-border/50 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                {t('content.title')}
              </h2>
              <div className="prose prose-invert prose-sm max-w-none">
                <h3 className="text-base font-semibold text-foreground mt-4 mb-2">
                  {t('content.summary')}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">{proposal.content.summary}</p>

                <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
                  {t('content.motivation')}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">{proposal.content.motivation}</p>

                <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
                  {t('content.specification')}
                </h3>
                <ul className="list-disc list-inside text-foreground-secondary space-y-1">
                  {proposal.content.specification.map((item, index) => (
                    <li key={index}>
                      <code className="bg-background-secondary px-1.5 py-0.5 rounded text-xs font-mono">
                        {item}
                      </code>
                    </li>
                  ))}
                </ul>

                <h3 className="text-base font-semibold text-foreground mt-6 mb-2">
                  {t('content.securityConsiderations')}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  {proposal.content.securityConsiderations}
                </p>
              </div>
            </section>

            {/* Timeline */}
            <section className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  {t('timeline.title')}
                </h2>
              </div>
              <div className="p-6">
                <div className="relative">
                  <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-4">
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center z-10">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t('timeline.proposalCreated')}</p>
                        <p className="text-xs text-foreground-tertiary">{proposal.timeline.createdAt}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-warning flex items-center justify-center z-10 animate-pulse">
                        <Circle className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t('timeline.votingPeriod')}</p>
                        <p className="text-xs text-foreground-tertiary">
                          {t('timeline.votingEnds')} {proposal.timeline.votingEnds}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center z-10" />
                      <div>
                        <SimpleTooltip content={t('timeline.timeLockTooltip')} side="right">
                          <p className="font-semibold text-sm flex items-center gap-1 cursor-help">
                            {t('timeline.timeLock')}
                            <HelpCircle className="w-3 h-3 text-foreground-tertiary" aria-hidden="true" />
                          </p>
                        </SimpleTooltip>
                        <p className="text-xs text-foreground-tertiary">{t('timeline.timeLockNote')}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 relative">
                      <div className="w-6 h-6 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center z-10" />
                      <div>
                        <p className="font-semibold text-sm">{t('timeline.execution')}</p>
                        <p className="text-xs text-foreground-tertiary">{t('timeline.executionNote')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50">
                <h2 className="text-lg font-semibold">{t('vote.title')}</h2>
              </div>
              <div className="p-6">
                {/* Vote Distribution */}
                <div className="mb-6">
                  <div
                    className="h-3 bg-background rounded-full overflow-hidden flex mb-3"
                    role="progressbar"
                    aria-valuenow={proposal.forPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${proposal.forPercentage}% ${t('vote.for')}, ${proposal.againstPercentage}% ${t('vote.against')}, ${proposal.abstainPercentage}% ${t('vote.abstain')}`}
                  >
                    <div className="h-full bg-success" style={{ width: `${proposal.forPercentage}%` }} />
                    <div className="h-full bg-danger" style={{ width: `${proposal.againstPercentage}%` }} />
                    <div className="h-full bg-foreground-tertiary" style={{ width: `${proposal.abstainPercentage}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-background-secondary rounded-lg">
                      <p className="text-[10px] text-foreground-tertiary flex items-center justify-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {t('vote.for')}
                      </p>
                      <p className="text-lg font-bold text-success font-mono">{proposal.forPercentage}%</p>
                    </div>
                    <div className="p-2 bg-background-secondary rounded-lg">
                      <p className="text-[10px] text-foreground-tertiary flex items-center justify-center gap-1">
                        <ThumbsDown className="w-3 h-3" />
                        {t('vote.against')}
                      </p>
                      <p className="text-lg font-bold text-danger font-mono">{proposal.againstPercentage}%</p>
                    </div>
                    <div className="p-2 bg-background-secondary rounded-lg">
                      <p className="text-[10px] text-foreground-tertiary flex items-center justify-center gap-1">
                        <MinusCircle className="w-3 h-3" />
                        {t('vote.abstain')}
                      </p>
                      <p className="text-lg font-bold text-foreground-tertiary font-mono">
                        {proposal.abstainPercentage}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quorum */}
                <div className="bg-background-secondary rounded-lg p-4 mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <SimpleTooltip content={t('vote.quorumTooltip')} side="top">
                      <span className="flex items-center gap-1 cursor-help text-foreground-tertiary">
                        {t('vote.quorum')} ({proposal.quorumRequired}% {t('vote.quorumRequired')})
                        <HelpCircle className="w-3 h-3" aria-hidden="true" />
                      </span>
                    </SimpleTooltip>
                    <span className="text-gold">{proposal.quorumPercentage}% {t('vote.quorumReached')}</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full"
                      style={{ width: `${Math.min(100, (proposal.quorumPercentage / proposal.quorumRequired) * 100)}%` }}
                    />
                  </div>
                  {proposal.quorumReached && (
                    <p className="text-[10px] text-success mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {t('vote.quorumReached')}
                    </p>
                  )}
                </div>

                {/* User Voting Power */}
                <div className="bg-gold/10 border border-gold rounded-lg p-4 text-center mb-6">
                  <p className="text-xs text-foreground-secondary">{t('vote.yourPower')}</p>
                  <p className="text-xl font-bold text-gold font-mono">
                    {proposal.userVotingPower.toLocaleString()} veQS
                  </p>
                </div>

                {/* Vote Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleVote('for')}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold border-2 bg-success/10 text-success border-success hover:bg-success hover:text-white transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {t('vote.for')}
                  </button>
                  <button
                    onClick={() => handleVote('against')}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold border-2 bg-danger/10 text-danger border-danger hover:bg-danger hover:text-white transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {t('vote.against')}
                  </button>
                  <button
                    onClick={() => handleVote('abstain')}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-lg font-semibold border-2 bg-foreground-tertiary/10 text-foreground-tertiary border-foreground-tertiary hover:bg-foreground-tertiary hover:text-white transition-colors"
                  >
                    <MinusCircle className="w-4 h-4" />
                    {t('vote.abstain')}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <nav className="flex gap-6" aria-label="Footer navigation">
              <a
                href="https://forum.quantumshield.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground-tertiary hover:text-gold transition-colors"
              >
                {tFooter('governanceForum')}
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
            </nav>
            <p className="text-xs text-foreground-muted">{tFooter('disclaimer')}</p>
          </div>
        </footer>
      </div>

      {/* Vote Modal */}
      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        voteChoice={selectedVote}
        proposalId={proposal.id}
        votingPower={proposal.userVotingPower}
        onConfirm={handleConfirmVote}
        t={t}
      />

      {/* Vote Success */}
      <VoteSuccess
        isOpen={isVoteSuccessOpen}
        onClose={() => setIsVoteSuccessOpen(false)}
        proposalId={proposal.id}
        voteChoice={selectedVote}
        votingPower={proposal.userVotingPower}
        txHash="0x7a8b...9c0d"
        t={t}
      />
    </main>
  );
}
