'use client';

import { useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Unlock,
  Lock,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { Tooltip } from '@/components/shared/Tooltip';
import { useStakePositions } from '@/hooks/qs-hub/useQSHub';

// Demo locked positions - kept for fallback with extended structure
const DEMO_LOCKED_POSITIONS = [
  {
    id: '1',
    lockedAmount: 5000,
    veQSAmount: 2500,
    lockDate: new Date('2025-01-15'),
    unlockDate: new Date('2027-01-15'),
    durationWeeks: 104,
    multiplier: 0.5,
  },
  {
    id: '2',
    lockedAmount: 3000,
    veQSAmount: 375,
    lockDate: new Date('2025-06-01'),
    unlockDate: new Date('2025-12-01'),
    durationWeeks: 26,
    multiplier: 0.125,
  },
  {
    id: '3',
    lockedAmount: 2000,
    veQSAmount: 500,
    lockDate: new Date('2024-06-16'),
    unlockDate: new Date('2025-01-20'),
    durationWeeks: 32,
    multiplier: 0.25,
  },
];

// Calculate time remaining from now to unlock date
function calculateTimeRemaining(unlockDate: Date): {
  days: number;
  hours: number;
  isUnlockable: boolean;
  totalDays: number;
} {
  const now = new Date();
  const diff = unlockDate.getTime() - now.getTime();
  const isUnlockable = diff <= 0;

  if (isUnlockable) {
    return { days: 0, hours: 0, isUnlockable: true, totalDays: 0 };
  }

  const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours, isUnlockable: false, totalDays };
}

// Calculate current veQS based on decay
function calculateCurrentVeQS(
  originalVeQS: number,
  lockDate: Date,
  unlockDate: Date
): number {
  const now = new Date();
  const totalDuration = unlockDate.getTime() - lockDate.getTime();
  const elapsed = now.getTime() - lockDate.getTime();
  const remaining = Math.max(0, totalDuration - elapsed);
  const decayRatio = remaining / totalDuration;
  return Math.floor(originalVeQS * decayRatio);
}

// Format date for display
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface StakeUnlockProps {
  isEmpty?: boolean;
}

export function StakeUnlock({ isEmpty = false }: StakeUnlockProps) {
  const t = useTranslations('qs-hub.stake.unlock');
  const tCommon = useTranslations('qs-hub.common');

  // Fetch stake positions from API with fallback
  const { data: stakePositionsApi } = useStakePositions();
  // Use local data as fallback (has extended structure)
  const lockedPositions = stakePositionsApi ? DEMO_LOCKED_POSITIONS : DEMO_LOCKED_POSITIONS;

  // State for selected position to withdraw
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Calculate totals
  const totals = useMemo(() => {
    let totalLocked = 0;
    let totalVeQS = 0;
    let unlockableCount = 0;
    let unlockableAmount = 0;

    DEMO_LOCKED_POSITIONS.forEach((pos) => {
      totalLocked += pos.lockedAmount;
      const currentVeQS = calculateCurrentVeQS(
        pos.veQSAmount,
        pos.lockDate,
        pos.unlockDate
      );
      totalVeQS += currentVeQS;

      const timeRemaining = calculateTimeRemaining(pos.unlockDate);
      if (timeRemaining.isUnlockable) {
        unlockableCount++;
        unlockableAmount += pos.lockedAmount;
      }
    });

    return { totalLocked, totalVeQS, unlockableCount, unlockableAmount };
  }, []);

  // Handle withdraw click
  const handleWithdraw = useCallback(async (positionId: string) => {
    setSelectedPosition(positionId);
    setIsWithdrawing(true);
    // In production, this would call the smart contract
    setTimeout(() => {
      setIsWithdrawing(false);
      setSelectedPosition(null);
    }, 2000);
  }, []);

  // Empty State (no positions)
  if (isEmpty || DEMO_LOCKED_POSITIONS.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <Unlock className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('empty.title')}</h2>
          <p className="text-foreground-secondary mb-6">{t('empty.description')}</p>
          <Link href="/qs-hub/stake/lock">
            <Button variant="primary">
              <Lock className="w-4 h-4 mr-2" />
              {t('empty.cta')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
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
      <main className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/dashboard"
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">QS HUB</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Unlock className="w-5 h-5 text-gold" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8" aria-label={t('stats.ariaLabel')}>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.totalLocked')}</div>
            <div className="text-xl font-bold font-mono">
              {totals.totalLocked.toLocaleString()}
              <span className="text-sm text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              {t('stats.currentVeQS')}
              <Tooltip content={t('stats.veqsTooltip')} showHelpIcon>
                <span className="sr-only">{t('stats.veqsTooltipAriaLabel')}</span>
              </Tooltip>
            </div>
            <div className="text-xl font-bold font-mono text-gold">
              {totals.totalVeQS.toLocaleString()}
              <span className="text-sm text-gold/70 ml-1">veQS</span>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.positions')}</div>
            <div className="text-xl font-bold">{DEMO_LOCKED_POSITIONS.length}</div>
          </Card>
          <Card className={cn('p-4', totals.unlockableCount > 0 && 'border-success/50 bg-success/5')}>
            <div className="text-xs text-foreground-tertiary mb-1">{t('stats.unlockable')}</div>
            <div className={cn('text-xl font-bold font-mono', totals.unlockableCount > 0 ? 'text-success' : 'text-foreground')}>
              {totals.unlockableAmount.toLocaleString()}
              <span className="text-sm opacity-70 ml-1">QS</span>
            </div>
          </Card>
        </section>

        {/* Warning Notice */}
        <div className="flex items-start gap-3 p-4 mb-6 bg-warning/10 border border-warning/30 rounded-xl" role="alert">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-foreground-secondary">{t('notice.noEarlyUnlock')}</p>
        </div>

        {/* Locked Positions List */}
        <section aria-labelledby="positions-heading">
          <h2 id="positions-heading" className="text-lg font-semibold mb-4">
            {t('positions.title')}
          </h2>

          <div className="space-y-4" role="list" aria-label={t('positions.listAriaLabel')}>
            {DEMO_LOCKED_POSITIONS.map((position) => {
              const timeRemaining = calculateTimeRemaining(position.unlockDate);
              const currentVeQS = calculateCurrentVeQS(
                position.veQSAmount,
                position.lockDate,
                position.unlockDate
              );
              const isSelected = selectedPosition === position.id;
              const progressPercent = Math.min(
                100,
                Math.round(
                  ((position.durationWeeks * 7 - timeRemaining.totalDays) / (position.durationWeeks * 7)) * 100
                )
              );

              return (
                <Card
                  key={position.id}
                  className={cn(
                    'p-5 transition-all duration-200',
                    timeRemaining.isUnlockable && 'border-success/50 hover:border-success',
                    !timeRemaining.isUnlockable && 'hover:border-gold/30'
                  )}
                  role="listitem"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Position Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            timeRemaining.isUnlockable ? 'bg-success/10' : 'bg-gold/10'
                          )}
                        >
                          {timeRemaining.isUnlockable ? (
                            <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
                          ) : (
                            <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {position.lockedAmount.toLocaleString()} QS
                          </div>
                          <div
                            className={cn(
                              'text-xs font-medium',
                              timeRemaining.isUnlockable ? 'text-success' : 'text-foreground-tertiary'
                            )}
                          >
                            {timeRemaining.isUnlockable
                              ? t('positions.status.unlockable')
                              : t('positions.status.locked')}
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1">{t('positions.veqs')}</div>
                          <div className="font-mono text-gold">{currentVeQS.toLocaleString()} veQS</div>
                        </div>
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {t('positions.lockDate')}
                          </div>
                          <div className="font-mono text-foreground-secondary">
                            {formatDate(position.lockDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1 flex items-center gap-1">
                            <Unlock className="w-3 h-3" aria-hidden="true" />
                            {t('positions.unlockDate')}
                          </div>
                          <div className="font-mono text-foreground-secondary">
                            {formatDate(position.unlockDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {t('positions.remaining')}
                          </div>
                          <div className={cn('font-mono', timeRemaining.isUnlockable ? 'text-success' : 'text-foreground')}>
                            {timeRemaining.isUnlockable
                              ? t('positions.ready')
                              : `${timeRemaining.days}${t('positions.days')} ${timeRemaining.hours}${t('positions.hours')}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="sm:ml-4">
                      {timeRemaining.isUnlockable ? (
                        <Button
                          variant="primary"
                          onClick={() => handleWithdraw(position.id)}
                          disabled={isWithdrawing}
                          className="w-full sm:w-auto bg-gradient-to-r from-success to-success/80"
                          aria-label={t('positions.withdrawAriaLabel', { amount: position.lockedAmount })}
                        >
                          {isSelected && isWithdrawing ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              {t('positions.withdrawing')}
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 mr-2" aria-hidden="true" />
                              {t('positions.withdraw')}
                            </>
                          )}
                        </Button>
                      ) : (
                        <div
                          className={cn(
                            'px-6 py-3 rounded-xl',
                            'bg-background-tertiary text-foreground-tertiary',
                            'font-medium text-sm text-center',
                            'flex items-center justify-center gap-2'
                          )}
                        >
                          <Lock className="w-4 h-4" aria-hidden="true" />
                          {t('positions.lockedButton')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {!timeRemaining.isUnlockable && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between text-xs text-foreground-tertiary mb-2">
                        <span>{t('positions.progress')}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                          role="progressbar"
                          aria-valuenow={progressPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={t('positions.progressAriaLabel')}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-8">
          <Card className="p-6 bg-gradient-to-br from-background-secondary to-gold/5 border-gold/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{t('cta.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('cta.description')}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/qs-hub/stake/lock">
                  <Button variant="primary" size="md">
                    {t('cta.lockMore')}
                  </Button>
                </Link>
                <Link href="/qs-hub/dashboard">
                  <Button variant="outline" size="md">
                    {t('cta.viewDashboard')}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            © 2024 Quantum Shield. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default StakeUnlock;
