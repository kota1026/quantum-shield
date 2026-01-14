'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useQSLock } from '@quantum-shield/web3';

/**
 * Lock Processing Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 10_lock_processing.html
 */

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: string;
  text: string;
  status: StepStatus;
}

const IS_TESTNET_MODE = process.env.NEXT_PUBLIC_ENABLE_TESTNET_MODE === 'true';

export default function LockProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '5.00';
  const dilithiumPubKey = searchParams.get('pubKey') || '';
  const userSignature = searchParams.get('signature') || '';

  const { address, isConnected } = useAccount();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [steps, setSteps] = useState<Step[]>([
    { id: 'sign', text: 'Dilithium署名を生成', status: 'complete' },
    { id: 'create', text: 'トランザクションを作成', status: 'complete' },
    { id: 'submit', text: 'ブロックチェーンに送信中...', status: 'active' },
    { id: 'confirm', text: '確認を待機', status: 'pending' },
  ]);

  const [txHash, setTxHash] = useState<string | null>(null);

  const {
    lock,
    isPending,
    isConfirming,
    isSuccess,
    txHash: realTxHash,
  } = useQSLock({
    onSuccess: (hash) => {
      setTxHash(hash);
    },
    onError: (error) => {
      setErrorMessage(error.message);
    },
  });

  // Demo mode: Simulate processing
  useEffect(() => {
    const demoMode = !realTxHash;
    if (!demoMode) return;

    // Step 3 completes after 1.25s
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'submit'
            ? { ...s, status: 'complete' }
            : s.id === 'confirm'
            ? { ...s, status: 'active' }
            : s
        )
      );
      setTxHash('0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d');
    }, 1250);

    // Step 4 completes after 2.5s
    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => (s.id === 'confirm' ? { ...s, status: 'complete' } : s))
      );
    }, 2500);

    // Redirect after 5s
    const timer3 = setTimeout(() => {
      router.push(`/lock/success?amount=${amount}&txHash=0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d`);
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [realTxHash, router, amount]);

  // Real mode: Execute lock
  const executeLock = useCallback(async () => {
    if (!isConnected || !address) {
      setErrorMessage('ウォレットが接続されていません');
      return;
    }

    try {
      let pubKey = dilithiumPubKey;
      let signature = userSignature;

      if (!pubKey || !signature) {
        if (!IS_TESTNET_MODE) {
          setErrorMessage('Dilithium WASMモジュールが利用できません');
          return;
        }
        pubKey = generateMockDilithiumPubKey(address);
        signature = generateMockSignature(address, amount);
      }

      await lock({
        amount,
        dilithiumPublicKey: pubKey,
        userSignature: signature,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Lock failed');
      setErrorMessage(error.message);
    }
  }, [isConnected, address, amount, dilithiumPubKey, userSignature, lock]);

  // Error state
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="premium-bg">
          <div className="red-glow" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-qs-danger/10 rounded-full flex items-center justify-center text-5xl">
            ❌
          </div>
          <h1 className="text-2xl font-bold mb-2 text-qs-danger">エラーが発生しました</h1>
          <p className="text-qs-text-secondary mb-6">{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setErrorMessage(null);
                executeLock();
              }}
              className="flex-1 btn-primary"
            >
              再試行
            </button>
            <button
              onClick={() => router.push('/lock')}
              className="flex-1 btn-secondary"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Premium Background */}
      <div className="premium-bg">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-50"
          style={{
            background: 'radial-gradient(circle, var(--accent-hinomaru-dim), transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-[400px] w-full">
        {/* Processing Visual */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          {/* Orbits */}
          <div
            className="absolute inset-0 border-2 border-transparent rounded-full animate-[spin_1.5s_linear_infinite]"
            style={{ borderTopColor: 'var(--accent-gold)' }}
          />
          <div
            className="absolute -inset-2.5 border-2 border-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"
            style={{ borderTopColor: 'var(--accent-hinomaru)' }}
          />

          {/* Hinomaru Core */}
          <div className="absolute inset-[30px]">
            <div
              className="absolute inset-0 rounded-full border border-white/10"
              style={{
                background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.15), rgba(255,255,255,0.02))',
              }}
            />
            <div
              className="absolute inset-5 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle at 35% 35%, #ff3050, var(--accent-hinomaru), #8a001a)',
                boxShadow: '0 0 40px var(--accent-hinomaru-glow)',
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">Lock処理中...</h1>
        <p className="text-sm text-qs-text-secondary mb-8">
          しばらくお待ちください。このページを閉じないでください。
        </p>

        {/* Steps */}
        <div className="text-left space-y-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-qs-lg transition-all ${
                step.status === 'active'
                  ? 'bg-hinomaru-dim'
                  : step.status === 'complete'
                  ? 'bg-qs-success/10'
                  : 'bg-white/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === 'active'
                    ? 'bg-hinomaru text-white animate-pulse'
                    : step.status === 'complete'
                    ? 'bg-qs-success text-white'
                    : 'bg-white/5 text-qs-text-tertiary'
                }`}
              >
                {step.status === 'complete' ? '✓' : index + 1}
              </div>
              <span
                className={`flex-1 text-sm ${
                  step.status === 'active'
                    ? 'text-qs-text-primary font-medium'
                    : step.status === 'complete'
                    ? 'text-qs-success'
                    : 'text-qs-text-tertiary'
                }`}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>

        {/* TX Hash */}
        {txHash && (
          <div className="text-xs text-qs-text-tertiary">
            TX:{' '}
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              {txHash.slice(0, 6)}...{txHash.slice(-4)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function generateMockDilithiumPubKey(address: string): string {
  const seed = address.toLowerCase().replace('0x', '');
  const mockPubKey = Array.from({ length: 64 }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return ((charCode + i * 17) % 256).toString(16).padStart(2, '0');
  }).join('');
  return mockPubKey;
}

function generateMockSignature(address: string, amount: string): string {
  const seed = `${address}:${amount}`.toLowerCase();
  const mockSignature = Array.from({ length: 128 }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return ((charCode + i * 31) % 256).toString(16).padStart(2, '0');
  }).join('');
  return mockSignature;
}
