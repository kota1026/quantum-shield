'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUnlocks } from '@/hooks/explorer';
import type { UnlockDetail } from '@/lib/v1/explorer/mock';

// Fallback data (used when API is unavailable)
const FALLBACK_UNLOCKS: UnlockDetail[] = [
  {
    id: '0x2e7f8d9a1b2c3d4e...d934a127',
    shortId: '0x2e7f...d934',
    lockId: '0x7a3f...e821',
    lockIdFull: '0x7a3f8b2c4d5e6f...e821d4f9',
    type: 'normal',
    status: 'pending',
    timeLock: '23h 14m',
    timeLockProgress: 3,
    proverSigs: { signed: 3, total: 5 },
    requestTime: '2026-01-10 14:46:22 UTC',
    timeLockEnd: '2026-01-11 14:46:22 UTC',
    dilithiumSig: 'dil3_sig_0x8f2a...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: false },
      { name: 'Prover Epsilon', signed: false },
    ],
  },
  {
    id: '0x5c9a0b1c2d3e4f5a...e127f8a9',
    shortId: '0x5c9a...e127',
    lockId: '0x4d8e...a923',
    lockIdFull: '0x4d8e9f0a1b2c3d...a923b4c5',
    type: 'emergency',
    status: 'pending' as const,
    timeLock: '6d 18h',
    timeLockProgress: 5,
    proverSigs: { signed: 5, total: 5 },
    requestTime: '2026-01-09 08:22:15 UTC',
    timeLockEnd: '2026-01-16 08:22:15 UTC',
    dilithiumSig: 'dil3_sig_0x9d2b...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: true },
    ],
  },
  {
    id: '0x3b1d4c5e6f7a8b9c...f842a1b2',
    shortId: '0x3b1d...f842',
    lockId: '0x1f6a...c734',
    lockIdFull: '0x1f6a7b8c9d0e1f...c734d5e6',
    type: 'normal' as const,
    status: 'complete' as const,
    timeLock: '-',
    timeLockProgress: 100,
    proverSigs: { signed: 5, total: 5 },
    requestTime: '2026-01-08 12:15:45 UTC',
    timeLockEnd: '2026-01-09 12:15:45 UTC',
    dilithiumSig: 'dil3_sig_0x7a1d...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: true },
    ],
  },
  {
    id: '0x7d4e5f6a7b8c9d0e...a563b7c8',
    shortId: '0x7d4e...a563',
    lockId: '0x8c3d...b156',
    lockIdFull: '0x8c3d4e5f6a7b8c...b156c2d3',
    type: 'normal' as const,
    status: 'challenged' as const,
    timeLock: '47h',
    timeLockProgress: 60,
    proverSigs: { signed: 4, total: 5 },
    requestTime: '2026-01-07 09:32:18 UTC',
    timeLockEnd: '2026-01-08 09:32:18 UTC',
    dilithiumSig: 'dil3_sig_0x5e8c...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: false },
    ],
  },
  {
    id: '0x9f2c3d4e5f6a7b8c...b718c9d0',
    shortId: '0x9f2c...b718',
    lockId: '0x2e7f...d934',
    lockIdFull: '0x2e7f3a4b5c6d7e...d934e5f6',
    type: 'normal' as const,
    status: 'complete' as const,
    timeLock: '-',
    timeLockProgress: 100,
    proverSigs: { signed: 5, total: 5 },
    requestTime: '2026-01-06 16:48:33 UTC',
    timeLockEnd: '2026-01-07 16:48:33 UTC',
    dilithiumSig: 'dil3_sig_0x2f9e...verified',
    dilithiumVerified: true,
    provers: [
      { name: 'Prover Alpha', signed: true },
      { name: 'Prover Beta', signed: true },
      { name: 'Prover Gamma', signed: true },
      { name: 'Prover Delta', signed: true },
      { name: 'Prover Epsilon', signed: true },
    ],
  },
];

type UnlockStatus = 'pending' | 'complete' | 'challenged';
type UnlockType = 'normal' | 'emergency';

interface ExplorerUnlocksProps {
  locale?: string;
}

export function ExplorerUnlocks({ locale = 'ja' }: ExplorerUnlocksProps) {
  const t = useTranslations('explorer');
  const [statusFilter, setStatusFilter] = useState<UnlockStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<UnlockType | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUnlock, setSelectedUnlock] = useState<UnlockDetail | null>(null);

  // Fetch data using hooks
  const { data: unlocksApi } = useUnlocks({
    status: statusFilter,
    type: typeFilter,
    page: currentPage,
  });

  // Use API data with fallback
  const mockUnlocks = unlocksApi?.unlocks ?? FALLBACK_UNLOCKS;

  const itemsPerPage = 5;
  const pendingCount = unlocksApi?.pending ?? 127;
  const completedCount = unlocksApi?.completed ?? 8234;
  const totalUnlocks = unlocksApi?.total ?? 8361;

  // Filter unlocks
  const filteredUnlocks = useMemo(() => {
    let result = [...mockUnlocks];

    if (statusFilter !== 'all') {
      result = result.filter(unlock => unlock.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(unlock => unlock.type === typeFilter);
    }

    return result;
  }, [statusFilter, typeFilter]);

  const totalPages = Math.ceil(filteredUnlocks.length / itemsPerPage);
  const paginatedUnlocks = filteredUnlocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadgeClass = (status: UnlockStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary';
      case 'complete':
        return 'bg-success/10 text-success';
      case 'challenged':
        return 'bg-warning/10 text-warning';
    }
  };

  const getStatusLabel = (status: UnlockStatus) => {
    return t(`common.status.${status === 'complete' ? 'complete' : status}`);
  };

  const closeDetailPanel = useCallback(() => {
    setSelectedUnlock(null);
  }, []);

  // Handle escape key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedUnlock) {
        closeDetailPanel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnlock, closeDetailPanel]);

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
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.overview')}
            </Link>
            <Link
              href={`/${locale}/explorer/locks`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.locks')}
            </Link>
            <Link
              href={`/${locale}/explorer/unlocks`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium bg-background-tertiary text-foreground rounded-full transition-colors"
              aria-current="page"
            >
              {t('common.header.unlocks')}
            </Link>
            <Link
              href={`/${locale}/explorer/challenges`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.challenges')}
            </Link>
            <Link
              href={`/${locale}/explorer/provers`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.provers')}
            </Link>
            <Link
              href={`/${locale}/explorer/analytics`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.analytics')}
            </Link>
          </nav>
        </header>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <span className="w-1 h-7 bg-hinomaru rounded-sm" aria-hidden="true" />
            {t('unlocks.pageTitle')}
          </h1>
          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-xl font-semibold text-gold">{pendingCount}</div>
              <div className="text-xs text-foreground-secondary">{t('unlocks.stats.pending')}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-gold">{completedCount.toLocaleString()}</div>
              <div className="text-xs text-foreground-secondary">{t('unlocks.stats.completed')}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UnlockStatus | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 min-h-[44px] bg-background-secondary border border-surface-tertiary rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
            aria-label={t('unlocks.table.status')}
          >
            <option value="all">{t('unlocks.filters.status.all')}</option>
            <option value="pending">{t('unlocks.filters.status.pending')}</option>
            <option value="complete">{t('unlocks.filters.status.complete')}</option>
            <option value="challenged">{t('unlocks.filters.status.challenged')}</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as UnlockType | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 min-h-[44px] bg-background-secondary border border-surface-tertiary rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
            aria-label={t('unlocks.table.type')}
          >
            <option value="all">{t('unlocks.filters.type.all')}</option>
            <option value="normal">{t('unlocks.filters.type.normal')}</option>
            <option value="emergency">{t('unlocks.filters.type.emergency')}</option>
          </select>
        </div>

        {/* Table */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={t('unlocks.table.ariaLabel')}>
              <thead>
                <tr className="bg-background-secondary border-b border-surface-tertiary">
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('unlocks.table.unlockId')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('unlocks.table.lockId')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('unlocks.table.type')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('unlocks.table.timeLock')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      {t('unlocks.table.proverSigs')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sr-only">{t('unlocks.table.proverSigsTooltip')}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{t('unlocks.table.proverSigsTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('unlocks.table.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUnlocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="text-foreground-secondary">{t('unlocks.emptyState.title')}</div>
                      <div className="text-sm text-foreground-tertiary mt-1">{t('unlocks.emptyState.description')}</div>
                    </td>
                  </tr>
                ) : (
                  paginatedUnlocks.map((unlock) => (
                    <tr
                      key={unlock.id}
                      onClick={() => setSelectedUnlock(unlock)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedUnlock(unlock);
                        }
                      }}
                      className="border-b border-surface-tertiary hover:bg-background-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hinomaru"
                      tabIndex={0}
                      role="button"
                      aria-label={`${t('unlocks.table.unlockId')} ${unlock.shortId}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{unlock.shortId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{unlock.lockId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={unlock.type === 'emergency' ? 'text-warning' : 'text-foreground-secondary'}>
                          {t(`common.unlockType.${unlock.type}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {unlock.status === 'challenged'
                          ? `${t('unlocks.timeLock.defense')}: ${unlock.timeLock}`
                          : unlock.timeLock === '-'
                            ? t('unlocks.timeLock.completed')
                            : `${unlock.timeLock} ${t('unlocks.timeLock.remaining')}`
                        }
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {unlock.proverSigs.signed}/{unlock.proverSigs.total}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(unlock.status)}`}>
                          {getStatusLabel(unlock.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUnlocks.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 border-t border-surface-tertiary">
              <div className="text-sm text-foreground-secondary">
                {t('unlocks.pagination.showing', {
                  start: (currentPage - 1) * itemsPerPage + 1,
                  end: Math.min(currentPage * itemsPerPage, filteredUnlocks.length),
                  total: totalUnlocks,
                })}
              </div>
              <div className="flex gap-2" role="navigation" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={t('unlocks.pagination.previous')}
                >
                  {t('unlocks.pagination.previous')}
                </Button>
                {[1, 2, 3].map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'primary' : 'secondary'}
                    size="sm"
                    className="min-w-[44px]"
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? 'page' : undefined}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={t('unlocks.pagination.next')}
                >
                  {t('unlocks.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Detail Panel Overlay */}
      {selectedUnlock && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={closeDetailPanel}
          aria-hidden="true"
        />
      )}

      {/* Detail Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[520px] max-w-full bg-background border-l border-surface-tertiary z-50 transform transition-transform duration-300 overflow-y-auto ${
          selectedUnlock ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t('unlocks.detail.title')}
        aria-hidden={!selectedUnlock}
      >
        {selectedUnlock && (
          <>
            {/* Detail Header */}
            <div className="flex justify-between items-center px-6 py-6 border-b border-surface-tertiary sticky top-0 bg-background z-10">
              <h2 className="text-lg font-semibold">{t('unlocks.detail.title')}</h2>
              <button
                onClick={closeDetailPanel}
                className="w-9 h-9 flex items-center justify-center bg-background-secondary border border-surface-tertiary rounded-lg text-foreground-secondary hover:text-foreground hover:border-surface-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru"
                aria-label={t('unlocks.detail.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Content */}
            <div className="px-6 py-6">
              {/* Status Badges */}
              <div className="flex gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(selectedUnlock.status)}`}>
                  {getStatusLabel(selectedUnlock.status)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-background-secondary text-foreground-secondary">
                  {t(`common.unlockType.${selectedUnlock.type}`)}
                </span>
              </div>

              {/* Time Lock Progress */}
              {selectedUnlock.status !== 'complete' && (
                <div className="mb-6">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-foreground-secondary">{t('unlocks.detail.timeLockProgress')}</span>
                    <span className="text-gold">
                      {selectedUnlock.status === 'challenged'
                        ? `${t('unlocks.timeLock.defense')}: ${selectedUnlock.timeLock}`
                        : `${selectedUnlock.timeLock} ${t('unlocks.timeLock.remaining')}`
                      }
                    </span>
                  </div>
                  <div className="h-2 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all"
                      style={{ width: `${selectedUnlock.timeLockProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Unlock Information */}
              <div className="mb-6">
                <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                  {t('unlocks.detail.sections.unlockInfo')}
                </h3>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlocks.detail.fields.unlockId')}</span>
                    <span className="font-mono text-sm text-right max-w-[60%] break-all">{selectedUnlock.shortId}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlocks.detail.fields.lockId')}</span>
                    <Link
                      href={`/${locale}/explorer/locks/${selectedUnlock.lockIdFull}`}
                      className="font-mono text-sm text-gold hover:underline"
                    >
                      {selectedUnlock.lockId}
                    </Link>
                  </div>
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlocks.detail.fields.requestTime')}</span>
                    <span className="text-sm">{selectedUnlock.requestTime}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-foreground-secondary text-sm">{t('unlocks.detail.fields.timeLockEnd')}</span>
                    <span className="text-sm">{selectedUnlock.timeLockEnd}</span>
                  </div>
                </div>
              </div>

              {/* Dilithium Signature */}
              <div className="mb-6">
                <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                  {t('unlocks.detail.sections.dilithiumSig')}
                </h3>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('unlocks.detail.fields.signatureHash')}</span>
                    <span className="font-mono text-xs">{selectedUnlock.dilithiumSig}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-foreground-secondary text-sm">{t('unlocks.detail.fields.verified')}</span>
                    <span className={selectedUnlock.dilithiumVerified ? 'text-success' : 'text-error'}>
                      {selectedUnlock.dilithiumVerified ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Prover Signatures */}
              <div className="mb-6">
                <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                  {t('unlocks.detail.sections.proverSigs')} ({selectedUnlock.proverSigs.signed}/{selectedUnlock.proverSigs.total})
                </h3>
                <div className="space-y-2">
                  {selectedUnlock.provers.map((prover) => (
                    <div
                      key={prover.name}
                      className="flex justify-between items-center p-3 bg-background-secondary rounded-lg"
                    >
                      <span className={`text-sm ${prover.signed ? 'text-gold' : 'text-foreground'}`}>
                        {prover.signed ? (
                          <Link href={`/${locale}/explorer/provers`} className="hover:underline">
                            {prover.name}
                          </Link>
                        ) : (
                          prover.name
                        )}
                      </span>
                      <span className={`text-xs ${prover.signed ? 'text-success' : 'text-foreground-tertiary'}`}>
                        {prover.signed ? t('unlocks.detail.proverStatus.signed') : t('unlocks.detail.proverStatus.pending')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
