'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Copy, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDisconnect: () => void;
  address: string;
}

export function WalletModal({
  isOpen,
  onClose,
  onCopy,
  onDisconnect,
  address,
}: WalletModalProps) {
  const t = useTranslations('consumer.dashboard.walletModal');
  const tWallet = useTranslations('consumer.common.wallet');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement;

      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown);

      // Focus first focusable element in modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        // Restore focus
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Format address with ellipsis in the middle
  const formatFullAddress = (addr: string) => {
    if (addr.length <= 20) return addr;
    return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6',
        'bg-black/80 backdrop-blur-sm'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={cn(
          'w-full max-w-md',
          'bg-surface border border-border rounded-qs-xl',
          'shadow-lg'
        )}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 id="wallet-modal-title" className="text-lg font-semibold text-foreground">
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
          <div className="text-center mb-6">
            <div
              className={cn(
                'w-16 h-16 mx-auto mb-4',
                'bg-surface-secondary rounded-full',
                'flex items-center justify-center'
              )}
            >
              <Wallet className="w-8 h-8 text-foreground-secondary" />
            </div>
            <p className="text-sm text-foreground-secondary mb-2">
              {t('connectedLabel')}
            </p>
            <p className="font-mono text-sm text-foreground">
              {formatFullAddress(address)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCopy}
              className="flex-1"
              leftIcon={<Copy className="w-4 h-4" />}
            >
              {tWallet('copy')}
            </Button>
            <Button
              variant="danger"
              onClick={onDisconnect}
              className="flex-1"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              {tWallet('disconnect')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
