'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock as LockIcon, Shield, Unlock, Clock, Info, X, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HinomaryVisual } from '../Dashboard/HinomaryVisual';
import { useConsumerStats } from '@/hooks/consumer';
import { MOCK_CONSUMER_STATS } from '@/lib/api/consumer/mock';

// Fallback data
const FALLBACK_BALANCE = MOCK_CONSUMER_STATS.available;

// Lock period options
type LockPeriod = 1 | 2 | 3 | 5;
const LOCK_PERIODS: LockPeriod[] = [1, 2, 3, 5];

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  period: LockPeriod;
  unlockDate: string;
  estimatedGas?: string;
}

function LockConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  period,
  unlockDate,
  estimatedGas = '~0.005',
}: LockModalProps) {
  const t = useTranslations('consumer.lock.modal');
  const tPeriod = useTranslations('consumer.lock.period');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Focus trap for modal accessibility
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleTabKey);
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = '';
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown, handleTabKey]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6',
        'bg-black/80 backdrop-blur-sm'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          'w-full max-w-md',
          'bg-surface border border-border rounded-qs-xl',
          'shadow-lg'
        )}
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 id="lock-confirm-modal-title" className="text-lg font-semibold text-foreground">
            {t('title')}
          </h3>
          <button
            onClick={onClose}
            className={cn(
              'p-1 rounded-qs',
              'text-foreground-secondary hover:text-foreground hover:bg-surface-secondary',
              'transition-colors'
            )}
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-foreground-secondary mb-4">
            {t('description')}
          </p>

          <div className="bg-surface-secondary rounded-qs p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">
                {t('amount')}
              </span>
              <span className="font-semibold text-foreground">
                {amount.toFixed(2)} ETH
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">
                {t('period')}
              </span>
              <span className="font-semibold text-foreground">
                {tPeriod(`years.${period}`)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">
                {t('unlockDate')}
              </span>
              <span className="font-semibold text-foreground">
                {unlockDate}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-sm text-foreground-secondary">
                {t('gasFee')}
              </span>
              <span className="font-semibold text-foreground">
                {estimatedGas} ETH
              </span>
            </div>
          </div>

          {/* Note about 24h waiting period */}
          <p className="mt-4 text-xs text-foreground-tertiary flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {t('note')}
          </p>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            className="flex-1"
            leftIcon={<Shield className="w-4 h-4" />}
          >
            {t('confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <button
          type="button"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-secondary/50 transition-colors rounded-full -m-3"
          aria-label="More info"
        >
          <span className="w-4 h-4 rounded-full bg-surface-tertiary text-foreground-secondary flex items-center justify-center text-xs">
            ?
          </span>
        </button>
      )}
      {isVisible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 w-64 px-3 py-2',
            'bg-surface-secondary border border-border rounded-qs',
            'text-xs text-foreground-secondary shadow-lg',
            'bottom-full left-1/2 -translate-x-1/2 mb-2'
          )}
        >
          {content}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-secondary"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

export function Lock() {
  const t = useTranslations('consumer.lock');
  const router = useRouter();

  // Fetch data using hooks
  const { data: stats } = useConsumerStats();

  // Use API data with fallback
  const balance = stats?.available ?? FALLBACK_BALANCE;

  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<LockPeriod>(2); // Default 2 years
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  // Calculate unlock date based on selected period
  const unlockDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + period);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [period]);

  const handleQuickAmount = (percent: number) => {
    const calculatedAmount = (balance * percent / 100).toFixed(2);
    setAmount(calculatedAmount);
    setError('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError('');
    }
  };

  const validateAmount = (): boolean => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      setError(t('validation.amountRequired'));
      return false;
    }
    if (numAmount < 0.01) {
      setError(t('validation.minimumAmount'));
      return false;
    }
    if (numAmount > balance) {
      setError(t('validation.insufficientBalance'));
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateAmount()) {
      setIsModalOpen(true);
    }
  };

  const handleConfirmLock = useCallback(() => {
    setIsModalOpen(false);
    const params = new URLSearchParams({
      amount: parseFloat(amount).toFixed(2),
      period: period.toString(),
    });
    router.push(`/consumer/lock/processing?${params.toString()}`);
  }, [router, amount, period]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/dashboard"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:text-foreground hover:border-gold',
              'transition-all'
            )}
            aria-label={t('header.backAriaLabel')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('header.title')}</h1>
          </div>
        </header>

        {/* Hero Section */}
        <section className="text-center mb-8">
          <Tooltip content={t('hero.badgeTooltip')}>
            <Badge variant="hinomaru" className="mb-4 cursor-help inline-flex items-center gap-1.5">
              <LockIcon className="w-3 h-3" aria-hidden="true" />
              {t('hero.badge')}
            </Badge>
          </Tooltip>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t('hero.title')}
          </h2>
          <p className="text-foreground-secondary text-sm max-w-md mx-auto">
            {t('hero.subtitle')}
          </p>
        </section>

        {/* Main Lock Card */}
        <Card padding="none" className="overflow-hidden mb-6">
          {/* Visual */}
          <div className="flex justify-center py-8 border-b border-border">
            <HinomaryVisual size="lg" />
          </div>

          {/* Input Section */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-3">
              <label
                htmlFor="lockAmount"
                className="block text-sm font-medium text-foreground"
              >
                {t('card.inputLabel')}
              </label>
              <span className="text-sm text-foreground-secondary">
                {t('card.availableBalance')}: <span className="font-medium text-foreground">{balance.toFixed(2)} ETH</span>
              </span>
            </div>

            <div
              className={cn(
                'flex items-center gap-3',
                'bg-surface-secondary border rounded-qs-lg',
                'px-4 py-4',
                'transition-all',
                error ? 'border-error focus-within:ring-1 focus-within:ring-error/30' : 'border-border focus-within:border-hinomaru focus-within:ring-1 focus-within:ring-hinomaru/30'
              )}
            >
              <input
                id="lockAmount"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={amount}
                onChange={handleAmountChange}
                placeholder={t('card.inputPlaceholder')}
                className={cn(
                  'flex-1 bg-transparent border-none',
                  'text-3xl font-semibold text-foreground',
                  'placeholder:text-foreground-muted',
                  'outline-none',
                  'w-full'
                )}
                aria-describedby={error ? 'lockAmountError' : 'lockAmountHelp'}
                aria-invalid={!!error}
              />
              <span id="lockAmountHelp" className="sr-only">
                Enter the amount of ETH you want to lock
              </span>
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2',
                  'bg-surface-tertiary rounded-qs'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 rounded-full',
                    'bg-gradient-to-br from-[#627eea] to-[#3c3c3d]',
                    'flex items-center justify-center',
                    'text-sm text-white font-medium'
                  )}
                  aria-hidden="true"
                >
                  Ξ
                </div>
                <span className="font-semibold text-foreground">ETH</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p id="lockAmountError" className="mt-2 text-sm text-error" role="alert">
                {error}
              </p>
            )}

            {/* Quick Amount Buttons */}
            <div
              className="flex gap-2 mt-4"
              role="group"
              aria-label="Quick amount selection"
            >
              {[25, 50, 75, 100].map((percent) => (
                <button
                  key={percent}
                  onClick={() => handleQuickAmount(percent)}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium',
                    'bg-surface-secondary border border-border rounded-qs',
                    'text-foreground-secondary',
                    'hover:bg-surface-tertiary hover:border-border-secondary hover:text-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-gold/50',
                    'transition-all'
                  )}
                  aria-label={`Set to ${percent}% of balance`}
                >
                  {percent === 100
                    ? t('card.quickAmounts.max')
                    : t(`card.quickAmounts.${percent}`)}
                </button>
              ))}
            </div>

            {/* Period Selection */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-3">
                {t('period.label')}
              </label>
              <div
                className="grid grid-cols-4 gap-2"
                role="radiogroup"
                aria-label={t('period.label')}
              >
                {LOCK_PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={period === p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'py-3 text-sm font-medium rounded-qs transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-gold/50',
                      period === p
                        ? 'bg-gold/20 border-2 border-gold text-gold'
                        : 'bg-surface-secondary border border-border text-foreground-secondary hover:bg-surface-tertiary hover:text-foreground'
                    )}
                  >
                    {t(`period.years.${p}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Lock Summary */}
            <div className="mt-6 p-4 bg-surface-secondary rounded-qs border border-border">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" aria-hidden="true" />
                {t('summary.title')}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground-secondary">{t('summary.amount')}</span>
                  <span className="font-medium text-foreground">
                    {amount ? `${parseFloat(amount).toFixed(2)} ETH` : '- ETH'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground-secondary">{t('summary.period')}</span>
                  <span className="font-medium text-foreground">{t(`period.years.${period}`)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground-secondary">{t('summary.unlockDate')}</span>
                  <span className="font-medium text-gold">{unlockDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border">
                  <span className="text-foreground-secondary">{t('summary.fee')}</span>
                  <span className="font-medium text-foreground">~0.005 ETH</span>
                </div>
              </div>
            </div>

            {/* Lock Button */}
            <div className="mt-6">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleSubmit}
                leftIcon={<Shield className="w-5 h-5" />}
                aria-label={t('card.lockButtonAriaLabel')}
              >
                {t('card.lockButton')}
              </Button>
              <p className="text-xs text-foreground-tertiary text-center mt-3 flex items-center justify-center gap-1.5">
                <span>Dilithium</span>
                <Tooltip content={t('dilithiumTooltip')} />
              </p>
            </div>
          </div>
        </Card>

        {/* Info Section */}
        <Card padding="md" className="bg-surface-secondary">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-gold" aria-hidden="true" />
            {t('info.title')}
          </h3>
          <ul className="grid gap-4" aria-label={t('info.title')}>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-hinomaru/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Shield className="w-4 h-4 text-hinomaru" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('info.items.quantum.title')}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {t('info.items.quantum.description')}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Unlock className="w-4 h-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('info.items.unlock.title')}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {t('info.items.unlock.description')}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center flex-shrink-0" aria-hidden="true">
                <Clock className="w-4 h-4 text-foreground-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t('info.items.fee.title')}
                </p>
                <p className="text-xs text-foreground-secondary">
                  {t('info.items.fee.description')}
                </p>
              </div>
            </li>
          </ul>
        </Card>
      </main>

      {/* Confirm Modal */}
      <LockConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmLock}
        amount={parseFloat(amount) || 0}
        period={period}
        unlockDate={unlockDate}
      />
    </div>
  );
}

export default Lock;
