'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'active' | 'complete';

interface ProcessingStep {
  id: string;
  text: string;
  status: StepStatus;
}

export function UnlockProcessing() {
  const t = useTranslations('consumer.unlockProcessing');
  const router = useRouter();

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'verify', text: t('steps.verify'), status: 'complete' },
    { id: 'send', text: t('steps.send'), status: 'complete' },
    { id: 'prover', text: t('steps.prover'), status: 'active' },
    { id: 'timelock', text: t('steps.timelock'), status: 'pending' },
  ]);

  useEffect(() => {
    // Step 3 (prover) complete after 1.25s
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 'prover') return { ...step, status: 'complete' };
          if (step.id === 'timelock') return { ...step, status: 'active' };
          return step;
        })
      );
    }, 1250);

    // Step 4 (timelock) complete after 2.5s
    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 'timelock') return { ...step, status: 'complete' };
          return step;
        })
      );
    }, 2500);

    // Redirect after 5s
    const timer3 = setTimeout(() => {
      router.push('/consumer/unlock-success');
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Background Glow - Gold for unlock */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-[radial-gradient(circle,rgba(201,169,98,0.15),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-[400px] w-full">
        {/* Processing Visual */}
        <div
          className="relative w-40 h-40 mx-auto mb-8"
          role="img"
          aria-label={t('visualLabel')}
        >
          {/* Orbits */}
          <div
            className={cn(
              'absolute inset-0 border-2 border-transparent border-t-gold rounded-full',
              'animate-spin'
            )}
            style={{ animationDuration: '1.5s' }}
          />
          <div
            className={cn(
              'absolute -inset-2.5 border-2 border-transparent border-t-hinomaru rounded-full',
              'animate-spin'
            )}
            style={{ animationDuration: '2s', animationDirection: 'reverse' }}
          />

          {/* Unlock Icon */}
          <div className="absolute inset-[30px] flex items-center justify-center">
            <span
              className="text-5xl animate-bounce"
              style={{ animationDuration: '1s' }}
              aria-hidden="true"
            >
              🔓
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {t('title')}
        </h1>
        <p className="text-sm text-foreground-secondary mb-8">
          {t('subtitle')}
        </p>

        {/* Steps */}
        <div className="text-left mb-8" role="list" aria-label={t('stepsLabel')}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-qs-lg mb-2',
                'transition-all duration-300',
                step.status === 'pending' && 'bg-white/5',
                step.status === 'active' && 'bg-gold/10',
                step.status === 'complete' && 'bg-success/10'
              )}
              role="listitem"
              aria-current={step.status === 'active' ? 'step' : undefined}
            >
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium',
                  'transition-all duration-300',
                  step.status === 'pending' && 'bg-white/10 text-foreground-tertiary',
                  step.status === 'active' && 'bg-gold text-background animate-pulse',
                  step.status === 'complete' && 'bg-success text-white'
                )}
              >
                {step.status === 'complete' ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'flex-1 text-sm transition-colors duration-300',
                  step.status === 'pending' && 'text-foreground-tertiary',
                  step.status === 'active' && 'text-foreground font-medium',
                  step.status === 'complete' && 'text-success'
                )}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>

        {/* Time Lock Info */}
        <div
          className={cn(
            'bg-warning/10 border border-warning rounded-qs-lg p-4',
            'text-left'
          )}
        >
          <p className="text-sm text-foreground-secondary">
            {t('info.text1')}
            <strong className="text-warning">{t('info.highlight')}</strong>
            {t('info.text2')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default UnlockProcessing;
