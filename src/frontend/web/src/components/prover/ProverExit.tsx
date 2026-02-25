'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Hourglass,
  Loader2,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ProverSidebar } from './ProverSidebar';
import { useProverId } from '@/stores/proverAuthStore';
import {
  useProverExitStatus,
  useInitiateExit,
  useWithdrawStake,
  useProverStake,
  useSigningQueue,
} from '@/hooks/prover/useProver';

// Penalty rate for early exit (within 180 days)
const EARLY_EXIT_PENALTY_RATE = 5;
// Unbonding period in days
const UNBONDING_DAYS = 7;

function formatTimestamp(ts: number | undefined): string {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatWei(weiStr: string): number {
  const num = Number(weiStr);
  if (isNaN(num)) return 0;
  // Assume wei (18 decimals)
  return num / 1e18;
}

// Derive stage from API exit status
type StageType = 'request' | 'queueProcessing' | 'coolingPeriod' | 'complete';

function deriveStage(
  proverStatus: string | undefined,
  canWithdraw: boolean | undefined,
  unbondingEnd: number | undefined,
  pendingQueueCount: number,
): StageType {
  if (!proverStatus || proverStatus === 'active' || proverStatus === 'Active') {
    return 'request';
  }
  if (proverStatus === 'exited' || proverStatus === 'Exited') {
    return 'complete';
  }
  // Prover is exiting
  if (pendingQueueCount > 0) {
    return 'queueProcessing';
  }
  if (canWithdraw) {
    return 'complete';
  }
  // Unbonding in progress
  return 'coolingPeriod';
}

export function ProverExit() {
  const t = useTranslations('prover');
  const proverId = useProverId();

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [comment, setComment] = useState('');
  const [confirmations, setConfirmations] = useState({
    penalty: false,
    activityEnd: false,
    coolingPeriod: false,
  });

  // API hooks
  const {
    data: exitStatus,
    isLoading: exitStatusLoading,
  } = useProverExitStatus(proverId ?? '');

  const { data: stakeData } = useProverStake(proverId ?? undefined);
  const { data: queueData } = useSigningQueue(proverId ?? '');

  const exitMutation = useInitiateExit(proverId ?? '');
  const withdrawMutation = useWithdrawStake(proverId ?? '');

  const pendingQueueCount = queueData?.pendingCount ?? 0;

  // Derive current stage from backend data
  const currentStage = useMemo(
    () =>
      deriveStage(
        exitStatus?.status,
        exitStatus?.canWithdraw,
        exitStatus?.unbondingEnd,
        pendingQueueCount,
      ),
    [exitStatus, pendingQueueCount],
  );

  // Computed values from API data
  const currentStakeWei = exitStatus?.stakeToReturn ?? '0';
  const currentStakeNum = formatWei(currentStakeWei);
  const pendingRewardsWei = exitStatus?.pendingRewards ?? '0';
  const pendingRewardsNum = formatWei(pendingRewardsWei);
  const penaltyAmount = currentStakeNum * (EARLY_EXIT_PENALTY_RATE / 100);

  // Unbonding progress
  const unbondingEnd = exitStatus?.unbondingEnd;
  const unbondingStart = exitStatus?.unbondingStart;
  const unbondingRemaining = exitStatus?.unbondingRemaining;
  const unbondingDaysElapsed = useMemo(() => {
    if (!unbondingStart || !unbondingEnd) return 0;
    const totalSec = unbondingEnd - unbondingStart;
    const elapsedSec = totalSec - Math.max(unbondingRemaining ?? 0, 0);
    return Math.min(Math.floor(elapsedSec / 86400), UNBONDING_DAYS);
  }, [unbondingStart, unbondingEnd, unbondingRemaining]);
  const unbondingProgress = unbondingDaysElapsed / UNBONDING_DAYS;

  // Wallet address from stake data
  const returnAddress = stakeData ? `${proverId?.slice(0, 10)}...${proverId?.slice(-8)}` : '-';

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleSubmitExit = async () => {
    if (!allConfirmed || !exitReason) return;
    setSubmitAttempted(true);
    try {
      await exitMutation.mutateAsync({
        reason: exitReason,
        comment,
        confirmationSignature: 'user-confirmed',
      });
    } catch {
      // Error is shown via the banner below
    }
  };

  const handleWithdraw = async () => {
    if (!proverId) return;
    setSubmitAttempted(true);
    try {
      await withdrawMutation.mutateAsync({
        destinationAddress: proverId,
        confirmationSignature: 'user-confirmed',
      });
    } catch {
      // Error is shown via the banner below
    }
  };

  // Timeline steps with current progress
  const getTimelineSteps = () => {
    const stageIndex: Record<StageType, number> = {
      request: 0,
      queueProcessing: 1,
      coolingPeriod: 2,
      complete: 3,
    };
    const currentIndex = stageIndex[currentStage];

    return [
      {
        key: 'exitRequest',
        label: t('exit.timeline.steps.exitRequest'),
        date:
          currentIndex >= 1
            ? formatTimestamp(exitStatus?.unbondingStart)
            : t('exit.timeline.today'),
        icon: FileText,
        status:
          currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'pending',
      },
      {
        key: 'queueComplete',
        label: t('exit.timeline.steps.queueComplete'),
        date: currentIndex >= 2 ? formatTimestamp(exitStatus?.unbondingStart) : t('exit.timeline.within24h'),
        icon: Clock,
        status:
          currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'pending',
      },
      {
        key: 'coolingPeriod',
        label: t('exit.timeline.steps.coolingPeriod'),
        date: t('exit.timeline.days7'),
        icon: Hourglass,
        status:
          currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'pending',
      },
      {
        key: 'stakeReturn',
        label: t('exit.timeline.steps.stakeReturn'),
        date: formatTimestamp(exitStatus?.unbondingEnd),
        icon: Wallet,
        status: currentIndex === 3 ? 'completed' : 'pending',
      },
    ];
  };

  const timelineSteps = getTimelineSteps();

  // Progress Timeline Component
  const ProgressTimeline = () => (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-6">{t('exit.timeline.title')}</h3>
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-surface-tertiary" />
        <div className="space-y-6">
          {timelineSteps.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                <div
                  className={cn(
                    'relative z-10 w-10 h-10 rounded-full flex items-center justify-center',
                    isCompleted
                      ? 'bg-success'
                      : isCurrent
                        ? 'bg-gold'
                        : 'bg-background-secondary border-2 border-surface-tertiary',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isCurrent ? 'text-white' : 'text-foreground-tertiary',
                      )}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    'flex-1 pt-1',
                    !isCompleted && !isCurrent && 'opacity-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{step.label}</div>
                    <div
                      className={cn(
                        'text-sm',
                        isCompleted
                          ? 'text-success'
                          : isCurrent
                            ? 'text-gold'
                            : 'text-foreground-tertiary',
                      )}
                    >
                      {step.date}
                    </div>
                  </div>
                  {isCurrent && (
                    <div className="text-sm text-gold mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                      {t('exit.stages.inProgress')}
                    </div>
                  )}
                  {isCompleted && (
                    <div className="text-sm text-success mt-1">
                      {t('exit.stages.completed')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );

  // Loading state — only show spinner when proverId exists and data is loading
  if (proverId && exitStatusLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <ProverSidebar activePage="exit" />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto mb-4" aria-hidden="true" />
            <p className="text-foreground-secondary">{t('exit.loading')}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <ProverSidebar activePage="exit" />

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Premium Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -top-24 left-1/2 -translate-x-1/2',
              'w-[800px] h-[500px]',
              'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
              'opacity-50',
            )}
          />
        </div>

        <div className="relative z-10 max-w-4xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{t('exit.title')}</h1>
            <p className="text-foreground-secondary">{t('exit.description')}</p>
          </div>

          {/* Mutation error banner — only after user clicks submit */}
          {submitAttempted && (exitMutation.isError || withdrawMutation.isError) && (
            <Card className="p-4 mb-6 border-danger bg-danger/10">
              <p className="text-danger text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t('exit.error.submitFailed')}
              </p>
            </Card>
          )}

          {/* Stage 1: Request */}
          {currentStage === 'request' && (
            <>
              {/* Pending challenges warning */}
              {exitStatus?.hasPendingChallenges && (
                <Card className="p-5 mb-6 border-danger bg-gradient-to-br from-danger/20 to-transparent">
                  <h3 className="font-semibold text-danger mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                    {t('exit.blockedByChallenge.title')}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t('exit.blockedByChallenge.description', { count: exitStatus.pendingChallenges })}
                  </p>
                </Card>
              )}

              {/* Warning Banner */}
              <Card className="p-5 mb-6 border-warning bg-gradient-to-br from-warning/20 to-transparent">
                <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  {t('exit.warning.title')}
                </h3>
                <ul className="list-disc list-inside text-sm text-foreground-secondary space-y-2">
                  <li>
                    <strong>{t('exit.warning.lockPeriod')}:</strong>{' '}
                    {t('exit.warning.lockPeriodDesc')}
                  </li>
                  <li>
                    <strong>{t('exit.warning.pendingRequests')}:</strong>{' '}
                    {t('exit.warning.pendingRequestsDesc')}
                  </li>
                  <li>
                    <strong>{t('exit.warning.unresolvedChallenges')}:</strong>{' '}
                    {t('exit.warning.unresolvedChallengesDesc')}
                  </li>
                  <li>
                    <strong>{t('exit.warning.rewards')}:</strong>{' '}
                    {t('exit.warning.rewardsDesc')}
                  </li>
                </ul>
              </Card>

              {/* Exit Summary */}
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('exit.summary.title')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-5 bg-background rounded-xl">
                    <div className="text-xs text-foreground-tertiary mb-2">
                      {t('exit.summary.currentStake')}
                    </div>
                    <div className="text-2xl font-bold font-mono text-gold">
                      {currentStakeNum.toLocaleString()} QST
                    </div>
                  </div>
                  <div className="p-5 bg-background rounded-xl">
                    <div className="text-xs text-foreground-tertiary mb-2">
                      {t('exit.summary.unclaimedRewards')}
                    </div>
                    <div className="text-2xl font-bold font-mono text-success">
                      {pendingRewardsNum.toLocaleString()} QST
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-1">
                      {t('exit.summary.autoTransfer')}
                    </div>
                  </div>
                  <div className="p-5 bg-background rounded-xl">
                    <div className="text-xs text-foreground-tertiary mb-2">
                      {t('exit.summary.unlockDate')}
                    </div>
                    <div className="text-2xl font-bold font-mono">
                      {t('exit.timeline.days7')}
                    </div>
                    <div className="text-xs text-foreground-tertiary mt-1">
                      {t('exit.summary.daysRemaining', { days: UNBONDING_DAYS })}
                    </div>
                  </div>
                </div>

                {/* Timeline Preview */}
                <div className="p-5 bg-background rounded-xl">
                  <h4 className="font-semibold mb-4">
                    {t('exit.timeline.title')}
                  </h4>
                  <div className="relative flex justify-between">
                    <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-tertiary" />
                    {timelineSteps.map((step, index) => (
                      <div
                        key={step.key}
                        className="relative flex flex-col items-center text-center z-10"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0
                              ? 'bg-hinomaru text-white'
                              : 'bg-background-secondary border-2 border-surface-tertiary'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="text-xs text-foreground-tertiary mt-2">
                          {step.label}
                        </div>
                        <div className="text-xs text-gold mt-1">{step.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Early Exit Penalty */}
              <Card className="p-6 mb-6 border-danger bg-gradient-to-br from-danger/20 to-transparent">
                <h4 className="font-semibold text-danger mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  {t('exit.penalty.title')}
                </h4>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('exit.penalty.description')}
                </p>
                <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                  <div>
                    <div className="text-xs text-foreground-tertiary">
                      {t('exit.penalty.rate')}: {EARLY_EXIT_PENALTY_RATE}%
                    </div>
                    <div className="text-sm">
                      {currentStakeNum.toLocaleString()} QST ×{' '}
                      {EARLY_EXIT_PENALTY_RATE}% =
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-danger">
                    -{penaltyAmount.toLocaleString()} QST
                  </div>
                </div>
              </Card>

              {/* Exit Form */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">
                  {t('exit.form.title')}
                </h3>

                <div className="space-y-6">
                  <div>
                    <label
                      htmlFor="exit-reason"
                      className="block font-semibold mb-2"
                    >
                      {t('exit.form.reasonLabel')}
                    </label>
                    <select
                      id="exit-reason"
                      value={exitReason}
                      onChange={(e) => setExitReason(e.target.value)}
                      className="w-full p-3 bg-background border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-hinomaru"
                    >
                      <option value="">{t('exit.form.selectReason')}</option>
                      <option value="business">
                        {t('exit.form.reasons.business')}
                      </option>
                      <option value="resource">
                        {t('exit.form.reasons.resource')}
                      </option>
                      <option value="market">
                        {t('exit.form.reasons.market')}
                      </option>
                      <option value="personal">
                        {t('exit.form.reasons.personal')}
                      </option>
                      <option value="other">
                        {t('exit.form.reasons.other')}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="exit-comment"
                      className="block font-semibold mb-2"
                    >
                      {t('exit.form.commentLabel')}
                    </label>
                    <textarea
                      id="exit-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('exit.form.commentPlaceholder')}
                      className="w-full p-3 bg-background border border-surface-tertiary rounded-lg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-hinomaru"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">
                      {t('exit.form.returnAddressLabel')}
                    </label>
                    <div className="flex items-center gap-4 p-3 bg-background rounded-lg">
                      <code className="flex-1 text-sm">{returnAddress}</code>
                      {proverId && (
                        <span className="text-success flex items-center gap-1 text-sm">
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          {t('exit.form.verified')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer min-h-[44px]">
                      <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 mr-0">
                        <input
                          type="checkbox"
                          checked={confirmations.penalty}
                          onChange={(e) =>
                            setConfirmations({
                              ...confirmations,
                              penalty: e.target.checked,
                            })
                          }
                          className="w-5 h-5"
                        />
                      </span>
                      <span className="text-sm text-foreground-secondary">
                        {t('exit.form.confirm.penalty', {
                          amount: penaltyAmount.toLocaleString(),
                        })}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer min-h-[44px]">
                      <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 mr-0">
                        <input
                          type="checkbox"
                          checked={confirmations.activityEnd}
                          onChange={(e) =>
                            setConfirmations({
                              ...confirmations,
                              activityEnd: e.target.checked,
                            })
                          }
                          className="w-5 h-5"
                        />
                      </span>
                      <span className="text-sm text-foreground-secondary">
                        {t('exit.form.confirm.activityEnd')}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer min-h-[44px]">
                      <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 mr-0">
                        <input
                          type="checkbox"
                          checked={confirmations.coolingPeriod}
                          onChange={(e) =>
                            setConfirmations({
                              ...confirmations,
                              coolingPeriod: e.target.checked,
                            })
                          }
                          className="w-5 h-5"
                        />
                      </span>
                      <span className="text-sm text-foreground-secondary">
                        {t('exit.form.confirm.coolingPeriod')}
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      disabled={
                        !allConfirmed ||
                        !exitReason ||
                        exitMutation.isPending ||
                        !!exitStatus?.hasPendingChallenges
                      }
                      aria-disabled={
                        !allConfirmed ||
                        !exitReason ||
                        exitMutation.isPending ||
                        !!exitStatus?.hasPendingChallenges
                      }
                      onClick={handleSubmitExit}
                    >
                      {exitMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                          {t('exit.form.submitting')}
                        </>
                      ) : (
                        t('exit.form.submitButton')
                      )}
                    </Button>
                    <Link href="/prover/dashboard">
                      <Button variant="outline">
                        {t('exit.form.cancelButton')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Stage 2: Queue Processing */}
          {currentStage === 'queueProcessing' && (
            <>
              <ProgressTimeline />

              <Card className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-8 h-8 text-gold animate-pulse" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      {t('exit.stages.queueProcessing.title')}
                    </h2>
                    <p className="text-foreground-secondary mb-6">
                      {t('exit.stages.queueProcessing.description')}
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 bg-background rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-foreground-tertiary">
                            {t('exit.stages.queueProcessing.pendingSignatures')}
                          </span>
                          <span className="font-semibold">
                            {pendingQueueCount}{' '}
                            {t('exit.stages.queueProcessing.remaining')}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold rounded-full animate-pulse"
                            style={{ width: pendingQueueCount > 0 ? '75%' : '100%' }}
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-background rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground-tertiary">
                            {t('exit.stages.queueProcessing.estimatedTime')}
                          </span>
                          <span className="font-semibold text-gold">
                            {t('exit.stages.queueProcessing.within24h')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Stage 3: Cooling Period */}
          {currentStage === 'coolingPeriod' && (
            <>
              <ProgressTimeline />

              <Card className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Hourglass className="w-8 h-8 text-gold animate-pulse" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      {t('exit.stages.coolingPeriod.title')}
                    </h2>
                    <p className="text-foreground-secondary mb-6">
                      {t('exit.stages.coolingPeriod.description')}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-background rounded-lg">
                        <div className="text-xs text-foreground-tertiary mb-1">
                          {t('exit.stages.coolingPeriod.startDate')}
                        </div>
                        <div className="font-semibold">
                          {formatTimestamp(unbondingStart)}
                        </div>
                      </div>
                      <div className="p-4 bg-background rounded-lg">
                        <div className="text-xs text-foreground-tertiary mb-1">
                          {t('exit.stages.coolingPeriod.endDate')}
                        </div>
                        <div className="font-semibold text-gold">
                          {formatTimestamp(unbondingEnd)}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-background rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground-tertiary">
                          {t('exit.stages.coolingPeriod.progress')}
                        </span>
                        <span className="font-semibold">
                          {unbondingDaysElapsed} / {UNBONDING_DAYS}{' '}
                          {t('exit.stages.coolingPeriod.days')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full"
                          style={{
                            width: `${Math.round(unbondingProgress * 100)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 border border-gold/30 bg-gold/5 rounded-lg">
                      <p className="text-sm text-foreground-secondary">
                        {t('exit.stages.coolingPeriod.notice')}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Stage 4: Complete */}
          {currentStage === 'complete' && (
            <>
              <ProgressTimeline />

              <Card className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-success rounded-full flex items-center justify-center">
                  <CheckCircle
                    className="h-12 w-12 text-white"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {t('exit.complete.title')}
                </h2>
                <p className="text-foreground-secondary mb-8">
                  {t('exit.complete.description')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">
                      {t('exit.complete.proverId')}
                    </div>
                    <div className="font-mono font-semibold">
                      {exitStatus?.proverId
                        ? `${exitStatus.proverId.slice(0, 10)}...`
                        : '-'}
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">
                      {t('exit.complete.status')}
                    </div>
                    <div className="font-semibold text-success">
                      {t('exit.complete.statusComplete')}
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">
                      {t('exit.complete.stakeReturned')}
                    </div>
                    <div className="font-semibold font-mono text-gold">
                      {currentStakeNum.toLocaleString()} QST
                    </div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">
                      {t('exit.complete.totalRewards')}
                    </div>
                    <div className="font-semibold font-mono text-gold">
                      {pendingRewardsNum.toLocaleString()} QST
                    </div>
                  </div>
                </div>

                {/* Withdraw button if can_withdraw but not yet withdrawn */}
                {exitStatus?.canWithdraw &&
                  exitStatus.status !== 'exited' &&
                  exitStatus.status !== 'Exited' && (
                    <Button
                      variant="primary"
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending}
                      className="mb-4"
                    >
                      {withdrawMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                          {t('exit.complete.withdrawing')}
                        </>
                      ) : (
                        t('exit.complete.withdrawButton')
                      )}
                    </Button>
                  )}

                <div>
                  <Link href="/prover/landing">
                    <Button variant="outline">
                      {t('exit.complete.backToHome')}
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Thank You Message */}
              <Card className="p-6 mt-6 text-center border-gold bg-gradient-to-br from-gold/10 to-transparent">
                <h3 className="text-lg font-semibold text-gold mb-2">
                  {t('exit.thankYou.title')}
                </h3>
                <p className="text-foreground-secondary">
                  {t('exit.thankYou.description')}
                </p>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
