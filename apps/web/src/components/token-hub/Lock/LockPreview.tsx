'use client';

import { useState, useCallback, useMemo } from 'react';
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
  Loader2,
  ExternalLink,
  Vote,
  Gift,
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleConfirm = useCallback(async () => {
    setIsProcessing(true);
    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsSuccess(true);
  }, []);

  const handleDone = useCallback(() => {
    router.push('/token-hub/dashboard');
  }, [router]);

  // Success State
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background pb-8">
        {/* Premium Background Effect - Success Glow */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[600px] h-[600px]',
              'bg-[radial-gradient(ellipse,rgba(34,197,94,0.15),transparent_60%)]'
            )}
          />
        </div>

        <main className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6" role="main">
          <TokenHubHeader />

          {/* Steps - All Complete */}
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
                      'bg-success border-success text-white'
                    )}
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm text-foreground-tertiary">
                    {t(`steps.step${step}`)}
                  </span>
                </div>
                {index < 2 && (
                  <div className="w-10 h-0.5 bg-success" aria-hidden="true" />
                )}
              </div>
            ))}
          </nav>

          {/* Success Card */}
          <Card padding="none" className="overflow-hidden">
            <div className="p-8 text-center">
              {/* Success Icon */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" />
                <div className="relative w-24 h-24 bg-success/20 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-white" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2">{t('success.title')}</h1>
              <p className="text-foreground-secondary mb-6">{t('success.description')}</p>

              {/* Lock Summary */}
              <div className="bg-background-secondary rounded-xl p-6 mb-6 text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{t('summary.lockAmount')}</span>
                    <span className="font-bold font-mono">{amount.toLocaleString()} QS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{t('summary.lockDuration')}</span>
                    <span className="font-bold font-mono">{durationOption.label}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{t('summary.veqsReceive')}</span>
                    <span className="text-xl font-bold font-mono text-gold">{calculatedVeQS.toLocaleString()} veQS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{t('details.unlockDate')}</span>
                    <span className="font-semibold">{unlockDate}</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground-secondary">{t('success.txHash')}</span>
                    <a
                      href="https://etherscan.io/tx/0x7a3f...9c2d"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-gold hover:underline inline-flex items-center gap-1"
                    >
                      0x7a3f...9c2d
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-6">
                <h2 className="font-semibold mb-3">{t('success.whatsNext.title')}</h2>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex items-start gap-2">
                    <Vote className="w-4 h-4 text-gold mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-foreground-secondary">{t('success.whatsNext.vote')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Gift className="w-4 h-4 text-gold mt-0.5" aria-hidden="true" />
                    <span className="text-sm text-foreground-secondary">{t('success.whatsNext.rewards')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleDone}
                  className="w-full"
                >
                  {t('success.done')}
                </Button>
                <Link
                  href="/token-hub/delegate"
                  className="text-sm text-gold hover:underline"
                >
                  {t('success.delegateLink')}
                </Link>
              </div>
            </div>
          </Card>
        </main>
      </div>
    );
  }

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
                disabled={isProcessing}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
                {t('actions.back')}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    {t('actions.processing')}
                  </>
                ) : (
                  <>
                    {t('actions.confirm')}
                    <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                  </>
                )}
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
