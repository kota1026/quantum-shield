'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Coins,
  Lock,
  Vote,
  Gift,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StepData {
  id: number;
  icon: React.ReactNode;
  key: string;
}

const STEPS: StepData[] = [
  { id: 1, icon: <Coins className="w-6 h-6" />, key: 'getTokens' },
  { id: 2, icon: <Lock className="w-6 h-6" />, key: 'lockTokens' },
  { id: 3, icon: <Vote className="w-6 h-6" />, key: 'vote' },
  { id: 4, icon: <Gift className="w-6 h-6" />, key: 'earnRewards' },
];

export function QSHubOnboarding() {
  const t = useTranslations('qs-hub.onboarding');
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="container mx-auto max-w-[600px] px-6 py-6 flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-4 mb-8">
            <Link
              href="/qs-hub/landing"
              className={cn(
                'w-11 h-11 flex items-center justify-center',
                'bg-surface border border-border rounded-qs',
                'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
                'transition-all'
              )}
              aria-label={t('header.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              {t('header.title')}
            </h1>
          </header>

          {/* Progress Steps */}
          <nav className="mb-8" aria-label={t('progress.ariaLabel')}>
            <ol className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <li key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={cn(
                      'min-w-[44px] w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0',
                      'transition-all',
                      step.id === currentStep
                        ? 'bg-hinomaru text-white'
                        : step.id < currentStep
                        ? 'bg-success text-white'
                        : 'bg-surface border border-border text-foreground-tertiary'
                    )}
                    aria-current={step.id === currentStep ? 'step' : undefined}
                    aria-label={t(`steps.${step.key}.title`)}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-semibold">{step.id}</span>
                    )}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-full h-1 mx-2',
                        step.id < currentStep ? 'bg-success' : 'bg-border'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {/* Step Content */}
          <div className="flex-1 flex flex-col">
            <div
              className={cn(
                'flex-1 p-8 rounded-qs-xl',
                'bg-surface border border-border',
                'text-center'
              )}
            >
              {/* Step Icon */}
              <div
                className={cn(
                  'w-20 h-20 mx-auto mb-6',
                  'bg-hinomaru/10 rounded-full',
                  'flex items-center justify-center text-hinomaru'
                )}
                aria-hidden="true"
              >
                {currentStepData.icon}
              </div>

              {/* Step Title */}
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t(`steps.${currentStepData.key}.title`)}
              </h2>

              {/* Step Description */}
              <p className="text-foreground-secondary mb-6">
                {t(`steps.${currentStepData.key}.description`)}
              </p>

              {/* Step Details */}
              <div className="text-left bg-background-secondary p-4 rounded-qs-lg mb-6">
                <ul className="space-y-3">
                  {[1, 2, 3].map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-foreground-secondary">
                        {t(`steps.${currentStepData.key}.points.${point}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step Action */}
              {currentStep === STEPS.length ? (
                <Button variant="primary" asChild className="w-full min-h-[44px]">
                  <Link href="/qs-hub/dashboard">
                    {t('actions.startNow')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  asChild
                  className="w-full min-h-[44px]"
                >
                  <Link href={t(`steps.${currentStepData.key}.actionHref`)}>
                    {t(`steps.${currentStepData.key}.action`)}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('navigation.prev')}
              </Button>

              <span className="text-sm text-foreground-tertiary">
                {currentStep} / {STEPS.length}
              </span>

              {currentStep < STEPS.length ? (
                <Button
                  variant="ghost"
                  onClick={handleNext}
                  className="min-h-[44px]"
                >
                  {t('navigation.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <div className="w-24" /> // Placeholder for alignment
              )}
            </div>
          </div>

          {/* Skip Link */}
          <div className="text-center mt-6">
            <Link
              href="/qs-hub/dashboard"
              className="text-sm text-foreground-tertiary hover:text-foreground transition-colors min-h-[44px] inline-flex items-center"
            >
              {t('navigation.skip')}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            {t('footer.copyright')}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default QSHubOnboarding;
