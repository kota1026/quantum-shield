'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { formatEther } from 'viem';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LockCard, LockItem } from './LockCard';
import { MethodCard } from './MethodCard';
import { TimeLockModal } from './TimeLockModal';
import { useUserTransactions } from '@/hooks/consumer';

// Helper to convert amount to ETH string
function formatAmountToEth(amount: string): string {
  try {
    // If already contains a decimal point, assume it's in ETH
    if (amount.includes('.')) {
      return parseFloat(amount).toFixed(2);
    }
    // Otherwise assume it's in wei and convert
    return parseFloat(formatEther(BigInt(amount))).toFixed(2);
  } catch {
    // Fallback: just parse as float
    return parseFloat(amount).toFixed(2);
  }
}

// Fallback data (used when API is unavailable)
const FALLBACK_LOCKS = [
  { id: '1', number: 1, amount: '10.00 ETH', timestamp: '2026-01-01', status: 'locked' as const },
  { id: '2', number: 2, amount: '5.25 ETH', timestamp: '2026-01-05', status: 'locked' as const },
];

type UnlockMethod = 'normal' | 'emergency';

export function Unlock() {
  const t = useTranslations('consumer.unlock');
  const router = useRouter();

  // Fetch data using new API hooks - get only locks
  const { data: txData } = useUserTransactions({ txType: 'lock', perPage: 50 });

  // Transform API data to component format
  const locks = (txData?.transactions?.filter(tx => tx.status !== 'completed').map((tx, index) => ({
    id: tx.id,
    number: index + 1,
    amount: `${formatAmountToEth(tx.amount)} ETH`,
    timestamp: new Date(tx.createdAt * 1000).toLocaleDateString('ja-JP'),
    status: tx.status === 'pending' ? ('pending' as const) : ('locked' as const),
  })) ?? FALLBACK_LOCKS) as LockItem[];

  const [selectedLockId, setSelectedLockId] = useState<string>(locks[0]?.id || '');
  const [selectedMethod, setSelectedMethod] = useState<UnlockMethod>('normal');
  const [isTimeLockModalOpen, setIsTimeLockModalOpen] = useState(false);

  const handleStartUnlock = useCallback(() => {
    if (selectedMethod === 'normal') {
      // Normal unlock: navigate to processing page with lock ID and method
      router.push(`/consumer/unlock/processing?lockId=${selectedLockId}&method=normal`);
    } else {
      // Emergency unlock: navigate to processing page with emergency method
      // Note: Bond confirmation could be a separate step, but for now we go directly to processing
      router.push(`/consumer/unlock/processing?lockId=${selectedLockId}&method=emergency`);
    }
  }, [selectedMethod, selectedLockId, router]);

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
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/dashboard"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Select Lock Section */}
        <section className="mb-8" aria-labelledby="select-lock-label">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-px bg-gold" aria-hidden="true" />
            <span
              id="select-lock-label"
              className="text-xs font-semibold tracking-wider uppercase text-gold"
            >
              {t('selectLock.label')}
            </span>
          </div>

          <div
            className="space-y-3"
            role="radiogroup"
            aria-labelledby="select-lock-label"
          >
            {locks.length === 0 ? (
              <p className="text-center text-foreground-secondary py-8">
                {t('selectLock.emptyState')}
              </p>
            ) : (
              locks.map((lock) => (
                <LockCard
                  key={lock.id}
                  lock={lock}
                  selected={selectedLockId === lock.id}
                  onSelect={() => setSelectedLockId(lock.id)}
                />
              ))
            )}
          </div>
        </section>

        {/* Select Method Section */}
        <section aria-labelledby="select-method-label">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-px bg-gold" aria-hidden="true" />
            <span
              id="select-method-label"
              className="text-xs font-semibold tracking-wider uppercase text-gold"
            >
              {t('selectMethod.label')}
            </span>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
            role="radiogroup"
            aria-labelledby="select-method-label"
          >
            <MethodCard
              type="normal"
              selected={selectedMethod === 'normal'}
              onSelect={() => setSelectedMethod('normal')}
              onHelpClick={() => setIsTimeLockModalOpen(true)}
            />
            <MethodCard
              type="emergency"
              selected={selectedMethod === 'emergency'}
              onSelect={() => setSelectedMethod('emergency')}
            />
          </div>

          {/* Emergency Warning */}
          {selectedMethod === 'emergency' && (
            <div
              className={cn(
                'flex items-start gap-3 p-4 mb-6',
                'bg-warning/10 border border-warning rounded-qs-lg'
              )}
              role="alert"
            >
              <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-warning mb-1">
                  {t('selectMethod.warningTitle')}
                </h4>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {t('selectMethod.warningMessage')}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            variant="primary"
            fullWidth
            onClick={handleStartUnlock}
            disabled={!selectedLockId}
          >
            {selectedMethod === 'normal'
              ? t('button.normalUnlock')
              : t('button.emergencyUnlock')}
          </Button>
        </section>
      </div>

      {/* Time Lock Modal */}
      <TimeLockModal
        isOpen={isTimeLockModalOpen}
        onClose={() => setIsTimeLockModalOpen(false)}
      />
    </div>
  );
}

export default Unlock;
