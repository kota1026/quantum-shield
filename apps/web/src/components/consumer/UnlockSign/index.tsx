'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo data
const DEMO_UNLOCK_AMOUNT = '10.00 ETH';
const DEMO_UNLOCK_TYPE = 'normal';
const DEMO_GAS_FEE = '~0.003 ETH';

export function UnlockSign() {
  const t = useTranslations('consumer.unlockSign');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSign = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      router.push('/consumer/unlock-processing');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-40'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[480px] w-full px-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/unlock"
            className={cn(
              'w-10 h-10 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
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

        {/* Sign Card */}
        <div
          className={cn(
            'bg-card border border-border-subtle rounded-qs-xl p-8',
            'text-center'
          )}
        >
          {/* Icon */}
          <div className="text-6xl mb-6" aria-hidden="true">
            🔐
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-2">
            {t('title')}
          </h2>
          <p className="text-sm text-foreground-secondary mb-8">
            {t('subtitle')}
          </p>

          {/* Unlock Summary */}
          <div
            className={cn(
              'bg-surface-secondary rounded-qs-lg p-5 mb-6',
              'text-left'
            )}
            role="region"
            aria-label={t('summary.ariaLabel')}
          >
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-xs text-foreground-tertiary">
                {t('summary.amount')}
              </span>
              <span className="text-lg font-medium text-gold">
                {DEMO_UNLOCK_AMOUNT}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-xs text-foreground-tertiary">
                {t('summary.type')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {t(`summary.types.${DEMO_UNLOCK_TYPE}`)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border-subtle">
              <span className="text-xs text-foreground-tertiary">
                {t('summary.waitTime')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {t('summary.waitTimeValue')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-foreground-tertiary">
                {t('summary.gasFee')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {DEMO_GAS_FEE}
              </span>
            </div>
          </div>

          {/* Key Visual */}
          <div
            className="flex items-center justify-center my-8"
            role="img"
            aria-label={t('visualLabel')}
          >
            <div
              className={cn(
                'w-20 h-20 rounded-full',
                'bg-hinomaru/10 border-2 border-hinomaru',
                'flex items-center justify-center',
                'animate-pulse shadow-[0_0_0_0_rgba(188,0,45,0.4)]'
              )}
              style={{
                animation: 'key-pulse 2s ease-in-out infinite',
              }}
            >
              <Key className="w-9 h-9 text-hinomaru" />
            </div>
          </div>

          {/* Info Box */}
          <div
            className={cn(
              'bg-gold/10 border border-gold rounded-qs-lg p-4 mb-6',
              'text-left'
            )}
          >
            <p className="text-sm text-foreground-secondary leading-relaxed">
              <span className="font-semibold text-gold">
                {t('info.highlight')}
              </span>
              {t('info.text')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Link
              href="/consumer/unlock"
              className={cn(
                'flex-1 py-4 rounded-qs-lg text-center',
                'bg-surface-secondary border border-border text-foreground-secondary font-semibold text-sm',
                'hover:border-border-emphasis hover:text-foreground',
                'transition-all'
              )}
            >
              {t('buttons.cancel')}
            </Link>
            <button
              onClick={handleSign}
              disabled={isSubmitting}
              className={cn(
                'flex-1 py-4 rounded-qs-lg text-center',
                'bg-gradient-hinomaru text-white font-semibold text-sm',
                'hover:shadow-glow-hinomaru hover:-translate-y-0.5',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
                'transition-all'
              )}
            >
              {isSubmitting ? t('buttons.signing') : t('buttons.sign')}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe for key pulse animation */}
      <style jsx global>{`
        @keyframes key-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(188, 0, 45, 0.4);
          }
          50% {
            box-shadow: 0 0 0 20px transparent;
          }
        }
      `}</style>
    </div>
  );
}

export default UnlockSign;
