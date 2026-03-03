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
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Default unlock data for initial state
const DEFAULT_UNLOCK_DATA: Record<string, {
  id: string;
  shortId: string;
  lockId: string;
  lockIdFull: string;
  type: 'normal' | 'emergency';
  status: 'pending' | 'complete' | 'challenged';
  amount: string;
  requestTime: string;
  requestTimeFormatted: string;
  timeLockEnd: string;
  timeLockEndFormatted: string;
  timeLockRemaining: string;
  timeLockProgress: number;
  dilithiumSig: string;
  dilithiumVerified: boolean;
  l2TxHash: string;
  l2TxHashFull: string;
  provers: Array<{
    name: string;
    signed: boolean;
    signedAt?: string;
  }>;
  challenge?: {
    id: string;
    shortId: string;
    challenger: string;
    challengerFull: string;
    bond: string;
    defenseDeadline: string;
  };
  timeline: Array<{
    event: 'requested' | 'timeLockStart' | 'proverApproval' | 'timeLockEnd' | 'executed' | 'challenged';
    time: string;
    completed: boolean;
  }>;
}> = {
  '0x2e7f8d9a1b2c3d4e...d934a127': {
    id: '0x2e7f8d9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9d934a127',
    shortId: '0x2e7f...d934',
    lockId: '0x7a3f...e821',
    lockIdFull: '0x7a3f8b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e821d4f9',
    type: 'normal',
    status: 'pending',
    amount: '125.5',
    requestTime: '2026-01-10T14:46:22Z',
    requestTimeFormatted: '2026-01-10 14:46:22 UTC',
    timeLockEnd: '2026-01-11T14:46:22Z',
    timeLockEndFormatted: '2026-01-11 14:46:22 UTC',
    timeLockRemaining: '23h 14m',
    timeLockProgress: 3,
    dilithiumSig: 'dil3_sig_0x8f2a9b3c4d5e6f7a8b9c0d1e...verified',
    dilithiumVerified: true,
    l2TxHash: '0x4d8e...a923',
    l2TxHashFull: '0x4d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a923',
    provers: [
      { name: 'Prover Alpha', signed: true, signedAt: '2026-01-10 14:48:12 UTC' },
      { name: 'Prover Beta', signed: true, signedAt: '2026-01-10 14:49:33 UTC' },
      { name: 'Prover Gamma', signed: true, signedAt: '2026-01-10 14:51:18 UTC' },
      { name: 'Prover Delta', signed: false },
      { name: 'Prover Epsilon', signed: false },
    ],
    timeline: [
      { event: 'requested', time: '2026-01-10 14:46', completed: true },
      { event: 'timeLockStart', time: '2026-01-10 14:46', completed: true },
      { event: 'proverApproval', time: '2026-01-10 14:51', completed: true },
      { event: 'timeLockEnd', time: '2026-01-11 14:46', completed: false },
      { event: 'executed', time: '-', completed: false },
    ],
  },
  '0x5c9a0b1c2d3e4f5a...e127f8a9': {
    id: '0x5c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9e127f8a9',
    shortId: '0x5c9a...e127',
    lockId: '0x4d8e...a923',
    lockIdFull: '0x4d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a923b4c5',
    type: 'emergency',
    status: 'pending',
    amount: '200.0',
    requestTime: '2026-01-09T08:22:15Z',
    requestTimeFormatted: '2026-01-09 08:22:15 UTC',
    timeLockEnd: '2026-01-16T08:22:15Z',
    timeLockEndFormatted: '2026-01-16 08:22:15 UTC',
    timeLockRemaining: '6d 18h',
    timeLockProgress: 5,
    dilithiumSig: 'dil3_sig_0x9d2b8c4e5f6a7b8c9d0e1f2a3b...verified',
    dilithiumVerified: true,
    l2TxHash: '0x5c9a...e127',
    l2TxHashFull: '0x5c9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9e127',
    provers: [
      { name: 'Prover Alpha', signed: true, signedAt: '2026-01-09 08:45:22 UTC' },
      { name: 'Prover Beta', signed: true, signedAt: '2026-01-09 09:12:45 UTC' },
      { name: 'Prover Gamma', signed: true, signedAt: '2026-01-09 09:34:18 UTC' },
      { name: 'Prover Delta', signed: true, signedAt: '2026-01-09 10:15:33 UTC' },
      { name: 'Prover Epsilon', signed: true, signedAt: '2026-01-09 10:42:07 UTC' },
    ],
    timeline: [
      { event: 'requested', time: '2026-01-09 08:22', completed: true },
      { event: 'timeLockStart', time: '2026-01-09 08:22', completed: true },
      { event: 'proverApproval', time: '2026-01-09 10:42', completed: true },
      { event: 'timeLockEnd', time: '2026-01-16 08:22', completed: false },
      { event: 'executed', time: '-', completed: false },
    ],
  },
  '0x3b1d4c5e6f7a8b9c...f842a1b2': {
    id: '0x3b1d4c5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3f842a1b2',
    shortId: '0x3b1d...f842',
    lockId: '0x1f6a...c734',
    lockIdFull: '0x1f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3c734d5e6',
    type: 'normal',
    status: 'complete',
    amount: '320.0',
    requestTime: '2026-01-08T12:15:45Z',
    requestTimeFormatted: '2026-01-08 12:15:45 UTC',
    timeLockEnd: '2026-01-09T12:15:45Z',
    timeLockEndFormatted: '2026-01-09 12:15:45 UTC',
    timeLockRemaining: '-',
    timeLockProgress: 100,
    dilithiumSig: 'dil3_sig_0x7a1d2b3c4d5e6f7a8b9c0d1e2f...verified',
    dilithiumVerified: true,
    l2TxHash: '0xa4f2...c891',
    l2TxHashFull: '0xa4f2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0fc891',
    provers: [
      { name: 'Prover Alpha', signed: true, signedAt: '2026-01-08 12:32:15 UTC' },
      { name: 'Prover Beta', signed: true, signedAt: '2026-01-08 12:45:22 UTC' },
      { name: 'Prover Gamma', signed: true, signedAt: '2026-01-08 13:01:18 UTC' },
      { name: 'Prover Delta', signed: true, signedAt: '2026-01-08 13:22:45 UTC' },
      { name: 'Prover Epsilon', signed: true, signedAt: '2026-01-08 13:45:33 UTC' },
    ],
    timeline: [
      { event: 'requested', time: '2026-01-08 12:15', completed: true },
      { event: 'timeLockStart', time: '2026-01-08 12:15', completed: true },
      { event: 'proverApproval', time: '2026-01-08 13:45', completed: true },
      { event: 'timeLockEnd', time: '2026-01-09 12:15', completed: true },
      { event: 'executed', time: '2026-01-09 12:16', completed: true },
    ],
  },
  '0x7d4e5f6a7b8c9d0e...a563b7c8': {
    id: '0x7d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3a563b7c8',
    shortId: '0x7d4e...a563',
    lockId: '0x8c3d...b156',
    lockIdFull: '0x8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3e4f5a6b7c8b156c2d3',
    type: 'normal',
    status: 'challenged',
    amount: '450.0',
    requestTime: '2026-01-07T09:32:18Z',
    requestTimeFormatted: '2026-01-07 09:32:18 UTC',
    timeLockEnd: '2026-01-08T09:32:18Z',
    timeLockEndFormatted: '2026-01-08 09:32:18 UTC',
    timeLockRemaining: '47h',
    timeLockProgress: 60,
    dilithiumSig: 'dil3_sig_0x5e8c4d5e6f7a8b9c0d1e2f3a4b...verified',
    dilithiumVerified: true,
    l2TxHash: '0x7d4e...a563',
    l2TxHashFull: '0x7d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2d3a563',
    provers: [
      { name: 'Prover Alpha', signed: true, signedAt: '2026-01-07 09:45:22 UTC' },
      { name: 'Prover Beta', signed: true, signedAt: '2026-01-07 10:02:15 UTC' },
      { name: 'Prover Gamma', signed: true, signedAt: '2026-01-07 10:18:33 UTC' },
      { name: 'Prover Delta', signed: true, signedAt: '2026-01-07 10:35:45 UTC' },
      { name: 'Prover Epsilon', signed: false },
    ],
    challenge: {
      id: '0xc1a2b3c4d5e6f7a8...ch001',
      shortId: '0xc1a2...ch001',
      challenger: '0x9f2c...b718',
      challengerFull: '0x9f2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9a0b1c2b718',
      bond: '10.0',
      defenseDeadline: '2026-01-09 09:32:18 UTC',
    },
    timeline: [
      { event: 'requested', time: '2026-01-07 09:32', completed: true },
      { event: 'timeLockStart', time: '2026-01-07 09:32', completed: true },
      { event: 'proverApproval', time: '2026-01-07 10:35', completed: true },
      { event: 'challenged', time: '2026-01-07 18:22', completed: true },
      { event: 'timeLockEnd', time: '-', completed: false },
      { event: 'executed', time: '-', completed: false },
    ],
  },
};

interface UnlockDetailProps {
  locale: string;
  unlockId: string;
}

export function UnlockDetail({ locale, unlockId }: UnlockDetailProps) {
  const t = useTranslations('explorer');
  const [copied, setCopied] = useState(false);

  // Find unlock by matching any part of the ID
  const unlock = Object.values(DEFAULT_UNLOCK_DATA).find(
    (u) => u.id.includes(unlockId) || u.shortId.includes(unlockId) || unlockId.includes(u.shortId.replace('...', ''))
  ) || DEFAULT_UNLOCK_DATA[unlockId];

  const handleCopyUnlockId = useCallback(async () => {
    if (unlock) {
      await navigator.clipboard.writeText(unlock.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [unlock]);

  const getStatusBadgeClass = (status: 'pending' | 'complete' | 'challenged') => {
    switch (status) {
      case 'pending':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary';
      case 'complete':
        return 'bg-success/10 text-success';
      case 'challenged':
        return 'bg-warning/10 text-warning';
    }
  };

  const getStatusLabel = (status: 'pending' | 'complete' | 'challenged') => {
    return t(`common.status.${status === 'complete' ? 'complete' : status}`);
  };

  const getTypeBadgeClass = (type: 'normal' | 'emergency') => {
    return type === 'emergency'
      ? 'bg-warning/10 text-warning'
      : 'bg-background-secondary text-foreground-secondary';
  };

  const getTimelineIcon = (event: string, completed: boolean) => {
    const iconClass = completed ? 'text-gold' : 'text-foreground-tertiary';
    switch (event) {
      case 'requested':
        return <Unlock className={`w-4 h-4 ${iconClass}`} />;
      case 'timeLockStart':
        return <Clock className={`w-4 h-4 ${iconClass}`} />;
      case 'proverApproval':
        return <Shield className={`w-4 h-4 ${iconClass}`} />;
      case 'timeLockEnd':
        return <Clock className={`w-4 h-4 ${iconClass}`} />;
      case 'executed':
        return <CheckCircle2 className={`w-4 h-4 ${iconClass}`} />;
      case 'challenged':
        return <AlertTriangle className={`w-4 h-4 ${iconClass}`} />;
      default:
        return null;
    }
  };

  const signedCount = unlock?.provers.filter(p => p.signed).length || 0;
  const totalProvers = unlock?.provers.length || 5;

  if (!unlock) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
          <Card padding="lg" className="text-center py-16">
            <Unlock className="w-16 h-16 mx-auto mb-4 text-foreground-tertiary" aria-hidden="true" />
            <h1 className="text-xl font-semibold mb-2">{t('unlockDetail.notFound.title')}</h1>
            <p className="text-foreground-secondary mb-6">{t('unlockDetail.notFound.description')}</p>
            <Link href={`/${locale}/explorer/unlocks`}>
              <Button variant="primary">{t('unlockDetail.notFound.backToUnlocks')}</Button>
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
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.locks')}
            </Link>
            <Link
              href={`/${locale}/explorer/unlocks`}
              className="px-5 py-2 text-sm font-medium bg-background-tertiary text-foreground rounded-full transition-colors"
              aria-current="page"
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
            href={`/${locale}/explorer/unlocks`}
            className="text-foreground-secondary hover:text-foreground transition-colors"
          >
            {t('unlockDetail.breadcrumb.unlocks')}
          </Link>
          <ChevronRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
          <span className="text-foreground">{t('unlockDetail.breadcrumb.detail')}</span>
        </nav>

        {/* Overview Section */}
        <Card padding="lg" className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-gold mb-1">
                {t('unlockDetail.fields.unlockId')}
              </div>
              <div className="font-mono text-lg break-all">{unlock.id}</div>
            </div>
            <div className="flex gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${getStatusBadgeClass(unlock.status)}`}>
                {getStatusLabel(unlock.status)}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${getTypeBadgeClass(unlock.type)}`}>
                {t(`common.unlockType.${unlock.type}`)}
              </span>
            </div>
          </div>

          {/* Time Lock Progress (if not complete) */}
          {unlock.status !== 'complete' && (
            <div className="mb-6">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-foreground-secondary">{t('unlockDetail.timeLockProgress')}</span>
                <span className="text-gold">
                  {unlock.status === 'challenged'
                    ? `${t('unlocks.timeLock.defense')}: ${unlock.timeLockRemaining}`
                    : `${unlock.timeLockRemaining} ${t('unlocks.timeLock.remaining')}`
                  }
                </span>
              </div>
              <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    unlock.status === 'challenged'
                      ? 'bg-gradient-to-r from-warning to-error'
                      : 'bg-gradient-to-r from-hinomaru to-gold'
                  }`}
                  style={{ width: `${unlock.timeLockProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background-secondary rounded-lg">
              <div className="text-3xl font-bold text-gold mb-1">{unlock.amount}</div>
              <div className="text-sm text-foreground-secondary">ETH</div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg">
              <div className="text-xl font-semibold text-gold mb-1">{signedCount}/{totalProvers}</div>
              <div className="text-sm text-foreground-secondary flex items-center justify-center gap-1">
                {t('unlockDetail.sections.proverSigs')}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-foreground-tertiary hover:text-foreground-secondary">
                        <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{t('unlocks.table.proverSigsTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="text-center p-4 bg-background-secondary rounded-lg">
              <div className="text-lg mb-1">{unlock.requestTimeFormatted}</div>
              <div className="text-sm text-foreground-secondary">{t('unlockDetail.fields.requestTime')}</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unlock Information */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('unlockDetail.sections.unlockInfo')}
              </h2>
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.unlockId')}</span>
                  <span className="font-mono text-sm text-right max-w-[60%] break-all">{unlock.shortId}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.lockId')}</span>
                  <Link
                    href={`/${locale}/explorer/locks/${unlock.lockIdFull}`}
                    className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    {unlock.lockId}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('unlockDetail.fields.type')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('unlockDetail.fields.typeTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className={unlock.type === 'emergency' ? 'text-warning' : 'text-foreground-secondary'}>
                    {t(`common.unlockType.${unlock.type}`)}
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.requestTime')}</span>
                  <span className="text-sm">{unlock.requestTimeFormatted}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('unlockDetail.fields.timeLockEnd')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('unlockDetail.fields.timeLockEndTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="text-sm">{unlock.timeLockEndFormatted}</span>
                </div>
              </div>
            </Card>

            {/* Dilithium Signature */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('unlockDetail.sections.dilithiumSig')}
              </h2>
              <div className="space-y-0">
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('unlockDetail.fields.signatureHash')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('unlockDetail.fields.signatureHashTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <span className="font-mono text-xs text-right max-w-[50%] break-all">{unlock.dilithiumSig}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-surface-tertiary">
                  <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.verified')}</span>
                  <span className={unlock.dilithiumVerified ? 'text-success' : 'text-error'}>
                    {unlock.dilithiumVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('unlockDetail.fields.l2TxHash')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('unlockDetail.fields.l2TxHashTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <a
                    href="#"
                    className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    {unlock.l2TxHash}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </Card>

            {/* Prover Signatures */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('unlockDetail.sections.proverSigs')} ({signedCount}/{totalProvers})
              </h2>
              <div className="space-y-2">
                {unlock.provers.map((prover) => (
                  <div
                    key={prover.name}
                    className="flex justify-between items-center p-3 bg-background-secondary rounded-lg"
                  >
                    <div>
                      <span className={`text-sm ${prover.signed ? 'text-gold' : 'text-foreground'}`}>
                        {prover.signed ? (
                          <Link href={`/${locale}/explorer/provers`} className="hover:underline">
                            {prover.name}
                          </Link>
                        ) : (
                          prover.name
                        )}
                      </span>
                      {prover.signedAt && (
                        <div className="text-xs text-foreground-tertiary mt-0.5">{prover.signedAt}</div>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prover.signed
                        ? 'bg-success/10 text-success'
                        : 'bg-foreground-tertiary/10 text-foreground-tertiary'
                    }`}>
                      {prover.signed ? t('unlockDetail.proverStatus.signed') : t('unlockDetail.proverStatus.pending')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Challenge Information (if challenged) */}
            {unlock.challenge && (
              <Card padding="lg" className="border-warning/30">
                <h2 className="text-[11px] uppercase tracking-wider text-warning mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                  {t('unlockDetail.sections.challenge')}
                </h2>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.challengeId')}</span>
                    <Link
                      href={`/${locale}/explorer/challenges/${unlock.challenge.id}`}
                      className="font-mono text-sm text-warning hover:underline flex items-center gap-1"
                    >
                      {unlock.challenge.shortId}
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.challenger')}</span>
                    <Link
                      href={`/${locale}/explorer/address/${unlock.challenge.challengerFull}`}
                      className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                    >
                      {unlock.challenge.challenger}
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.bond')}</span>
                    <span className="font-semibold">{unlock.challenge.bond} ETH</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-foreground-secondary text-sm">{t('unlockDetail.fields.defenseDeadline')}</span>
                    <span className="text-warning">{unlock.challenge.defenseDeadline}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Timeline & Actions */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card padding="lg">
              <h2 className="text-[11px] uppercase tracking-wider text-gold mb-4">
                {t('unlockDetail.sections.timeline')}
              </h2>
              <div className="space-y-4">
                {unlock.timeline.map((item, index) => (
                  <div
                    key={`${item.event}-${index}`}
                    className={`flex items-start gap-3 ${index < unlock.timeline.length - 1 ? 'pb-4 border-l-2 border-surface-tertiary ml-2 pl-5 relative' : ''}`}
                  >
                    {index < unlock.timeline.length - 1 && (
                      <div className="absolute left-[-9px] top-0">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          item.completed
                            ? item.event === 'challenged' ? 'bg-warning' : 'bg-gold'
                            : 'bg-background-secondary border border-surface-tertiary'
                        }`}>
                          {getTimelineIcon(item.event, item.completed)}
                        </div>
                      </div>
                    )}
                    {index === unlock.timeline.length - 1 && (
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.completed
                          ? item.event === 'challenged' ? 'bg-warning' : 'bg-gold'
                          : 'bg-background-secondary border border-surface-tertiary'
                      }`}>
                        {getTimelineIcon(item.event, item.completed)}
                      </div>
                    )}
                    <div>
                      <div className={`text-sm font-medium ${
                        item.completed
                          ? item.event === 'challenged' ? 'text-warning' : 'text-foreground'
                          : 'text-foreground-tertiary'
                      }`}>
                        {t(`unlockDetail.timeline.${item.event}`)}
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
                  onClick={handleCopyUnlockId}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      {t('unlockDetail.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      {t('unlockDetail.actions.copyUnlockId')}
                    </>
                  )}
                </Button>

                <Link
                  href={`/${locale}/explorer/locks/${unlock.lockIdFull}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-surface-secondary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  {t('unlockDetail.actions.viewLock')}
                </Link>

                <a
                  href="#"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-surface-secondary rounded-lg hover:bg-background-tertiary transition-colors"
                >
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  {t('unlockDetail.actions.viewOnL2')}
                </a>

                {unlock.challenge && (
                  <Link
                    href={`/${locale}/explorer/challenges/${unlock.challenge.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-warning text-warning rounded-lg hover:bg-warning/10 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                    {t('unlockDetail.actions.viewChallenge')}
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
