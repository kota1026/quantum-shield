'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo data
const DEMO_UNLOCK_AMOUNT = '10.00 ETH';
const DEMO_UNLOCK_DATE = '2026-01-08 14:35:00';
const DEMO_TX_HASH = '0x8b4g...1d3e';
const DEMO_TX_URL = 'https://sepolia.etherscan.io/tx/0x8b4g1d3e';
const DEMO_INITIAL_SECONDS = 23 * 3600 + 59 * 60 + 59; // 23:59:59
const DEMO_TOTAL_SECONDS = 24 * 3600; // 24 hours

export function UnlockSuccess() {
  const t = useTranslations('consumer.unlockSuccess');

  const [remainingSeconds, setRemainingSeconds] = useState(DEMO_INITIAL_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const progressPercent = ((DEMO_TOTAL_SECONDS - remainingSeconds) / DEMO_TOTAL_SECONDS) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Background Glow - Gold for unlock */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-[radial-gradient(circle,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-[440px] w-full">
        {/* Success Icon */}
        <div
          className={cn(
            'w-24 h-24 mx-auto mb-6',
            'bg-gold/10 border-2 border-gold rounded-full',
            'flex items-center justify-center',
            'animate-[pop_0.5s_ease-out]'
          )}
          role="img"
          aria-label={t('successIconLabel')}
        >
          <span className="text-5xl" aria-hidden="true">⏳</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gold mb-2">
          {t('title')}
        </h1>
        <p className="text-[15px] text-foreground-secondary mb-8">
          {t('subtitle')}
        </p>

        {/* Time Lock Card */}
        <div
          className={cn(
            'bg-warning/10 border border-warning rounded-qs-xl p-6 mb-6'
          )}
          role="timer"
          aria-label={t('timelockCard.ariaLabel')}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" aria-hidden="true">⏰</span>
            <span className="text-base font-semibold text-warning">
              {t('timelockCard.title')}
            </span>
          </div>
          <div
            className="text-4xl font-bold font-mono text-foreground mb-2"
            aria-live="polite"
          >
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-xs text-foreground-secondary mb-4">
            {t('timelockCard.label')}
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-warning rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Result Card */}
        <div
          className={cn(
            'bg-card border border-border-subtle rounded-qs-xl p-6 mb-6',
            'text-left'
          )}
        >
          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.amount')}
            </span>
            <span className="text-lg font-medium text-gold">
              {DEMO_UNLOCK_AMOUNT}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.status')}
            </span>
            <span className="text-sm font-medium text-warning flex items-center gap-1.5">
              <span aria-hidden="true">⏳</span>
              {t('result.statusValue')}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-border-subtle">
            <span className="text-xs text-foreground-tertiary">
              {t('result.unlockDate')}
            </span>
            <span className="text-sm font-medium font-mono">
              {DEMO_UNLOCK_DATE}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-xs text-foreground-tertiary">
              {t('result.txHash')}
            </span>
            <a
              href={DEMO_TX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gold hover:underline flex items-center gap-1"
            >
              {DEMO_TX_HASH}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 mb-6',
            'bg-success/10 border border-success rounded-qs-lg',
            'text-left'
          )}
        >
          <Lightbulb className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {t('info')}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link
            href="/consumer/dashboard"
            className={cn(
              'flex-1 py-4 rounded-qs-lg text-center',
              'bg-gradient-hinomaru text-white font-semibold text-sm',
              'hover:shadow-glow-hinomaru hover:-translate-y-0.5',
              'transition-all'
            )}
          >
            {t('buttons.dashboard')}
          </Link>
          <Link
            href="/consumer/history"
            className={cn(
              'flex-1 py-4 rounded-qs-lg text-center',
              'bg-surface-secondary border border-border text-foreground-secondary font-semibold text-sm',
              'hover:border-border-emphasis hover:text-foreground',
              'transition-all'
            )}
          >
            {t('buttons.history')}
          </Link>
        </div>
      </div>

      {/* Keyframe for pop animation */}
      <style jsx global>{`
        @keyframes pop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default UnlockSuccess;
