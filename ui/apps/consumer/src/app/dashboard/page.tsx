'use client';

import { useAccount, useReadContract, useBalance } from 'wagmi';
import Link from 'next/link';
import { formatEther } from 'viem';
import { useState } from 'react';
import { QS_VAULT_ABI, QS_VAULT_ADDRESS } from '@quantum-shield/web3';

/**
 * Dashboard Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 03_dashboard.html
 */

// Hinomaru Logo Component
function HinomaruLogo() {
  return (
    <div className="logo-hinomaru">
      <div className="logo-circle-outer" />
      <div className="logo-hinomaru-inner" />
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  unit,
  badge,
  highlight,
  onClick,
}: {
  label: string;
  value: string | number;
  unit?: string;
  badge?: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className="qs-card cursor-pointer hover:translate-y-[-2px]"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-qs-text-tertiary">{label}</span>
        {badge && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-qs-success/10 text-qs-success font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${highlight ? 'text-hinomaru-light' : ''}`}>
        {value}
        {unit && <span className="text-sm font-medium text-qs-text-secondary ml-1">{unit}</span>}
      </div>
    </div>
  );
}

// Transaction Item Component
function TxItem({
  type,
  time,
  amount,
  status,
}: {
  type: 'lock' | 'unlock' | 'pending';
  time: string;
  amount: string;
  status: 'complete' | 'pending';
}) {
  const icons = {
    lock: '🔒',
    unlock: '🔓',
    pending: '⏳',
  };

  const iconBgColors = {
    lock: 'bg-hinomaru-dim text-hinomaru-light',
    unlock: 'bg-gold-dim text-gold',
    pending: 'bg-qs-warning/10 text-qs-warning',
  };

  const statusColors = {
    complete: 'bg-qs-success/10 text-qs-success',
    pending: 'bg-qs-warning/10 text-qs-warning',
  };

  const typeLabels = {
    lock: 'Lock',
    unlock: 'Unlock Complete',
    pending: 'Normal Unlock',
  };

  const statusLabels = {
    complete: 'Complete',
    pending: '24h Lock',
  };

  return (
    <Link
      href="/history"
      className="flex items-center gap-3 p-3 bg-qs-bg-secondary rounded-qs-md hover:bg-qs-bg-elevated transition-colors"
    >
      <div
        className={`w-9 h-9 rounded-qs-md flex items-center justify-center text-base ${iconBgColors[type]}`}
      >
        {icons[type]}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-[13px] mb-0.5">{typeLabels[type]}</div>
        <div className="text-[11px] text-qs-text-tertiary font-mono">{time}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold text-[13px]">{amount}</div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mt-1 ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>
    </Link>
  );
}

// Lock Modal Component
function LockModal({
  isOpen,
  onClose,
  amount,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  amount: string;
  onConfirm: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-qs-bg-card border border-qs-border-default rounded-qs-xl max-w-[480px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-qs-border-subtle">
          <h3 className="text-lg font-semibold">Lock確認</h3>
          <button onClick={onClose} className="text-qs-text-secondary text-2xl hover:text-qs-text-primary">
            &times;
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-qs-text-secondary mb-4">
            以下の内容でLockを実行します。Dilithium署名が必要です。
          </p>
          <div className="bg-qs-bg-secondary rounded-qs-md p-4 mb-4">
            <div className="flex justify-between mb-2">
              <span className="text-qs-text-secondary text-[13px]">Lock金額</span>
              <span className="font-semibold">{amount} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-qs-text-secondary text-[13px]">ガス代（概算）</span>
              <span className="font-semibold">~0.005 ETH</span>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-qs-border-subtle">
          <button onClick={onConfirm} className="btn-primary w-full">
            署名してLock
          </button>
        </div>
      </div>
    </div>
  );
}

// Wallet Modal Component
function WalletModal({
  isOpen,
  onClose,
  address,
}: {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}) {
  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-qs-bg-card border border-qs-border-default rounded-qs-xl max-w-[480px] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-qs-border-subtle">
          <h3 className="text-lg font-semibold">ウォレット</h3>
          <button onClick={onClose} className="text-qs-text-secondary text-2xl hover:text-qs-text-primary">
            &times;
          </button>
        </div>
        <div className="p-6 text-center">
          <div className="text-5xl mb-4">🦊</div>
          <div className="text-sm text-qs-text-secondary">接続中のウォレット</div>
          <div className="font-mono text-sm mt-2">
            {address.slice(0, 10)}...{address.slice(-8)}
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={copyAddress}
              className="flex-1 py-3 bg-transparent border border-qs-border-default rounded-qs-lg text-qs-text-secondary hover:border-hinomaru hover:text-hinomaru-light transition-colors"
            >
              📋 コピー
            </button>
            <Link
              href="/disconnect"
              className="flex-1 py-3 bg-transparent border border-qs-danger text-qs-danger rounded-qs-lg hover:bg-qs-danger hover:text-white transition-colors text-center"
            >
              切断
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [lockAmount, setLockAmount] = useState('');
  const [showLockModal, setShowLockModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';
  const enableMockData = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true';

  const {
    data: userLockIds,
    isLoading: isLoadingLocks,
    isError: isLockError,
    refetch: refetchLocks,
  } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getUserLocks',
    args: address ? [address] : undefined,
  });

  const firstLockId =
    userLockIds && (userLockIds as bigint[]).length > 0 ? (userLockIds as bigint[])[0] : undefined;

  const { data: firstLockDetails } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getLock',
    args: firstLockId !== undefined ? [firstLockId] : undefined,
  });

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="premium-bg">
          <div className="red-glow" />
        </div>
        <div className="relative z-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-qs-bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💼</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">ウォレットを接続</h1>
          <p className="text-qs-text-secondary mb-8">
            ダッシュボードを表示するには、ウォレットを接続してください。
          </p>
          <Link href="/onboarding" className="btn-primary inline-block">
            ウォレットを接続
          </Link>
        </div>
      </div>
    );
  }

  const lockIds = userLockIds as bigint[] | undefined;
  const lockCount = lockIds?.length || 0;
  const firstLockAmount = firstLockDetails
    ? Number(formatEther((firstLockDetails as any).amount || 0n))
    : 0;
  const walletBalance = balance ? parseFloat(formatEther(balance.value)) : 0;

  const setAmountPercent = (percent: number) => {
    const amount = (walletBalance * percent / 100).toFixed(2);
    setLockAmount(amount);
  };

  const handleSubmitLock = () => {
    if (!lockAmount || parseFloat(lockAmount) <= 0) {
      return;
    }
    setShowLockModal(true);
  };

  const handleConfirmLock = () => {
    setShowLockModal(false);
    window.location.href = '/lock/processing';
  };

  // Mock data for demo
  const mockTransactions = enableMockData
    ? [
        { type: 'lock' as const, time: '2026-01-06 14:32', amount: '5.00 ETH', status: 'complete' as const },
        { type: 'pending' as const, time: '2026-01-05 09:15', amount: '2.50 ETH', status: 'pending' as const },
        { type: 'unlock' as const, time: '2026-01-03 18:45', amount: '1.25 ETH', status: 'complete' as const },
      ]
    : [];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Premium Background */}
      <div className="premium-bg">
        <div className="red-glow" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <HinomaruLogo />
            <span className="text-xl font-bold">Quantum Shield</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-1 bg-qs-bg-secondary p-1 rounded-full border border-qs-border-subtle">
            <Link href="/dashboard" className="px-5 py-2 text-sm text-qs-text-primary bg-qs-bg-elevated rounded-full">
              Dashboard
            </Link>
            <button
              onClick={() => setShowLockModal(true)}
              className="px-5 py-2 text-sm text-qs-text-secondary hover:text-qs-text-primary hover:bg-qs-bg-elevated rounded-full transition-colors"
            >
              Lock
            </button>
            <Link
              href="/unlock"
              className="px-5 py-2 text-sm text-qs-text-secondary hover:text-qs-text-primary hover:bg-qs-bg-elevated rounded-full transition-colors"
            >
              Unlock
            </Link>
            <Link
              href="/history"
              className="px-5 py-2 text-sm text-qs-text-secondary hover:text-qs-text-primary hover:bg-qs-bg-elevated rounded-full transition-colors"
            >
              History
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="w-10 h-10 flex items-center justify-center bg-qs-bg-secondary border border-qs-border-default rounded-qs-md text-qs-text-secondary hover:border-gold hover:text-gold transition-colors"
            >
              ⚙️
            </Link>
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-hinomaru-dim border border-hinomaru rounded-full text-hinomaru-light text-sm font-medium hover:bg-hinomaru hover:text-white transition-colors"
            >
              <span className="w-2 h-2 bg-qs-success rounded-full" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Locked"
            value={enableMockData ? '24.85' : firstLockAmount.toFixed(2)}
            unit="ETH"
            badge="+12.4%"
            highlight
            onClick={() => setShowLockModal(true)}
          />
          <StatCard
            label="Available"
            value={enableMockData ? '12.50' : walletBalance.toFixed(2)}
            unit="ETH"
            onClick={() => window.location.href = '/unlock'}
          />
          <StatCard
            label="Pending Unlock"
            value={enableMockData ? '2' : '0'}
            onClick={() => window.location.href = '/unlock'}
          />
          <StatCard
            label="Transactions"
            value={enableMockData ? '47' : lockCount}
            onClick={() => window.location.href = '/history'}
          />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Lock Card */}
          <div className="qs-card p-0">
            <div className="flex justify-between items-center p-6 border-b border-qs-border-subtle">
              <h2 className="text-lg font-semibold">Lock Assets</h2>
              <span className="qs-badge-hinomaru">🔒 Quantum Protected</span>
            </div>
            <div className="p-6">
              {/* Hinomaru Visual */}
              <div className="h-[200px] flex items-center justify-center relative mb-6">
                <div className="absolute w-[180px] h-[180px] border border-white/10 border-dashed rounded-full animate-orbit-spin-reverse" />
                <div className="absolute w-[150px] h-[150px] border border-gold opacity-40 rounded-full animate-orbit-spin" />
                <div className="relative w-[120px] h-[120px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-white/5 rounded-full border border-white/10" />
                  <div className="absolute inset-[25px] bg-gradient-to-br from-[#ff3050] via-hinomaru to-hinomaru-dark rounded-full shadow-[0_0_40px_var(--accent-hinomaru-glow)] animate-hinomaru-pulse" />
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <div className="text-xs text-qs-text-secondary mb-2">Amount to Lock</div>
                <div className="flex items-center bg-qs-bg-secondary border border-qs-border-default rounded-qs-lg p-3 focus-within:border-hinomaru focus-within:shadow-[0_0_0_3px_var(--accent-hinomaru-dim)] transition-all">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    placeholder="0.00"
                    value={lockAmount}
                    onChange={(e) => setLockAmount(e.target.value)}
                    className="flex-1 bg-transparent border-none text-2xl font-semibold outline-none placeholder:text-qs-text-tertiary"
                  />
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-qs-bg-elevated rounded-qs-md">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#627eea] to-[#3c3c3d] rounded-full flex items-center justify-center text-xs text-white">
                      Ξ
                    </div>
                    <span className="font-semibold text-sm">ETH</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setAmountPercent(percent)}
                      className="flex-1 py-2.5 bg-qs-bg-secondary border border-qs-border-subtle rounded-qs-md text-qs-text-secondary text-[13px] font-medium hover:bg-qs-bg-elevated hover:border-qs-border-default hover:text-qs-text-primary transition-colors"
                    >
                      {percent === 100 ? 'MAX' : `${percent}%`}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSubmitLock} className="btn-primary w-full mt-6">
                Lock with Dilithium Signature
              </button>
            </div>
          </div>

          {/* Activity Card */}
          <div className="qs-card p-0">
            <div className="flex justify-between items-center p-6 border-b border-qs-border-subtle">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-2">
                {mockTransactions.length > 0 ? (
                  mockTransactions.map((tx, i) => (
                    <TxItem key={i} {...tx} />
                  ))
                ) : (
                  <div className="text-center py-8 text-qs-text-tertiary">
                    取引履歴がありません
                  </div>
                )}
              </div>
              <Link
                href="/history"
                className="block w-full mt-4 py-3 bg-transparent border border-qs-border-default rounded-qs-lg text-qs-text-secondary text-sm font-medium text-center hover:border-hinomaru hover:text-hinomaru-light transition-colors"
              >
                すべての履歴を見る →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-qs-bg-secondary border-t border-qs-border-subtle p-2 pb-6 md:hidden z-50">
        <div className="flex justify-around">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 px-3 py-2 text-hinomaru-light">
            <span className="text-xl">📊</span>
            <span className="text-[10px]">Dashboard</span>
          </Link>
          <button
            onClick={() => setShowLockModal(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 text-qs-text-tertiary hover:text-hinomaru-light"
          >
            <span className="text-xl">🔒</span>
            <span className="text-[10px]">Lock</span>
          </button>
          <Link href="/unlock" className="flex flex-col items-center gap-1 px-3 py-2 text-qs-text-tertiary hover:text-hinomaru-light">
            <span className="text-xl">🔓</span>
            <span className="text-[10px]">Unlock</span>
          </Link>
          <Link href="/history" className="flex flex-col items-center gap-1 px-3 py-2 text-qs-text-tertiary hover:text-hinomaru-light">
            <span className="text-xl">📜</span>
            <span className="text-[10px]">History</span>
          </Link>
          <Link href="/settings" className="flex flex-col items-center gap-1 px-3 py-2 text-qs-text-tertiary hover:text-hinomaru-light">
            <span className="text-xl">⚙️</span>
            <span className="text-[10px]">Settings</span>
          </Link>
        </div>
      </div>

      {/* Modals */}
      <LockModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        amount={lockAmount || '0.00'}
        onConfirm={handleConfirmLock}
      />
      <WalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        address={address || ''}
      />
    </div>
  );
}
