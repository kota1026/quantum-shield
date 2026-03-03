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
import { useUnlockDetail } from '@/hooks/explorer/useExplorer';
import type { UnlockDetail as UnlockDetailData } from '@/lib/api/explorer/types';

interface UnlockDetailProps {
  locale: string;
  unlockId: string;
}

export function UnlockDetail({ locale, unlockId }: UnlockDetailProps) {
  const t = useTranslations('explorer');
  const [copied, setCopied] = useState(false);

  const { data: unlock, isLoading, error } = useUnlockDetail(unlockId);

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

  const signedCount = unlock?.proverSigs?.signed ?? unlock?.provers.filter(p => p.signed).length ?? 0;
  const totalProvers = unlock?.proverSigs?.total ?? unlock?.provers.length ?? 5;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
          <Card padding="lg" className="animate-pulse">
            <div className="h-8 bg-background-secondary rounded w-1/3 mb-4" />
            <div className="h-4 bg-background-secondary rounded w-2/3 mb-2" />
            <div className="h-4 bg-background-secondary rounded w-1/2 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-24 bg-background-secondary rounded" />
              <div className="h-24 bg-background-secondary rounded" />
              <div className="h-24 bg-background-secondary rounded" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
        </div>
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
          <Card padding="lg" className="text-center py-16">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" aria-hidden="true" />
            <h1 className="text-xl font-semibold mb-2">{t('unlockDetail.notFound.title')}</h1>
            <p className="text-foreground-secondary mb-6">{error.message}</p>
            <Link href={`/${locale}/explorer/unlocks`}>
              <Button variant="primary">{t('unlockDetail.notFound.backToUnlocks')}</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

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
                    ? `${t('unlocks.timeLock.defense')}: ${unlock.timeLockRemaining || unlock.timeLock}`
                    : `${unlock.timeLockRemaining || unlock.timeLock} ${t('unlocks.timeLock.remaining')}`
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
              <div className="text-3xl font-bold text-gold mb-1">{unlock.amount ?? '-'}</div>
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
              <div className="text-lg mb-1">{unlock.requestTime}</div>
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
                  <span className="text-sm">{unlock.requestTime}</span>
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
                  <span className="text-sm">{unlock.timeLockEnd}</span>
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
                    {unlock.l2TxHash || unlock.shortId}
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
                {(unlock.timeline ?? []).map((item, index) => (
                  <div
                    key={`${item.event}-${index}`}
                    className={`flex items-start gap-3 ${index < (unlock.timeline?.length ?? 0) - 1 ? 'pb-4 border-l-2 border-surface-tertiary ml-2 pl-5 relative' : ''}`}
                  >
                    {index < (unlock.timeline?.length ?? 0) - 1 && (
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
                    {index === (unlock.timeline?.length ?? 0) - 1 && (
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
