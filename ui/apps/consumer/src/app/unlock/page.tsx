'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';

/**
 * Unlock Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 04_unlock.html
 */

type UnlockMethod = 'normal' | 'emergency';

interface LockItem {
  id: string;
  amount: string;
  lockedAt: string;
  status: 'locked' | 'unlocking';
  unlockTimeRemaining?: string;
}

// Mock data
const mockLocks: LockItem[] = [
  { id: '1', amount: '10.00', lockedAt: '2026-01-01 10:00', status: 'locked' },
  { id: '2', amount: '5.00', lockedAt: '2026-01-03 14:30', status: 'locked' },
  { id: '3', amount: '2.50', lockedAt: '2026-01-05 09:15', status: 'unlocking', unlockTimeRemaining: '23:41:02' },
];

function UnlockPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLockId = searchParams.get('lockId');
  const { isConnected } = useAccount();

  const [selectedLockId, setSelectedLockId] = useState<string | null>(preselectedLockId || mockLocks[0]?.id || null);
  const [selectedMethod, setSelectedMethod] = useState<UnlockMethod>('normal');
  const [showTimelockModal, setShowTimelockModal] = useState(false);

  const selectedLock = mockLocks.find(l => l.id === selectedLockId);

  const handleStartUnlock = () => {
    if (!selectedLockId || !selectedLock) return;
    if (selectedMethod === 'normal') {
      router.push(`/unlock/sign?lockId=${selectedLockId}&amount=${selectedLock.amount}`);
    } else {
      router.push(`/unlock/emergency/bond?lockId=${selectedLockId}&amount=${selectedLock.amount}`);
    }
  };

  // 未接続状態
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="premium-bg">
          <div className="red-glow" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-hinomaru-dim rounded-full flex items-center justify-center text-5xl">
            🔓
          </div>
          <h1 className="text-2xl font-bold mb-2">ウォレットを接続</h1>
          <p className="text-qs-text-secondary mb-6">
            資産のUnlockにはウォレット接続が必要です
          </p>
          <Link href="/onboarding" className="btn-primary inline-block">
            接続する
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Premium Background */}
      <div className="premium-bg">
        <div className="red-glow" />
      </div>

      <div className="relative z-10 max-w-[800px] mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center bg-qs-bg-secondary border border-qs-border-default rounded-qs-md text-qs-text-secondary hover:border-hinomaru hover:text-hinomaru-light transition-colors"
          >
            ←
          </Link>
          <h1 className="text-2xl font-bold">Unlock</h1>
        </div>

        {/* Section: Select Lock */}
        <div className="section-label">Select Lock to Unlock</div>

        <div className="flex flex-col gap-3 mb-8">
          {mockLocks.map((lock) => (
            <button
              key={lock.id}
              onClick={() => setSelectedLockId(lock.id)}
              className={`qs-card p-5 text-left transition-all ${
                selectedLockId === lock.id
                  ? 'border-hinomaru bg-hinomaru-dim'
                  : 'hover:border-qs-border-default'
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-qs-bg-secondary rounded-qs-md text-xl">
                    {lock.status === 'unlocking' ? '⏳' : '🔒'}
                  </div>
                  <div>
                    <div className="font-semibold text-[15px]">Lock #{lock.id}</div>
                    <div className="text-xs text-qs-text-tertiary font-mono">{lock.lockedAt}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="unlock"
                    checked={selectedLockId === lock.id}
                    onChange={() => setSelectedLockId(lock.id)}
                    className="w-5 h-5 accent-hinomaru"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">{lock.amount} ETH</span>
                {lock.status === 'unlocking' ? (
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-qs-warning/10 text-qs-warning">
                    Unlock中 ({lock.unlockTimeRemaining})
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-medium bg-hinomaru-dim text-hinomaru-light">
                    Locked
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Section: Select Method */}
        <div className="section-label">Select Unlock Method</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Normal Unlock */}
          <button
            onClick={() => setSelectedMethod('normal')}
            className={`qs-card p-6 text-left transition-all ${
              selectedMethod === 'normal' ? 'border-hinomaru' : 'hover:border-qs-border-default'
            }`}
          >
            <div className="text-3xl mb-4">🔐</div>
            <div className="text-base font-semibold mb-2">通常Unlock</div>
            <div className="text-[13px] text-qs-text-secondary leading-relaxed mb-4">
              Dilithium署名 + Prover署名で安全にUnlock
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-qs-text-tertiary">待機時間</span>
                <span className="font-medium">24時間</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-qs-text-tertiary">必要なもの</span>
                <span className="font-medium">Dilithium秘密鍵</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-qs-text-tertiary">手数料</span>
                <span className="font-medium">ガス代のみ</span>
              </div>
            </div>

            {/* Time Lock Help */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTimelockModal(true);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-gold mt-3 hover:underline"
            >
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center bg-gold/10 border border-gold rounded-full text-[9px] font-semibold">
                ?
              </span>
              なぜ24時間待つの？
            </button>

            {/* Time Lock Reason Box */}
            <div className="flex items-start gap-2.5 p-3 bg-gold/10 border border-gold/30 rounded-qs-md mt-3">
              <span className="text-base flex-shrink-0">🛡️</span>
              <div className="text-[11px] text-qs-text-secondary leading-relaxed">
                <strong className="text-gold">Time Lockはあなたを守ります</strong>
                <br />
                不正アクセスがあっても、24時間の猶予で検知・対処できます。
              </div>
            </div>
          </button>

          {/* Emergency Unlock */}
          <button
            onClick={() => setSelectedMethod('emergency')}
            className={`qs-card p-6 text-left transition-all ${
              selectedMethod === 'emergency' ? 'border-hinomaru' : 'hover:border-qs-border-default'
            }`}
          >
            <div className="text-3xl mb-4 text-qs-warning">⚠️</div>
            <div className="text-base font-semibold mb-2">緊急Unlock</div>
            <div className="text-[13px] text-qs-text-secondary leading-relaxed mb-4">
              秘密鍵紛失時のセーフティネット
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-qs-text-tertiary">待機時間</span>
                <span className="font-medium text-qs-warning">7日間</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-qs-text-tertiary">必要なもの</span>
                <span className="font-medium">ウォレット署名</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-qs-text-tertiary">Bond</span>
                <span className="font-medium text-qs-warning">MAX(0.5 ETH, 金額×5%)</span>
              </div>
            </div>
          </button>
        </div>

        {/* Emergency Warning */}
        {selectedMethod === 'emergency' && (
          <div className="flex items-start gap-3 p-4 bg-qs-warning/10 border border-qs-warning rounded-qs-lg mb-6">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h4 className="text-sm font-semibold text-qs-warning mb-1">緊急Unlockの注意事項</h4>
              <p className="text-[13px] text-qs-text-secondary leading-relaxed">
                緊急Unlockには7日間の待機期間とBond（保証金）が必要です。Bondは7日後にChallengeがなければ返還されます。
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleStartUnlock}
          disabled={!selectedLockId}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {selectedMethod === 'normal' ? '通常Unlockを開始' : '緊急Unlockを開始'}
        </button>
      </div>

      {/* Time Lock Modal */}
      {showTimelockModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6"
          onClick={() => setShowTimelockModal(false)}
        >
          <div
            className="bg-qs-bg-card border border-qs-border-default rounded-qs-xl max-w-[480px] w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-qs-border-subtle flex justify-between items-center">
              <h3 className="text-lg font-semibold">なぜ24時間待つの？</h3>
              <button
                onClick={() => setShowTimelockModal(false)}
                className="text-qs-text-secondary text-2xl p-1 hover:text-qs-text-primary"
              >
                ×
              </button>
            </div>
            <div className="p-6 text-[14px] text-qs-text-secondary leading-relaxed space-y-4">
              <p>
                <strong className="text-qs-text-primary">Time Lock</strong>
                は、あなたの資産を守るための重要なセキュリティ機能です。
              </p>

              <div>
                <h4 className="text-[15px] font-medium text-qs-text-primary mb-2">🛡️ Time Lockが守るもの</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>不正アクセスの検知</strong>: 誰かがあなたの秘密鍵を盗んでUnlockを試みても、24時間の猶予があれば気づいて対処できます
                  </li>
                  <li>
                    <strong>フィッシング対策</strong>: 誤って署名してしまっても、実際に資産が移動するまで24時間あります
                  </li>
                  <li>
                    <strong>ハッキング対策</strong>: 攻撃者は24時間以内に資産を持ち去ることができません
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-qs-text-primary mb-2">⏰ 待機中にできること</h4>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Unlock要求の確認・監視</li>
                  <li>不審な要求があればキャンセル</li>
                  <li>緊急時は緊急Unlockで対応可能（7日間待機+Bond必要）</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[15px] font-medium text-qs-text-primary mb-2">💡 豆知識</h4>
                <p>
                  「今収集して後で解読」攻撃に対抗するため、量子耐性暗号とTime Lockの組み合わせが最も効果的なセキュリティ戦略です。
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-qs-border-subtle">
              <button
                onClick={() => setShowTimelockModal(false)}
                className="w-full py-3 bg-hinomaru rounded-qs-lg text-white font-semibold text-sm hover:bg-hinomaru-light transition-colors"
              >
                理解しました
              </button>
            </div>
          </div>
        </div>
      )}
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

export default function UnlockPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnlockPageContent />
    </Suspense>
  );
}
