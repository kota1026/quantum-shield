'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: number;
  status: StepStatus;
}

const TOTAL_DURATION = 5000; // 5 seconds
const STEP_INTERVAL = 1000;  // 1 second per step

export function EmergencyProcessing() {
  const t = useTranslations('consumer.emergencyProcessing');
  const router = useRouter();

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, status: 'complete' },
    { id: 2, status: 'active' },
    { id: 3, status: 'pending' },
    { id: 4, status: 'pending' },
  ]);

  useEffect(() => {
    // Step 2 complete after 1s
    const timer1 = setTimeout(() => {
      setSteps(prev => prev.map(s => {
        if (s.id === 2) return { ...s, status: 'complete' };
        if (s.id === 3) return { ...s, status: 'active' };
        return s;
      }));
    }, STEP_INTERVAL);

    // Step 3 complete after 2s
    const timer2 = setTimeout(() => {
      setSteps(prev => prev.map(s => {
        if (s.id === 3) return { ...s, status: 'complete' };
        if (s.id === 4) return { ...s, status: 'active' };
        return s;
      }));
    }, STEP_INTERVAL * 2);

    // Step 4 complete after 3s
    const timer3 = setTimeout(() => {
      setSteps(prev => prev.map(s => {
        if (s.id === 4) return { ...s, status: 'complete' };
        return s;
      }));
    }, STEP_INTERVAL * 3);

    // Redirect after 5s
    const timer4 = setTimeout(() => {
      router.push('/consumer/emergency-success');
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router]);

  const stepLabels = [
    t('steps.verify'),
    t('steps.sendBond'),
    t('steps.register'),
    t('steps.startTimeLock'),
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[600px] h-[600px]',
            'bg-gradient-radial from-warning/15 to-transparent'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        {/* Processing Visual */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          {/* Orbits */}
          <div
            className={cn(
              'absolute inset-0',
              'border-2 border-transparent border-t-warning',
              'rounded-full animate-spin'
            )}
            style={{ animationDuration: '1.5s' }}
          />
          <div
            className={cn(
              'absolute -inset-2.5',
              'border-2 border-transparent border-t-warning',
              'rounded-full animate-spin'
            )}
            style={{ animationDuration: '2s', animationDirection: 'reverse' }}
          />
          {/* Center Icon */}
          <div
            className={cn(
              'absolute inset-[30px] flex items-center justify-center',
              'animate-pulse'
            )}
            style={{ animationDuration: '1.5s' }}
          >
            <AlertTriangle className="w-12 h-12 text-warning" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-warning mb-3">
          {t('status.processing')}
        </h1>
        <p className="text-sm text-foreground-secondary mb-8">
          {t('message.wait')}
        </p>

        {/* Steps */}
        <div className="text-left space-y-2 mb-8" role="list" aria-label={t('status.processing')}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-qs-lg transition-all',
                step.status === 'pending' && 'bg-white/[0.02]',
                step.status === 'active' && 'bg-warning/15',
                step.status === 'complete' && 'bg-success/10'
              )}
              role="listitem"
            >
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium',
                  step.status === 'pending' && 'bg-white/5 text-foreground-tertiary',
                  step.status === 'active' && 'bg-warning text-background animate-pulse',
                  step.status === 'complete' && 'bg-success text-white'
                )}
              >
                {step.status === 'complete' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={cn(
                  'text-sm flex-1',
                  step.status === 'pending' && 'text-foreground-tertiary',
                  step.status === 'active' && 'text-foreground font-medium',
                  step.status === 'complete' && 'text-success'
                )}
              >
                {stepLabels[index]}
              </span>
            </div>
          ))}
        </div>

        {/* Do not close warning */}
        <p className="text-xs text-foreground-tertiary">
          {t('message.doNotClose')}
        </p>
      </div>
    </div>
  );
}

export default EmergencyProcessing;
