'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Coins,
  Bell,
  Lock,
  Swords,
  LogOut,
  RefreshCw,
  X,
  Clock,
  AlertCircle,
  Unlock,
  Inbox,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';

// Mock data
const mockStats = {
  pending: 12,
  urgent: 4,
  avgWait: '4m 32s',
  todayProcessed: 847,
};

type RequestType = 'unlock' | 'emergency';
type WaitStatus = 'normal' | 'urgent' | 'critical';

interface QueueItem {
  id: string;
  type: RequestType;
  address: string;
  amount: string;
  waitTime: string;
  waitStatus: WaitStatus;
  sourceChain: string;
  destChain: string;
  dilithiumSig: string;
}

const mockQueueItems: QueueItem[] = [
  {
    id: 'UNL-78421',
    type: 'unlock',
    address: '0x7a3f...9c2d',
    amount: '5.25',
    waitTime: '2m 34s',
    waitStatus: 'urgent',
    sourceChain: 'L3 Aegis',
    destChain: 'Ethereum L1',
    dilithiumSig: '0x2b8f4a...verified',
  },
  {
    id: 'UNL-78420',
    type: 'unlock',
    address: '0x8b2c...1e5a',
    amount: '12.00',
    waitTime: '4m 12s',
    waitStatus: 'urgent',
    sourceChain: 'L3 Aegis',
    destChain: 'Ethereum L1',
    dilithiumSig: '0x9c3f7b...verified',
  },
  {
    id: 'EMG-12045',
    type: 'emergency',
    address: '0x3d9f...7c4b',
    amount: '2.50',
    waitTime: '8m 45s',
    waitStatus: 'critical',
    sourceChain: 'L3 Aegis',
    destChain: 'Ethereum L1',
    dilithiumSig: '0x7d4e2a...verified',
  },
  {
    id: 'UNL-78419',
    type: 'unlock',
    address: '0x2f8a...4d1c',
    amount: '0.85',
    waitTime: '1m 20s',
    waitStatus: 'normal',
    sourceChain: 'L3 Aegis',
    destChain: 'Ethereum L1',
    dilithiumSig: '0x1a5c9d...verified',
  },
  {
    id: 'UNL-78418',
    type: 'unlock',
    address: '0x9c3e...2b7f',
    amount: '3.40',
    waitTime: '0m 58s',
    waitStatus: 'normal',
    sourceChain: 'L3 Aegis',
    destChain: 'Ethereum L1',
    dilithiumSig: '0x8b2f4c...verified',
  },
];

type FilterType = 'all' | 'normal' | 'emergency' | 'urgent';
type SigningState = 'idle' | 'confirming' | 'processing' | 'success' | 'error';

export function ProverQueue() {
  const t = useTranslations('prover');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedRequest, setSelectedRequest] = useState<QueueItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [signingState, setSigningState] = useState<SigningState>('idle');
  const [batchSigningState, setBatchSigningState] = useState<SigningState>('idle');
  const [processingStep, setProcessingStep] = useState(0);

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/prover/dashboard' },
    { key: 'queue', icon: FileText, href: '/prover/queue', active: true, badge: 12 },
    { key: 'metrics', icon: BarChart3, href: '/prover/metrics' },
    { key: 'rewards', icon: Coins, href: '/prover/rewards' },
  ];

  const managementItems = [
    { key: 'alerts', icon: Bell, href: '/prover/alerts', badge: 2, badgeVariant: 'warning' as const },
    { key: 'stake', icon: Lock, href: '/prover/alerts' },
    { key: 'challenges', icon: Swords, href: '/prover/challenge' },
  ];

  const filters: { key: FilterType; count: number }[] = [
    { key: 'all', count: 12 },
    { key: 'normal', count: 9 },
    { key: 'emergency', count: 3 },
    { key: 'urgent', count: 4 },
  ];

  const filteredItems = mockQueueItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'normal') return item.type === 'unlock';
    if (activeFilter === 'emergency') return item.type === 'emergency';
    if (activeFilter === 'urgent') return item.waitStatus === 'urgent' || item.waitStatus === 'critical';
    return true;
  });

  const isAnyModalOpen = showDetailModal || showSignModal || showBatchModal;

  const handleCloseModals = useCallback(() => {
    setShowDetailModal(false);
    setShowSignModal(false);
    setShowBatchModal(false);
    setSigningState('idle');
    setBatchSigningState('idle');
    setProcessingStep(0);
  }, []);

  // Handle Escape key to close modals
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAnyModalOpen) {
        handleCloseModals();
      }
    },
    [isAnyModalOpen, handleCloseModals]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  const handleRowClick = (item: QueueItem) => {
    setSelectedRequest(item);
    setShowDetailModal(true);
  };

  const handleSignClick = (item: QueueItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRequest(item);
    setSigningState('confirming');
    setShowSignModal(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Simulate signing process
  const handleConfirmSign = async () => {
    setSigningState('processing');
    setProcessingStep(1);

    // Step 1: Verifying Dilithium signature
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProcessingStep(2);

    // Step 2: Generating SPHINCS+ signature
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessingStep(3);

    // Step 3: Broadcasting to network
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setProcessingStep(4);

    // Complete
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSigningState('success');
  };

  // Simulate batch signing process
  const handleConfirmBatchSign = async () => {
    setBatchSigningState('processing');
    setProcessingStep(1);

    // Step 1: Verifying signatures
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessingStep(2);

    // Step 2: Generating batch signature
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setProcessingStep(3);

    // Step 3: Broadcasting
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setProcessingStep(4);

    // Complete
    await new Promise((resolve) => setTimeout(resolve, 500));
    setBatchSigningState('success');
  };

  const processingSteps = [
    { key: 'verifying', label: t('queue.process.verifying') },
    { key: 'generating', label: t('queue.process.generating') },
    { key: 'broadcasting', label: t('queue.process.broadcasting') },
    { key: 'complete', label: t('queue.process.complete') },
  ];

  return (
    <TooltipProvider>
    <div className="flex min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside className="w-64 bg-background-secondary border-r border-surface-tertiary p-6 flex flex-col">
        <Link href="/prover/landing" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
            </div>
            <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-base font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1px]">Prover Portal</div>
          </div>
        </Link>

        <nav className="flex-1" aria-label={t('dashboard.nav.operations')}>
          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2">
            {t('dashboard.nav.operations')}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
                item.active
                  ? 'bg-hinomaru/10 text-hinomaru-400'
                  : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
              }`}
              aria-current={item.active ? 'page' : undefined}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant="danger" className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
            {t('dashboard.nav.management')}
          </div>
          {managementItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground mb-1 transition-colors"
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant={item.badgeVariant || 'danger'} className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
            {t('dashboard.nav.account')}
          </div>
          <Link
            href="/prover/exit"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            {t('dashboard.nav.exit')}
          </Link>
        </nav>

        {/* Prover Status */}
        <div className="mt-auto p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" aria-hidden="true" />
            <div>
              <div className="text-sm font-semibold">Prover #047</div>
              <div className="text-[11px] text-gold">Tier 1 • Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Premium Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -top-24 left-1/2 -translate-x-1/2',
              'w-[800px] h-[500px]',
              'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
              'opacity-50'
            )}
          />
        </div>

        <div className="relative z-10">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">{t('queue.title')}</h1>
              <p className="text-foreground-secondary text-sm lg:text-base">{t('queue.description')}</p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('queue.refresh')}
              </Button>
              <Button variant="primary" onClick={() => setShowBatchModal(true)}>
                {t('queue.signAll', { count: mockStats.pending })}
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card variant="hoverGradient" padding="md">
              <div className="text-xs text-foreground-tertiary mb-1">{t('queue.stats.pending')}</div>
              <div className="text-2xl font-bold font-mono">{mockStats.pending}</div>
            </Card>
            <Card variant="hoverGradient" padding="md">
              <div className="text-xs text-foreground-tertiary mb-1">{t('queue.stats.urgent')}</div>
              <div className="text-2xl font-bold font-mono text-warning">{mockStats.urgent}</div>
            </Card>
            <Card variant="hoverGradient" padding="md">
              <div className="text-xs text-foreground-tertiary mb-1">{t('queue.stats.avgWait')}</div>
              <div className="text-2xl font-bold font-mono">{mockStats.avgWait}</div>
            </Card>
            <Card variant="hoverGradient" padding="md">
              <div className="text-xs text-foreground-tertiary mb-1">{t('queue.stats.todayProcessed')}</div>
              <div className="text-2xl font-bold font-mono">{mockStats.todayProcessed}</div>
            </Card>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-3 mb-5" role="group" aria-label={t('queue.filterLabel')}>
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  activeFilter === filter.key
                    ? 'bg-hinomaru/10 border-hinomaru text-hinomaru-400'
                    : 'bg-background-secondary border-surface-tertiary text-foreground-secondary hover:border-foreground-tertiary hover:text-foreground'
                }`}
                aria-pressed={activeFilter === filter.key}
              >
                {t(`queue.filter.${filter.key}`)} ({filter.count})
              </button>
            ))}
          </div>

          {/* Queue Table or Empty State */}
          {filteredItems.length === 0 ? (
            <Card className="p-20 text-center">
              <Inbox className="h-16 w-16 mx-auto mb-6 text-foreground-tertiary opacity-50" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-3">{t('queue.empty.title')}</h3>
              <p className="text-foreground-secondary max-w-md mx-auto mb-6">{t('queue.empty.description')}</p>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('queue.empty.refresh')}
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[700px]" role="grid" aria-label={t('queue.tableLabel')}>
                <thead>
                  <tr className="bg-background-secondary border-b border-surface-tertiary">
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('queue.table.requestId')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('queue.table.type')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('queue.table.userAddress')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('queue.table.amount')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('queue.table.waitTime')}
                    </th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                      {t('queue.table.action')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className="border-b border-surface-tertiary hover:bg-surface cursor-pointer transition-colors"
                      tabIndex={0}
                      role="row"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleRowClick(item);
                        }
                      }}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-gold">#{item.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        {item.type === 'emergency' ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="warning"
                                className="text-[11px] px-2.5 py-0.5 cursor-help"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                                {t('queue.type.emergency')}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{t('queue.tooltip.emergency')}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Badge
                            variant="danger"
                            className="text-[11px] px-2.5 py-0.5"
                          >
                            <Unlock className="h-3 w-3 mr-1" aria-hidden="true" />
                            {t('queue.type.unlock')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-foreground-secondary">{item.address}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-semibold">{item.amount} ETH</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`font-mono text-sm flex items-center gap-1 ${
                            item.waitStatus === 'critical'
                              ? 'text-danger'
                              : item.waitStatus === 'urgent'
                                ? 'text-warning'
                                : 'text-foreground-secondary'
                          }`}
                        >
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {item.waitTime}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleSignClick(item, e)}
                          aria-label={t('queue.signRequest', { id: item.id })}
                        >
                          {t('queue.sign')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </main>

      {/* Request Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
          onClick={handleCloseModals}
        >
          <div
            className="bg-background-secondary border border-surface-tertiary rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-5 border-b border-surface-tertiary">
              <h2 id="detail-modal-title" className="text-lg font-semibold">
                {t('queue.detail.title', { id: selectedRequest.id })}
              </h2>
              <button
                onClick={handleCloseModals}
                className="w-11 h-11 flex items-center justify-center bg-surface rounded-lg text-foreground-secondary hover:text-foreground transition-colors"
                aria-label={t('queue.modal.close')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.detail.type')}
                  </div>
                  <div className="text-base font-semibold font-mono">
                    {selectedRequest.type === 'emergency' ? t('queue.type.emergency') : t('queue.type.normalUnlock')}
                  </div>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.detail.amount')}
                  </div>
                  <div className="text-base font-semibold font-mono">{selectedRequest.amount} ETH</div>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.detail.userAddress')}
                  </div>
                  <div className="text-sm font-mono">{selectedRequest.address}</div>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.detail.waitTime')}
                  </div>
                  <div
                    className={`text-base font-semibold font-mono ${
                      selectedRequest.waitStatus === 'critical'
                        ? 'text-danger'
                        : selectedRequest.waitStatus === 'urgent'
                          ? 'text-warning'
                          : ''
                    }`}
                  >
                    {selectedRequest.waitTime}
                  </div>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.detail.sourceChain')}
                  </div>
                  <div className="text-base font-semibold font-mono">{selectedRequest.sourceChain}</div>
                </div>
                <div className="p-4 bg-surface rounded-lg">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.detail.destChain')}
                  </div>
                  <div className="text-base font-semibold font-mono">{selectedRequest.destChain}</div>
                </div>
              </div>
              <div className="p-4 bg-surface rounded-lg">
                <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1 flex items-center gap-1">
                  {t('queue.detail.dilithiumSig')}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 -m-1 rounded hover:bg-surface-secondary transition-colors" aria-label={t('queue.tooltip.dilithiumAriaLabel')}>
                        <HelpCircle className="h-3 w-3 text-foreground-tertiary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{t('queue.tooltip.dilithium')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-sm font-mono text-success break-all">{selectedRequest.dilithiumSig} ✓</div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-5 border-t border-surface-tertiary">
              <Button variant="outline" className="flex-1" onClick={handleCloseModals}>
                {t('queue.modal.cancel')}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSigningState('confirming');
                      setShowSignModal(true);
                    }}
                  >
                    {t('queue.signWithSphincx')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>{t('queue.tooltip.sphincs')}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* Sign Modal with Processing/Success States */}
      {showSignModal && selectedRequest && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sign-modal-title"
          onClick={signingState === 'confirming' ? handleCloseModals : undefined}
        >
          <div
            className="bg-background-secondary border border-surface-tertiary rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confirming State */}
            {signingState === 'confirming' && (
              <>
                <div className="flex justify-between items-center px-6 py-5 border-b border-surface-tertiary">
                  <h2 id="sign-modal-title" className="text-lg font-semibold">
                    {t('queue.confirm.title')}
                  </h2>
                  <button
                    onClick={handleCloseModals}
                    className="w-11 h-11 flex items-center justify-center bg-surface rounded-lg text-foreground-secondary hover:text-foreground transition-colors"
                    aria-label={t('queue.modal.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-hinomaru/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-hinomaru" />
                  </div>
                  <p className="text-foreground-secondary mb-5">{t('queue.confirm.description')}</p>
                  <div className="p-4 bg-surface rounded-lg text-left">
                    <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                      {t('queue.confirm.request')}
                    </div>
                    <div className="text-base font-semibold font-mono">
                      #{selectedRequest.id} • {selectedRequest.amount} ETH
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 px-6 py-5 border-t border-surface-tertiary">
                  <Button variant="outline" className="flex-1" onClick={handleCloseModals}>
                    {t('queue.modal.cancel')}
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={handleConfirmSign}>
                    {t('queue.confirm.submit')}
                  </Button>
                </div>
              </>
            )}

            {/* Processing State */}
            {signingState === 'processing' && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-8 w-8 text-gold animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{t('queue.process.title')}</h2>
                  <p className="text-foreground-secondary">{t('queue.process.description')}</p>
                </div>
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div key={step.key} className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                          processingStep > index + 1
                            ? 'bg-success text-white'
                            : processingStep === index + 1
                              ? 'bg-gold/20 text-gold'
                              : 'bg-surface text-foreground-tertiary'
                        )}
                      >
                        {processingStep > index + 1 ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : processingStep === index + 1 ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span className="text-sm font-mono">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm',
                          processingStep > index + 1
                            ? 'text-success'
                            : processingStep === index + 1
                              ? 'text-foreground font-medium'
                              : 'text-foreground-tertiary'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success State */}
            {signingState === 'success' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('queue.success.title')}</h2>
                <p className="text-foreground-secondary mb-6">{t('queue.success.description')}</p>
                <div className="p-4 bg-surface rounded-lg mb-6">
                  <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                    {t('queue.success.txHash')}
                  </div>
                  <div className="text-sm font-mono text-gold">0x7a3f9c2d...4e8b1f</div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleCloseModals}>
                    {t('queue.success.close')}
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={handleCloseModals}>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    {t('queue.success.next')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Sign Modal with Processing/Success States */}
      {showBatchModal && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-modal-title"
          onClick={batchSigningState === 'idle' ? handleCloseModals : undefined}
        >
          <div
            className="bg-background-secondary border border-surface-tertiary rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confirming State */}
            {batchSigningState === 'idle' && (
              <>
                <div className="flex justify-between items-center px-6 py-5 border-b border-surface-tertiary">
                  <h2 id="batch-modal-title" className="text-lg font-semibold">
                    {t('queue.batch.title')}
                  </h2>
                  <button
                    onClick={handleCloseModals}
                    className="w-11 h-11 flex items-center justify-center bg-surface rounded-lg text-foreground-secondary hover:text-foreground transition-colors"
                    aria-label={t('queue.modal.close')}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gold" />
                  </div>
                  <p className="text-foreground-secondary mb-5">
                    {t('queue.batch.description', { count: mockStats.pending })}
                  </p>
                  <div className="p-4 bg-surface rounded-lg text-left">
                    <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                      {t('queue.batch.summary')}
                    </div>
                    <div className="text-base font-semibold font-mono">
                      {mockStats.pending} {t('queue.batch.requests')} • 24.00 ETH
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 px-6 py-5 border-t border-surface-tertiary">
                  <Button variant="outline" className="flex-1" onClick={handleCloseModals}>
                    {t('queue.modal.cancel')}
                  </Button>
                  <Button variant="primary" className="flex-1" onClick={handleConfirmBatchSign}>
                    {t('queue.batch.confirm')}
                  </Button>
                </div>
              </>
            )}

            {/* Processing State */}
            {batchSigningState === 'processing' && (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="h-8 w-8 text-gold animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">{t('queue.batch.processing.title')}</h2>
                  <p className="text-foreground-secondary">
                    {t('queue.batch.processing.description', { count: mockStats.pending })}
                  </p>
                </div>
                <div className="space-y-4">
                  {processingSteps.map((step, index) => (
                    <div key={step.key} className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                          processingStep > index + 1
                            ? 'bg-success text-white'
                            : processingStep === index + 1
                              ? 'bg-gold/20 text-gold'
                              : 'bg-surface text-foreground-tertiary'
                        )}
                      >
                        {processingStep > index + 1 ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : processingStep === index + 1 ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <span className="text-sm font-mono">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm',
                          processingStep > index + 1
                            ? 'text-success'
                            : processingStep === index + 1
                              ? 'text-foreground font-medium'
                              : 'text-foreground-tertiary'
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success State */}
            {batchSigningState === 'success' && (
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('queue.batch.success.title')}</h2>
                <p className="text-foreground-secondary mb-6">
                  {t('queue.batch.success.description', { count: mockStats.pending })}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                      {t('queue.batch.success.processed')}
                    </div>
                    <div className="text-xl font-bold font-mono text-success">{mockStats.pending}</div>
                  </div>
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="text-[11px] uppercase tracking-wider text-foreground-tertiary mb-1">
                      {t('queue.batch.success.volume')}
                    </div>
                    <div className="text-xl font-bold font-mono">24.00 ETH</div>
                  </div>
                </div>
                <Button variant="primary" className="w-full" onClick={handleCloseModals}>
                  {t('queue.batch.success.done')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
