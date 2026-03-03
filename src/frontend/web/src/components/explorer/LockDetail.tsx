'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import {
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Lock,
  Unlock,
  Clock,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Default lock data for initial state
const DEFAULT_LOCK_DATA: Record<string, {
  id: string;
  shortId: string;
  amount: string;
  status: 'active' | 'unlocking' | 'unlocked';
  lockTime: string;
  lockTimeFormatted: string;
  blockNumber: string;
  owner: string;
  ownerFull: string;
  dilithiumKey: string;
  l2TxHash: string;
  l2TxHashFull: string;
  l1TxHash: string;
  l1TxHashFull: string;
  unlockId?: string;
  timeline: Array<{
    event: 'locked' | 'unlockRequested' | 'timeLockStart' | 'proverApproval' | 'unlocked';
    time: string;
    completed: boolean;
  }>;
}> = {
  '0x7a3f8b2c4d5e6f...e821d4f9': {
    id: '0x7a3f8b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e821d4f9',
    shortId: '0x7a3f...e821',
    amount: '125.5',
    status: 'active',
    lockTime: '2026-01-10T14:32:18Z',
    lockTimeFormatted: '2026-01-10 14:32:18 UTC',
    blockNumber: '18,234,567',
    owner: '0x9b2c...f412',
    ownerFull: '0x9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5f412',
    dilithiumKey: 'dil3_0x8f2a9b3c4d5e6f7a8b9c0d1e2f3a...verified',
    l2TxHash: '0x4d8e...a923',
    l2TxHashFull: '0x4d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a923',
    l1TxHash: '0x1a2b...c3d4',
    l1TxHashFull: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c3d4',
    timeline: [
      { event: 'locked', time: '2026-01-10 14:32', completed: true },
    ],
  },
  '0x4d8e9f0a1b2c3d...a923b4c5': {
    id: '0x4d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3a923b4c5',
    shortId: '0x4d8e...a923',
    amount: '200.0',
    status: 'unlocking',
    lockTime: '2026-01-10T14:17:33Z',
    lockTimeFormatted: '2026-01-10 14:17:33 UTC',
    blockNumber: '18,234,489',
    owner: '0x2e7f...d934',
    ownerFull: '0x2e7f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3d934',
    dilithiumKey: 'dil3_0x9d2b8c4e5f6a7b8c9d0e1f2a3b4c...verified',
    l2TxHash: '0x5c9a...e127',
    l2TxHashFull: '0x5c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9e127',
    l1TxHash: '0x2b3c...d4e5',
    l1TxHashFull: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3d4e5',
    unlockId: '0x7a3f2e7f...d934a127',
    timeline: [
      { event: 'locked', time: '2026-01-10 14:17', completed: true },
      { event: 'unlockRequested', time: '2026-01-15 09:23', completed: true },
      { event: 'timeLockStart', time: '2026-01-15 09:23', completed: true },
      { event: 'proverApproval', time: '2026-01-15 10:45', completed: false },
      { event: 'unlocked', time: '-', completed: false },
    ],
  },
  '0x8c3d4e5f6a7b8c...b156c2d3': {
    id: '0x8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3e4f5a6b7c8b156c2d3',
    shortId: '0x8c3d...b156',
    amount: '320.0',
    status: 'unlocked',
    lockTime: '2026-01-10T14:01:58Z',
    lockTimeFormatted: '2026-01-10 14:01:58 UTC',
    blockNumber: '18,234,412',
    owner: '0x9f2c...b718',
    ownerFull: '0x9f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2b718',
    dilithiumKey: 'dil3_0x7a1d2b3c4d5e6f7a8b9c0d1e2f3a...verified',
    l2TxHash: '0xa4f2...c891',
    l2TxHashFull: '0xa4f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fc891',
    l1TxHash: '0x3c4d...e5f6',
    l1TxHashFull: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3e5f6',
    unlockId: '0x5c9a0b1c...e127f8a9',
    timeline: [
      { event: 'locked', time: '2026-01-10 14:01', completed: true },
      { event: 'unlockRequested', time: '2026-01-12 16:45', completed: true },
      { event: 'timeLockStart', time: '2026-01-12 16:45', completed: true },
      { event: 'proverApproval', time: '2026-01-13 08:12', completed: true },
      { event: 'unlocked', time: '2026-01-13 16:45', completed: true },
    ],
  },
};

interface LockDetailProps {
  locale: string;
  lockId: string;
}

export function LockDetail({ locale, lockId }: LockDetailProps) {
  const t = useTranslations('explorer');
  const [copied, setCopied] = useState(false);

  // Find lock by matching any part of the ID
  const lock = Object.values(DEFAULT_LOCK_DATA).find(
    (l) => l.id.includes(lockId) || l.shortId.includes(lockId) || lockId.includes(l.shortId.replace('...', ''))
  ) || DEFAULT_LOCK_DATA[lockId];

  const handleCopyLockId = useCallback(async () => {
    if (lock) {
      await navigator.clipboard.writeText(lock.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lock]);

  const getStatusBadgeClass = (status: 'active' | 'unlocking' | 'unlocked') => {
    switch (status) {
      case 'active':
        return 'bg-gold/10 text-gold';
      case 'unlocking':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary';
      case 'unlocked':
        return 'bg-success/10 text-success';
    }
  };

  const getStatusLabel = (status: 'active' | 'unlocking' | 'unlocked') => {
    return t(`common.status.${status === 'unlocked' ? 'complete' : status}`);
  };

  const getTimelineIcon = (event: string, completed: boolean) => {
    const iconClass = completed ? 'text-gold' : 'text-foreground-tertiary';
    switch (event) {
      case 'locked':
        return <Lock className={`w-4 h-4 ${iconClass}`} />;
      case 'unlockRequested':
        return <Unlock className={`w-4 h-4 ${iconClass}`} />;
      case 'timeLockStart':
        return <Clock className={`w-4 h-4 ${iconClass}`} />;
      case 'proverApproval':
        return <Shield className={`w-4 h-4 ${iconClass}`} />;
      case 'unlocked':
        return <CheckCircle2 className={`w-4 h-4 ${iconClass}`} />;
      default:
        return null;
    }
  };

  if (!lock) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
          <Card padding="lg" className="text-center py-16">
            <Lock className="w-16 h-16 mx-auto mb-4 text-foreground-tertiary" aria-hidden="true" />
            <h1 className="text-xl font-semibold mb-2">{t('lockDetail.notFound.title')}</h1>
            <p className="text-foreground-secondary mb-6">{t('lockDetail.notFound.description')}</p>
            <Link href={`/${locale}/explorer/locks`}>
              <Button variant="primary">{t('lockDetail.notFound.backToLocks')}</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Logo */}
          <Link href={`/${locale}/explorer/overview`} className="flex items-center gap-4">
            <div className="w-11 h-11 relative flex items-center justify-center">
              <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_25s_linear_infinite]">
                <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-gold rounded-full" />
              </div>
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">Quantum Shield</span>
              <span className="text-[10px] text-gold tracking-widest uppercase">Explorer</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="flex gap-1 bg-background-secondary p-1 rounded-full border border-surface-tertiary overflow-x-auto"
            role="navigation"
            aria-label="Explorer navigation"
          >
            <Link
              href={`/${locale}/explorer/overview`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.overview')}
            </Link>
            <Link
              href={`/${locale}/explorer/locks`}
              className="px-5 py-2 text-sm font-medium bg-background-tertiary text-foreground rounded-full transition-colors"
              aria-current="page"
            >
              {t('common.header.locks')}
            </Link>
            <Link
              href={`/${locale}/explorer/unlocks`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.unlocks')}
            </Link>
            <Link
              href={`/${locale}/explorer/challenges`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.challenges')}
            </Link>
            <Link
              href={`/${locale}/explorer/provers`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.provers')}
            </Link>
            <Link
              href={`/${locale}/explorer/analytics`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.analytics')}
            </Link>
          </nav>
        </header>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
          <Link
            href={`/${locale}/explorer/locks`}
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            {t('lockDetail.breadcrumb.locks')}
          </Link>
          <ChevronRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
          <span className="text-foreground">{t('lockDetail.breadcrumb.detail')}</span>
        </nav>

        {/* Overview Section */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gold mb-1">
                {t('lockDetail.fields.lockId')}
              </div>
              <div className="font-mono text-lg break-all">{lock.id}</div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadgeClass(lock.status)}`}>
              {getStatusLabel(lock.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background-secondary rounded-lg">
              <div className="text-3xl font-bold text-gold mb-1">{lock.amount}</div>
              <div className="text-sm text-foreground-secondary">ETH</div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg">
              <div className="text-xl font-mono mb-1">{lock.blockNumber}</div>
              <div className="text-sm text-foreground-secondary flex items-center justify-center gap-1">
                {t('lockDetail.fields.blockNumber')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-foreground-tertiary hover:text-foreground-secondary">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('lockDetail.fields.blockNumberTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg">
              <div className="text-lg mb-1">{lock.lockTimeFormatted}</div>
              <div className="text-sm text-foreground-secondary">{t('lockDetail.fields.lockTime')}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lock Information */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('lockDetail.sections.lockInfo')}
              </h2>
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('lockDetail.fields.lockId')}</span>
                  <span className="font-mono text-sm text-right max-w-[60%] break-all">{lock.shortId}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('lockDetail.fields.amount')}</span>
                  <span className="font-semibold">{lock.amount} ETH</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('lockDetail.fields.status')}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(lock.status)}`}>
                    {getStatusLabel(lock.status)}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-foreground-secondary text-sm">{t('lockDetail.fields.lockTime')}</span>
                  <span className="text-sm">{lock.lockTimeFormatted}</span>
                </div>
              </div>
            </Card>

            {/* Owner Information */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('lockDetail.sections.owner')}
              </h2>
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('lockDetail.fields.ownerAddress')}</span>
                  <Link
                    href={`/${locale}/explorer/address/${lock.ownerFull}`}
                    className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    {lock.owner}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('lockDetail.fields.dilithiumKey')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('lockDetail.fields.dilithiumKeyTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="font-mono text-xs text-right max-w-[50%] break-all">{lock.dilithiumKey}</span>
                </div>
              </div>
            </Card>

            {/* Transactions */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('lockDetail.sections.transactions')}
              </h2>
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('lockDetail.fields.l2TxHash')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('lockDetail.fields.l2TxHashTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <a
                    href="#"
                    className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    {lock.l2TxHash}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('lockDetail.fields.l1TxHash')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('lockDetail.fields.l1TxHashTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <a
                    href="#"
                    className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    {lock.l1TxHash}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Timeline & Actions */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('lockDetail.sections.timeline')}
              </h2>
              <div className="space-y-4">
                {lock.timeline.map((item, index) => (
                  <div
                    key={item.event}
                    className={`flex items-start gap-3 ${index < lock.timeline.length - 1 ? 'pb-4 border-l-2 border-surface-tertiary ml-2 pl-5 relative' : ''}`}
                  >
                    {index < lock.timeline.length - 1 && (
                      <div className="absolute left-[-9px] top-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${item.completed ? 'bg-gold' : 'bg-background-secondary border border-surface-tertiary'}`}>
                          {getTimelineIcon(item.event, item.completed)}
                        </div>
                      </div>
                    )}
                    {index === lock.timeline.length - 1 && (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-gold' : 'bg-background-secondary border border-surface-tertiary'}`}>
                        {getTimelineIcon(item.event, item.completed)}
                      </div>
                    )}
                    <div className={index < lock.timeline.length - 1 ? '' : ''}>
                      <div className={`text-sm font-medium ${item.completed ? 'text-foreground' : 'text-foreground-tertiary'}`}>
                        {t(`lockDetail.timeline.${item.event}`)}
                      </div>
                      <div className="text-xs text-foreground-tertiary">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Card padding="lg">
              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleCopyLockId}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      {t('lockDetail.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      {t('lockDetail.actions.copyLockId')}
                    </>
                  )}
                </Button>

                <a
                  href="#"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-surface-secondary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  {t('lockDetail.actions.viewOnL2')}
                </a>

                {lock.unlockId && (
                  <Link
                    href={`/${locale}/explorer/unlocks/${lock.unlockId}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-surface-secondary rounded-lg hover:bg-background-tertiary transition-colors"
                  >
                    <Unlock className="w-4 h-4" aria-hidden="true" />
                    {t('lockDetail.actions.viewUnlock')}
                  </Link>
                )}

                <Link
                  href={`/${locale}/explorer/address/${lock.ownerFull}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-surface-secondary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  {t('lockDetail.actions.viewOwner')}
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
