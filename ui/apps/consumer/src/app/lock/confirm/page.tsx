'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, ArrowLeft, CheckCircle, Clock, Users, Fuel } from 'lucide-react';

/**
 * Lock Confirmation Page - Consumer App
 * タスクID: UI-CON-004
 *
 * Lock Flow: Input → Confirmation → Processing → Success
 * 仕様書: 04_SCREENS.md §2.1 Consumer App
 */

function LockConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';

  const handleConfirm = () => {
    router.push(`/lock/processing?amount=${amount}`);
  };

  const amountInUsd = (parseFloat(amount) * 2500).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  const estimatedGas = 0.002;
  const totalAmount = (parseFloat(amount) + estimatedGas).toFixed(6);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/lock" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </Link>
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="font-semibold">Quantum Shield</span>
            </Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Lock確認</h1>
            <p className="text-gray-400">内容を確認して署名してください</p>
          </div>

          {/* Amount Card */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20 rounded-2xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-400 mb-2">Lock金額</p>
            <p className="text-5xl font-bold mb-2">{amount}</p>
            <p className="text-2xl text-gray-400">ETH</p>
            <p className="text-sm text-gray-500 mt-2">≈ ${amountInUsd} USD</p>
          </div>

          {/* Features */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              保護内容
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">量子耐性セキュリティ</p>
                  <p className="text-sm text-gray-400">
                    Dilithium-III & SPHINCS+ で保護
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium">24時間タイムロック</p>
                  <p className="text-sm text-gray-400">
                    Unlock時は24時間の待機期間
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">マルチProver検証</p>
                  <p className="text-sm text-gray-400">
                    複数のProverによる検証
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              取引詳細
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Lock金額</span>
                <span className="font-medium">{amount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ネットワーク</span>
                <span className="font-medium">Ethereum Sepolia</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 flex items-center">
                  <Fuel className="w-4 h-4 mr-1" />
                  推定ガス代
                </span>
                <span className="font-medium">~{estimatedGas} ETH</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">合計</span>
                  <span className="font-bold text-lg">~{totalAmount} ETH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <Lock className="w-5 h-5" />
              <span>署名してLock</span>
            </button>

            <Link
              href="/lock"
              className="w-full py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>金額を変更</span>
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-500 mt-6">
            「署名してLock」をクリックすると、ウォレットで署名を求められます。
            <br />
            ガス代は実際の処理時に確定します。
          </p>
        </div>
      </main>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">読み込み中...</p>
      </div>
    </div>
  );
}

export default function LockConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LockConfirmContent />
    </Suspense>
  );
}
