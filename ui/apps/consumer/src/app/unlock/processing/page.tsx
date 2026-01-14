'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Unlock Processing Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 12_unlock_processing.html
 */

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: string;
  text: string;
  status: StepStatus;
}

const TOTAL_DURATION = 5000;
const STEP_INTERVAL = 1250;

function UnlockProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const amount = searchParams.get('amount') || '10.00';

  const [steps, setSteps] = useState<Step[]>([
    { id: 'verify', text: 'Dilithium署名を検証', status: 'complete' },
    { id: 'send', text: 'Unlock要求を送信', status: 'complete' },
    { id: 'prover', text: 'Prover署名を待機中...', status: 'active' },
    { id: 'timelock', text: 'Time Lock開始', status: 'pending' },
  ]);

  // Demo mode: Simulate processing
  useEffect(() => {
    // Step 3 (prover) completes after STEP_INTERVAL
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'prover'
            ? { ...s, status: 'complete' }
            : s.id === 'timelock'
            ? { ...s, status: 'active' }
            : s
        )
      );
    }, STEP_INTERVAL);

    // Step 4 (timelock) completes after STEP_INTERVAL * 2
    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => (s.id === 'timelock' ? { ...s, status: 'complete' } : s))
      );
    }, STEP_INTERVAL * 2);

    // Redirect after TOTAL_DURATION
    const timer3 = setTimeout(() => {
      router.push(`/unlock/success?lockId=${lockId}&amount=${amount}`);
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router, lockId, amount]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Premium Background with Gold Glow */}
      <div className="premium-bg">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(201, 169, 98, 0.15), transparent 60%)',
          }}
        />
      </div>

      <div className="relative z-10 text-center max-w-[400px] w-full">
        {/* Processing Visual */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          {/* Orbits */}
          <div
            className="absolute inset-0 border-2 border-transparent rounded-full"
            style={{
              borderTopColor: 'var(--accent-gold)',
              animation: 'spin 1.5s linear infinite',
            }}
          />
          <div
            className="absolute -inset-2.5 border-2 border-transparent rounded-full"
            style={{
              borderTopColor: 'var(--accent-hinomaru)',
              animation: 'spin 2s linear infinite reverse',
            }}
          />

          {/* Unlock Icon */}
          <div className="absolute inset-[30px] flex items-center justify-center">
            <div
              className="text-5xl"
              style={{ animation: 'unlock-bounce 1s ease-in-out infinite' }}
            >
              🔓
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3">Unlock処理中...</h1>
        <p className="text-sm text-qs-text-secondary mb-8">Prover署名を待っています</p>

        {/* Steps */}
        <div className="text-left space-y-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-qs-lg transition-all ${
                step.status === 'active'
                  ? 'bg-gold/10'
                  : step.status === 'complete'
                  ? 'bg-qs-success/10'
                  : 'bg-white/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === 'active'
                    ? 'bg-gold text-qs-bg-primary'
                    : step.status === 'complete'
                    ? 'bg-qs-success text-white'
                    : 'bg-white/5 text-qs-text-tertiary'
                }`}
                style={step.status === 'active' ? { animation: 'pulse-scale 1s ease-in-out infinite' } : {}}
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

        {/* Time Lock Info */}
        <div
          className="p-4 rounded-qs-lg text-left"
          style={{
            background: 'rgba(240, 160, 48, 0.1)',
            border: '1px solid var(--warning)',
          }}
        >
          <p className="text-[13px] text-qs-text-secondary">
            Unlock要求が承認されると、<strong className="text-qs-warning">24時間のTime Lock</strong>
            が開始されます。
          </p>
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

export default function UnlockProcessingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnlockProcessingContent />
    </Suspense>
  );
}
