'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Emergency Unlock Success Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 16_emergency_success.html
 */

function EmergencySuccessContent() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '10.00';
  const bond = searchParams.get('bond') || '0.50';
  const txHash = searchParams.get('txHash') || '0x9c5h2e4f1a3b7d6e8f0c2a4b6d8e0f2a';

  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';

  // Calculate unlock available time (7 days from now)
  const unlockAvailableTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const unlockAvailableString = unlockAvailableTime.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Countdown state (7 days)
  const [countdown, setCountdown] = useState({
    days: 6,
    hours: 23,
    minutes: 59,
    seconds: 59,
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalDuration = 7 * 24 * 3600;
    let remainingSeconds = 6 * 24 * 3600 + 23 * 3600 + 59 * 60 + 59;

    const timer = setInterval(() => {
      if (remainingSeconds <= 0) {
        clearInterval(timer);
        return;
      }

      remainingSeconds -= 1;

      const days = Math.floor(remainingSeconds / (24 * 3600));
      const hours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      setCountdown({ days, hours, minutes, seconds });
      setProgress(((totalDuration - remainingSeconds) / totalDuration) * 100);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Premium Background with Warning Glow */}
      <div className="premium-bg">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle, rgba(240, 160, 48, 0.12), transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-[440px] w-full">
        {/* Success Icon */}
        <div
          className="w-[100px] h-[100px] mx-auto mb-6 rounded-full flex items-center justify-center text-5xl"
          style={{
            background: 'rgba(240, 160, 48, 0.12)',
            border: '2px solid var(--warning)',
            animation: 'pop 0.5s ease-out',
          }}
        >
          ⚠️
        </div>

        {/* Title */}
        <h1 className="text-[28px] font-bold mb-2 text-qs-warning">緊急Unlock開始</h1>
        <p className="text-[15px] text-qs-text-secondary mb-8">7日後にUnlockを実行できます</p>

        {/* Time Lock Card */}
        <div
          className="p-6 rounded-qs-xl mb-6"
          style={{
            background: 'rgba(240, 160, 48, 0.12)',
            border: '1px solid var(--warning)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">⏰</span>
            <span className="text-base font-semibold text-qs-warning">緊急Time Lock残り時間</span>
          </div>
          <div className="text-[32px] font-bold font-mono mb-2">
            {countdown.days}d {formatNumber(countdown.hours)}:{formatNumber(countdown.minutes)}:
            {formatNumber(countdown.seconds)}
          </div>
          <div className="text-[13px] text-qs-text-secondary mb-4">Challenge期間終了まで</div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-qs-warning rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Result Card */}
        <div className="qs-card p-6 mb-6 text-left">
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">Unlock金額</span>
            <span className="text-lg font-semibold text-qs-warning">{amount} ETH</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">Bond（保証金）</span>
            <span className="text-sm font-medium">{bond} ETH（返還予定）</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-qs-border-subtle">
            <span className="text-[13px] text-qs-text-tertiary">Unlock可能日時</span>
            <span className="text-sm font-medium">{unlockAvailableString}</span>
          </div>
          <div className="flex justify-between items-center py-3">
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
        </div>

        {/* Info Box */}
        <div
          className="flex items-start gap-3 p-4 rounded-qs-lg mb-6 text-left"
          style={{
            background: 'rgba(0, 200, 150, 0.12)',
            border: '1px solid var(--success)',
          }}
        >
          <span className="text-xl flex-shrink-0">💡</span>
          <span className="text-[13px] text-qs-text-secondary leading-relaxed">
            7日間のChallenge期間中に問題がなければ、Bondは自動的に返還されます。Unlock可能になったらダッシュボードから実行できます。
          </span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 btn-primary text-center py-4">
            ダッシュボードへ
          </Link>
          <Link
            href="/history"
            className="flex-1 py-4 bg-qs-bg-secondary border border-qs-border-default rounded-qs-lg text-qs-text-secondary font-semibold text-sm text-center hover:border-gold hover:text-gold transition-colors"
          >
            履歴を見る
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="premium-bg">
        <div className="red-glow" />
      </div>
      <div className="relative z-10 text-center">
        <div className="w-12 h-12 border-2 border-qs-warning border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-qs-text-secondary">読み込み中...</p>
      </div>
    </div>
  );
}

export default function EmergencySuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmergencySuccessContent />
    </Suspense>
  );
}
