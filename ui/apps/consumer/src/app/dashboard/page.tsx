'use client';

import { useAccount, useReadContract, useBalance } from 'wagmi';
import { Shield, Lock, Unlock, Plus, Clock, ExternalLink, RefreshCw, AlertTriangle, Wallet, Settings, History } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { QS_VAULT_ABI, QS_VAULT_ADDRESS } from '@quantum-shield/web3';

/**
 * Dashboard Page - Consumer App
 * タスクID: UI-CON-003
 * 
 * 仕様書: 
 * - 04_SCREENS.md §2.1 Consumer App
 * - STEP_E_UI_INTEGRATION_PLAN.md
 */

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';
  const enableMockData = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true';

  const { 
    data: userLockIds, 
    isLoading: isLoadingLocks, 
    isError: isLockError,
    refetch: refetchLocks 
  } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getUserLocks',
    args: address ? [address] : undefined,
  });

  const firstLockId = userLockIds && (userLockIds as bigint[]).length > 0 
    ? (userLockIds as bigint[])[0] 
    : undefined;

  const { data: firstLockDetails } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getLock',
    args: firstLockId !== undefined ? [firstLockId] : undefined,
  });

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">ウォレットを接続</h1>
          <p className="text-gray-400 mb-8">
            ダッシュボードを表示するには、ウォレットを接続してください。
          </p>
          <Link
            href="/onboarding"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-8 py-3 rounded-full transition-colors"
          >
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

  const mockPendingUnlocks = enableMockData ? [
    {
      unlockId: '1',
      lockId: '1',
      amount: '0.5',
      unlockTime: Math.floor(Date.now() / 1000) + 3600 * 20,
      isEmergency: false,
    },
  ] : [];

  const isLoading = isLoadingLocks;
  const isContractZero = QS_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000';
  const walletBalance = balance ? parseFloat(formatEther(balance.value)).toFixed(4) : '0.0000';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="font-semibold">Quantum Shield</span>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/history" className="text-gray-400 hover:text-white transition-colors">
                <History className="w-5 h-5" />
              </Link>
              <Link href="/settings" className="text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
              <div className="px-3 py-1.5 bg-gray-800 rounded-full text-sm font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            </nav>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">ダッシュボード</h1>
            <p className="text-gray-400">L1 Sepolia上の資産を管理</p>
          </div>

          {/* Warnings */}
          {isContractZero && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium mb-1">
                    コントラクトアドレス未設定
                  </p>
                  <p className="text-xs text-gray-400">
                    NEXT_PUBLIC_QS_VAULT_ADDRESSを環境変数に設定してください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {isLockError && !isContractZero && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <p className="text-sm text-red-400">
                    データの取得に失敗しました
                  </p>
                </div>
                <button 
                  onClick={() => refetchLocks()}
                  className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>再試行</span>
                </button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <p className="text-sm text-gray-400 mb-2">ウォレット残高</p>
              <p className="text-2xl font-bold">{walletBalance}</p>
              <p className="text-sm text-gray-500">ETH</p>
            </div>
            
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <p className="text-sm text-gray-400 mb-2">Lock済み (L1)</p>
              {isLoading ? (
                <div className="h-8 w-20 bg-gray-800 rounded animate-pulse" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-emerald-400">{firstLockAmount.toFixed(4)}</p>
                  <p className="text-sm text-gray-500">ETH</p>
                </>
              )}
            </div>
            
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <p className="text-sm text-gray-400 mb-2">アクティブLock</p>
              {isLoading ? (
                <div className="h-8 w-12 bg-gray-800 rounded animate-pulse" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{lockCount}</p>
                  <p className="text-sm text-gray-500">件</p>
                </>
              )}
            </div>
            
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <p className="text-sm text-gray-400 mb-2">Unlock待機中</p>
              <p className="text-2xl font-bold text-cyan-400">{mockPendingUnlocks.length}</p>
              <p className="text-sm text-gray-500">件</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/lock"
              className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>新規Lock</span>
            </Link>
            <Link
              href="/unlock"
              className="flex items-center space-x-2 border border-white/20 hover:border-white/40 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <Unlock className="w-5 h-5" />
              <span>Unlock申請</span>
            </Link>
            <a
              href={`${etherscanUrl}/address/${QS_VAULT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-white px-6 py-3 rounded-xl transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              <span>コントラクト</span>
            </a>
          </div>

          {/* Pending Unlocks */}
          {mockPendingUnlocks.length > 0 && (
            <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold">Unlock待機中</h2>
              </div>
              
              <div className="space-y-4">
                {mockPendingUnlocks.map((unlock) => {
                  const now = Math.floor(Date.now() / 1000);
                  const remaining = unlock.unlockTime - now;
                  const hours = Math.floor(remaining / 3600);
                  const minutes = Math.floor((remaining % 3600) / 60);
                  
                  return (
                    <div
                      key={unlock.unlockId}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-xl"
                    >
                      <div>
                        <p className="font-semibold">{unlock.amount} ETH</p>
                        <p className="text-sm text-gray-400">Lock #{unlock.lockId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-400 font-mono">
                          {hours}時間 {minutes}分
                        </p>
                        <p className="text-xs text-gray-500">残り</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Locks */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold">アクティブLock</h2>
              </div>
              <button 
                onClick={() => refetchLocks()}
                className="text-sm text-gray-400 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" />
                <span>更新</span>
              </button>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-gray-800 rounded-xl animate-pulse" />
                <div className="h-20 bg-gray-800 rounded-xl animate-pulse" />
              </div>
            ) : lockCount === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-400 mb-2">アクティブなLockがありません</p>
                <p className="text-sm text-gray-500 mb-6">
                  量子耐性セキュリティで資産を保護しましょう
                </p>
                <Link
                  href="/lock"
                  className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Lockを作成</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {lockIds?.map((lockId) => (
                  <LockItem 
                    key={lockId.toString()} 
                    lockId={lockId} 
                    etherscanUrl={etherscanUrl}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function LockItem({ lockId, etherscanUrl }: { lockId: bigint; etherscanUrl: string }) {
  const { data: lockDetails, isLoading } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getLock',
    args: [lockId],
  });

  if (isLoading) {
    return <div className="h-20 bg-gray-800 rounded-xl animate-pulse" />;
  }

  const lock = lockDetails as any;
  if (!lock) return null;

  const amount = formatEther(lock.amount || 0n);
  const lockedAt = Number(lock.lockedAt || 0);
  const status = Number(lock.status || 0);

  const statusLabels: Record<number, { label: string; color: string }> = {
    0: { label: 'アクティブ', color: 'text-emerald-400 bg-emerald-500/20' },
    1: { label: 'Unlock中', color: 'text-cyan-400 bg-cyan-500/20' },
    2: { label: '完了', color: 'text-gray-400 bg-gray-500/20' },
  };

  const statusInfo = statusLabels[status] || statusLabels[0];

  return (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
      <div>
        <p className="font-semibold">{parseFloat(amount).toFixed(4)} ETH</p>
        <p className="text-sm text-gray-400">
          {lockedAt > 0 ? new Date(lockedAt * 1000).toLocaleDateString('ja-JP') : 'Unknown'}
        </p>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Lock ID: {lockId.toString()}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`px-3 py-1 rounded-full text-sm ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
        {status === 0 && (
          <Link
            href={`/unlock?lockId=${lockId.toString()}`}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Unlock
          </Link>
        )}
      </div>
    </div>
  );
}
