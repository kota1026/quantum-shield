'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { X, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegenerateModal({ isOpen, onClose }: RegenerateModalProps) {
  const t = useTranslations('consumer.keyManagement.regenerateModal');
  const router = useRouter();
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);

  const canRegenerate = confirm1 && confirm2;

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirm1(false);
      setConfirm2(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleRegenerate = useCallback(() => {
    if (!canRegenerate) return;

    // In production, this would call an API to regenerate keys
    // and then redirect to onboarding
    onClose();
    router.push('/consumer');
  }, [canRegenerate, onClose, router]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6',
        'bg-black/80 backdrop-blur-sm'
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerate-modal-title"
    >
      <div
        className={cn(
          'w-full max-w-md',
          'bg-card border border-border rounded-qs-xl',
          'overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-border-subtle">
          <h2
            id="regenerate-modal-title"
            className="text-lg font-semibold text-foreground"
          >
            {t('title')}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors"
            aria-label={t('close')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Danger Warning Box */}
          <div
            className={cn(
              'flex items-start gap-3 p-4 mb-4',
              'bg-danger/10 border border-danger rounded-qs-lg'
            )}
            role="alert"
          >
            <AlertOctagon
              className="w-5 h-5 text-danger flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold text-danger mb-1">
                {t('warning.title')}
              </h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {t('warning.description')}
              </p>
            </div>
          </div>

          {/* Confirmation Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirm1}
                onChange={(e) => setConfirm1(e.target.checked)}
                className={cn(
                  'w-5 h-5 mt-0.5 rounded border-border',
                  'accent-hinomaru cursor-pointer'
                )}
              />
              <span className="text-sm text-foreground-secondary">
                {t('confirm1')}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirm2}
                onChange={(e) => setConfirm2(e.target.checked)}
                className={cn(
                  'w-5 h-5 mt-0.5 rounded border-border',
                  'accent-hinomaru cursor-pointer'
                )}
              />
              <span className="text-sm text-foreground-secondary">
                {t('confirm2')}
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border-subtle">
          <button
            onClick={onClose}
            className={cn(
              'flex-1 px-4 py-3.5 rounded-qs-lg',
              'bg-surface-secondary border border-border',
              'text-sm font-semibold text-foreground-secondary',
              'hover:border-border-emphasis hover:text-foreground',
              'transition-all'
            )}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleRegenerate}
            disabled={!canRegenerate}
            className={cn(
              'flex-1 px-4 py-3.5 rounded-qs-lg',
              'bg-danger/10 border border-danger',
              'text-sm font-semibold text-danger',
              'transition-all',
              canRegenerate
                ? 'hover:bg-danger hover:text-white'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            {t('regenerate')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegenerateModal;
