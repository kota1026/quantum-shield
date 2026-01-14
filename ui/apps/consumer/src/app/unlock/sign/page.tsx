'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Unlock Sign Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 11_unlock_sign.html
 */

function UnlockSignContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const amount = searchParams.get('amount') || '10.00';

  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    setIsSigning(true);
    // Demo: Simulate signing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    router.push(`/unlock/processing?lockId=${lockId}&amount=${amount}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Premium Background */}
      <div className="premium-bg">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-40"
          style={{
            background: 'radial-gradient(circle, var(--accent-hinomaru-dim), transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[480px] w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/unlock?lockId=${lockId}`}
            className="w-10 h-10 flex items-center justify-center bg-qs-bg-secondary border border-qs-border-default rounded-qs-md text-qs-text-secondary hover:border-hinomaru hover:text-hinomaru-light transition-colors"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold">Dilithium署名</h1>
        </div>

        {/* Sign Card */}
        <div className="qs-card p-8 text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-[22px] font-bold mb-2">署名が必要です</h2>
          <p className="text-sm text-qs-text-secondary mb-8">
            Unlock要求を承認するためにDilithium署名を行います
          </p>

          {/* Unlock Summary */}
          <div className="bg-qs-bg-secondary rounded-qs-lg p-5 mb-6 text-left">
            <div className="flex justify-between py-2 border-b border-qs-border-subtle">
              <span className="text-[13px] text-qs-text-tertiary">Unlock金額</span>
              <span className="text-lg font-semibold text-gold">{amount} ETH</span>
            </div>
            <div className="flex justify-between py-2 border-b border-qs-border-subtle">
              <span className="text-[13px] text-qs-text-tertiary">Unlockタイプ</span>
              <span className="text-sm font-medium">通常Unlock</span>
            </div>
            <div className="flex justify-between py-2 border-b border-qs-border-subtle">
              <span className="text-[13px] text-qs-text-tertiary">待機時間</span>
              <span className="text-sm font-medium">24時間</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[13px] text-qs-text-tertiary">ガス代（概算）</span>
              <span className="text-sm font-medium">~0.003 ETH</span>
            </div>
          </div>

          {/* Key Visual */}
          <div className="relative h-[120px] flex items-center justify-center my-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{
                background: 'var(--accent-hinomaru-dim)',
                border: '2px solid var(--accent-hinomaru)',
                animation: 'key-pulse 2s ease-in-out infinite',
              }}
            >
              🔑
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
            <span className="text-lg flex-shrink-0">🔐</span>
            <p className="text-[13px] text-qs-text-secondary leading-relaxed">
              <strong className="text-gold">Dilithium-III署名</strong>
              を使用してUnlock要求を承認します。この署名は量子コンピュータに対しても安全です。
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Link
              href={`/unlock?lockId=${lockId}`}
              className="flex-1 py-4 bg-qs-bg-secondary border border-qs-border-default rounded-qs-lg text-qs-text-secondary font-semibold text-[15px] text-center hover:border-hinomaru hover:text-hinomaru-light transition-colors"
            >
              キャンセル
            </Link>
            <button
              onClick={handleSign}
              disabled={isSigning}
              className="flex-1 btn-primary disabled:opacity-70"
            >
              {isSigning ? '署名中...' : '署名してUnlock'}
            </button>
          </div>
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
        <div className="w-12 h-12 border-2 border-hinomaru border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-qs-text-secondary">読み込み中...</p>
      </div>
    </div>
  );
}

export default function UnlockSignPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnlockSignContent />
    </Suspense>
  );
}
