'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle, Clock, ArrowRight, ExternalLink, Lock, Plus } from 'lucide-react';

/**
 * Lock Success Page - Consumer App
 * タスクID: UI-CON-004
 * 
 * Lock Flow: Input → Confirmation → Processing → Success
 * 仕様書: 04_SCREENS.md §2.1 Consumer App
 */

export default function LockSuccessPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const txHash = searchParams.get('txHash') || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const lockId = Math.floor(Math.random() * 1000) + 1;
  const amountInUsd = (parseFloat(amount) * 2500).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="font-semibold">Quantum Shield</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Lock完了！</h1>
            <p className="text-gray-400">
              資産が量子耐性のあるセキュリティで保護されました
            </p>
          </div>

          {/* Amount Card */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/20 rounded-2xl p-6 mb-6 text-center">
            <p className="text-sm text-gray-400 mb-2">Lock済み金額</p>
            <p className="text-5xl font-bold text-emerald-400 mb-1">{amount}</p>
            <p className="text-xl text-emerald-400/60">ETH</p>
            <p className="text-sm text-gray-500 mt-2">≈ ${amountInUsd} USD</p>
          </div>

          {/* Details Card */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Lock詳細
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Lock ID</span>
                <span className="font-mono text-emerald-400">#{lockId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ステータス</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm rounded-full">
                  アクティブ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">トランザクション</span>
                <a
                  href={`${etherscanUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300"
                >
                  <span className="font-mono text-sm">
                    {txHash.slice(0, 6)}...{txHash.slice(-4)}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ネットワーク</span>
                <span className="text-white">Sepolia Testnet</span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
              次のステップ
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium">量子耐性で保護中</p>
                  <p className="text-sm text-gray-400">
                    あなたの資産はDilithium-IIIで守られています
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="font-medium">Unlock方法</p>
                  <p className="text-sm text-gray-400">
                    Dilithium署名 + 24時間待機でUnlock可能
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <span>ダッシュボードへ</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="/lock"
              className="w-full py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>さらにロック</span>
            </Link>
          </div>

          {/* Share */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              🎉 おめでとうございます！量子時代に向けた準備が整いました
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
