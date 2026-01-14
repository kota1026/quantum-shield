'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Lock Success Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 10_lock_success.html
 */

export default function LockSuccessPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '5.00';
  const txHash = searchParams.get('txHash') || '0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d';
  const [confetti, setConfetti] = useState<Array<{ id: number; left: string; color: string; delay: string }>>([]);

  const timestamp = new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';

  // Generate confetti on mount
  useEffect(() => {
    const colors = ['#bc002d', '#c9a962', '#00c896', '#ffffff', '#e8334d'];
    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: `${Math.random() * 2}s`,
    }));
    setConfetti(pieces);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Success Background Glow */}
      <div className="premium-bg">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(0, 200, 150, 0.12), transparent 60%)',
          }}
        />
      </div>

      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="absolute w-2.5 h-2.5 opacity-0"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              animation: `confetti-fall 3s ease-out ${piece.delay} forwards`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-[440px] w-full">
        {/* Success Icon */}
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: 'rgba(0, 200, 150, 0.12)',
            animation: 'pop 0.5s ease-out',
          }}
        >
          ✓
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2 text-qs-success">Lock完了！</h1>
        <p className="text-[15px] text-qs-text-secondary mb-8">
          資産は量子耐性暗号で安全に保護されています
        </p>

        {/* Result Card */}
        <div className="qs-card p-6 mb-6 text-left">
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">Lock金額</span>
            <span className="text-lg font-semibold text-hinomaru-light">{amount} ETH</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">ステータス</span>
            <span className="text-sm font-medium text-qs-success">🔒 Locked</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">日時</span>
            <span className="text-sm font-medium">{timestamp}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">TX Hash</span>
            <a
              href={`${etherscanUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold text-xs font-mono hover:underline"
            >
              {txHash.slice(0, 6)}...{txHash.slice(-4)} ↗
            </a>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[13px] text-qs-text-tertiary">ガス代</span>
            <span className="text-sm font-medium">0.0025 ETH</span>
          </div>
        </div>

        {/* Info Box */}
        <div
          className="flex items-start gap-3 p-4 rounded-qs-lg mb-6 text-left"
          style={{
            background: 'var(--accent-gold-dim)',
            border: '1px solid var(--accent-gold)',
          }}
        >
          <span className="text-lg">💡</span>
          <span className="text-[13px] text-qs-text-secondary leading-relaxed">
            Unlockには24時間のTime Lock（通常）または7日間（緊急）が必要です。
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 btn-primary text-center py-4">
            ダッシュボードへ
          </Link>
          <Link
            href="/history"
            className="flex-1 py-4 bg-qs-bg-secondary border border-qs-border-default rounded-qs-lg text-qs-text-secondary font-semibold text-sm text-center hover:border-hinomaru hover:text-hinomaru-light transition-colors"
          >
            履歴を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
