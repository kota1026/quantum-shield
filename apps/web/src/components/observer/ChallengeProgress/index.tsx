'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { ArrowLeft, Check, Clock, CircleDot } from 'lucide-react';

interface ChallengeData {
  id: string;
  targetAddress: string;
  targetAmount: string;
  unlockType: 'emergency' | 'normal';
  riskScore: number;
  yourBond: string;
  potentialReward: string;
  txHash: string;
  originalTxHash: string;
  submittedAt: string;
  defensePeriodEnd: string;
  status: 'defense_period' | 'awaiting_judgment' | 'resolved';
  result?: 'won' | 'lost';
}

// Mock data for demonstration
const mockChallenge: ChallengeData = {
  id: 'CHG-2847',
  targetAddress: '0x4b7c8a2e1f9d3c6b5a4e7f8d9c1b2a3e4f5d6c7b',
  targetAmount: '45.00',
  unlockType: 'emergency',
  riskScore: 87,
  yourBond: '0.45',
  potentialReward: '0.90',
  txHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
  originalTxHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
  submittedAt: '2026-01-08 14:32:18 UTC',
  defensePeriodEnd: '2026-01-11 14:32:18 UTC',
  status: 'defense_period',
};

interface TimelineItemProps {
  status: 'completed' | 'current' | 'pending';
  number?: number;
  title: string;
  time: string;
  description: string;
}

function TimelineItem({ status, number, title, time, description }: TimelineItemProps) {
  return (
    <div className="relative pb-6 last:pb-0">
      <div
        className={`absolute left-[-25px] w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
          status === 'completed'
            ? 'bg-success text-white'
            : status === 'current'
              ? 'bg-warning text-white animate-pulse'
              : 'bg-background-secondary border-2 border-border-default text-text-tertiary'
        }`}
      >
        {status === 'completed' ? (
          <Check className="w-3 h-3" />
        ) : status === 'current' ? (
          <Clock className="w-3 h-3" />
        ) : (
          number
        )}
      </div>
      <div className="pl-4">
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-xs text-text-tertiary font-mono">{time}</div>
        <div className="text-sm text-text-secondary mt-2">{description}</div>
      </div>
    </div>
  );
}

export function ChallengeProgress() {
  const t = useTranslations('observer.dashboard.challengeProgress');
  const tCommon = useTranslations('observer.dashboard');
  const [countdown, setCountdown] = useState({ hours: 47, minutes: 22, seconds: 15 });
  const [progress, setProgress] = useState(35);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 0;
          minutes = 0;
          seconds = 0;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const statusBadge = {
    defense_period: {
      text: t('status.defensePeriod'),
      className: 'bg-warning/10 text-warning border-warning',
    },
    awaiting_judgment: {
      text: t('status.awaitingJudgment'),
      className: 'bg-accent-gold/10 text-accent-gold border-accent-gold',
    },
    resolved: {
      text: t('status.resolved'),
      className: 'bg-success/10 text-success border-success',
    },
  };

  const currentStatus = statusBadge[mockChallenge.status];

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,var(--accent-hinomaru-dim),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-[900px] mx-auto px-8 py-8">
        <ObserverHeader />

        <Link
          href="/observer/history"
          className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-transparent border border-border-default rounded-lg text-text-secondary text-sm hover:border-accent-gold hover:text-accent-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToHistory')}
        </Link>

        {/* Submitted Banner */}
        <div className="bg-success/10 border border-success rounded-xl p-6 mb-8 flex items-center gap-4">
          <div className="text-2xl">
            <Check className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="font-semibold text-success">{t('submitted.title')}</div>
            <div className="text-sm text-text-secondary">
              {t('submitted.description', { txHash: `${mockChallenge.txHash.slice(0, 6)}...${mockChallenge.txHash.slice(-4)}` })}
            </div>
          </div>
        </div>

        {/* Challenge Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('header.title', { id: mockChallenge.id })}</h1>
            <div className="font-mono text-sm text-text-tertiary">
              {t('header.vs')} {mockChallenge.targetAddress.slice(0, 6)}...{mockChallenge.targetAddress.slice(-4)} •{' '}
              {mockChallenge.targetAmount} ETH {t('header.emergencyUnlock')}
            </div>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${currentStatus.className}`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            {currentStatus.text}
          </div>
        </div>

        {/* Countdown */}
        <section
          className="bg-card border border-border-subtle rounded-2xl p-8 mb-8 text-center"
          aria-label={t('countdown.ariaLabel')}
        >
          <div className="text-sm text-text-tertiary mb-6">{t('countdown.remaining')}</div>
          <div className="flex justify-center gap-12 mb-8">
            <div className="text-center">
              <div className="text-6xl font-bold font-mono text-hinomaru-400 tabular-nums">
                {String(countdown.hours).padStart(2, '0')}
              </div>
              <div className="text-xs text-text-tertiary uppercase tracking-widest mt-2">{t('countdown.hours')}</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold font-mono text-hinomaru-400 tabular-nums">
                {String(countdown.minutes).padStart(2, '0')}
              </div>
              <div className="text-xs text-text-tertiary uppercase tracking-widest mt-2">{t('countdown.minutes')}</div>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold font-mono text-hinomaru-400 tabular-nums">
                {String(countdown.seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-text-tertiary uppercase tracking-widest mt-2">{t('countdown.seconds')}</div>
            </div>
          </div>
          <div className="h-2 bg-background-primary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-text-tertiary mt-3">{t('countdown.elapsed', { percent: progress })}</div>
        </section>

        {/* Timeline */}
        <section
          className="bg-card border border-border-subtle rounded-2xl p-8 mb-8"
          aria-labelledby="timeline-title"
        >
          <h2 id="timeline-title" className="text-lg font-semibold mb-6">
            {t('timeline.title')}
          </h2>
          <div className="relative pl-8 before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-0.5 before:bg-border-default">
            <TimelineItem
              status="completed"
              title={t('timeline.submitted')}
              time="2026-01-08 14:32:18 UTC"
              description={t('timeline.submittedDesc', { address: `${mockChallenge.targetAddress.slice(0, 6)}...${mockChallenge.targetAddress.slice(-4)}`, bond: mockChallenge.yourBond })}
            />
            <TimelineItem
              status="completed"
              title={t('timeline.bondLocked')}
              time="2026-01-08 14:32:20 UTC"
              description={t('timeline.bondLockedDesc', { bond: mockChallenge.yourBond })}
            />
            <TimelineItem
              status="current"
              title={t('timeline.defenseEnd')}
              time={t('timeline.endsAt', { time: '2026-01-11 14:32:18 UTC' })}
              description={t('timeline.defenseDesc')}
            />
            <TimelineItem
              status="pending"
              number={4}
              title={t('timeline.judgment')}
              time={t('timeline.pending')}
              description={t('timeline.judgmentDesc')}
            />
            <TimelineItem
              status="pending"
              number={5}
              title={t('timeline.resolution')}
              time={t('timeline.pending')}
              description={t('timeline.resolutionDesc')}
            />
          </div>
        </section>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section
            className="bg-card border border-border-subtle rounded-2xl p-8"
            aria-labelledby="challenge-details-title"
          >
            <h3 id="challenge-details-title" className="text-sm text-text-tertiary mb-4">
              {t('details.title')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('details.challengeId')}</span>
                <span className="font-semibold font-mono">#{mockChallenge.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('details.submitted')}</span>
                <span className="font-semibold">2026-01-08 14:32</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('details.yourBond')}</span>
                <span className="font-semibold text-warning">{mockChallenge.yourBond} ETH</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('details.potentialReward')}</span>
                <span className="font-semibold text-success">~{mockChallenge.potentialReward} ETH</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-text-secondary">{t('details.txHash')}</span>
                <span className="font-semibold font-mono text-xs">
                  {mockChallenge.txHash.slice(0, 6)}...{mockChallenge.txHash.slice(-4)}
                </span>
              </div>
            </div>
          </section>

          <section
            className="bg-card border border-border-subtle rounded-2xl p-8"
            aria-labelledby="target-details-title"
          >
            <h3 id="target-details-title" className="text-sm text-text-tertiary mb-4">
              {t('target.title')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('target.address')}</span>
                <span className="font-semibold font-mono text-xs">
                  {mockChallenge.targetAddress.slice(0, 6)}...{mockChallenge.targetAddress.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('target.amount')}</span>
                <span className="font-semibold">{mockChallenge.targetAmount} ETH</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('target.type')}</span>
                <span className="font-semibold text-warning">{t('target.emergencyUnlock')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border-subtle text-sm">
                <span className="text-text-secondary">{t('target.riskScore')}</span>
                <span className="font-semibold text-error">{mockChallenge.riskScore}</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-text-secondary">{t('target.originalTx')}</span>
                <span className="font-semibold font-mono text-xs">
                  {mockChallenge.originalTxHash.slice(0, 6)}...{mockChallenge.originalTxHash.slice(-4)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
