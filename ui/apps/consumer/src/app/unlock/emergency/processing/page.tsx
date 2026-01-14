'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Emergency Unlock Processing Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 15_emergency_processing.html
 */

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: string;
  text: string;
  status: StepStatus;
}

const TOTAL_DURATION = 5000;
const STEP_INTERVAL = 1000;

export default function EmergencyProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const amount = searchParams.get('amount') || '10.00';
  const bond = searchParams.get('bond') || '0.50';

  const [steps, setSteps] = useState<Step[]>([
    { id: 'verify', text: 'ウォレット署名を検証', status: 'complete' },
    { id: 'bond', text: `Bond (${bond} ETH) を送金中...`, status: 'active' },
    { id: 'register', text: '緊急Unlock要求を登録', status: 'pending' },
    { id: 'timelock', text: '7日間Time Lock開始', status: 'pending' },
  ]);

  useEffect(() => {
    // Step 2 (bond) completes after STEP_INTERVAL
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'bond'
            ? { ...s, status: 'complete' }
            : s.id === 'register'
            ? { ...s, status: 'active' }
            : s
        )
      );
    }, STEP_INTERVAL);

    // Step 3 (register) completes after STEP_INTERVAL * 2
    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'register'
            ? { ...s, status: 'complete' }
            : s.id === 'timelock'
            ? { ...s, status: 'active' }
            : s
        )
      );
    }, STEP_INTERVAL * 2);

    // Step 4 (timelock) completes after STEP_INTERVAL * 3
    const timer3 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => (s.id === 'timelock' ? { ...s, status: 'complete' } : s))
      );
    }, STEP_INTERVAL * 3);

    // Redirect after TOTAL_DURATION
    const timer4 = setTimeout(() => {
      router.push(`/unlock/emergency/success?lockId=${lockId}&amount=${amount}&bond=${bond}`);
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router, lockId, amount, bond]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Premium Background with Warning Glow */}
      <div className="premium-bg">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle, rgba(240, 160, 48, 0.15), transparent 60%)',
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
              borderTopColor: 'var(--warning)',
              animation: 'spin 1.5s linear infinite',
            }}
          />
          <div
            className="absolute -inset-2.5 border-2 border-transparent rounded-full"
            style={{
              borderTopColor: 'var(--warning)',
              animation: 'spin 2s linear infinite reverse',
            }}
          />

          {/* Warning Icon */}
          <div className="absolute inset-[30px] flex items-center justify-center">
            <div
              className="text-5xl"
              style={{ animation: 'pulse-opacity 1.5s ease-in-out infinite' }}
            >
              ⚠️
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-3 text-qs-warning">緊急Unlock処理中...</h1>
        <p className="text-sm text-qs-text-secondary mb-8">Bond支払いを処理しています</p>

        {/* Steps */}
        <div className="text-left space-y-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-qs-lg transition-all ${
                step.status === 'active'
                  ? 'bg-qs-warning/15'
                  : step.status === 'complete'
                  ? 'bg-qs-success/10'
                  : 'bg-white/5'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step.status === 'active'
                    ? 'bg-qs-warning text-qs-bg-primary'
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
      </div>
    </div>
  );
}
