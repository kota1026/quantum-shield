'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Clock,
  ArrowRight,
  AlertTriangle,
  ArrowLeft,
  Info,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { Tooltip } from '@/components/shared/Tooltip';
import { useStakePositions } from '@/hooks/qs-hub/useQSHub';

// Duration extension options (in weeks from current position)
const EXTENSION_OPTIONS = [
  { weeks: 26, label: '+6M', months: 6 },
  { weeks: 52, label: '+1Y', months: 12 },
  { weeks: 104, label: '+2Y', months: 24 },
  { weeks: 156, label: '+3Y', months: 36 },
];

// Demo current lock data - In production, this would come from wallet/API
const FALLBACK_CURRENT_LOCK = {
  lockedAmount: 10000,
  currentDurationWeeks: 52, // 1 year remaining
  lockEndDate: new Date(Date.now() + 52 * 7 * 24 * 60 * 60 * 1000), // 1 year from now
  currentVeQS: 2500,
  multiplier: 0.25,
};

export function StakeExtend() {
  const t = useTranslations('qs-hub.stake.extend');
  const tCommon = useTranslations('qs-hub.common');
  const router = useRouter();

  // Fetch stake positions from API
  const { data: stakePositions } = useStakePositions();
  // Use local data as fallback (has extended structure)
  const currentLock = stakePositions?.[0] ?? FALLBACK_CURRENT_LOCK;

  // Form state
  const [selectedExtension, setSelectedExtension] = useState<number>(52); // weeks

  // Get the selected extension option
  const extensionOption = useMemo(() => {
    return EXTENSION_OPTIONS.find((d) => d.weeks === selectedExtension) || EXTENSION_OPTIONS[1];
  }, [selectedExtension]);

  // Calculate new lock duration and veQS
  const calculations = useMemo(() => {
    const newTotalWeeks = FALLBACK_CURRENT_LOCK.currentDurationWeeks + selectedExtension;
    const maxWeeks = 208; // 4 years
    const cappedWeeks = Math.min(newTotalWeeks, maxWeeks);
    const newMultiplier = cappedWeeks / maxWeeks;
    const newVeQS = Math.floor(FALLBACK_CURRENT_LOCK.lockedAmount * newMultiplier);
    const veQSGain = newVeQS - FALLBACK_CURRENT_LOCK.currentVeQS;
    const newEndDate = new Date(
      FALLBACK_CURRENT_LOCK.lockEndDate.getTime() + selectedExtension * 7 * 24 * 60 * 60 * 1000
    );

    return {
      newTotalWeeks: cappedWeeks,
      newMultiplier,
      newVeQS,
      veQSGain,
      newEndDate,
      isMaxed: newTotalWeeks >= maxWeeks,
    };
  }, [selectedExtension]);

  // Handle extension selection
  const handleExtensionSelect = useCallback((weeks: number) => {
    setSelectedExtension(weeks);
  }, []);

  // Handle confirm click
  const handleConfirm = useCallback(() => {
    router.push(`/qs-hub/stake/extend/confirm?extension=${selectedExtension}`);
  }, [selectedExtension, router]);

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format duration
  const formatDuration = (weeks: number) => {
    if (weeks < 52) return `${weeks}W`;
    const years = Math.floor(weeks / 52);
    const remainingWeeks = weeks % 52;
    if (remainingWeeks === 0) return `${years}Y`;
    return `${years}Y ${remainingWeeks}W`;
  };

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
      <main className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6" role="main">
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Current Lock Status Card */}
        <Card padding="none" className="overflow-hidden mb-6">
          <div className="flex items-center gap-3 p-5 border-b border-border bg-background-secondary/50">
            <Clock className="w-5 h-5 text-gold" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{t('currentLock.title')}</h2>
          </div>

          <div className="p-5 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-foreground-tertiary mb-1">{t('currentLock.locked')}</div>
              <div className="text-xl font-bold font-mono">
                {FALLBACK_CURRENT_LOCK.lockedAmount.toLocaleString()} <span className="text-gold text-sm">QS</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground-tertiary mb-1">{t('currentLock.veQS')}</div>
              <div className="text-xl font-bold font-mono text-gold">
                {FALLBACK_CURRENT_LOCK.currentVeQS.toLocaleString()} <span className="text-sm">veQS</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground-tertiary mb-1">{t('currentLock.remaining')}</div>
              <div className="text-lg font-semibold">
                {formatDuration(FALLBACK_CURRENT_LOCK.currentDurationWeeks)}
              </div>
            </div>
            <div>
              <div className="text-xs text-foreground-tertiary mb-1">{t('currentLock.unlockDate')}</div>
              <div className="text-lg font-semibold">{formatDate(FALLBACK_CURRENT_LOCK.lockEndDate)}</div>
            </div>
          </div>
        </Card>

        {/* Extension Form Card */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <TrendingUp className="w-5 h-5 text-gold" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{t('form.title')}</h2>
          </div>

          <div className="p-5 space-y-6">
            {/* Extension Selection */}
            <section aria-labelledby="extension-label">
              <div className="flex items-center gap-2 mb-3">
                <label id="extension-label" className="text-sm font-medium">
                  {t('extension.label')}
                </label>
                <Tooltip content={t('extension.tooltip')} showHelpIcon>
                  <span className="sr-only">{t('extension.helpAriaLabel')}</span>
                </Tooltip>
              </div>

              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                role="radiogroup"
                aria-label={t('extension.ariaLabel')}
              >
                {EXTENSION_OPTIONS.map((option) => (
                  <button
                    key={option.weeks}
                    type="button"
                    onClick={() => handleExtensionSelect(option.weeks)}
                    className={cn(
                      'p-4 rounded-xl text-center transition-all duration-200',
                      'border',
                      'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      selectedExtension === option.weeks
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-background-secondary hover:border-gold/50'
                    )}
                    role="radio"
                    aria-checked={selectedExtension === option.weeks}
                  >
                    <div
                      className={cn(
                        'text-2xl font-bold mb-1',
                        selectedExtension === option.weeks ? 'text-gold' : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </div>
                    <div className="text-xs text-foreground-tertiary">
                      {t(`extension.options.${option.months}`)}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Preview Box */}
            <section
              className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-5"
              aria-labelledby="preview-label"
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-gold" aria-hidden="true" />
                <span id="preview-label" className="text-sm font-medium">
                  {t('preview.title')}
                </span>
              </div>

              <div className="space-y-4">
                {/* New veQS */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('preview.newVeQS')}</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-gold">
                      {calculations.newVeQS.toLocaleString()}
                    </span>
                    <span className="text-sm text-gold ml-1">veQS</span>
                    <div className="text-xs text-success">
                      +{calculations.veQSGain.toLocaleString()} veQS
                    </div>
                  </div>
                </div>

                {/* New Duration */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('preview.newDuration')}</span>
                  <span className="text-lg font-semibold">
                    {formatDuration(calculations.newTotalWeeks)}
                  </span>
                </div>

                {/* New Unlock Date */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('preview.newUnlockDate')}</span>
                  <span className="text-lg font-semibold">{formatDate(calculations.newEndDate)}</span>
                </div>

                {/* New Multiplier */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('preview.multiplier')}</span>
                  <span className="text-lg font-mono font-semibold text-gold">
                    ×{calculations.newMultiplier.toFixed(3)}
                  </span>
                </div>
              </div>

              {calculations.isMaxed && (
                <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-xs text-success text-center">{t('preview.maxReached')}</p>
                </div>
              )}
            </section>

            {/* Warning Notice */}
            <div
              className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-foreground-secondary">{t('warning.extension')}</p>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleConfirm}
              className="w-full"
              aria-label={t('confirmButton.ariaLabel')}
            >
              {t('confirmButton.text')}
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
            </Button>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-8 p-6 bg-card border border-border/50 rounded-xl">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">{t('info.title')}</h3>
              <ul className="space-y-2 text-sm text-foreground-secondary">
                <li>• {t('info.point1')}</li>
                <li>• {t('info.point2')}</li>
                <li>• {t('info.point3')}</li>
              </ul>
            </div>
          </div>
        </div>

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

export default StakeExtend;
