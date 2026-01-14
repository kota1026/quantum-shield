'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Emergency Unlock Bond Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 14_emergency_bond.html
 */

// SEQ#3: Emergency Bond = MAX(0.5 ETH, amount × 5%)
const MIN_BOND = 0.5;
const BOND_PERCENTAGE = 0.05;

function EmergencyBondContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const lockAmount = parseFloat(searchParams.get('amount') || '10.00');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Calculate bond per SEQ#3: MAX(0.5 ETH, amount × 5%)
  const calculatedBond = useMemo(() => {
    const percentageBond = lockAmount * BOND_PERCENTAGE;
    return Math.max(MIN_BOND, percentageBond);
  }, [lockAmount]);

  const handleSubmit = async () => {
    if (!isConfirmed) return;
    setIsSubmitting(true);
    // Demo: Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/unlock/emergency/processing?lockId=${lockId}&amount=${lockAmount}&bond=${calculatedBond}`);
  };

  return (
    <div className="min-h-screen">
      {/* Premium Background with Warning Glow */}
      <div className="premium-bg">
        <div
          className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-50"
          style={{
            background: 'radial-gradient(ellipse, rgba(240, 160, 48, 0.12), transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[500px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href={`/unlock?lockId=${lockId}`}
            className="w-10 h-10 flex items-center justify-center bg-qs-bg-secondary border border-qs-border-default rounded-qs-md text-qs-text-secondary hover:border-qs-warning hover:text-qs-warning transition-colors"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold">緊急Unlock</h1>
        </div>

        {/* Warning Banner */}
        <div
          className="flex items-center gap-3 p-4 rounded-qs-lg mb-6"
          style={{
            background: 'rgba(232, 64, 87, 0.12)',
            border: '1px solid var(--error)',
          }}
        >
          <span className="text-2xl">⚠️</span>
          <span className="text-sm text-qs-text-secondary">
            <strong className="text-qs-danger">緊急Unlockには7日間の待機期間</strong>
            とBond（保証金）が必要です。通常Unlockが可能な場合はそちらを推奨します。
          </span>
        </div>

        {/* Bond Card */}
        <div className="qs-card p-6 mb-6">
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <span>⚡</span>
            <span className="text-qs-warning">Bond（保証金）</span>について
          </h3>

          {/* Summary Section */}
          <div className="bg-qs-bg-secondary rounded-qs-lg p-4 mb-5">
            <div className="flex justify-between py-2.5 border-b border-qs-border-subtle">
              <span className="text-[13px] text-qs-text-tertiary">Unlock金額</span>
              <span className="text-xl font-semibold text-qs-warning">{lockAmount.toFixed(2)} ETH</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-[13px] text-qs-text-tertiary">待機時間</span>
              <span className="text-sm font-medium">7日間</span>
            </div>
          </div>

          {/* Bond Calculation */}
          <div
            className="p-4 rounded-qs-lg mb-5"
            style={{
              background: 'rgba(240, 160, 48, 0.12)',
              border: '1px solid var(--warning)',
            }}
          >
            <div className="font-mono text-[13px] text-qs-text-secondary mb-2">
              Bond = MAX(0.5 ETH, 金額 × 5%)
            </div>
            <div className="font-mono text-[13px] text-qs-text-secondary mb-2">
              = MAX(0.5 ETH, {lockAmount.toFixed(2)} × 5%) = MAX(0.5, {(lockAmount * BOND_PERCENTAGE).toFixed(2)})
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm font-medium">必要なBond</span>
              <span className="text-2xl font-bold text-qs-warning">{calculatedBond.toFixed(2)} ETH</span>
            </div>
          </div>

          {/* Info List */}
          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-2.5 py-2 text-[13px] text-qs-text-secondary">
              <span className="text-qs-warning">✓</span>
              <span>
                Bondは7日間の待機期間後、Challengeがなければ<strong>全額返還</strong>されます
              </span>
            </div>
            <div className="flex items-start gap-2.5 py-2 text-[13px] text-qs-text-secondary">
              <span className="text-qs-warning">✓</span>
              <span>不正なUnlockの場合、BondはChallengerに没収されます</span>
            </div>
            <div className="flex items-start gap-2.5 py-2 text-[13px] text-qs-text-secondary">
              <span className="text-qs-warning">✓</span>
              <span>緊急Unlockは秘密鍵紛失時のセーフティネットです</span>
            </div>
          </div>
        </div>

        {/* Checkbox Row */}
        <div className="flex items-center gap-3 p-4 bg-qs-bg-secondary rounded-qs-lg mb-6">
          <input
            type="checkbox"
            id="confirmCheckbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="w-5 h-5 accent-qs-warning cursor-pointer"
          />
          <label htmlFor="confirmCheckbox" className="text-sm text-qs-text-secondary cursor-pointer">
            上記の内容を理解し、Bond {calculatedBond.toFixed(2)} ETHを支払うことに同意します
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Link
            href={`/unlock?lockId=${lockId}`}
            className="flex-1 py-4 bg-qs-bg-secondary border border-qs-border-default rounded-qs-lg text-qs-text-secondary font-semibold text-[15px] text-center hover:border-qs-border-default hover:text-qs-text-primary transition-colors"
          >
            キャンセル
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!isConfirmed || isSubmitting}
            className="flex-1 py-4 bg-qs-warning rounded-qs-lg text-qs-bg-primary font-semibold text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
          >
            {isSubmitting ? '処理中...' : '緊急Unlockを開始'}
          </button>
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

export default function EmergencyBondPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EmergencyBondContent />
    </Suspense>
  );
}
