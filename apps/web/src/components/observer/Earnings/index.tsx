'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { Trophy, Wallet, Check, X, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

type ClaimStep = 'idle' | 'confirm' | 'processing' | 'success';

interface EarningItem {
  id: string;
  type: 'reward' | 'bond_return' | 'bond_lost';
  challengeId: string;
  amount: string;
  date: string;
  status: 'claimable' | 'claimed' | 'settled';
}

// Mock data
const mockClaimableAmount = '1.24';
const mockClaimableUsd = '4,340';
const mockTotalEarned = '4.28';
const mockTotalClaimed = '3.04';

const mockBreakdown = [
  {
    id: '1',
    type: 'reward' as const,
    challengeId: 'CHG-2831',
    description: 'Won',
    date: '2026-01-05',
    amount: '+0.65',
  },
  {
    id: '2',
    type: 'bond_return' as const,
    challengeId: 'CHG-2831',
    description: 'Refunded',
    date: '2026-01-05',
    amount: '+0.35',
  },
  {
    id: '3',
    type: 'reward' as const,
    challengeId: 'CHG-2824',
    description: 'Won',
    date: '2026-01-03',
    amount: '+0.24',
  },
];

const mockHistory: EarningItem[] = [
  { id: '1', type: 'reward', challengeId: 'CHG-2831', amount: '+0.65', date: '2026-01-05', status: 'claimable' },
  { id: '2', type: 'reward', challengeId: 'CHG-2824', amount: '+0.24', date: '2026-01-03', status: 'claimable' },
  { id: '3', type: 'bond_lost', challengeId: 'CHG-2819', amount: '-0.10', date: '2026-01-01', status: 'settled' },
  { id: '4', type: 'reward', challengeId: 'CHG-2812', amount: '+1.10', date: '2025-12-28', status: 'claimed' },
  { id: '5', type: 'reward', challengeId: 'CHG-2805', amount: '+0.45', date: '2025-12-25', status: 'claimed' },
];

interface ClaimModalProps {
  step: ClaimStep;
  onClose: () => void;
  onConfirm: () => void;
  onDone: () => void;
  amount: string;
  t: ReturnType<typeof useTranslations>;
}

function ClaimModal({ step, onClose, onConfirm, onDone, amount, t }: ClaimModalProps) {
  if (step === 'idle') return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-modal-title"
    >
      <div className="bg-card border border-border-default rounded-2xl p-8 max-w-md w-[90%] text-center">
        {/* Confirm Step */}
        {step === 'confirm' && (
          <>
            <div className="mb-6">
              <Wallet className="w-12 h-12 mx-auto text-success" />
            </div>
            <h2 id="claim-modal-title" className="text-xl font-bold mb-2">
              {t('claimModal.title')}
            </h2>
            <div className="text-4xl font-bold text-success my-6">{amount} QS</div>
            <p className="text-foreground-secondary text-sm mb-8">
              {t('claimModal.description')}
              <br />
              <span className="font-mono text-xs">0x7a3f...9c2d</span>
            </p>
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-transparent border border-border rounded-lg text-foreground-secondary hover:border-gold hover:text-gold transition-colors"
              >
                {t('claimModal.cancel')}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-6 bg-gradient-to-br from-success to-success/80 rounded-lg text-white font-semibold hover:shadow-lg hover:shadow-success/30 transition-all"
              >
                {t('claimModal.confirm')}
              </button>
            </div>
          </>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin" />
              </div>
            </div>
            <h2 id="claim-modal-title" className="text-xl font-bold mb-2">
              {t('claimModal.processingTitle')}
            </h2>
            <p className="text-foreground-secondary text-sm mb-4">
              {t('claimModal.processingDescription')}
            </p>
            <div className="text-3xl font-bold text-gold my-6">{amount} QS</div>
            <div className="flex items-center justify-center gap-2 text-sm text-foreground-tertiary">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              {t('claimModal.waitingForConfirmation')}
            </div>
          </>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-success/20 rounded-full flex items-center justify-center">
                <div className="w-14 h-14 bg-success rounded-full flex items-center justify-center">
                  <Check className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
            <h2 id="claim-modal-title" className="text-xl font-bold mb-2">
              {t('claimModal.successTitle')}
            </h2>
            <p className="text-foreground-secondary text-sm mb-2">
              {t('claimModal.successDescription')}
            </p>
            <div className="text-3xl font-bold text-success my-6">{amount} QS</div>

            {/* Transaction Hash */}
            <div className="bg-background-secondary rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-foreground-secondary">{t('claimModal.txHash')}</span>
                <a
                  href="https://etherscan.io/tx/0x7a3f9c2d8e1b4f6a...3d4e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-gold hover:underline inline-flex items-center gap-1"
                >
                  0x7a3f...3d4e
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={onDone}
              className="w-full"
            >
              {t('claimModal.done')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export function Earnings() {
  const t = useTranslations('observer.dashboard.earnings');
  const router = useRouter();
  const [claimStep, setClaimStep] = useState<ClaimStep>('idle');

  const handleOpenClaimModal = () => {
    setClaimStep('confirm');
  };

  const handleCloseClaimModal = () => {
    setClaimStep('idle');
  };

  const handleConfirmClaim = async () => {
    setClaimStep('processing');
    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 2500));
    setClaimStep('success');
  };

  const handleDone = () => {
    setClaimStep('idle');
    // Optionally refresh page data here
  };

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,var(--accent-hinomaru-dim),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-8 py-8">
        <ObserverHeader />

        <h1 className="text-3xl font-bold mb-8">{t('pageTitle')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Main Content */}
          <div>
            {/* Claim Card */}
            <section
              className="relative bg-gradient-to-br from-card to-background-secondary border border-border-subtle rounded-2xl p-8 mb-8 overflow-hidden"
              aria-labelledby="claim-section-title"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-success to-gold" />
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 id="claim-section-title" className="text-base text-foreground-secondary mb-2">
                    {t('claim.available')}
                  </h2>
                  <div className="text-5xl font-bold text-success tabular-nums">{mockClaimableAmount} QS</div>
                  <div className="text-base text-foreground-tertiary mt-2">{t('claim.rewardToken')}</div>
                </div>
                <span className="px-4 py-2 bg-success/10 border border-success rounded-full text-success text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  {t('claim.readyToClaim')}
                </span>
              </div>
              <button
                onClick={handleOpenClaimModal}
                className="w-full py-5 bg-gradient-to-br from-success to-[#00a080] rounded-xl text-white text-lg font-semibold hover:shadow-xl hover:shadow-success/30 hover:-translate-y-0.5 transition-all"
              >
                {t('claim.claimButton')} {mockClaimableAmount} QS
              </button>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-border-subtle rounded-xl p-6">
                <div className="text-xs text-text-tertiary mb-2">{t('summary.totalEarnings')}</div>
                <div className="text-2xl font-bold text-accent-gold">{mockTotalEarned} QS</div>
              </div>
              <div className="bg-card border border-border-subtle rounded-xl p-6">
                <div className="text-xs text-text-tertiary mb-2">{t('summary.claimed')}</div>
                <div className="text-2xl font-bold">{mockTotalClaimed} QS</div>
              </div>
            </div>

            {/* Breakdown */}
            <section
              className="bg-card border border-border-subtle rounded-2xl overflow-hidden mb-8"
              aria-labelledby="breakdown-title"
            >
              <div className="p-6 border-b border-border-subtle">
                <h2 id="breakdown-title" className="text-lg font-semibold">
                  {t('claim.title')}
                </h2>
              </div>
              <div className="p-6">
                {mockBreakdown.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-4 border-b border-border-subtle last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          item.type === 'reward' ? 'bg-success/10' : 'bg-accent-gold/10'
                        }`}
                      >
                        <Trophy
                          className={`w-4 h-4 ${item.type === 'reward' ? 'text-success' : 'text-accent-gold'}`}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {t('breakdown.challenge', { id: item.challengeId })}{' '}
                          {item.type === 'reward' ? t('breakdown.reward') : t('breakdown.bondReturn')}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {item.description} • {item.date}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono font-semibold text-success">{item.amount} QS</div>
                  </div>
                ))}
              </div>
            </section>

            {/* History */}
            <section
              className="bg-card border border-border-subtle rounded-2xl overflow-hidden"
              aria-labelledby="history-title"
            >
              <div className="p-6 border-b border-border-subtle">
                <h2 id="history-title" className="text-lg font-semibold">
                  {t('history.title')}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full" role="grid">
                  <thead>
                    <tr className="bg-background-secondary">
                      <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-6 py-4">
                        {t('history.date')}
                      </th>
                      <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-6 py-4">
                        {t('history.type')}
                      </th>
                      <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-6 py-4">
                        {t('history.challenge')}
                      </th>
                      <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-6 py-4">
                        {t('history.amount')}
                      </th>
                      <th className="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider px-6 py-4">
                        {t('history.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border-subtle last:border-0">
                        <td className="px-6 py-4 text-sm">{item.date}</td>
                        <td className="px-6 py-4 text-sm">
                          {item.type === 'reward'
                            ? t('types.challengeWin')
                            : item.type === 'bond_return'
                              ? t('types.bondReturn')
                              : t('types.bondLost')}
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">#{item.challengeId}</td>
                        <td
                          className={`px-6 py-4 text-sm font-mono font-semibold ${
                            item.amount.startsWith('+') ? 'text-success' : 'text-error'
                          }`}
                        >
                          {item.amount} QS
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 'claimable'
                                ? 'bg-warning/10 text-warning'
                                : item.status === 'claimed'
                                  ? 'bg-success/10 text-success'
                                  : 'bg-text-tertiary/10 text-text-tertiary'
                            }`}
                          >
                            {item.status === 'claimable'
                              ? t('statuses.claimable')
                              : item.status === 'claimed'
                                ? t('statuses.claimed')
                                : t('statuses.settled')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div>
            {/* Performance Stats */}
            <section
              className="bg-card border border-border-subtle rounded-2xl p-8 mb-6"
              aria-labelledby="performance-title"
            >
              <h3 id="performance-title" className="text-base font-semibold mb-6">
                {t('performance.title')}
              </h3>
              <div className="text-center py-6 border-b border-border-subtle">
                <div className="text-3xl font-bold text-success">85.7%</div>
                <div className="text-xs text-text-tertiary mt-1">{t('performance.successRate')}</div>
                <div className="h-2 bg-background-primary rounded-full overflow-hidden mt-4">
                  <div
                    className="h-full bg-gradient-to-r from-success to-accent-gold rounded-full"
                    style={{ width: '85.7%' }}
                  />
                </div>
              </div>
              <div className="text-center py-6 border-b border-border-subtle">
                <div className="text-3xl font-bold">14</div>
                <div className="text-xs text-text-tertiary mt-1">{t('performance.totalChallenges')}</div>
              </div>
              <div className="text-center py-6 border-b border-border-subtle">
                <div className="text-3xl font-bold text-success">12</div>
                <div className="text-xs text-text-tertiary mt-1">{t('performance.successful')}</div>
              </div>
              <div className="text-center py-6">
                <div className="text-3xl font-bold text-error">2</div>
                <div className="text-xs text-text-tertiary mt-1">{t('performance.failed')}</div>
              </div>
            </section>

            {/* Observer Stake */}
            <section
              className="bg-card border border-border-subtle rounded-2xl p-8 mb-6"
              aria-labelledby="stake-title"
            >
              <h3 id="stake-title" className="text-base font-semibold mb-6">
                {t('stake.title')}
              </h3>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-2xl font-bold">5.00 ETH</div>
                  <div className="text-xs text-text-tertiary">{t('stake.stakedAmount')}</div>
                </div>
                <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                  {t('stake.active')}
                </span>
              </div>
              <div className="text-sm text-text-secondary">
                {t('stake.activeSince')}: 2025-11-15
                <br />
                {t('stake.daysStaked')}: 56
              </div>
            </section>

            {/* ROI Calculator */}
            <section
              className="bg-card border border-border-subtle rounded-2xl p-8"
              aria-labelledby="roi-title"
            >
              <h3 id="roi-title" className="text-base font-semibold mb-6">
                {t('roi.title')}
              </h3>
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">{t('roi.totalInvested')}</span>
                <span className="font-semibold">5.00 ETH</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle">
                <span className="text-sm text-text-secondary">{t('roi.totalEarned')}</span>
                <span className="font-semibold text-success">4.28 QS</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-text-secondary">{t('roi.roi')}</span>
                <span className="font-bold text-success text-lg">+85.6%</span>
              </div>
            </section>
          </div>
        </div>
      </div>

      <ClaimModal
        step={claimStep}
        onClose={handleCloseClaimModal}
        onConfirm={handleConfirmClaim}
        onDone={handleDone}
        amount={mockClaimableAmount}
        t={t}
      />
    </div>
  );
}
