'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type StepStatus = 'pending' | 'active' | 'complete';

interface Step {
  id: number;
  status: StepStatus;
}

const TOTAL_DURATION = 5000;
const STEP_INTERVAL = 1250;

// Mock tx hash generator (in production, this would come from the actual transaction)
const generateMockTxHash = () => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 8; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  hash += '...';
  for (let i = 0; i < 4; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

export function LockProcessing() {
  const t = useTranslations('consumer.lockProcessing');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get data from URL params
  const amount = searchParams.get('amount') || '5.00';
  const period = searchParams.get('period') || '2';

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, status: 'complete' },
    { id: 2, status: 'complete' },
    { id: 3, status: 'active' },
    { id: 4, status: 'pending' },
  ]);

  const [showTxHash, setShowTxHash] = useState(false);
  const [txHash] = useState(() => generateMockTxHash());

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
      // Pass data to success page
      const params = new URLSearchParams({
        amount,
        period,
        txHash,
      });
      router.push(`/consumer/lock/success?${params.toString()}`);
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router, amount, period, txHash]);

  const stepLabels = [
    { label: t('steps.sign'), tooltip: t('steps.signTooltip') },
    { label: t('steps.createTx'), tooltip: null },
    { label: t('steps.broadcast'), tooltip: null },
    { label: t('steps.confirm'), tooltip: null },
  ];

  return (
    <TooltipProvider>
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
            <div className="absolute inset-5 bg-gradient-to-br from-[#ff3050] via-hinomaru to-[#8a001a] rounded-full shadow-[0_0_40px_rgba(188,0,45,0.4)] animate-pulse" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-3">{t('title')}</h1>
        <p className="text-sm text-foreground-secondary mb-8">{t('subtitle')}</p>

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
                  step.status === 'pending' && 'bg-white/5 text-foreground-secondary',
                  step.status === 'active' && 'bg-hinomaru text-white animate-pulse',
                  step.status === 'complete' && 'bg-success text-white'
                )}
              >
                {step.status === 'complete' ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'flex-1 text-sm flex items-center gap-1',
                  step.status === 'pending' && 'text-foreground-secondary',
                  step.status === 'active' && 'text-foreground font-medium',
                  step.status === 'complete' && 'text-success'
                )}
              >
                {stepLabels[index].label}
                {stepLabels[index].tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-3 rounded hover:bg-surface-secondary/50 transition-colors" aria-label={t('steps.tooltipAriaLabel')}>
                        <HelpCircle className="h-3 w-3 text-foreground-tertiary" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{stepLabels[index].tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
            </div>
          ))}
        </div>

        {showTxHash && (
          <p className="text-xs text-foreground-secondary font-mono">
            TX: <span className="text-gold">{txHash}</span>
          </p>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
