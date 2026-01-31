'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Zap, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEmergencyUnlockData, useSubmitEmergencyUnlock } from '@/hooks/consumer';
import { MOCK_EMERGENCY_UNLOCK_DATA } from '@/lib/api/consumer/mock';

// Fallback data
const FALLBACK_UNLOCK_DATA = MOCK_EMERGENCY_UNLOCK_DATA;

// Bond calculation: MAX(0.5 ETH, amount × 5%)
function calculateBond(amount: number): number {
  const minBond = 0.5;
  const percentBond = amount * 0.05;
  return Math.max(minBond, percentBond);
}

export function EmergencyBond() {
  const t = useTranslations('consumer.emergencyBond');
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '';

  // Fetch data using hooks
  const { data: unlockDataApi } = useEmergencyUnlockData(lockId);
  const submitEmergencyMutation = useSubmitEmergencyUnlock();

  // Use API data with fallback
  const unlockData = unlockDataApi ?? FALLBACK_UNLOCK_DATA;

  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = parseFloat(unlockData.amount);
  const bondAmount = calculateBond(amount);
  const percentBond = (amount * 0.05).toFixed(2);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    // Simulate transaction submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    router.push('/consumer/emergency-processing');
  }, [router]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Warning Theme */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[600px] h-[400px]',
            'bg-gradient-radial from-warning/10 to-transparent',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-lg mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/consumer/unlock"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-warning hover:text-warning',
              'transition-all'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Warning Banner */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 mb-6',
            'bg-error/10 border border-error rounded-qs-lg'
          )}
          role="alert"
        >
          <AlertTriangle className="w-6 h-6 text-error flex-shrink-0" />
          <p className="text-sm text-foreground-secondary leading-relaxed">
            <strong className="text-error">{t('warning.title')}</strong>
            {' '}{t('warning.message')}
          </p>
        </div>

        {/* Bond Card */}
        <div
          className={cn(
            'bg-surface border border-border-subtle rounded-qs-xl p-6 mb-6'
          )}
        >
          {/* Card Title */}
          <h2 className="flex items-center gap-2 text-base font-semibold mb-4">
            <Zap className="w-5 h-5 text-warning" aria-hidden="true" />
            <span className="text-warning">{t('bondCard.title')}</span>
          </h2>

          {/* Summary Section */}
          <div className="bg-background rounded-qs-lg p-4 mb-5">
            <div className="flex justify-between py-2.5 border-b border-border-subtle">
              <span className="text-sm text-foreground-tertiary">
                {t('bondCard.unlockAmount')}
              </span>
              <span className="text-xl font-medium text-warning">
                {unlockData.amount} {unlockData.symbol}
              </span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-sm text-foreground-tertiary">
                {t('bondCard.waitTime')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {t('bondCard.waitDays', { days: unlockData.waitDays })}
              </span>
            </div>
          </div>

          {/* Bond Calculation */}
          <div
            className={cn(
              'bg-warning/10 border border-warning rounded-qs-lg p-4 mb-5'
            )}
          >
            <div className="font-mono text-sm text-foreground-secondary mb-2">
              {t('bondCard.formula')}
            </div>
            <div className="font-mono text-sm text-foreground-secondary mb-3">
              = MAX(0.5 ETH, {unlockData.amount} × 5%) = MAX(0.5, {percentBond})
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">
                {t('bondCard.requiredBond')}
              </span>
              <span className="text-2xl font-bold text-warning">
                {bondAmount.toFixed(2)} {unlockData.symbol}
              </span>
            </div>
          </div>

          {/* Info List */}
          <ul className="space-y-2 mb-0">
            <li className="flex items-start gap-2.5 text-sm text-foreground-secondary">
              <Check className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span dangerouslySetInnerHTML={{ __html: t.raw('bondCard.info1') }} />
            </li>
            <li className="flex items-start gap-2.5 text-sm text-foreground-secondary">
              <Check className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{t('bondCard.info2')}</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-foreground-secondary">
              <Check className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{t('bondCard.info3')}</span>
            </li>
          </ul>
        </div>

        {/* Confirmation Checkbox */}
        <label
          className={cn(
            'flex items-center gap-3 p-4 mb-6',
            'bg-surface rounded-qs-lg cursor-pointer',
            'transition-colors hover:bg-surface/80'
          )}
        >
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className={cn(
              'w-5 h-5 rounded',
              'accent-warning',
              'focus:ring-2 focus:ring-warning focus:ring-offset-2 focus:ring-offset-background'
            )}
            aria-describedby="confirm-label"
          />
          <span id="confirm-label" className="text-sm text-foreground-secondary">
            {t('confirm.label', { amount: bondAmount.toFixed(2), symbol: unlockData.symbol })}
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            asChild
          >
            <Link href="/consumer/unlock">
              {t('buttons.cancel')}
            </Link>
          </Button>
          <Button
            variant="warning"
            className="flex-1"
            onClick={handleSubmit}
            disabled={!isConfirmed || isSubmitting}
          >
            {isSubmitting ? t('buttons.submitting') : t('buttons.submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmergencyBond;
