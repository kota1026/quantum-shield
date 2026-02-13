'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { GraduationCap, X, Info } from 'lucide-react';
import { ObserverHeader } from './ObserverHeader';
import { ObserverStatCard } from './ObserverStatCard';
import { PendingUnlocksTable } from './PendingUnlocksTable';
import { SuspiciousAlertCard } from './SuspiciousAlertCard';
import { EarningsSidebar } from './EarningsSidebar';
import { ChallengeStatsSidebar } from './ChallengeStatsSidebar';
import { ActiveChallengesSidebar } from './ActiveChallengesSidebar';
import { ObserverStakeSidebar } from './ObserverStakeSidebar';
import {
  useObserverData,
  useObserverDashboard,
  usePendingUnlocks,
  useSuspiciousTransactions,
  useActiveChallenges,
} from '@/hooks/observer';

export function ObserverDashboard() {
  const t = useTranslations('observer.dashboard');
  const [showPracticeBanner, setShowPracticeBanner] = useState(true);

  // Fetch data using hooks (with loading/error states)
  const { data: observerData, isLoading: isLoadingObserver, error: observerError } = useObserverData();
  const { data: dashboardApi, isLoading: isLoadingDashboard, error: dashboardError } = useObserverDashboard();
  const { data: pendingUnlocksApi, isLoading: isLoadingPending, error: pendingError } = usePendingUnlocks();
  const { data: suspiciousApi, isLoading: isLoadingSuspicious, error: suspiciousError } = useSuspiciousTransactions();
  const { data: activeChallengesApi, isLoading: isLoadingChallenges, error: challengesError } = useActiveChallenges();

  const isLoading = isLoadingObserver || isLoadingDashboard || isLoadingPending || isLoadingSuspicious || isLoadingChallenges;
  const hasError = dashboardError || pendingError;

  // Use API data directly (empty arrays when data not yet available)
  const pendingUnlocks = pendingUnlocksApi?.items ?? [];
  const suspiciousTransactions = suspiciousApi ?? [];
  const activeChallenges = activeChallengesApi ?? [];

  // Calculate practice mode from observer data
  const { isInPracticePeriod, daysRemaining } = useMemo(() => {
    if (!observerData?.registrationDate) {
      return { isInPracticePeriod: false, daysRemaining: 0, practiceEndDate: new Date() };
    }
    const now = new Date();
    const registrationDate = new Date(observerData.registrationDate);
    const practiceEndDate = new Date(registrationDate);
    practiceEndDate.setMonth(practiceEndDate.getMonth() + (observerData.practicePeriodMonths ?? 3));

    const isInPractice = now < practiceEndDate;
    const days = Math.ceil((practiceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { isInPracticePeriod: isInPractice, daysRemaining: days, practiceEndDate };
  }, [observerData]);

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

        {/* Practice Mode Banner */}
        {isInPracticePeriod && showPracticeBanner && (
          <div
            className={cn(
              'flex items-center gap-4 mb-6 px-5 py-4',
              'bg-gold/10 border border-gold/50 rounded-xl'
            )}
            role="alert"
            aria-label={t('practiceMode.ariaLabel')}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gold/20 rounded-full flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-gold" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gold">{t('practiceMode.title')}</span>
                <span className="px-2 py-0.5 bg-gold/20 rounded text-xs font-medium text-gold">
                  {t('practiceMode.daysRemaining', { days: daysRemaining })}
                </span>
              </div>
              <p className="text-sm text-foreground-secondary">
                {t('practiceMode.description')}
              </p>
            </div>
            <button
              onClick={() => setShowPracticeBanner(false)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gold/10 rounded-lg transition-colors"
              aria-label={t('practiceMode.dismiss')}
            >
              <X className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <h1 className="text-[32px] font-bold text-foreground tracking-tight">
              {t('pageTitle')}
            </h1>
            {isInPracticePeriod && (
              <span
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5',
                  'bg-gold/15 border border-gold/50 rounded-full',
                  'text-gold text-xs font-semibold'
                )}
              >
                <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
                {t('practiceMode.badge')}
              </span>
            )}
          </div>
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

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 text-foreground-tertiary">{t('loading')}</div>
        )}

        {/* Error State */}
        {!isLoading && hasError && (
          <div className="text-center py-12 text-warning">{t('error')}</div>
        )}

        {/* Stats Grid */}
        {!isLoading && !hasError && (<>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 items-stretch"
          role="region"
          aria-label="Observer statistics"
        >
          <ObserverStatCard
            label={t('stats.pendingUnlocks.label')}
            value={dashboardApi?.pendingUnlocksCount ?? pendingUnlocks.length}
            variant="warning"
            tooltip={t('stats.pendingUnlocks.tooltip')}
            change={t('stats.pendingUnlocks.change', { count: pendingUnlocks.length })}
            href="/observer/pending"
          />
          <ObserverStatCard
            label={t('stats.suspicious.label')}
            value={suspiciousTransactions.length}
            variant="highlight"
            tooltip={t('stats.suspicious.tooltip')}
            changeBadge={suspiciousTransactions.length > 0 ? {
              text: t('stats.suspicious.badge'),
              variant: 'danger',
            } : undefined}
            href="/observer/suspicious"
          />
          <ObserverStatCard
            label={t('stats.activeChallenges.label')}
            value={dashboardApi?.activeChallenges ?? activeChallenges.length}
            variant="default"
            tooltip={t('stats.activeChallenges.tooltip')}
            href="/observer/history"
          />
          <ObserverStatCard
            label={t('stats.totalEarnings.label')}
            value={dashboardApi?.totalEarnings ?? '0'}
            unit="ETH"
            variant="success"
            tooltip={t('stats.totalEarnings.tooltip')}
            change={dashboardApi?.unclaimedEarnings ? t('stats.totalEarnings.change', { amount: `${dashboardApi.unclaimedEarnings} ETH` }) : undefined}
            href="/observer/earnings"
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Tables */}
          <div className="space-y-8">
            <PendingUnlocksTable unlocks={pendingUnlocks} />
            <SuspiciousAlertCard transactions={suspiciousTransactions} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-4">
            <EarningsSidebar claimableAmount={dashboardApi?.unclaimedEarnings ? `${dashboardApi.unclaimedEarnings} ETH` : '0 ETH'} />
            <ChallengeStatsSidebar
              successful={dashboardApi?.successfulChallenges ?? 0}
              failed={(dashboardApi?.totalChallenges ?? 0) - (dashboardApi?.successfulChallenges ?? 0)}
            />
            <ActiveChallengesSidebar challenges={activeChallenges} />
            <ObserverStakeSidebar
              stakeAmount={observerData?.stakeAmount ?? '0 ETH'}
              activeSince={observerData?.registrationDate ?? '-'}
            />
          </div>
        </div>
        </>)}
      </main>
    </div>
  );
}
