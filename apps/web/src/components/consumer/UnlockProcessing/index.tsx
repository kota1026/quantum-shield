'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Check, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: number;
  status: StepStatus;
}

const TOTAL_DURATION = 5000;
const STEP_INTERVAL = 1250;

export function UnlockProcessing() {
  const t = useTranslations('consumer.unlockProcessing');
  const router = useRouter();

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, status: 'complete' },
    { id: 2, status: 'complete' },
    { id: 3, status: 'active' },
    { id: 4, status: 'pending' },
  ]);

  const [showTxHash, setShowTxHash] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setSteps(prev => prev.map(s => {
        if (s.id === 3) return { ...s, status: 'complete' };
        if (s.id === 4) return { ...s, status: 'active' };
        return s;
      }));
      setShowTxHash(true);
    }, STEP_INTERVAL);

    const timer2 = setTimeout(() => {
      setSteps(prev => prev.map(s => {
        if (s.id === 4) return { ...s, status: 'complete' };
        return s;
      }));
    }, STEP_INTERVAL * 2);

    const timer3 = setTimeout(() => {
      router.push('/consumer/unlock/success');
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router]);

  const stepLabels = [
    t('steps.verify'),
    t('steps.createTx'),
    t('steps.broadcast'),
    t('steps.startTimeLock'),
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-hinomaru/15 to-transparent" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-md w-full">
        <div className="relative w-40 h-40 mx-auto mb-8">
          <div className="absolute inset-0 border-2 border-transparent border-t-gold rounded-full animate-spin" style={{ animationDuration: '1.5s' }} />
          <div className="absolute -inset-2.5 border-2 border-transparent border-t-hinomaru rounded-full animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          <div className="absolute inset-[30px]">
            <div className="absolute inset-0 bg-gradient-radial from-white/15 to-white/2 rounded-full border border-white/10" />
            <div className="absolute inset-5 bg-gradient-to-br from-[#ff3050] via-hinomaru to-[#8a001a] rounded-full shadow-[0_0_40px_rgba(188,0,45,0.4)] animate-pulse" style={{ animationDuration: '2s' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <Unlock className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('subtitle')}</p>

        <div className="text-left space-y-2 mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-qs transition-all',
                step.status === 'pending' && 'bg-white/2',
                step.status === 'active' && 'bg-hinomaru/10',
                step.status === 'complete' && 'bg-success/10'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                  step.status === 'pending' && 'bg-white/5 text-muted-foreground',
                  step.status === 'active' && 'bg-hinomaru text-white animate-pulse',
                  step.status === 'complete' && 'bg-success text-white'
                )}
              >
                {step.status === 'complete' ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'flex-1 text-sm',
                  step.status === 'pending' && 'text-muted-foreground',
                  step.status === 'active' && 'text-foreground font-medium',
                  step.status === 'complete' && 'text-success'
                )}
              >
                {stepLabels[index]}
              </span>
            </div>
          ))}
        </div>

        {showTxHash && (
          <p className="text-xs text-muted-foreground font-mono">
            TX: <a href="https://sepolia.etherscan.io/tx/0x8b4e...1d3f" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">0x8b4e...1d3f</a>
          </p>
        )}
      </div>
    </div>
  );
}
