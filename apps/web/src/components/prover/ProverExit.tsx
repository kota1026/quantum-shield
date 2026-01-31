'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  FileText,
  Hourglass,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ProverSidebar } from './ProverSidebar';

// Mock data
const mockExitData = {
  currentStake: 400000,
  tokens: 80000,
  unclaimedRewards: 12340,
  unlockDate: '2026/09/20',
  daysRemaining: 183,
  penaltyRate: 5,
  penaltyAmount: 20000,
  returnAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f8bD34',
};

const mockCompletedExit = {
  proverId: 'PRV-2026-001234',
  activityDays: 87,
  stakeReturned: 380000,
  totalRewards: 47520,
  signaturesProcessed: 12847,
  exitRequestDate: '2026/01/17',
  queueCompleteDate: '2026/01/18',
  coolingEndDate: '2026/01/24',
};

// Exit process stages following timeline:
// 1. request - Exit申請
// 2. queueProcessing - キュー完了待ち（〜24時間）
// 3. coolingPeriod - クーリング期間（7日間）
// 4. complete - ステーク返還完了
type StageType = 'request' | 'queueProcessing' | 'coolingPeriod' | 'complete';

export function ProverExit() {
  const t = useTranslations('prover');
  const [currentStage, setCurrentStage] = useState<StageType>('request');
  const [exitReason, setExitReason] = useState('');
  const [comment, setComment] = useState('');
  const [confirmations, setConfirmations] = useState({
    penalty: false,
    activityEnd: false,
    coolingPeriod: false,
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleSubmitExit = () => {
    if (allConfirmed && exitReason) {
      setCurrentStage('queueProcessing');
    }
  };

  // Timeline steps with current progress
  const getTimelineSteps = () => {
    const stageIndex = {
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
        date: currentIndex >= 0 ? mockCompletedExit.exitRequestDate : t('exit.timeline.today'),
        icon: FileText,
        status: currentIndex > 0 ? 'completed' : currentIndex === 0 ? 'current' : 'pending'
      },
      {
        key: 'queueComplete',
        label: t('exit.timeline.steps.queueComplete'),
        date: currentIndex >= 1 ? mockCompletedExit.queueCompleteDate : t('exit.timeline.within24h'),
        icon: Clock,
        status: currentIndex > 1 ? 'completed' : currentIndex === 1 ? 'current' : 'pending'
      },
      {
        key: 'coolingPeriod',
        label: t('exit.timeline.steps.coolingPeriod'),
        date: currentIndex >= 2 ? `${t('exit.timeline.days7')}` : t('exit.timeline.days7'),
        icon: Hourglass,
        status: currentIndex > 2 ? 'completed' : currentIndex === 2 ? 'current' : 'pending'
      },
      {
        key: 'stakeReturn',
        label: t('exit.timeline.steps.stakeReturn'),
        date: mockCompletedExit.coolingEndDate,
        icon: Wallet,
        status: currentIndex === 3 ? 'completed' : 'pending'
      },
    ];
  };

  const timelineSteps = getTimelineSteps();

  // Progress Timeline Component (shown on all stages except request)
  const ProgressTimeline = () => (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-6">{t('exit.timeline.title')}</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-surface-tertiary" />

        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Icon circle */}
                <div className={cn(
                  'relative z-10 w-10 h-10 rounded-full flex items-center justify-center',
                  isCompleted ? 'bg-success' : isCurrent ? 'bg-gold' : 'bg-background-secondary border-2 border-surface-tertiary'
                )}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={cn('w-5 h-5', isCurrent ? 'text-white' : 'text-foreground-tertiary')} />
                  )}
                </div>

                {/* Content */}
                <div className={cn('flex-1 pt-1', !isCompleted && !isCurrent && 'opacity-50')}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{step.label}</div>
                    <div className={cn(
                      'text-sm',
                      isCompleted ? 'text-success' : isCurrent ? 'text-gold' : 'text-foreground-tertiary'
                    )}>
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
              'opacity-50'
            )}
          />
        </div>

        <div className="relative z-10 max-w-4xl">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{t('exit.title')}</h1>
            <p className="text-foreground-secondary">{t('exit.description')}</p>
          </div>

          {/* Stage 1: Request */}
          {currentStage === 'request' && (
            <>
              {/* Warning Banner */}
              <Card className="p-5 mb-6 border-warning bg-gradient-to-br from-warning/20 to-transparent">
                <h3 className="font-semibold text-warning mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                  {t('exit.warning.title')}
                </h3>
                <ul className="list-disc list-inside text-sm text-foreground-secondary space-y-2">
                  <li><strong>{t('exit.warning.lockPeriod')}:</strong> {t('exit.warning.lockPeriodDesc')}</li>
                  <li><strong>{t('exit.warning.pendingRequests')}:</strong> {t('exit.warning.pendingRequestsDesc')}</li>
                  <li><strong>{t('exit.warning.unresolvedChallenges')}:</strong> {t('exit.warning.unresolvedChallengesDesc')}</li>
                  <li><strong>{t('exit.warning.rewards')}:</strong> {t('exit.warning.rewardsDesc')}</li>
                </ul>
              </Card>

              {/* Exit Summary */}
              <Card className="p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">{t('exit.summary.title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-5 bg-background rounded-xl">
                    <div className="text-xs text-foreground-tertiary mb-2">{t('exit.summary.currentStake')}</div>
                    <div className="text-2xl font-bold font-mono text-gold">${mockExitData.currentStake.toLocaleString()}</div>
                    <div className="text-xs text-foreground-tertiary mt-1">QST {mockExitData.tokens.toLocaleString()}</div>
                  </div>
                  <div className="p-5 bg-background rounded-xl">
                    <div className="text-xs text-foreground-tertiary mb-2">{t('exit.summary.unclaimedRewards')}</div>
                    <div className="text-2xl font-bold font-mono text-success">${mockExitData.unclaimedRewards.toLocaleString()}</div>
                    <div className="text-xs text-foreground-tertiary mt-1">{t('exit.summary.autoTransfer')}</div>
                  </div>
                  <div className="p-5 bg-background rounded-xl">
                    <div className="text-xs text-foreground-tertiary mb-2">{t('exit.summary.unlockDate')}</div>
                    <div className="text-2xl font-bold font-mono">{mockExitData.unlockDate}</div>
                    <div className="text-xs text-foreground-tertiary mt-1">{t('exit.summary.daysRemaining', { days: mockExitData.daysRemaining })}</div>
                  </div>
                </div>

                {/* Timeline Preview */}
                <div className="p-5 bg-background rounded-xl">
                  <h4 className="font-semibold mb-4">{t('exit.timeline.title')}</h4>
                  <div className="relative flex justify-between">
                    <div className="absolute top-5 left-10 right-10 h-0.5 bg-surface-tertiary" />
                    {timelineSteps.map((step, index) => (
                      <div key={step.key} className="relative flex flex-col items-center text-center z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                          index === 0 ? 'bg-hinomaru text-white' : 'bg-background-secondary border-2 border-surface-tertiary'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="text-xs text-foreground-tertiary mt-2">{step.label}</div>
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
                <p className="text-sm text-foreground-secondary mb-4">{t('exit.penalty.description')}</p>
                <div className="flex justify-between items-center p-4 bg-background rounded-lg">
                  <div>
                    <div className="text-xs text-foreground-tertiary">{t('exit.penalty.rate')}: {mockExitData.penaltyRate}%</div>
                    <div className="text-sm">${mockExitData.currentStake.toLocaleString()} × {mockExitData.penaltyRate}% =</div>
                  </div>
                  <div className="text-2xl font-bold text-danger">-${mockExitData.penaltyAmount.toLocaleString()}</div>
                </div>
              </Card>

              {/* Exit Form */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">{t('exit.form.title')}</h3>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="exit-reason" className="block font-semibold mb-2">{t('exit.form.reasonLabel')}</label>
                    <select
                      id="exit-reason"
                      value={exitReason}
                      onChange={(e) => setExitReason(e.target.value)}
                      className="w-full p-3 bg-background border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-hinomaru"
                    >
                      <option value="">{t('exit.form.selectReason')}</option>
                      <option value="business">{t('exit.form.reasons.business')}</option>
                      <option value="resource">{t('exit.form.reasons.resource')}</option>
                      <option value="market">{t('exit.form.reasons.market')}</option>
                      <option value="personal">{t('exit.form.reasons.personal')}</option>
                      <option value="other">{t('exit.form.reasons.other')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="exit-comment" className="block font-semibold mb-2">{t('exit.form.commentLabel')}</label>
                    <textarea
                      id="exit-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('exit.form.commentPlaceholder')}
                      className="w-full p-3 bg-background border border-surface-tertiary rounded-lg resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-hinomaru"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-2">{t('exit.form.returnAddressLabel')}</label>
                    <div className="flex items-center gap-4 p-3 bg-background rounded-lg">
                      <code className="flex-1 text-sm">{mockExitData.returnAddress}</code>
                      <span className="text-success flex items-center gap-1 text-sm">
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        {t('exit.form.verified')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer min-h-[44px]">
                      <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 mr-0">
                        <input
                          type="checkbox"
                          checked={confirmations.penalty}
                          onChange={(e) => setConfirmations({ ...confirmations, penalty: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </span>
                      <span className="text-sm text-foreground-secondary">
                        {t('exit.form.confirm.penalty', { amount: mockExitData.penaltyAmount.toLocaleString() })}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer min-h-[44px]">
                      <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 mr-0">
                        <input
                          type="checkbox"
                          checked={confirmations.activityEnd}
                          onChange={(e) => setConfirmations({ ...confirmations, activityEnd: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </span>
                      <span className="text-sm text-foreground-secondary">{t('exit.form.confirm.activityEnd')}</span>
                    </label>

                    <label className="flex items-start gap-3 p-4 bg-background rounded-lg cursor-pointer min-h-[44px]">
                      <span className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 mr-0">
                        <input
                          type="checkbox"
                          checked={confirmations.coolingPeriod}
                          onChange={(e) => setConfirmations({ ...confirmations, coolingPeriod: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </span>
                      <span className="text-sm text-foreground-secondary">{t('exit.form.confirm.coolingPeriod')}</span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      disabled={!allConfirmed || !exitReason}
                      aria-disabled={!allConfirmed || !exitReason}
                      onClick={handleSubmitExit}
                    >
                      {t('exit.form.submitButton')}
                    </Button>
                    <Link href="/prover/dashboard">
                      <Button variant="outline">{t('exit.form.cancelButton')}</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Stage 2: Queue Processing (〜24時間) */}
          {currentStage === 'queueProcessing' && (
            <>
              <ProgressTimeline />

              <Card className="p-8">
                <div className="flex items-start gap-6">
                  {/* Animated Icon */}
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-8 h-8 text-gold animate-pulse" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{t('exit.stages.queueProcessing.title')}</h2>
                    <p className="text-foreground-secondary mb-6">{t('exit.stages.queueProcessing.description')}</p>

                    <div className="space-y-4">
                      <div className="p-4 bg-background rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-foreground-tertiary">{t('exit.stages.queueProcessing.pendingSignatures')}</span>
                          <span className="font-semibold">3 {t('exit.stages.queueProcessing.remaining')}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full w-3/4 animate-pulse" />
                        </div>
                      </div>

                      <div className="p-4 bg-background rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-foreground-tertiary">{t('exit.stages.queueProcessing.estimatedTime')}</span>
                          <span className="font-semibold text-gold">{t('exit.stages.queueProcessing.within24h')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Demo button to proceed */}
                    <div className="mt-6 pt-6 border-t border-surface-tertiary">
                      <p className="text-xs text-foreground-tertiary mb-3">{t('exit.stages.demoNote')}</p>
                      <Button variant="outline" size="sm" onClick={() => setCurrentStage('coolingPeriod')}>
                        {t('exit.stages.demoNext')} →
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Stage 3: Cooling Period (7日間) */}
          {currentStage === 'coolingPeriod' && (
            <>
              <ProgressTimeline />

              <Card className="p-8">
                <div className="flex items-start gap-6">
                  {/* Animated Icon */}
                  <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Hourglass className="w-8 h-8 text-gold animate-pulse" />
                  </div>

                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">{t('exit.stages.coolingPeriod.title')}</h2>
                    <p className="text-foreground-secondary mb-6">{t('exit.stages.coolingPeriod.description')}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 bg-background rounded-lg">
                        <div className="text-xs text-foreground-tertiary mb-1">{t('exit.stages.coolingPeriod.startDate')}</div>
                        <div className="font-semibold">{mockCompletedExit.queueCompleteDate}</div>
                      </div>
                      <div className="p-4 bg-background rounded-lg">
                        <div className="text-xs text-foreground-tertiary mb-1">{t('exit.stages.coolingPeriod.endDate')}</div>
                        <div className="font-semibold text-gold">{mockCompletedExit.coolingEndDate}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-background rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-foreground-tertiary">{t('exit.stages.coolingPeriod.progress')}</span>
                        <span className="font-semibold">3 / 7 {t('exit.stages.coolingPeriod.days')}</span>
                      </div>
                      <div className="w-full h-2 bg-surface-tertiary rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: '43%' }} />
                      </div>
                    </div>

                    <div className="mt-6 p-4 border border-gold/30 bg-gold/5 rounded-lg">
                      <p className="text-sm text-foreground-secondary">
                        {t('exit.stages.coolingPeriod.notice')}
                      </p>
                    </div>

                    {/* Demo button to proceed */}
                    <div className="mt-6 pt-6 border-t border-surface-tertiary">
                      <p className="text-xs text-foreground-tertiary mb-3">{t('exit.stages.demoNote')}</p>
                      <Button variant="outline" size="sm" onClick={() => setCurrentStage('complete')}>
                        {t('exit.stages.demoNext')} →
                      </Button>
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
                  <CheckCircle className="h-12 w-12 text-white" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('exit.complete.title')}</h2>
                <p className="text-foreground-secondary mb-8">{t('exit.complete.description')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.proverId')}</div>
                    <div className="font-mono font-semibold">{mockCompletedExit.proverId}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.activityPeriod')}</div>
                    <div className="font-semibold">{t('exit.complete.days', { count: mockCompletedExit.activityDays })}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.status')}</div>
                    <div className="font-semibold text-success">{t('exit.complete.statusComplete')}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.stakeReturned')}</div>
                    <div className="font-semibold font-mono text-gold">${mockCompletedExit.stakeReturned.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.totalRewards')}</div>
                    <div className="font-semibold font-mono text-gold">${mockCompletedExit.totalRewards.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-background rounded-lg text-left">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('exit.complete.signaturesProcessed')}</div>
                    <div className="font-semibold">{mockCompletedExit.signaturesProcessed.toLocaleString()}{t('exit.complete.count')}</div>
                  </div>
                </div>

                <Link href="/prover/landing">
                  <Button variant="primary">{t('exit.complete.backToHome')}</Button>
                </Link>
              </Card>

              {/* Thank You Message */}
              <Card className="p-6 mt-6 text-center border-gold bg-gradient-to-br from-gold/10 to-transparent">
                <h3 className="text-lg font-semibold text-gold mb-2">{t('exit.thankYou.title')}</h3>
                <p className="text-foreground-secondary">{t('exit.thankYou.description')}</p>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
