'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Clock, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTransactionDetail } from '@/hooks/consumer';

// Format remaining time as HH:MM:SS
function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format timestamp to readable date
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Truncate hash for display
function truncateHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || '-';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export function UnlockSuccess() {
  const t = useTranslations('consumer.unlockSuccess');
  const searchParams = useSearchParams();

  // Get parameters from URL
  const lockId = searchParams.get('lockId') || '';
  const unlockId = searchParams.get('unlockId') || '';
  const releaseTimeParam = searchParams.get('releaseTime');
  const method = searchParams.get('method') || 'normal';

  // Parse release time from URL parameter
  const releaseTime = releaseTimeParam ? parseInt(releaseTimeParam, 10) : 0;

  // Fetch transaction detail for amount
  const { data: txDetail } = useTransactionDetail(lockId);

  // Calculate remaining time
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!releaseTime) return;

    const calculateRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, releaseTime - now);
      setRemainingSeconds(remaining);
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [releaseTime]);

  // Format amount from transaction detail
  const formattedAmount = useMemo(() => {
    if (!txDetail?.transaction?.amount) return '-';
    const amount = txDetail.transaction.amount;
    // If amount has decimal, assume it's already in ETH
    if (amount.includes('.')) {
      return `${parseFloat(amount).toFixed(4)} ETH`;
    }
    // Otherwise assume wei and convert
    try {
      const wei = BigInt(amount);
      const eth = Number(wei) / 1e18;
      return `${eth.toFixed(4)} ETH`;
    } catch {
      return `${amount} ETH`;
    }
  }, [txDetail]);

  const isEmergency = method === 'emergency';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gold/15 to-transparent" />
      </div>

      <main role="main" className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Success Icon */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative w-full h-full bg-success rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-foreground-secondary mb-8">
          {isEmergency ? t('subtitleEmergency') : t('subtitle')}
        </p>

        {/* Emergency Warning */}
        {isEmergency && (
          <div className={cn(
            'flex items-start gap-3 p-4 mb-6',
            'bg-warning/10 border border-warning rounded-qs-lg'
          )} role="alert">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground-secondary text-left">
              {t('emergency.warning')}
            </p>
          </div>
        )}

        {/* Time Lock Info Card */}
        <div className={cn(
          'p-6 rounded-qs-lg border mb-8',
          isEmergency ? 'border-warning/30 bg-warning/5' : 'border-gold/30 bg-gold/5'
        )}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className={cn('w-5 h-5', isEmergency ? 'text-warning' : 'text-gold')} />
            <span className={cn('text-sm font-semibold', isEmergency ? 'text-warning' : 'text-gold')}>
              {isEmergency ? t('timelock.titleEmergency') : t('timelock.title')}
            </span>
          </div>

          <div className="text-4xl font-bold text-foreground mb-2 font-mono">
            {formatRemainingTime(remainingSeconds)}
          </div>
          <p className="text-xs text-foreground-secondary">{t('timelock.label')}</p>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-8 text-left">
          <div className="flex justify-between items-center p-3 bg-surface rounded-qs">
            <span className="text-sm text-foreground-secondary">{t('details.amount')}</span>
            <span className="text-sm font-semibold text-foreground">{formattedAmount}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-qs">
            <span className="text-sm text-foreground-secondary">{t('details.estimatedCompletion')}</span>
            <span className="text-sm font-medium text-foreground">
              {releaseTime ? formatDate(releaseTime) : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-qs">
            <span className="text-sm text-foreground-secondary">{t('details.unlockId')}</span>
            <span className="text-sm font-mono text-foreground">
              {truncateHash(unlockId)}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-surface-secondary rounded-qs mb-8">
          <p className="text-xs text-foreground-secondary leading-relaxed">
            {t('info.message')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/consumer/history" className="block">
            <Button variant="secondary" fullWidth>
              {t('buttons.viewHistory')}
            </Button>
          </Link>
          <Link href="/consumer/dashboard" className="block">
            <Button variant="primary" fullWidth>
              {t('buttons.backToDashboard')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
