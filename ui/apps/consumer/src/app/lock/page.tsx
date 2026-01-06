'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useBalance } from 'wagmi';
import { Shield, Lock, AlertTriangle, Info, ArrowLeft, Wallet } from 'lucide-react';
import { parseEther, formatEther } from 'viem';

/**
 * Lock Input Page - Consumer App
 * タスクID: UI-CON-004
 * 
 * Lock Flow: Input → Confirmation → Processing → Success
 * 仕様書: 
 * - 04_SCREENS.md §2.1 Consumer App
 * - SEQUENCES_v2.0.md SEQ#1
 */

export default function LockInputPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (value: string) => {
    // 数字と小数点のみ許可
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    
    setAmount(value);
    setError(null);

    if (value === '' || value === '.') return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setError('有効な金額を入力してください');
      return;
    }

    if (numValue <= 0) {
      setError('0より大きい金額を入力してください');
      return;
    }

    if (balance) {
      try {
        if (parseEther(value) > balance.value) {
          setError('残高を超えています');
          return;
        }
      } catch {
        setError('有効な金額を入力してください');
        return;
      }
    }

    // 最小Lock金額 (0.001 ETH)
    if (numValue < 0.001) {
      setError('最小Lock金額は 0.001 ETH です');
      return;
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      // ガス代として少し残す
      const maxAmount = Math.max(
        0,
        parseFloat(formatEther(balance.value)) - 0.005
      );
      if (maxAmount > 0) {
        setAmount(maxAmount.toFixed(6));
        setError(null);
      }
    }
  };

  const handleContinue = () => {
    if (!amount || error) return;
    router.push(`/lock/confirm?amount=${amount}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && amount && !error) {
      handleContinue();
    }
  };

  // 未接続状態
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">ウォレットを接続</h1>
          <p className="text-gray-400 mb-8">
            資産をロックするには、まずウォレットを接続してください。
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

  const formattedBalance = balance 
    ? parseFloat(formatEther(balance.value)).toFixed(4) 
    : '0.0000';

  const amountInUsd = amount 
    ? (parseFloat(amount) * 2500).toLocaleString('ja-JP', { maximumFractionDigits: 2 })
    : '0';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="font-semibold">Quantum Shield</span>
            </Link>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">資産をロック</h1>
            <p className="text-gray-400">量子耐性のあるVaultで資産を保護</p>
          </div>

          {/* Main Card */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            {/* Balance Display */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-gray-400">利用可能残高</span>
              <div className="text-right">
                <span className="text-lg font-semibold">{formattedBalance}</span>
                <span className="text-gray-400 ml-1">{balance?.symbol || 'ETH'}</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="relative mb-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Lock金額</span>
                  <button
                    onClick={handleMaxClick}
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    MAX
                  </button>
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 bg-transparent text-4xl font-bold outline-none placeholder-gray-600"
                    autoFocus
                  />
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold">Ξ</span>
                    </div>
                    <span className="text-lg font-medium">ETH</span>
                  </div>
                </div>
                {amount && (
                  <p className="text-sm text-gray-500 mt-2">
                    ≈ ${amountInUsd} USD
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-400 mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Info */}
            <div className="p-4 bg-gray-800/50 rounded-xl mb-6">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="text-sm text-gray-400">
                  <p className="mb-2">
                    ETHは量子耐性のあるVaultにロックされます。
                  </p>
                  <ul className="space-y-1">
                    <li>• 通常Unlock: Dilithium署名 + 24時間待機</li>
                    <li>• 緊急Unlock: Bond支払い + 7日間待機</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium mb-1">重要</p>
                  <p className="text-sm text-gray-400">
                    Dilithium秘密鍵のバックアップを確認してください。鍵がないと緊急Unlock（7日+Bond）のみになります。
                  </p>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={!amount || !!error}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              続行
            </button>
          </div>

          {/* Connected Wallet Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              接続中: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
