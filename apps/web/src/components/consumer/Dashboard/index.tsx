'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect, useBalance, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';
import { StatCard } from './StatCard';
import { LockAssetCard } from './LockAssetCard';
import { RecentActivity, Transaction } from './RecentActivity';
import { LockModal } from './LockModal';
import { WalletModal } from './WalletModal';
import { cn } from '@/lib/utils';
import { useUserDashboard, useUserTransactions, setUserAddress, clearUserAddress, useUserLockedBalance } from '@/hooks/consumer';
import { useConsumerAuthStore, useIsConsumerAuthenticated } from '@/stores/consumerAuthStore';
import type { ConsumerStats } from '@/lib/api/consumer/mock';
import { SEPOLIA_CHAIN_ID, L1_VAULT_ADDRESS, L1_VAULT_ABI } from '@/lib/contracts/l1vault';

// Empty state defaults (no mock data - shows real 0 values)
const EMPTY_STATS: ConsumerStats = {
  totalLocked: 0,
  available: 0,
  pendingUnlock: 0,
  transactions: 0,
};

// Skeleton component for loading state
function StatCardSkeleton() {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-gold/10 animate-pulse">
      <div className="h-4 bg-muted rounded w-24 mb-2" />
      <div className="h-8 bg-muted rounded w-32" />
    </div>
  );
}

// Error banner component
function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm text-destructive">{message}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-destructive hover:text-destructive/80 underline"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const t = useTranslations('consumer.dashboard');
  const router = useRouter();

  // Authentication state
  const isAuthenticated = useIsConsumerAuthenticated();
  const { logout } = useConsumerAuthStore();

  // RainbowKit/Wagmi hooks for wallet connection
  const { openConnectModal } = useConnectModal();
  const { isConnected, address: connectedAddress } = useAccount();
  const { disconnect } = useDisconnect();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/consumer/login');
    }
  }, [isAuthenticated, router]);

  // Get wallet balance on Sepolia
  const { data: balanceData } = useBalance({
    address: connectedAddress,
    chainId: SEPOLIA_CHAIN_ID,
  });

  // Read user's locked balance from L1Vault contract (user-specific)
  const { balanceEth: userLockedBalanceEth, balanceWei, isLoading: isUserLockedLoading, error: lockedBalanceError } = useUserLockedBalance();

  // Debug: Log locked balance data
  useEffect(() => {
    console.log('Dashboard - Locked Balance Debug:', {
      connectedAddress,
      balanceWei: balanceWei?.toString(),
      balanceEth: userLockedBalanceEth,
      isLoading: isUserLockedLoading,
      error: lockedBalanceError?.message,
      L1_VAULT_ADDRESS,
    });
  }, [connectedAddress, balanceWei, userLockedBalanceEth, isUserLockedLoading, lockedBalanceError]);

  // Read totalLocked directly from L1Vault contract (global - for reference only)
  const { data: totalLockedOnChain } = useReadContract({
    address: L1_VAULT_ADDRESS,
    abi: L1_VAULT_ABI,
    functionName: 'totalLocked',
    chainId: SEPOLIA_CHAIN_ID,
  });

  // Sync wallet address to localStorage for API requests
  useEffect(() => {
    if (isConnected && connectedAddress) {
      setUserAddress(connectedAddress);
    } else {
      clearUserAddress();
    }
  }, [isConnected, connectedAddress]);

  // Fetch data using new API hooks with loading and error states
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refetch: refetchDashboard } = useUserDashboard();
  const { data: txData, isLoading: isTxLoading, error: txError, refetch: refetchTx } = useUserTransactions({ perPage: 10 });

  const isLoading = isDashboardLoading || isTxLoading || isUserLockedLoading;
  const hasError = dashboardError || txError;

  // Transform API data to component format (show real data, default to 0/empty)
  // Use user-specific locked balance from L1Vault contract
  const totalLockedEth = userLockedBalanceEth;

  // Get available balance from wallet (Sepolia ETH)
  const availableEth = balanceData?.value
    ? parseFloat(formatEther(balanceData.value))
    : 0;

  const stats: ConsumerStats = {
    totalLocked: totalLockedEth,
    available: availableEth,
    pendingUnlock: dashboardData?.pendingUnlocks || 0,
    transactions: txData?.total || 0,
  };

  const transactions: Transaction[] = (txData?.transactions || []).map(tx => {
    // Convert amount to ETH - handle both wei format (integer string) and ETH format (decimal string)
    let amountEth: string;
    try {
      if (tx.amount.includes('.')) {
        // Already in ETH format
        amountEth = parseFloat(tx.amount).toString();
      } else {
        // In wei format - convert to ETH
        amountEth = formatEther(BigInt(tx.amount));
      }
    } catch {
      // Fallback: parse as float directly
      amountEth = parseFloat(tx.amount).toString();
    }
    return {
      id: tx.id,
      type: tx.txType === 'lock' ? 'lock' : tx.txType === 'normal_unlock' ? 'unlock' : 'unlocking',
      amount: amountEth,
      timestamp: new Date(tx.createdAt * 1000).toISOString(),
      status: tx.status === 'completed' ? 'complete' : 'pending',
    };
  });

  // Use connected wallet address if available, otherwise show "Not connected"
  const walletAddress = isConnected && connectedAddress ? connectedAddress : 'Not connected';

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
    // Navigate to processing page with amount
    const params = new URLSearchParams({
      amount: lockAmount.toFixed(6),
    });
    router.push(`/consumer/lock/processing?${params.toString()}`);
  }, [router, lockAmount]);

  const handleCopyAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      // In production, show toast notification
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [walletAddress]);

  const handleDisconnect = useCallback(() => {
    if (window.confirm('Disconnect wallet?')) {
      logout();  // Clear auth state
      disconnect();
      router.push('/consumer');
    }
  }, [logout, disconnect, router]);

  // Handle wallet button click - open connect modal if not connected, or wallet modal if connected
  const handleWalletClick = useCallback(() => {
    if (!isConnected && openConnectModal) {
      openConnectModal();
    } else {
      setIsWalletModalOpen(true);
    }
  }, [isConnected, openConnectModal]);

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
          onWalletClick={handleWalletClick}
          onLockClick={scrollToLockInput}
        />

        {/* Error Banner */}
        {hasError && (
          <ErrorBanner
            message={dashboardError?.message || txError?.message || 'Failed to load data'}
            onRetry={() => {
              refetchDashboard();
              refetchTx();
            }}
          />
        )}

        {/* Stats Grid */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          aria-label={t('stats.ariaLabel')}
        >
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                label={t('stats.totalLocked.label')}
                value={stats.totalLocked.toFixed(2)}
                unit="ETH"
                tooltip={t('stats.totalLocked.tooltip')}
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
            </>
          )}
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
