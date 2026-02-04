'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Check,
  ArrowRight,
  Calculator,
  AlertTriangle,
  ArrowLeft,
  HelpCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { Tooltip } from '@/components/shared/Tooltip';
import { useQSBalance } from '@/hooks/qs-hub/useQSHub';

// Fallback balance (used when API is unavailable)
const FALLBACK_BALANCE = 15000;

// Lock duration options
const DURATION_OPTIONS = [
  { weeks: 1, label: '1W', months: 0, multiplier: 0.005 },
  { weeks: 4, label: '1M', months: 1, multiplier: 0.02 },
  { weeks: 26, label: '6M', months: 6, multiplier: 0.125 },
  { weeks: 52, label: '1Y', months: 12, multiplier: 0.25 },
  { weeks: 104, label: '2Y', months: 24, multiplier: 0.5 },
  { weeks: 208, label: '4Y', months: 48, multiplier: 1.0 },
];

// Quick amount percentages
const QUICK_AMOUNTS = [25, 50, 75, 100];

// Demo balance - In production, this would come from wallet/API
const balance = 15000;

// Step type
type Step = 1 | 2 | 3;

export function StakeLock() {
  const t = useTranslations('qs-hub.stake.lock');
  const tCommon = useTranslations('qs-hub.common');
  const router = useRouter();

  // Fetch balance from API with fallback
  const { data: balanceApi } = useQSBalance();
  const balance = balanceApi ?? FALLBACK_BALANCE;

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(104); // weeks (2Y default)
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [currentStep] = useState<Step>(1);

  // Get the selected duration option
  const durationOption = useMemo(() => {
    return DURATION_OPTIONS.find((d) => d.weeks === selectedDuration) || DURATION_OPTIONS[4];
  }, [selectedDuration]);

  // Calculate veQS
  const calculatedVeQS = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    return Math.floor(numAmount * durationOption.multiplier);
  }, [amount, durationOption]);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      setAmount('');
      setSelectedQuickAmount(null);
      return;
    }
    const numValue = parseInt(value, 10);
    if (numValue <= balance) {
      setAmount(numValue.toLocaleString());
      const percent = Math.round((numValue / balance) * 100);
      if (QUICK_AMOUNTS.includes(percent)) {
        setSelectedQuickAmount(percent);
      } else {
        setSelectedQuickAmount(null);
      }
    }
  };

  // Handle quick amount selection
  const handleQuickAmount = useCallback((percent: number) => {
    const calculatedAmount = Math.floor((balance * percent) / 100);
    setAmount(calculatedAmount.toLocaleString());
    setSelectedQuickAmount(percent);
  }, []);

  // Handle max button
  const handleMax = useCallback(() => {
    setAmount(balance.toLocaleString());
    setSelectedQuickAmount(100);
  }, []);

  // Handle duration selection
  const handleDurationSelect = useCallback((weeks: number) => {
    setSelectedDuration(weeks);
  }, []);

  // Handle preview click
  const handlePreview = useCallback(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    if (numAmount > 0) {
      router.push(`/qs-hub/stake/lock/preview?amount=${numAmount}&duration=${selectedDuration}`);
    }
  }, [amount, selectedDuration, router]);

  // Validate form
  const isFormValid = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    return numAmount > 0 && numAmount <= balance;
  }, [amount]);

  // Check for error states
  const amountError = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    if (numAmount > balance) {
      return 'insufficientBalance';
    }
    return null;
  }, [amount]);

  // Format duration display
  const formatDuration = (option: typeof DURATION_OPTIONS[0]) => {
    if (option.months === 0) return `${option.weeks}W`;
    if (option.months < 12) return `${option.months}M`;
    return `${option.months / 12}Y`;
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

        {/* Steps */}
        <nav
          className="flex justify-center items-center gap-4 mb-10"
          aria-label={t('steps.ariaLabel')}
        >
          {[1, 2, 3].map((step, index) => (
            <div key={step} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                    'border transition-colors',
                    step === currentStep
                      ? 'bg-gold border-gold text-background'
                      : step < currentStep
                      ? 'bg-success border-success text-white'
                      : 'bg-background-secondary border-border text-foreground-tertiary'
                  )}
                  aria-current={step === currentStep ? 'step' : undefined}
                >
                  {step < currentStep ? (
                    <Check className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    step
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm hidden sm:inline',
                    step === currentStep ? 'text-foreground' : 'text-foreground-tertiary'
                  )}
                >
                  {t(`steps.step${step}`)}
                </span>
              </div>
              {index < 2 && <div className="w-8 h-0.5 bg-border" aria-hidden="true" />}
            </div>
          ))}
        </nav>

        {/* Lock Form Card */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
            <h2 className="text-lg font-semibold">{t('form.title')}</h2>
          </div>

          <div className="p-6 space-y-8">
            {/* Amount Input Section */}
            <section aria-labelledby="amount-label">
              <div className="flex items-center gap-2 mb-3">
                <label id="amount-label" htmlFor="lock-amount" className="text-sm font-medium">
                  {t('amount.label')}
                </label>
                <Tooltip content={t('amount.tooltip')} showHelpIcon>
                  <span className="sr-only">{t('amount.helpAriaLabel')}</span>
                </Tooltip>
              </div>

              {/* Input Wrapper */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4',
                  'bg-background-secondary border border-border rounded-xl',
                  'transition-all duration-200',
                  'focus-within:border-gold focus-within:ring-2 focus-within:ring-gold/20'
                )}
              >
                <input
                  id="lock-amount"
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className={cn(
                    'flex-1 bg-transparent border-none outline-none',
                    'text-2xl sm:text-3xl font-semibold font-mono text-foreground',
                    'placeholder:text-foreground-tertiary'
                  )}
                  aria-describedby="balance-info"
                />
                <span className="text-lg font-semibold text-gold">QS</span>
              </div>

              {/* Balance Row */}
              <div id="balance-info" className="flex justify-between items-center mt-2">
                <span className="text-xs text-foreground-tertiary">
                  {t('amount.balance')}: {balance.toLocaleString()} QS
                </span>
                <button
                  type="button"
                  onClick={handleMax}
                  className="min-h-[44px] min-w-[44px] px-2 inline-flex items-center justify-center text-xs text-gold font-medium hover:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  aria-label={t('amount.maxAriaLabel')}
                >
                  MAX
                </button>
              </div>

              {/* Error Message */}
              {amountError && (
                <div className="mt-2 text-xs text-danger flex items-center gap-1" role="alert">
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  {t(`amount.errors.${amountError}`)}
                </div>
              )}

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-4" role="group" aria-label={t('amount.quickAmountsAriaLabel')}>
                {QUICK_AMOUNTS.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => handleQuickAmount(percent)}
                    className={cn(
                      'flex-1 min-h-[44px] py-2 px-3 text-sm font-medium rounded-lg',
                      'border transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      selectedQuickAmount === percent
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-border bg-background-secondary text-foreground-secondary hover:border-gold/50 hover:text-foreground'
                    )}
                    aria-pressed={selectedQuickAmount === percent}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </section>

            {/* Duration Selection Section */}
            <section aria-labelledby="duration-label">
              <div className="flex items-center gap-2 mb-3">
                <label id="duration-label" className="text-sm font-medium">
                  {t('duration.label')}
                </label>
                <Tooltip content={t('duration.tooltip')} showHelpIcon>
                  <span className="sr-only">{t('duration.helpAriaLabel')}</span>
                </Tooltip>
              </div>

              {/* Duration Options */}
              <div
                className="grid grid-cols-3 sm:grid-cols-6 gap-2"
                role="radiogroup"
                aria-label={t('duration.ariaLabel')}
              >
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.weeks}
                    type="button"
                    onClick={() => handleDurationSelect(option.weeks)}
                    className={cn(
                      'p-3 rounded-xl text-center transition-all duration-200',
                      'border',
                      'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      selectedDuration === option.weeks
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-background-secondary hover:border-gold/50'
                    )}
                    role="radio"
                    aria-checked={selectedDuration === option.weeks}
                  >
                    <div
                      className={cn(
                        'text-lg font-bold mb-0.5',
                        selectedDuration === option.weeks ? 'text-gold' : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </div>
                    <div className="text-[10px] font-mono text-foreground-tertiary">
                      ×{option.multiplier < 0.1 ? option.multiplier.toFixed(3) : option.multiplier.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Preview Box */}
            <section
              className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-6"
              aria-labelledby="preview-label"
            >
              <div className="flex justify-between items-center mb-3">
                <span id="preview-label" className="text-sm text-foreground-secondary flex items-center gap-2">
                  <Calculator className="w-4 h-4" aria-hidden="true" />
                  {t('preview.label')}
                </span>
                <Tooltip content={t('preview.formulaTooltip')} showHelpIcon>
                  <span className="sr-only">{t('preview.formulaAriaLabel')}</span>
                </Tooltip>
              </div>

              <div
                className="text-3xl sm:text-4xl font-bold font-mono text-gold mb-2"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {calculatedVeQS.toLocaleString()} veQS
              </div>

              <div className="text-xs font-mono text-foreground-tertiary">
                = {amount || '0'} QS × {durationOption.multiplier < 0.1 ? durationOption.multiplier.toFixed(3) : durationOption.multiplier.toFixed(2)} ({formatDuration(durationOption)} / 4Y)
              </div>
            </section>

            {/* Lock Warning Notice */}
            <div
              className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-foreground-secondary">{t('warning.lockPeriod')}</p>
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handlePreview}
              disabled={!isFormValid}
              className="w-full"
              aria-label={t('previewButton.ariaLabel')}
            >
              {t('previewButton.text')}
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

export default StakeLock;
