'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserKeys } from '@/hooks/consumer';

// Type definition for key info
interface KeyInfo {
  publicKey: string;
  secretKey: string;
  algorithm: string;
  createdAt: string;
  lastBackup: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_KEY_INFO: KeyInfo = {
  publicKey: '',
  secretKey: '',
  algorithm: 'ML-DSA-65',
  createdAt: '',
  lastBackup: '',
};

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const t = useTranslations('consumer.keyManagement.exportModal');

  // Fetch data using new API hooks
  const { data: keysData } = useUserKeys();

  // Transform API data to component format
  const keyInfo: KeyInfo = keysData ? {
    publicKey: keysData.dilithiumPublicKey || '',
    secretKey: '', // Not exposed via API for security
    algorithm: keysData.algorithm?.name || 'ML-DSA-65',
    createdAt: keysData.registeredAt ? new Date(keysData.registeredAt * 1000).toLocaleDateString('ja-JP') : '',
    lastBackup: '', // TODO: Add to API
  } : EMPTY_KEY_INFO;

  const [confirmed, setConfirmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmed(false);
      setRevealed(false);
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

  const handleReveal = () => {
    if (confirmed) {
      setRevealed(true);
    }
  };

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
      aria-labelledby="export-modal-title"
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
            id="export-modal-title"
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
          {/* Warning Box */}
          <div
            className={cn(
              'flex items-start gap-3 p-4 mb-4',
              'bg-warning/10 border border-warning rounded-qs-lg'
            )}
            role="alert"
          >
            <AlertTriangle
              className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold text-warning mb-1">
                {t('warning.title')}
              </h3>
              <p className="text-xs text-foreground-secondary leading-relaxed">
                {t('warning.description')}
              </p>
            </div>
          </div>

          {/* Secret Key Display */}
          <div className="bg-surface-secondary p-4 rounded-qs mb-4">
            <div
              className={cn(
                'font-mono text-xs break-all leading-relaxed',
                'transition-all duration-300',
                revealed ? 'select-text' : 'blur-sm select-none'
              )}
              aria-label={revealed ? t('secretKeyRevealed') : t('secretKeyHidden')}
            >
              {keyInfo.secretKey}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={revealed}
              className={cn(
                'w-5 h-5 rounded border-border',
                'accent-hinomaru cursor-pointer',
                revealed && 'opacity-50'
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
            {t('close')}
          </button>
          <button
            onClick={handleReveal}
            disabled={!confirmed || revealed}
            className={cn(
              'flex-1 px-4 py-3.5 rounded-qs-lg',
              'bg-gradient-hinomaru border-none',
              'text-sm font-semibold text-white',
              'transition-all',
              confirmed && !revealed
                ? 'hover:shadow-glow-hinomaru'
                : 'opacity-50 cursor-not-allowed'
            )}
          >
            {revealed ? t('revealed') : t('reveal')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExportModal;
