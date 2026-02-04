'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Clock, Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEmergencyResult } from '@/hooks/consumer';

// Fallback data (used when API is unavailable)
const FALLBACK_RESULT = {
  txHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
  amount: '12.5',
  symbol: 'ETH',
  bond: '0.625',
  waitDays: 7,
  completionDate: '2026-01-24 10:30 UTC',
};

function formatCountdown(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function EmergencySuccess() {
  const t = useTranslations('consumer.emergencySuccess');
  const searchParams = useSearchParams();
  const txId = searchParams.get('txId') || '';

  // Fetch data using hooks
  const { data: resultDataApi } = useEmergencyResult(txId);

  // Use API data with fallback
  const resultData = resultDataApi ?? FALLBACK_RESULT;

  // 7 days countdown starting from ~6d 23:59:59
  const waitDays = resultData.waitDays;
  const [totalSeconds, setTotalSeconds] = useState((waitDays - 1) * 24 * 3600 + 23 * 3600 + 59 * 60 + 59);
  const totalDuration = waitDays * 24 * 3600;

  useEffect(() => {
    const interval = setInterval(() => {
      setTotalSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = ((totalDuration - totalSeconds) / totalDuration) * 100;
  const shortTxHash = `${resultData.txHash.slice(0, 6)}...${resultData.txHash.slice(-4)}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-gradient-radial from-warning/12 to-transparent'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Success Icon */}
        <div
          className={cn(
            'w-24 h-24 mx-auto mb-6',
            'bg-warning/10 border-2 border-warning rounded-full',
            'flex items-center justify-center',
            'animate-[pop_0.5s_ease-out]'
          )}
        >
          <AlertTriangle className="w-12 h-12 text-warning" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-warning mb-2">
          {t('success.title')}
        </h1>
        <p className="text-sm text-foreground-secondary mb-8">
          {t('success.subtitle')}
        </p>

        {/* Time Lock Card */}
        <div
          className={cn(
            'bg-warning/10 border border-warning rounded-qs-xl p-6 mb-6'
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-warning" />
            <span className="text-base font-semibold text-warning">
              {t('timelock.title')}
            </span>
          </div>
          <div className="font-mono text-3xl font-bold mb-2">
            {formatCountdown(totalSeconds)}
          </div>
          <div className="text-sm text-foreground-secondary mb-4">
            {t('timelock.label')}
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-warning rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Result Card */}
        <div
          className={cn(
            'bg-surface border border-border-subtle rounded-qs-xl p-6 mb-6 text-left'
          )}
        >
          <div className="flex justify-between py-2.5 border-b border-border-subtle">
            <span className="text-sm text-foreground-tertiary">
              {t('details.amount')}
            </span>
            <span className="text-lg font-medium text-warning">
              {resultData.amount} {resultData.symbol}
            </span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border-subtle">
            <span className="text-sm text-foreground-tertiary">
              {t('details.bond')}
            </span>
            <span className="text-sm font-medium">
              {resultData.bond} {resultData.symbol} ({t('details.bondRefund')})
            </span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border-subtle">
            <span className="text-sm text-foreground-tertiary">
              {t('details.estimatedCompletion')}
            </span>
            <span className="text-sm font-medium">
              {resultData.completionDate}
            </span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-sm text-foreground-tertiary">
              {t('details.txHash')}
            </span>
            <a
              href={`https://sepolia.etherscan.io/tx/${resultData.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-gold hover:underline flex items-center gap-1"
            >
              {shortTxHash}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 mb-6',
            'bg-success/10 border border-success rounded-qs-lg text-left'
          )}
        >
          <Lightbulb className="w-5 h-5 text-success flex-shrink-0" />
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {t('info.message')}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button variant="primary" className="flex-1" asChild>
            <Link href="/consumer/dashboard">
              {t('buttons.backToDashboard')}
            </Link>
          </Button>
          <Button variant="secondary" className="flex-1" asChild>
            <Link href="/consumer/history">
              {t('buttons.viewHistory')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EmergencySuccess;
