'use client';

import { useTranslations } from 'next-intl';
import { X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  estimatedGas?: string;
}

export function LockModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  estimatedGas = '~0.005',
}: LockModalProps) {
  const t = useTranslations('consumer.dashboard.lockModal');

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6',
        'bg-black/80 backdrop-blur-sm'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full max-w-md',
          'bg-surface border border-border rounded-qs-xl',
          'shadow-lg'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 id="lock-modal-title" className="text-lg font-semibold text-foreground">
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

        {/* Body */}
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
                {t('gasFee')}
              </span>
              <span className="font-semibold text-foreground">
                {estimatedGas} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
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
