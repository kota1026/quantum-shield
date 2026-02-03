'use client';

import { useState, useCallback, useRef } from 'react';
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
import { useUserDashboard, useUserTransactions } from '@/hooks/consumer';
import {
  MOCK_CONSUMER_STATS,
  MOCK_TRANSACTIONS,
  MOCK_USER_SETTINGS,
  type ConsumerStats,
} from '@/lib/api/consumer/mock';

// Fallback data
const FALLBACK_STATS = MOCK_CONSUMER_STATS;
const FALLBACK_TRANSACTIONS = MOCK_TRANSACTIONS;
const FALLBACK_WALLET = MOCK_USER_SETTINGS.walletAddress;

export function Dashboard() {
  const t = useTranslations('consumer.dashboard');
  const router = useRouter();

  // Fetch data using new API hooks
  const { data: dashboardData } = useUserDashboard();
  const { data: txData } = useUserTransactions({ perPage: 10 });

  // Transform API data to component format, with fallback
  const stats: ConsumerStats = dashboardData ? {
    totalLocked: parseFloat(dashboardData.totalLocked) || 0,
    available: 0, // TODO: Add available balance to API
    pendingUnlock: dashboardData.pendingUnlocks || 0,
    transactions: txData?.total || 0,
  } : FALLBACK_STATS;

  const transactions = (txData?.transactions?.map(tx => ({
    id: tx.id,
    type: tx.txType === 'lock' ? 'lock' : tx.txType === 'normal_unlock' ? 'unlock' : 'unlocking',
    amount: tx.amount,
    timestamp: new Date(tx.createdAt * 1000).toISOString(),
    status: tx.status === 'completed' ? 'complete' : 'pending',
  })) ?? FALLBACK_TRANSACTIONS) as Transaction[];

  const walletAddress = dashboardData?.address || FALLBACK_WALLET;

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
      await navigator.clipboard.writeText(walletAddress);
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

  // ロックボタンクリック時に金額入力欄にスクロール＆フォーカス
  const scrollToLockInput = useCallback(() => {
    const lockAmountInput = document.getElementById('lockAmount');
    if (lockAmountInput) {
      lockAmountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        lockAmountInput.focus();
      }, 500);
    }
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
          walletAddress={walletAddress}
          onWalletClick={() => setIsWalletModalOpen(true)}
          onLockClick={scrollToLockInput}
        />

        {/* Stats Grid */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          <StatCard
            label={t('stats.totalLocked.label')}
            value={stats.totalLocked.toFixed(2)}
            unit="ETH"
            tooltip={t('stats.totalLocked.tooltip')}
            badge={{ text: '+12.4%', variant: 'success' }}
            highlight
            onClick={() => router.push('/consumer/history')}
            ariaLabel={`${t('stats.totalLocked.label')}: ${stats.totalLocked} ETH`}
          />
          <StatCard
            label={t('stats.available.label')}
            value={stats.available.toFixed(2)}
            unit="ETH"
            tooltip={t('stats.available.tooltip')}
            onClick={() => router.push('/consumer/unlock')}
            ariaLabel={`${t('stats.available.label')}: ${stats.available} ETH`}
          />
          <StatCard
            label={t('stats.pendingUnlock.label')}
            value={stats.pendingUnlock}
            tooltip={t('stats.pendingUnlock.tooltip')}
            onClick={() => router.push('/consumer/unlock')}
            ariaLabel={`${t('stats.pendingUnlock.label')}: ${stats.pendingUnlock}`}
          />
          <StatCard
            label={t('stats.transactions.label')}
            value={stats.transactions}
            tooltip={t('stats.transactions.tooltip')}
            onClick={() => router.push('/consumer/history')}
            ariaLabel={`${t('stats.transactions.label')}: ${stats.transactions}`}
          />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Lock Asset Card */}
          <LockAssetCard
            balance={stats.available}
            onLock={handleLock}
          />

          {/* Recent Activity */}
          <RecentActivity transactions={transactions} />
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav onLockClick={scrollToLockInput} />

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
        address={walletAddress}
      />
    </div>
  );
}

export default Dashboard;
