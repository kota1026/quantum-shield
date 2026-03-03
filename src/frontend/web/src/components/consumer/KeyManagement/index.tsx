'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  HardDrive,
  Eye,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '../Dashboard/Tooltip';
import { BackupModal } from './BackupModal';
import { ExportModal } from './ExportModal';
import { RegenerateModal } from './RegenerateModal';
import { useUserKeys } from '@/hooks/consumer';

// Type definition for key info
interface KeyInfo {
  publicKey: string;
  secretKey: string;
  algorithm: string;
  createdAt: string;
  lastBackup: string;
}

const EMPTY_KEY_INFO: KeyInfo = {
  publicKey: '',
  secretKey: '',
  algorithm: 'ML-DSA-65',
  createdAt: '',
  lastBackup: '',
};

export function KeyManagement() {
  const t = useTranslations('consumer.keyManagement');

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

  // Modal states
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRegenerateModalOpen, setIsRegenerateModalOpen] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  const handleCopyPublicKey = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(keyInfo.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [keyInfo.publicKey]);

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
      <main role="main" className="relative z-10 max-w-[600px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/settings"
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

        {/* Warning Box */}
        <div
          className={cn(
            'flex items-start gap-3 p-4 mb-6',
            'bg-warning/10 border border-warning rounded-qs-lg'
          )}
          role="alert"
        >
          <AlertTriangle
            className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-warning mb-1">
              {t('warning.title')}
            </h2>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              {t('warning.description')}
            </p>
          </div>
        </div>

        {/* Public Key Card */}
        <div
          className={cn(
            'bg-card border border-border-subtle rounded-qs-xl p-6 mb-6'
          )}
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-foreground-secondary flex items-center gap-2">
              <span aria-hidden="true">🔐</span>
              {t('publicKey.label')}
              <Tooltip content={t('publicKey.dilithiumTooltip')}>
                <button
                  type="button"
                  className="text-foreground-tertiary hover:text-foreground-secondary transition-colors"
                  aria-label={t('publicKey.tooltipAriaLabel')}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </Tooltip>
            </span>
            <span
              className={cn(
                'text-xs px-3 py-1 rounded-full font-semibold',
                'bg-success/10 text-success'
              )}
            >
              {t('publicKey.badge')}
            </span>
          </div>

          <div
            className={cn(
              'font-mono text-sm bg-surface-secondary p-4 rounded-qs',
              'break-all leading-relaxed mb-4'
            )}
            aria-label={t('publicKey.ariaLabel')}
          >
            {keyInfo.publicKey}
          </div>

          <button
            onClick={handleCopyPublicKey}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'px-4 py-3 rounded-qs',
              'bg-surface-secondary border border-border',
              'text-sm text-foreground-secondary',
              'hover:border-gold hover:text-gold',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:ring-offset-2 focus:ring-offset-background',
              'transition-all'
            )}
            aria-label={t('publicKey.copyAriaLabel')}
            aria-live="polite"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span role="status">{t('publicKey.copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" aria-hidden="true" />
                {t('publicKey.copy')}
              </>
            )}
          </button>
        </div>

        {/* Key Management Actions */}
        <div className="mb-6">
          <span
            className={cn(
              'text-xs font-semibold tracking-wider uppercase text-gold',
              'flex items-center gap-2 mb-3'
            )}
          >
            <span
              className="w-4 h-px bg-gold"
              aria-hidden="true"
            />
            {t('sections.management')}
          </span>

          <div className="bg-card border border-border-subtle rounded-qs-xl overflow-hidden">
            {/* Backup */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className={cn(
                'w-full flex items-center gap-4 px-5 py-4',
                'border-b border-border-subtle',
                'hover:bg-surface-elevated transition-colors',
                'focus:outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-inset focus:ring-hinomaru/30',
                'text-left'
              )}
              aria-label={t('actions.backup.ariaLabel')}
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-surface-secondary rounded-qs'
                )}
                aria-hidden="true"
              >
                <HardDrive className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-0.5">
                  {t('actions.backup.title')}
                </h3>
                <p className="text-xs text-foreground-tertiary">
                  {t('actions.backup.description')}
                </p>
              </div>
              <span className="text-foreground-tertiary" aria-hidden="true">→</span>
            </button>

            {/* Export / Show Secret Key */}
            <button
              onClick={() => setIsExportModalOpen(true)}
              className={cn(
                'w-full flex items-center gap-4 px-5 py-4',
                'border-b border-border-subtle',
                'hover:bg-surface-elevated transition-colors',
                'focus:outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-inset focus:ring-hinomaru/30',
                'text-left'
              )}
              aria-label={t('actions.export.ariaLabel')}
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-surface-secondary rounded-qs'
                )}
                aria-hidden="true"
              >
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-0.5">
                  {t('actions.export.title')}
                </h3>
                <p className="text-xs text-foreground-tertiary">
                  {t('actions.export.description')}
                </p>
              </div>
              <span className="text-foreground-tertiary" aria-hidden="true">→</span>
            </button>

            {/* Regenerate Keys */}
            <button
              onClick={() => setIsRegenerateModalOpen(true)}
              className={cn(
                'w-full flex items-center gap-4 px-5 py-4',
                'hover:bg-surface-elevated transition-colors',
                'focus:outline-none focus:bg-surface-elevated focus:ring-2 focus:ring-inset focus:ring-danger/30',
                'text-left'
              )}
              aria-label={t('actions.regenerate.ariaLabel')}
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-danger/10 rounded-qs'
                )}
                aria-hidden="true"
              >
                <RefreshCw className="w-5 h-5 text-danger" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-0.5">
                  {t('actions.regenerate.title')}
                </h3>
                <p className="text-xs text-danger">
                  {t('actions.regenerate.description')}
                </p>
              </div>
              <span className="text-foreground-tertiary" aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        {/* Key History */}
        <div>
          <span
            className={cn(
              'text-xs font-semibold tracking-wider uppercase text-gold',
              'flex items-center gap-2 mb-3'
            )}
          >
            <span
              className="w-4 h-px bg-gold"
              aria-hidden="true"
            />
            {t('sections.history')}
          </span>

          <div className="bg-card border border-border-subtle rounded-qs-xl overflow-hidden">
            {/* Created Date */}
            <div
              className={cn(
                'flex items-center gap-4 px-5 py-4',
                'border-b border-border-subtle'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-surface-secondary rounded-qs'
                )}
                aria-hidden="true"
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-0.5">
                  {t('history.created.title')}
                </h3>
                <p className="text-xs text-foreground-tertiary font-mono">
                  {keyInfo.createdAt}
                </p>
              </div>
            </div>

            {/* Last Backup */}
            <div className="flex items-center gap-4 px-5 py-4">
              <div
                className={cn(
                  'w-10 h-10 flex items-center justify-center',
                  'bg-surface-secondary rounded-qs'
                )}
                aria-hidden="true"
              >
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground mb-0.5">
                  {t('history.lastBackup.title')}
                </h3>
                <p className="text-xs text-foreground-tertiary font-mono">
                  {keyInfo.lastBackup}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      <RegenerateModal
        isOpen={isRegenerateModalOpen}
        onClose={() => setIsRegenerateModalOpen(false)}
      />
    </div>
  );
}

export default KeyManagement;
