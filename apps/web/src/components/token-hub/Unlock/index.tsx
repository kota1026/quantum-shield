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
  Info,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

// Demo locked positions - In production, this would come from API/blockchain
const DEMO_LOCKED_POSITIONS = [
  {
    id: '1',
    lockedAmount: 5000,
    veQSAmount: 2500,
    lockDate: new Date('2025-01-15'),
    unlockDate: new Date('2027-01-15'),
    durationMonths: 24,
    multiplier: 0.5,
  },
  {
    id: '2',
    lockedAmount: 3000,
    veQSAmount: 750,
    lockDate: new Date('2025-06-01'),
    unlockDate: new Date('2026-01-01'),
    durationMonths: 6,
    multiplier: 0.125,
  },
  {
    id: '3',
    lockedAmount: 2000,
    veQSAmount: 500,
    lockDate: new Date('2024-06-16'),
    unlockDate: new Date('2025-12-16'),
    durationMonths: 18,
    multiplier: 0.375,
  },
];

// Calculate time remaining from now to unlock date
function calculateTimeRemaining(unlockDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  isUnlockable: boolean;
  totalDays: number;
} {
  const now = new Date();
  const diff = unlockDate.getTime() - now.getTime();
  const isUnlockable = diff <= 0;

  if (isUnlockable) {
    return { days: 0, hours: 0, minutes: 0, isUnlockable: true, totalDays: 0 };
  }

  const totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isUnlockable: false, totalDays };
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
function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface UnlockTooltipProps {
  id: string;
}

function UnlockTooltip({ id }: UnlockTooltipProps) {
  const t = useTranslations('token-hub.unlock');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className={cn(
          'flex items-center gap-1 text-xs text-gold',
          'hover:text-gold-400 transition-colors',
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded'
        )}
        aria-label={t('tooltip.ariaLabel')}
        aria-expanded={isOpen}
        aria-controls={`tooltip-${id}`}
      >
        <Info className="w-4 h-4" aria-hidden="true" />
        <span>{t('tooltip.label')}</span>
      </button>

      {isOpen && (
        <div
          id={`tooltip-${id}`}
          role="tooltip"
          className={cn(
            'absolute z-50 bottom-full left-0 mb-2',
            'w-72 p-4 rounded-xl',
            'bg-background-elevated border border-gold/30',
            'shadow-lg shadow-black/20'
          )}
        >
          <h4 className="font-semibold text-sm text-foreground mb-2">
            {t('tooltip.title')}
          </h4>
          <p className="text-xs text-foreground-secondary leading-relaxed mb-3">
            {t('tooltip.description')}
          </p>
          <div className="p-3 bg-background-secondary rounded-lg">
            <p className="text-xs text-gold leading-relaxed">
              {t('tooltip.note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function TokenHubUnlock() {
  const t = useTranslations('token-hub.unlock');
  const tCommon = useTranslations('token-hub.common');

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
    // For demo, just simulate a delay
    setTimeout(() => {
      setIsWithdrawing(false);
      setSelectedPosition(null);
      // Would update state/refetch data here
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Gold Glow */}
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
        className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Header */}
        <TokenHubHeader />

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
              <Unlock className="w-5 h-5 text-gold" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('title')}
              </h1>
              <p className="text-sm text-foreground-secondary">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <section
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">
              {t('stats.totalLocked')}
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              {totals.totalLocked.toLocaleString()}
              <span className="text-sm text-foreground-secondary ml-1">QS</span>
            </div>
          </Card>
          <Card className="p-4 group relative">
            <div className="text-xs text-foreground-tertiary mb-1 flex items-center gap-1">
              {t('stats.currentVeQS')}
              <Info
                className="w-3 h-3 text-foreground-tertiary cursor-help"
                aria-hidden="true"
              />
            </div>
            <div className="text-xl font-bold font-mono text-gold">
              {totals.totalVeQS.toLocaleString()}
              <span className="text-sm text-gold/70 ml-1">veQS</span>
            </div>
            {/* Tooltip for beginners */}
            <div
              className={cn(
                'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
                'w-64 p-3 rounded-lg',
                'bg-background-elevated border border-border shadow-lg',
                'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                'transition-all duration-200 pointer-events-none'
              )}
              role="tooltip"
            >
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {t('stats.veqsTooltip')}
              </p>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-foreground-tertiary mb-1">
              {t('stats.positions')}
            </div>
            <div className="text-xl font-bold text-foreground">
              {DEMO_LOCKED_POSITIONS.length}
            </div>
          </Card>
          <Card
            className={cn(
              'p-4',
              totals.unlockableCount > 0 && 'border-success/50 bg-success/5'
            )}
          >
            <div className="text-xs text-foreground-tertiary mb-1">
              {t('stats.unlockable')}
            </div>
            <div
              className={cn(
                'text-xl font-bold font-mono',
                totals.unlockableCount > 0 ? 'text-success' : 'text-foreground'
              )}
            >
              {totals.unlockableAmount.toLocaleString()}
              <span className="text-sm opacity-70 ml-1">QS</span>
            </div>
          </Card>
        </section>

        {/* Info Notice */}
        <div
          className="flex items-start gap-3 p-4 mb-6 bg-background-secondary border border-border rounded-xl"
          role="note"
        >
          <AlertTriangle
            className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm text-foreground-secondary">
              {t('notice.noEarlyUnlock')}
            </p>
            <Link
              href="/token-hub/faq"
              className="inline-flex items-center gap-1 text-xs text-gold hover:underline mt-2 focus-visible:ring-2 focus-visible:ring-gold rounded"
            >
              {t('notice.faqLink')}
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Locked Positions List */}
        <section aria-labelledby="positions-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="positions-heading" className="text-lg font-semibold">
              {t('positions.title')}
            </h2>
            <UnlockTooltip id="main" />
          </div>

          <div className="space-y-4" role="list" aria-label={t('positions.listAriaLabel')}>
            {DEMO_LOCKED_POSITIONS.map((position) => {
              const timeRemaining = calculateTimeRemaining(position.unlockDate);
              const currentVeQS = calculateCurrentVeQS(
                position.veQSAmount,
                position.lockDate,
                position.unlockDate
              );
              const isSelected = selectedPosition === position.id;

              return (
                <Card
                  key={position.id}
                  className={cn(
                    'p-5 transition-all duration-200',
                    timeRemaining.isUnlockable &&
                      'border-success/50 hover:border-success',
                    !timeRemaining.isUnlockable &&
                      'hover:border-gold/30'
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
                            timeRemaining.isUnlockable
                              ? 'bg-success/10'
                              : 'bg-gold/10'
                          )}
                        >
                          {timeRemaining.isUnlockable ? (
                            <CheckCircle2
                              className="w-5 h-5 text-success"
                              aria-hidden="true"
                            />
                          ) : (
                            <Lock
                              className="w-5 h-5 text-gold"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {position.lockedAmount.toLocaleString()} QS
                          </div>
                          <div
                            className={cn(
                              'text-xs font-medium',
                              timeRemaining.isUnlockable
                                ? 'text-success'
                                : 'text-foreground-tertiary'
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
                          <div className="text-foreground-tertiary text-xs mb-1">
                            {t('positions.veqs')}
                          </div>
                          <div className="font-mono text-gold">
                            {currentVeQS.toLocaleString()} veQS
                          </div>
                        </div>
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" aria-hidden="true" />
                            {t('positions.lockDate')}
                          </div>
                          <div className="font-mono text-foreground-secondary">
                            {formatDate(position.lockDate, 'ja')}
                          </div>
                        </div>
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1 flex items-center gap-1">
                            <Unlock className="w-3 h-3" aria-hidden="true" />
                            {t('positions.unlockDate')}
                          </div>
                          <div className="font-mono text-foreground-secondary">
                            {formatDate(position.unlockDate, 'ja')}
                          </div>
                        </div>
                        <div>
                          <div className="text-foreground-tertiary text-xs mb-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            {t('positions.remaining')}
                          </div>
                          <div
                            className={cn(
                              'font-mono',
                              timeRemaining.isUnlockable
                                ? 'text-success'
                                : 'text-foreground'
                            )}
                          >
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
                        <button
                          type="button"
                          onClick={() => handleWithdraw(position.id)}
                          disabled={isWithdrawing}
                          className={cn(
                            'w-full sm:w-auto px-6 py-3 rounded-xl',
                            'bg-gradient-to-r from-success to-success/80 text-white',
                            'font-semibold text-sm',
                            'transition-all duration-200',
                            'hover:shadow-[0_4px_16px_rgba(0,200,150,0.4)]',
                            'focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'flex items-center justify-center gap-2'
                          )}
                          aria-label={t('positions.withdrawAriaLabel', {
                            amount: position.lockedAmount,
                          })}
                        >
                          {isSelected && isWithdrawing ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              {t('positions.withdrawing')}
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" aria-hidden="true" />
                              {t('positions.withdraw')}
                            </>
                          )}
                        </button>
                      ) : (
                        <div
                          className={cn(
                            'px-6 py-3 rounded-xl',
                            'bg-background-tertiary text-foreground-tertiary',
                            'font-medium text-sm text-center',
                            'flex items-center justify-center gap-2'
                          )}
                          aria-label={t('positions.lockedAriaLabel')}
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
                        <span>
                          {Math.round(
                            ((position.durationMonths * 30 -
                              timeRemaining.totalDays) /
                              (position.durationMonths * 30)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              ((position.durationMonths * 30 -
                                timeRemaining.totalDays) /
                                (position.durationMonths * 30)) *
                                100
                            )}%`,
                          }}
                          role="progressbar"
                          aria-valuenow={Math.round(
                            ((position.durationMonths * 30 -
                              timeRemaining.totalDays) /
                              (position.durationMonths * 30)) *
                              100
                          )}
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

        {/* Empty State */}
        {DEMO_LOCKED_POSITIONS.length === 0 && (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gold/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-gold" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('empty.title')}</h3>
            <p className="text-sm text-foreground-secondary mb-6">
              {t('empty.description')}
            </p>
            <Link
              href="/token-hub/lock"
              className={cn(
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                'bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white',
                'font-semibold text-sm',
                'transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(188,0,45,0.4)]',
                'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              {t('empty.lockButton')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </Card>
        )}

        {/* CTA Section */}
        <section className="mt-8">
          <Card className="p-6 bg-gradient-to-br from-background-secondary to-gold/5 border-gold/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{t('cta.title')}</h3>
                <p className="text-sm text-foreground-secondary">
                  {t('cta.description')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/token-hub/lock"
                  className={cn(
                    'px-5 py-2.5 rounded-lg',
                    'bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white',
                    'font-medium text-sm text-center',
                    'transition-all duration-200',
                    'hover:shadow-[0_4px_16px_rgba(188,0,45,0.4)]',
                    'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  {t('cta.lockMore')}
                </Link>
                <Link
                  href="/token-hub/dashboard"
                  className={cn(
                    'px-5 py-2.5 rounded-lg',
                    'border border-gold text-gold',
                    'font-medium text-sm text-center',
                    'transition-all duration-200',
                    'hover:bg-gold/10',
                    'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                  )}
                >
                  {t('cta.viewDashboard')}
                </Link>
              </div>
            </div>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <nav
            className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4"
            aria-label={tCommon('footer.navLabel')}
          >
            <Link
              href="/consumer/terms"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.privacy')}
            </Link>
            <Link
              href="/token-hub/faq"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.security')}
            </Link>
          </nav>
          <p className="text-xs text-foreground-tertiary text-center max-w-lg mx-auto leading-relaxed">
            {tCommon('footer.disclaimer')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default TokenHubUnlock;
