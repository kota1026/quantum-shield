'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LockCard, LockItem } from './LockCard';
import { MethodCard } from './MethodCard';
import { TimeLockModal } from './TimeLockModal';

// Demo data - In production, this would come from API/hooks
const DEMO_LOCKS: LockItem[] = [
  {
    id: '1',
    number: 1,
    amount: '10.00 ETH',
    timestamp: '2026-01-01 10:00',
    status: 'locked',
  },
  {
    id: '2',
    number: 2,
    amount: '5.00 ETH',
    timestamp: '2026-01-03 14:30',
    status: 'locked',
  },
  {
    id: '3',
    number: 3,
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    status: 'pending',
    remainingTime: '23:41:02',
  },
];

type UnlockMethod = 'normal' | 'emergency';

export function Unlock() {
  const t = useTranslations('consumer.unlock');
  const router = useRouter();

  const [selectedLockId, setSelectedLockId] = useState<string>(DEMO_LOCKS[0]?.id || '');
  const [selectedMethod, setSelectedMethod] = useState<UnlockMethod>('normal');
  const [isTimeLockModalOpen, setIsTimeLockModalOpen] = useState(false);

  const handleStartUnlock = useCallback(() => {
    if (selectedMethod === 'normal') {
      // Normal unlock: navigate to processing page with lock ID
      router.push(`/consumer/unlock/processing?lockId=${selectedLockId}`);
    } else {
      // Emergency unlock: navigate to bond confirmation page with lock ID
      router.push(`/consumer/emergency-bond?lockId=${selectedLockId}`);
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
              'w-10 h-10 flex items-center justify-center',
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
            {DEMO_LOCKS.length === 0 ? (
              <p className="text-center text-foreground-secondary py-8">
                {t('selectLock.emptyState')}
              </p>
            ) : (
              DEMO_LOCKS.map((lock) => (
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
