'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Check,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

// Lock duration options
const DURATION_OPTIONS = [
  { months: 6, label: '6M', multiplier: 0.125 },
  { months: 12, label: '1Y', multiplier: 0.25 },
  { months: 24, label: '2Y', multiplier: 0.5 },
  { months: 48, label: '4Y', multiplier: 1.0 },
];

export function LockPreview() {
  const t = useTranslations('token-hub.lockPreview');
  const tCommon = useTranslations('token-hub.common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const amount = Number(searchParams.get('amount')) || 0;
  const duration = Number(searchParams.get('duration')) || 24;

  const durationOption = useMemo(() => {
    return DURATION_OPTIONS.find((d) => d.months === duration) || DURATION_OPTIONS[2];
  }, [duration]);

  const calculatedVeQS = useMemo(() => {
    return Math.floor(amount * durationOption.multiplier);
  }, [amount, durationOption]);

  const unlockDate = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + duration);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [duration]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleConfirm = useCallback(() => {
    // In production, this would submit the transaction
    // For now, navigate to a success state or dashboard
    router.push('/token-hub/dashboard');
  }, [router]);

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
      <main className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <TokenHubHeader />

        {/* Steps */}
        <nav
          className="flex justify-center items-center gap-4 mb-12"
          aria-label={t('steps.ariaLabel')}
        >
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                    'border transition-colors',
                    step === 2
                      ? 'bg-gold border-gold text-background'
                      : step < 2
                      ? 'bg-success border-success text-white'
                      : 'bg-background-secondary border-border text-foreground-tertiary'
                  )}
                  aria-current={step === 2 ? 'step' : undefined}
                >
                  {step < 2 ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    step === 2 ? 'text-foreground' : 'text-foreground-tertiary'
                  )}
                >
                  {t(`steps.step${step}`)}
                </span>
              </div>
              {index < 2 && (
                <div
                  className="w-10 h-0.5 bg-border"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </nav>

        {/* Preview Card */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
            <h1 className="text-xl font-semibold">{t('title')}</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Section */}
            <div className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-6">
              <h2 className="text-sm text-foreground-secondary mb-4">{t('summary.title')}</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('summary.lockAmount')}</span>
                  <span className="text-xl font-bold font-mono">{amount.toLocaleString()} QS</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('summary.lockDuration')}</span>
                  <span className="text-xl font-bold font-mono">{durationOption.label}</span>
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('summary.veqsReceive')}</span>
                  <span className="text-2xl font-bold font-mono text-gold">{calculatedVeQS.toLocaleString()} veQS</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-secondary rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-foreground-tertiary mb-2">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                  {t('details.unlockDate')}
                </div>
                <div className="text-sm font-semibold">{unlockDate}</div>
              </div>

              <div className="bg-background-secondary rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-foreground-tertiary mb-2">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  {t('details.multiplier')}
                </div>
                <div className="text-sm font-semibold font-mono">×{durationOption.multiplier.toFixed(durationOption.multiplier < 1 ? 3 : 2)}</div>
              </div>
            </div>

            {/* Warning Notice */}
            <div
              className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-warning mb-1">{t('warning.title')}</p>
                <p className="text-sm text-foreground-secondary">
                  {t('warning.description')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('actions.back')}
              </Button>

              <Button
                variant="gold"
                size="lg"
                onClick={handleConfirm}
                className="flex-1"
              >
                {t('actions.confirm')}
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border">
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4" aria-label={tCommon('footer.navLabel')}>
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
          </nav>
          <p className="text-xs text-foreground-tertiary text-center max-w-lg mx-auto leading-relaxed">
            {tCommon('footer.disclaimer')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default LockPreview;
