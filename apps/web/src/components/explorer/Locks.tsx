'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useLocks } from '@/hooks/explorer';
import type { LockDetail } from '@/lib/api/explorer/mock';

// Empty initial state (no fake data)
const FALLBACK_LOCKS: LockDetail[] = [];

type LockStatus = 'active' | 'unlocking' | 'unlocked';
type SortOption = 'newest' | 'oldest' | 'amountHigh' | 'amountLow';

interface ExplorerLocksProps {
  locale?: string;
}

export function ExplorerLocks({ locale = 'ja' }: ExplorerLocksProps) {
  const t = useTranslations('explorer');
  const [statusFilter, setStatusFilter] = useState<LockStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLock, setSelectedLock] = useState<LockDetail | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch data using hooks
  const { data: locksApi } = useLocks({
    status: statusFilter,
    sort: sortOption,
    search: searchQuery,
    page: currentPage,
  });

  // Use API data with fallback
  const mockLocks = locksApi?.locks ?? FALLBACK_LOCKS;

  const itemsPerPage = 6;
  const totalLocks = locksApi?.total ?? 0;
  const totalValue = locksApi ? `${totalLocks}` : '0';

  // Filter and sort locks
  const filteredLocks = useMemo(() => {
    let result = [...mockLocks];

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(lock => lock.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lock =>
        lock.shortId.toLowerCase().includes(query) ||
        lock.owner.toLowerCase().includes(query) ||
        lock.id.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortOption) {
      case 'oldest':
        result.reverse();
        break;
      case 'amountHigh':
        result.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
        break;
      case 'amountLow':
        result.sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
        break;
    }

    return result;
  }, [statusFilter, sortOption, searchQuery]);

  const totalPages = Math.ceil(filteredLocks.length / itemsPerPage);
  const paginatedLocks = filteredLocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadgeClass = (status: LockStatus) => {
    switch (status) {
      case 'active':
        return 'bg-gold/10 text-gold';
      case 'unlocking':
        return 'bg-foreground-tertiary/10 text-foreground-tertiary';
      case 'unlocked':
        return 'bg-success/10 text-success';
    }
  };

  const getStatusLabel = (status: LockStatus) => {
    return t(`common.status.${status === 'unlocked' ? 'complete' : status}`);
  };

  const handleCopyLockId = useCallback(async () => {
    if (selectedLock) {
      await navigator.clipboard.writeText(selectedLock.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [selectedLock]);

  const closeDetailPanel = useCallback(() => {
    setSelectedLock(null);
  }, []);

  // Handle escape key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedLock) {
        closeDetailPanel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedLock, closeDetailPanel]);

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
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium bg-background-tertiary text-foreground rounded-full transition-colors"
              aria-current="page"
            >
              {t('common.header.locks')}
            </Link>
            <Link
              href={`/${locale}/explorer/unlocks`}
              className="px-5 py-2 min-h-[44px] inline-flex items-center text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
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
            {t('locks.pageTitle')}
          </h1>
          <div className="flex gap-6">
            <div className="text-right">
              <div className="text-xl font-semibold text-gold">{totalLocks.toLocaleString()}</div>
              <div className="text-xs text-foreground-secondary">{t('locks.stats.totalLocks')}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-semibold text-gold">{totalValue}</div>
              <div className="text-xs text-foreground-secondary">{t('locks.stats.totalValue')}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as LockStatus | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 min-h-[44px] bg-background-secondary border border-surface-tertiary rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
            aria-label={t('locks.table.status')}
          >
            <option value="all">{t('locks.filters.status.all')}</option>
            <option value="active">{t('locks.filters.status.active')}</option>
            <option value="unlocking">{t('locks.filters.status.unlocking')}</option>
            <option value="unlocked">{t('locks.filters.status.unlocked')}</option>
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-4 py-2 min-h-[44px] bg-background-secondary border border-surface-tertiary rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
            aria-label="Sort order"
          >
            <option value="newest">{t('locks.filters.sort.newest')}</option>
            <option value="oldest">{t('locks.filters.sort.oldest')}</option>
            <option value="amountHigh">{t('locks.filters.sort.amountHigh')}</option>
            <option value="amountLow">{t('locks.filters.sort.amountLow')}</option>
          </select>

          <div className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-background-secondary border border-surface-tertiary rounded-lg flex-1 md:max-w-xs focus-within:border-hinomaru focus-within:ring-2 focus-within:ring-hinomaru/20">
            <Search className="w-4 h-4 text-foreground-tertiary flex-shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('locks.filters.searchPlaceholder')}
              className="flex-1 bg-transparent border-none text-sm text-foreground placeholder:text-foreground-tertiary outline-none min-h-[44px]"
              aria-label={t('locks.filters.searchPlaceholder')}
            />
          </div>
        </div>

        {/* Table */}
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={t('locks.table.ariaLabel')}>
              <thead>
                <tr className="bg-background-secondary border-b border-surface-tertiary">
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('locks.table.lockId')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('locks.table.owner')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('locks.table.amount')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('locks.table.lockTime')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('locks.table.status')}
                  </th>
                  <th scope="col" className="text-left px-4 py-3 text-[11px] font-semibold text-foreground-tertiary uppercase tracking-wider">
                    {t('locks.table.l2Tx')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLocks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="text-foreground-secondary">{t('locks.emptyState.title')}</div>
                      <div className="text-sm text-foreground-tertiary mt-1">{t('locks.emptyState.description')}</div>
                    </td>
                  </tr>
                ) : (
                  paginatedLocks.map((lock) => (
                    <tr
                      key={lock.id}
                      onClick={() => setSelectedLock(lock)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedLock(lock);
                        }
                      }}
                      className="border-b border-surface-tertiary hover:bg-background-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-hinomaru"
                      tabIndex={0}
                      role="button"
                      aria-label={`${t('locks.table.lockId')} ${lock.shortId}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{lock.shortId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{lock.owner}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold">{lock.amount}</span>
                        <span className="text-foreground-secondary ml-1">ETH</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{lock.lockTimeShort}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(lock.status)}`}>
                          {getStatusLabel(lock.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">{lock.l2Tx}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredLocks.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-4 border-t border-surface-tertiary">
              <div className="text-sm text-foreground-secondary">
                {t('locks.pagination.showing', {
                  start: (currentPage - 1) * itemsPerPage + 1,
                  end: Math.min(currentPage * itemsPerPage, filteredLocks.length),
                  total: totalLocks,
                })}
              </div>
              <div className="flex gap-2" role="navigation" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label={t('locks.pagination.previous')}
                >
                  {t('locks.pagination.previous')}
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
                <span className="px-2 py-1 text-foreground-secondary">...</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(4149)}
                  aria-label="Page 4149"
                >
                  4149
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label={t('locks.pagination.next')}
                >
                  {t('locks.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Detail Panel Overlay */}
      {selectedLock && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={closeDetailPanel}
          aria-hidden="true"
        />
      )}

      {/* Detail Panel */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[500px] max-w-full bg-background border-l border-surface-tertiary z-50 transform transition-transform duration-300 overflow-y-auto ${
          selectedLock ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={t('locks.detail.title')}
        aria-hidden={!selectedLock}
      >
        {selectedLock && (
          <>
            {/* Detail Header */}
            <div className="flex justify-between items-center px-6 py-6 border-b border-surface-tertiary sticky top-0 bg-background z-10">
              <h2 className="text-lg font-semibold">{t('locks.detail.title')}</h2>
              <button
                onClick={closeDetailPanel}
                className="w-9 h-9 flex items-center justify-center bg-background-secondary border border-surface-tertiary rounded-lg text-foreground-secondary hover:text-foreground hover:border-surface-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru"
                aria-label={t('locks.detail.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Detail Content */}
            <div className="px-6 py-6">
              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-background-secondary rounded-lg mb-6">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    selectedLock.status === 'active'
                      ? 'bg-gold'
                      : selectedLock.status === 'unlocking'
                      ? 'bg-foreground-tertiary'
                      : 'bg-success'
                  }`}
                  aria-hidden="true"
                />
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(selectedLock.status)}`}>
                  {getStatusLabel(selectedLock.status)}
                </span>
              </div>

              {/* Lock Information Section */}
              <div className="mb-6">
                <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                  {t('locks.detail.sections.lockInfo')}
                </h3>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('locks.detail.fields.lockId')}</span>
                    <span className="font-mono text-sm text-right max-w-[60%] break-all">{selectedLock.id}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('locks.detail.fields.amount')}</span>
                    <span className="font-semibold">{selectedLock.amount} ETH</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('locks.detail.fields.lockTime')}</span>
                    <span className="text-sm">{selectedLock.lockTime}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-foreground-secondary text-sm flex items-center gap-1">
                      {t('locks.detail.fields.blockNumber')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sr-only">{t('locks.detail.fields.blockNumberTooltip')}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{t('locks.detail.fields.blockNumberTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-mono text-sm">{selectedLock.blockNumber}</span>
                  </div>
                </div>
              </div>

              {/* Owner Section */}
              <div className="mb-6">
                <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                  {t('locks.detail.sections.owner')}
                </h3>
                <div className="space-y-0">
                  <div className="flex justify-between py-3 border-b border-surface-tertiary">
                    <span className="text-foreground-secondary text-sm">{t('locks.detail.fields.address')}</span>
                    <Link
                      href={`/${locale}/explorer/address/${selectedLock.ownerFull}`}
                      className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                    >
                      {selectedLock.owner}
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-foreground-secondary text-sm flex items-center gap-1">
                      {t('locks.detail.fields.dilithiumKey')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="sr-only">{t('locks.detail.fields.dilithiumKeyTooltip')}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{t('locks.detail.fields.dilithiumKeyTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-mono text-xs">{selectedLock.dilithiumKey}</span>
                  </div>
                </div>
              </div>

              {/* Transactions Section */}
              <div className="mb-6">
                <h3 className="text-[11px] uppercase tracking-wider text-gold mb-3">
                  {t('locks.detail.sections.transactions')}
                </h3>
                <div className="flex justify-between py-3">
                  <span className="text-foreground-secondary text-sm flex items-center gap-1">
                    {t('locks.detail.fields.l2TxHash')}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="sr-only">{t('locks.detail.fields.l2TxHashTooltip')}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{t('locks.detail.fields.l2TxHashTooltip')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <a
                    href="#"
                    className="font-mono text-sm text-gold hover:underline flex items-center gap-1"
                  >
                    {selectedLock.l2Tx}
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Link
                  href={`/${locale}/explorer/unlocks`}
                  className="flex-1 px-4 py-3 text-center text-sm font-medium border border-surface-secondary rounded-lg hover:bg-background-tertiary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru"
                >
                  {t('locks.detail.actions.viewUnlock')}
                </Link>
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleCopyLockId}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      {t('locks.detail.actions.copyLockId')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
