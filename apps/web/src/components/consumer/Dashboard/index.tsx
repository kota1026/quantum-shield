'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';
import { StatCard } from './StatCard';
import { LockAssetCard } from './LockAssetCard';
import { RecentActivity, Transaction } from './RecentActivity';
import { LockModal } from './LockModal';
import { WalletModal } from './WalletModal';
import { cn } from '@/lib/utils';

// Demo data - In production, this would come from API/hooks
const DEMO_STATS = {
  totalLocked: 24.85,
  available: 12.50,
  pendingUnlock: 2,
  transactions: 47,
};

const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'lock',
    amount: '5.00 ETH',
    timestamp: '2026-01-06 14:32',
    status: 'complete',
  },
  {
    id: '2',
    type: 'unlocking',
    amount: '2.50 ETH',
    timestamp: '2026-01-05 09:15',
    status: 'pending',
  },
  {
    id: '3',
    type: 'unlock',
    amount: '1.25 ETH',
    timestamp: '2026-01-03 18:45',
    status: 'complete',
  },
];

const WALLET_ADDRESS = '0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d';

export function Dashboard() {
  const t = useTranslations('consumer.dashboard');
  const router = useRouter();

  // Modal states
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [lockAmount, setLockAmount] = useState(0);

  // Handlers
  const handleLock = useCallback((amount: number) => {
    setLockAmount(amount);
    setIsLockModalOpen(true);
  }, []);

  const handleConfirmLock = useCallback(() => {
    setIsLockModalOpen(false);
    // Navigate to processing page
    router.push('/consumer/lock/processing');
  }, [router]);

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS);
      // In production, show toast notification
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    if (window.confirm('Disconnect wallet?')) {
      router.push('/consumer');
    }
  }, [router]);

  const openLockModal = useCallback(() => {
    setLockAmount(0);
    setIsLockModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" role="main">
        {/* Header */}
        <AppHeader
          walletAddress={WALLET_ADDRESS}
          onWalletClick={() => setIsWalletModalOpen(true)}
          onLockClick={openLockModal}
        />

        {/* Stats Grid */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          <StatCard
            label={t('stats.totalLocked.label')}
            value={DEMO_STATS.totalLocked.toFixed(2)}
            unit="ETH"
            badge={{ text: '+12.4%', variant: 'success' }}
            highlight
            onClick={() => router.push('/consumer/history')}
            ariaLabel={`${t('stats.totalLocked.label')}: ${DEMO_STATS.totalLocked} ETH. ${t('stats.totalLocked.tooltip')}`}
          />
          <StatCard
            label={t('stats.available.label')}
            value={DEMO_STATS.available.toFixed(2)}
            unit="ETH"
            onClick={() => router.push('/consumer/unlock')}
            ariaLabel={`${t('stats.available.label')}: ${DEMO_STATS.available} ETH. ${t('stats.available.tooltip')}`}
          />
          <StatCard
            label={t('stats.pendingUnlock.label')}
            value={DEMO_STATS.pendingUnlock}
            onClick={() => router.push('/consumer/unlock')}
            ariaLabel={`${t('stats.pendingUnlock.label')}: ${DEMO_STATS.pendingUnlock}. ${t('stats.pendingUnlock.tooltip')}`}
          />
          <StatCard
            label={t('stats.transactions.label')}
            value={DEMO_STATS.transactions}
            onClick={() => router.push('/consumer/history')}
            ariaLabel={`${t('stats.transactions.label')}: ${DEMO_STATS.transactions}. ${t('stats.transactions.tooltip')}`}
          />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Lock Asset Card */}
          <LockAssetCard
            balance={DEMO_STATS.available}
            onLock={handleLock}
          />

          {/* Recent Activity */}
          <RecentActivity transactions={DEMO_TRANSACTIONS} />
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav onLockClick={openLockModal} />

      {/* Modals */}
      <LockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onConfirm={handleConfirmLock}
        amount={lockAmount}
      />
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onCopy={handleCopyAddress}
        onDisconnect={handleDisconnect}
        address={WALLET_ADDRESS}
      />
    </div>
  );
}

export default Dashboard;
