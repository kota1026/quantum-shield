'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, CheckCircle2, Circle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
} from '@quantum-shield/ui';

type Step = 'signing' | 'submitting' | 'confirming' | 'complete';

const steps: { id: Step; title: string; description: string }[] = [
  {
    id: 'signing',
    title: 'Wallet Signature',
    description: 'Please sign the transaction in your wallet',
  },
  {
    id: 'submitting',
    title: 'Submitting Transaction',
    description: 'Sending transaction to the network',
  },
  {
    id: 'confirming',
    title: 'Confirming',
    description: 'Waiting for block confirmation',
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Your assets are now locked',
  },
];

export default function LockProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const [currentStep, setCurrentStep] = useState<Step>('signing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate the lock process
    const timer1 = setTimeout(() => {
      setCurrentStep('submitting');
      setProgress(33);
    }, 2000);

    const timer2 = setTimeout(() => {
      setCurrentStep('confirming');
      setProgress(66);
    }, 4000);

    const timer3 = setTimeout(() => {
      setCurrentStep('complete');
      setProgress(100);
    }, 6000);

    const timer4 = setTimeout(() => {
      router.push(`/lock/success?amount=${amount}`);
    }, 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router, amount]);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qs-primary-100 dark:bg-qs-primary-900">
            {currentStep === 'complete' ? (
              <CheckCircle2 className="h-8 w-8 text-qs-success-500" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-qs-primary-500" />
            )}
          </div>
          <CardTitle>
            {currentStep === 'complete' ? 'Lock Complete!' : 'Processing Lock'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'complete'
              ? `Successfully locked ${amount} ETH`
              : 'Please wait while we secure your assets'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 ${
                    isComplete || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="mt-0.5">
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-qs-success-500" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin text-qs-primary-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Amount Info */}
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Locking</p>
            <p className="text-2xl font-bold">{amount} ETH</p>
          </div>

          {/* Warning */}
          <p className="text-center text-sm text-muted-foreground">
            Do not close this window until the process is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
