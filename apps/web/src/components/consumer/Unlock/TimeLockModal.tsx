'use client';

import { useTranslations } from 'next-intl';
import { X, Shield, Clock, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeLockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TimeLockModal({ isOpen, onClose }: TimeLockModalProps) {
  const t = useTranslations('consumer.unlock.timeLock');

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6',
        'bg-black/80 backdrop-blur-sm'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="timelock-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full max-w-lg',
          'bg-surface border border-border rounded-qs-xl',
          'shadow-lg max-h-[80vh] overflow-y-auto'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border sticky top-0 bg-surface">
          <h3 id="timelock-modal-title" className="text-lg font-semibold text-foreground">
            {t('modalTitle')}
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
          <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
            <strong className="text-foreground">{t('modalIntro').split('Time Lock')[0]}</strong>
            Time Lock
            <strong className="text-foreground">{t('modalIntro').split('Time Lock')[1]}</strong>
          </p>

          {/* Protection Section */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Shield className="w-4 h-4 text-gold" />
              {t('protectionTitle')}
            </h4>
            <ul className="space-y-3 text-sm text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {t('protection1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {t('protection2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {t('protection3')}
              </li>
            </ul>
          </div>

          {/* Waiting Section */}
          <div className="mb-6">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Clock className="w-4 h-4 text-gold" />
              {t('waitingTitle')}
            </h4>
            <ul className="space-y-3 text-sm text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {t('waiting1')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {t('waiting2')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold mt-0.5">•</span>
                {t('waiting3')}
              </li>
            </ul>
          </div>

          {/* Tips Section */}
          <div className="p-4 bg-surface-secondary rounded-qs border border-border">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
              <Lightbulb className="w-4 h-4 text-gold" />
              {t('tipsTitle')}
            </h4>
            <p className="text-sm text-foreground-secondary leading-relaxed">
              {t('tipsContent')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <Button variant="primary" fullWidth onClick={onClose}>
            {t('understood')}
          </Button>
        </div>
      </div>
    </div>
  );
}
