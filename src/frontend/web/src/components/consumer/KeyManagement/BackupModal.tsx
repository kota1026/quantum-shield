'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const t = useTranslations('consumer.keyManagement.backupModal');
  const [confirmed, setConfirmed] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmed(false);
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

  const handleDownload = useCallback(() => {
    if (!confirmed) return;

    // Create backup data
    const backupData = JSON.stringify({
      version: '1.0',
      algorithm: 'Dilithium-III',
      encrypted: true,
      timestamp: new Date().toISOString(),
    }, null, 2);

    // Create and download file
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-shield-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onClose();
  }, [confirmed, onClose]);

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
      aria-labelledby="backup-modal-title"
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
            id="backup-modal-title"
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
          <p className="text-sm text-foreground-secondary mb-4 leading-relaxed">
            {t('description')}
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className={cn(
                'w-5 h-5 rounded border-border',
                'accent-hinomaru cursor-pointer'
              )}
            />
            <span className="text-sm text-foreground-secondary">
              {t('confirmLabel')}
            </span>
          </label>
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
            onClick={handleDownload}
            disabled={!confirmed}
            className={cn(
              'flex-1 px-4 py-3.5 rounded-qs-lg',
              'bg-gradient-hinomaru border-none',
              'text-sm font-semibold text-white',
              'transition-all',
              confirmed
                ? 'hover:shadow-glow-hinomaru'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            {t('download')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BackupModal;
