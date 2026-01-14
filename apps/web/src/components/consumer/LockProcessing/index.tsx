'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'active' | 'complete';

interface ProcessingStep {
  id: string;
  text: string;
  status: StepStatus;
}

// Demo TX Hash
const DEMO_TX_HASH = '0x7a3f...9c2d';
const DEMO_TX_URL = 'https://sepolia.etherscan.io/tx/0x7a3f9c2d';

export function LockProcessing() {
  const t = useTranslations('consumer.lockProcessing');
  const router = useRouter();

  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'sign', text: t('steps.sign'), status: 'complete' },
    { id: 'create', text: t('steps.create'), status: 'complete' },
    { id: 'send', text: t('steps.send'), status: 'active' },
    { id: 'confirm', text: t('steps.confirm'), status: 'pending' },
  ]);

  const [showTxHash, setShowTxHash] = useState(false);

  useEffect(() => {
    // Step 3 complete after 1.25s
    const timer1 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 'send') return { ...step, status: 'complete' };
          if (step.id === 'confirm') return { ...step, status: 'active' };
          return step;
        })
      );
      setShowTxHash(true);
    }, 1250);

    // Step 4 complete after 2.5s
    const timer2 = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === 'confirm') return { ...step, status: 'complete' };
          return step;
        })
      );
    }, 2500);

    // Redirect after 5s
    const timer3 = setTimeout(() => {
      router.push('/consumer/lock-success');
    }, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-[400px] w-full">
        {/* Processing Visual - Hinomaru with orbits */}
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

          {/* Hinomaru Core */}
          <div className="absolute inset-[30px]">
            <div
              className={cn(
                'absolute inset-0 rounded-full',
                'bg-gradient-radial from-white/15 to-white/5',
                'border border-white/10'
              )}
            />
            <div
              className={cn(
                'absolute inset-5 rounded-full',
                'bg-gradient-to-br from-hinomaru-light via-hinomaru to-hinomaru-dark',
                'shadow-[0_0_40px_rgba(188,0,45,0.4)]',
                'animate-pulse'
              )}
              style={{ animationDuration: '2s' }}
            />
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
                step.status === 'active' && 'bg-hinomaru/10',
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
                  step.status === 'active' && 'bg-hinomaru text-white animate-pulse',
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

        {/* TX Hash */}
        {showTxHash && (
          <div
            className={cn(
              'text-xs text-foreground-tertiary',
              'animate-fade-in'
            )}
          >
            <span>TX: </span>
            <a
              href={DEMO_TX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline font-mono"
            >
              {DEMO_TX_HASH}
              <ExternalLink className="inline w-3 h-3 ml-1" aria-hidden="true" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default LockProcessing;
