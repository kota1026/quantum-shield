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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { HelpTooltip } from './HelpTooltip';
import { FormulaTooltip } from './FormulaTooltip';
import { Link } from '@/i18n/navigation';
import { useBalance } from '@/hooks/token-hub/useTokenHub';

// Maximum lock time: 48 months = 4 years (SEQUENCES.md §9.1)
const MAX_LOCK_MONTHS = 48;

// Lock duration options — ratio = months / MAX_LOCK_MONTHS (linear time-decay)
// veQS voting_power = QS_locked × ratio
const DURATION_OPTIONS = [
  { months: 6, label: '6M', ratio: 6 / MAX_LOCK_MONTHS },
  { months: 12, label: '1Y', ratio: 12 / MAX_LOCK_MONTHS },
  { months: 24, label: '2Y', ratio: 24 / MAX_LOCK_MONTHS },
  { months: 48, label: '4Y', ratio: 1.0 },
];

// Quick amount percentages
const QUICK_AMOUNTS = [25, 50, 75, 100];

// Fallback balance (used when API is unavailable)
const FALLBACK_BALANCE = 125000;

// Step type
type Step = 1 | 2 | 3;

export function TokenHubLock() {
  const t = useTranslations('token-hub.lock');
  const tCommon = useTranslations('token-hub.common');
  const router = useRouter();

  // Fetch balance from API with fallback
  const { data: balanceApi } = useBalance();
  const balance = balanceApi ?? FALLBACK_BALANCE;

  // Form state
  const [amount, setAmount] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(24); // months
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [currentStep] = useState<Step>(1);

  // Get the selected duration option
  const durationOption = useMemo(() => {
    return DURATION_OPTIONS.find((d) => d.months === selectedDuration) || DURATION_OPTIONS[2];
  }, [selectedDuration]);

  // Calculate veQS
  const calculatedVeQS = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    return Math.floor(numAmount * durationOption.ratio);
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
      // Check if it matches a quick amount
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
  const handleDurationSelect = useCallback((months: number) => {
    setSelectedDuration(months);
  }, []);

  // Handle preview click
  const handlePreview = useCallback(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    if (numAmount > 0) {
      // In production, this would navigate to preview with params
      router.push(`/token-hub/lock/preview?amount=${numAmount}&duration=${selectedDuration}`);
    }
  }, [amount, selectedDuration, router]);

  // Validate form
  const isFormValid = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    return numAmount > 0 && numAmount <= balance;
  }, [amount]);

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
                    'text-sm',
                    step === currentStep
                      ? 'text-foreground'
                      : 'text-foreground-tertiary'
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

        {/* Lock Form Card */}
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
            <h1 className="text-xl font-semibold">{t('title')}</h1>
          </div>

          <div className="p-6 space-y-8">
            {/* Amount Input Section */}
            <section aria-labelledby="amount-label">
              <div className="flex items-center gap-2 mb-3">
                <label
                  id="amount-label"
                  htmlFor="lock-amount"
                  className="text-sm font-medium"
                >
                  {t('amount.label')}
                </label>
                <HelpTooltip
                  id="amount-help"
                  content={t('amount.tooltip')}
                  ariaLabel={t('amount.helpAriaLabel')}
                />
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
              <div
                id="balance-info"
                className="flex justify-between items-center mt-2"
              >
                <span className="text-xs text-foreground-tertiary">
                  {t('amount.balance')}: {balance.toLocaleString()} QS
                </span>
                <button
                  type="button"
                  onClick={handleMax}
                  className="text-xs text-gold font-medium hover:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  aria-label={t('amount.maxAriaLabel')}
                >
                  MAX
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-4" role="group" aria-label={t('amount.quickAmountsAriaLabel')}>
                {QUICK_AMOUNTS.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    onClick={() => handleQuickAmount(percent)}
                    className={cn(
                      'flex-1 py-2 px-3 text-sm font-medium rounded-lg',
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
                <label
                  id="duration-label"
                  className="text-sm font-medium"
                >
                  {t('duration.label')}
                </label>
                <HelpTooltip
                  id="duration-help"
                  content={t('duration.tooltip')}
                  ariaLabel={t('duration.helpAriaLabel')}
                />
              </div>

              {/* Duration Options */}
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                role="radiogroup"
                aria-label={t('duration.ariaLabel')}
              >
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.months}
                    type="button"
                    onClick={() => handleDurationSelect(option.months)}
                    className={cn(
                      'p-4 rounded-xl text-center transition-all duration-200',
                      'border',
                      'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      selectedDuration === option.months
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-background-secondary hover:border-gold/50'
                    )}
                    role="radio"
                    aria-checked={selectedDuration === option.months}
                  >
                    <div
                      className={cn(
                        'text-2xl font-bold mb-1',
                        selectedDuration === option.months
                          ? 'text-gold'
                          : 'text-foreground'
                      )}
                    >
                      {option.label}
                    </div>
                    <div className="text-xs text-foreground-tertiary mb-2">
                      {t(`duration.options.${option.months}`)}
                    </div>
                    <div className="text-xs font-mono text-gold">
                      ×{option.ratio.toFixed(option.ratio < 1 ? 3 : 1)}
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
                <FormulaTooltip />
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
                = {amount || '0'} QS × {durationOption.ratio.toFixed(durationOption.ratio < 1 ? 3 : 2)} ({durationOption.months / 12}{t('preview.years')} / 4{t('preview.years')})
              </div>
            </section>

            {/* Lock Warning Notice */}
            <div
              className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-foreground-secondary">
                {t('warning.lockPeriod')}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handlePreview}
              disabled={!isFormValid}
              className={cn(
                'w-full py-4 rounded-xl text-base font-semibold',
                'transition-all duration-200',
                'flex items-center justify-center gap-2',
                'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isFormValid
                  ? 'bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(188,0,45,0.4)]'
                  : 'bg-background-secondary text-foreground-tertiary cursor-not-allowed'
              )}
              aria-label={t('previewButton.ariaLabel')}
            >
              {t('previewButton.text')}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
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
            <Link
              href="/consumer/help"
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

export default TokenHubLock;
