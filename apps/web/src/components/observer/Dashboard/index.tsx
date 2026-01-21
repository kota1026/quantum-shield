'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ObserverHeader } from './ObserverHeader';
import { ObserverStatCard } from './ObserverStatCard';
import { PendingUnlocksTable } from './PendingUnlocksTable';
import { SuspiciousAlertCard } from './SuspiciousAlertCard';
import { EarningsSidebar } from './EarningsSidebar';
import { ChallengeStatsSidebar } from './ChallengeStatsSidebar';
import { ActiveChallengesSidebar } from './ActiveChallengesSidebar';
import { ObserverStakeSidebar } from './ObserverStakeSidebar';

// Mock data - In production, this would come from API
const mockPendingUnlocks = [
  {
    id: '1',
    address: '0x8f2a...3d4e',
    amount: '12.50 ETH',
    type: 'normal' as const,
    timeRemaining: '23:41:02',
    status: 'pending' as const,
  },
  {
    id: '2',
    address: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    type: 'emergency' as const,
    timeRemaining: '6d 14:22:18',
    status: 'monitoring' as const,
  },
  {
    id: '3',
    address: '0x1a9d...7b2c',
    amount: '8.75 ETH',
    type: 'normal' as const,
    timeRemaining: '18:05:33',
    status: 'pending' as const,
  },
];

const mockSuspiciousTransactions = [
  {
    id: '1',
    address: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    type: 'emergency' as const,
    riskLevel: 'high' as const,
    score: 87,
    reason: 'First-time emergency unlock with large amount',
  },
  {
    id: '2',
    address: '0x2e5f...8a1b',
    amount: '25.00 ETH',
    type: 'normal' as const,
    riskLevel: 'medium' as const,
    score: 62,
    reason: 'Unusual unlock pattern detected',
  },
];

const mockActiveChallenges = [
  {
    id: '1',
    challengeId: '#CHG-2847',
    targetAddress: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    countdown: '47:22:15',
    progress: 35,
    status: 'defense' as const,
  },
  {
    id: '2',
    challengeId: '#CHG-2843',
    targetAddress: '0x9a2e...1f3c',
    amount: '18.25 ETH',
    countdown: '12:08:44',
    progress: 83,
    status: 'judgment' as const,
  },
];

export function ObserverDashboard() {
  const t = useTranslations('observer.dashboard');

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      <main
        className="relative z-10 max-w-[1400px] mx-auto px-8 py-8"
        role="main"
        aria-label={t('pageTitle')}
      >
        {/* Header */}
        <ObserverHeader />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-[32px] font-bold text-foreground tracking-tight">
            {t('pageTitle')}
          </h1>
          <div
            className={cn(
              'flex items-center gap-2 px-5 py-2.5',
              'bg-success/15 border border-success/50 rounded-full',
              'text-success text-sm font-semibold'
            )}
            role="status"
            aria-label={t('monitoringBadgeAriaLabel')}
          >
            <span className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" />
            {t('monitoringBadge')}
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 items-stretch"
          role="region"
          aria-label="Observer statistics"
        >
          <ObserverStatCard
            label={t('stats.pendingUnlocks.label')}
            value={47}
            variant="warning"
            tooltip={t('stats.pendingUnlocks.tooltip')}
            change={t('stats.pendingUnlocks.change', { count: 12 })}
            href="/observer/pending"
          />
          <ObserverStatCard
            label={t('stats.suspicious.label')}
            value={3}
            variant="highlight"
            tooltip={t('stats.suspicious.tooltip')}
            changeBadge={{
              text: t('stats.suspicious.badge'),
              variant: 'danger',
            }}
            href="/observer/suspicious"
          />
          <ObserverStatCard
            label={t('stats.activeChallenges.label')}
            value={2}
            variant="default"
            tooltip={t('stats.activeChallenges.tooltip')}
            href="/observer/history"
          />
          <ObserverStatCard
            label={t('stats.totalEarnings.label')}
            value="4.28"
            unit="ETH"
            variant="success"
            tooltip={t('stats.totalEarnings.tooltip')}
            change={t('stats.totalEarnings.change', { amount: '0.35 ETH' })}
            href="/observer/earnings"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Tables */}
          <div className="space-y-8">
            <PendingUnlocksTable unlocks={mockPendingUnlocks} />
            <SuspiciousAlertCard transactions={mockSuspiciousTransactions} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            <EarningsSidebar claimableAmount="1.24 ETH" />
            <ChallengeStatsSidebar successful={12} failed={2} />
            <ActiveChallengesSidebar challenges={mockActiveChallenges} />
            <ObserverStakeSidebar
              stakeAmount="5.00 ETH"
              activeSince="2025-11-15"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
