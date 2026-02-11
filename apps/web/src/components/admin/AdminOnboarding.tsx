'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  User,
  Shield,
  Users,
  Vote,
  Settings,
  Check,
  ChevronRight,
  ChevronLeft,
  Award,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Step indicator component
interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
  onStepClick: (step: number) => void;
}

function StepIndicator({ steps, currentStep, onStepClick }: StepIndicatorProps) {
  const t = useTranslations('admin.onboarding');

  return (
    <nav
      className="mb-12 flex items-center justify-center gap-2"
      aria-label={t('progress.step', { current: currentStep + 1, total: steps.length })}
    >
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <button
            type="button"
            onClick={() => index <= currentStep && onStepClick(index)}
            disabled={index > currentStep}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              index < currentStep &&
                'border-success bg-success text-white hover:opacity-90',
              index === currentStep &&
                'border-hinomaru bg-hinomaru text-white',
              index > currentStep &&
                'cursor-not-allowed border-surface-tertiary bg-background-secondary text-foreground-tertiary'
            )}
            aria-label={t('progress.stepLabel', { number: index + 1 })}
            aria-current={index === currentStep ? 'step' : undefined}
          >
            {index < currentStep ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              index + 1
            )}
          </button>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'mx-2 h-0.5 w-12 transition-colors sm:w-16',
                index < currentStep ? 'bg-hinomaru' : 'bg-surface-tertiary'
              )}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </nav>
  );
}

// Overview item component
interface OverviewItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'consumer' | 'prover' | 'governance' | 'admin';
}

function OverviewItem({ icon, title, description, variant }: OverviewItemProps) {
  const bgColors = {
    consumer: 'bg-hinomaru/10',
    prover: 'bg-[#4a90d9]/10',
    governance: 'bg-gold/10',
    admin: 'bg-success/10',
  };

  return (
    <article className="rounded-xl bg-background-secondary p-5">
      <div
        className={cn(
          'mb-3 flex h-12 w-12 items-center justify-center rounded-xl',
          bgColors[variant]
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-foreground">{title}</h3>
      <p className="text-[13px] leading-relaxed text-foreground-secondary">
        {description}
      </p>
    </article>
  );
}

// Principle item component
interface PrincipleItemProps {
  number: number;
  title: string;
  description: string;
  tag: string;
}

function PrincipleItem({ number, title, description, tag }: PrincipleItemProps) {
  return (
    <article
      className="flex gap-4 rounded-xl border-l-4 border-hinomaru bg-background-secondary p-5"
      aria-label={`${tag}: ${title}`}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-hinomaru text-sm font-bold text-white"
        aria-hidden="true"
      >
        {number}
      </div>
      <div className="flex-1">
        <h3 className="mb-1 text-[15px] font-semibold text-foreground">{title}</h3>
        <p className="mb-2 text-[13px] text-foreground-secondary">{description}</p>
        <span className="inline-block rounded bg-hinomaru/10 px-2 py-0.5 font-mono text-[10px] text-hinomaru">
          {tag}
        </span>
      </div>
    </article>
  );
}

// Emergency procedure step component
interface ProcedureStepProps {
  number: number;
  title: string;
  description: string;
  isLast: boolean;
}

function ProcedureStep({ number, title, description, isLast }: ProcedureStepProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-semibold text-background"
          aria-hidden="true"
        >
          {number}
        </div>
        {!isLast && (
          <div className="mt-2 h-10 w-0.5 bg-surface-tertiary" aria-hidden="true" />
        )}
      </div>
      <article className="flex-1 rounded-lg bg-background-secondary p-4">
        <h4 className="mb-1 text-sm font-medium text-foreground">{title}</h4>
        <p className="text-xs text-foreground-secondary">{description}</p>
      </article>
    </div>
  );
}

// Quiz option component
interface QuizOptionProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
}

function QuizOption({ label, value, selected, onSelect }: QuizOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(value)}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-hinomaru bg-hinomaru/10'
          : 'border-surface-tertiary bg-background-tertiary hover:border-gold'
      )}
    >
      <div
        className={cn(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
          selected ? 'border-hinomaru bg-hinomaru' : 'border-surface-tertiary'
        )}
        aria-hidden="true"
      >
        {selected && <div className="h-2 w-2 rounded-full bg-white" />}
      </div>
      <span className="text-sm text-foreground">{label}</span>
    </button>
  );
}

// Quiz question component
interface QuizQuestionProps {
  title: string;
  question: string;
  options: { a: string; b: string; c: string; d: string };
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}

function QuizQuestion({
  title,
  question,
  options,
  selectedAnswer,
  onSelect,
}: QuizQuestionProps) {
  return (
    <div className="rounded-xl bg-background-secondary p-6">
      <div className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <FileText className="h-5 w-5 text-gold" aria-hidden="true" />
        {title}
      </div>
      <p className="mb-4 text-sm text-foreground">{question}</p>
      <div className="space-y-2" role="radiogroup" aria-label={question}>
        {Object.entries(options).map(([key, value]) => (
          <QuizOption
            key={key}
            label={value}
            value={key}
            selected={selectedAnswer === key}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

export function AdminOnboarding() {
  const t = useTranslations('admin.onboarding');
  const router = useRouter();

  const steps = ['welcome', 'overview', 'principles', 'emergency', 'quiz'];
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{
    q1: string | null;
    q2: string | null;
  }>({ q1: null, q2: null });
  const [showQuizError, setShowQuizError] = useState(false);

  // Mock user data - in production would come from auth context
  const userData = {
    name: 'Kato',
    fromRole: 'Viewer',
    toRole: 'Operator',
  };

  const handleStepClick = useCallback((step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    // Verify quiz answers
    const correctAnswers = { q1: 'c', q2: 'b' };
    if (
      quizAnswers.q1 === correctAnswers.q1 &&
      quizAnswers.q2 === correctAnswers.q2
    ) {
      setIsCompleted(true);
      setShowQuizError(false);
    } else {
      setShowQuizError(true);
    }
  }, [quizAnswers]);

  const handleGoToDashboard = useCallback(() => {
    router.push('/admin/dashboard');
  }, [router]);

  const renderStepContent = () => {
    if (isCompleted) {
      return (
        <div className="py-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-[3px] border-success bg-success/10">
            <Award className="h-12 w-12 text-success" aria-hidden="true" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            {t('completion.title')}
          </h2>
          <p className="mb-8 text-sm text-foreground-secondary">
            {t('completion.message')}
          </p>
          <div className="inline-block rounded-xl bg-background-secondary p-5">
            <div className="mb-2 text-xs text-foreground-tertiary">
              {t('completion.permissionLabel')}
            </div>
            <div className="text-lg font-semibold text-success">
              {t('completion.permissionValue')}
            </div>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="py-10 text-center">
            <p className="mb-8 text-lg leading-relaxed text-foreground-secondary">
              {t('welcome.greeting', { name: userData.name })}
              <br />
              <br />
              {t('welcome.message')}
            </p>
            <div className="inline-block rounded-full border border-gold bg-gold/10 px-5 py-2 text-sm font-medium text-gold">
              {t('welcome.roleBadge', {
                from: userData.fromRole,
                to: userData.toRole,
              })}
            </div>
          </div>
        );

      case 1: // Overview
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <OverviewItem
              icon={<User className="h-6 w-6 text-hinomaru" />}
              title={t('overview.systems.consumer.title')}
              description={t('overview.systems.consumer.description')}
              variant="consumer"
            />
            <OverviewItem
              icon={<Shield className="h-6 w-6 text-[#4a90d9]" />}
              title={t('overview.systems.prover.title')}
              description={t('overview.systems.prover.description')}
              variant="prover"
            />
            <OverviewItem
              icon={<Vote className="h-6 w-6 text-gold" />}
              title={t('overview.systems.governance.title')}
              description={t('overview.systems.governance.description')}
              variant="governance"
            />
            <OverviewItem
              icon={<Settings className="h-6 w-6 text-success" />}
              title={t('overview.systems.admin.title')}
              description={t('overview.systems.admin.description')}
              variant="admin"
            />
          </div>
        );

      case 2: // Principles
        return (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((num) => (
              <PrincipleItem
                key={num}
                number={num}
                title={t(`principles.items.cp${num}.title`)}
                description={t(`principles.items.cp${num}.description`)}
                tag={t(`principles.items.cp${num}.tag`)}
              />
            ))}
          </div>
        );

      case 3: // Emergency
        return (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((num) => (
              <ProcedureStep
                key={num}
                number={num}
                title={t(`emergency.steps.step${num}.title`)}
                description={t(`emergency.steps.step${num}.description`)}
                isLast={num === 5}
              />
            ))}
          </div>
        );

      case 4: // Quiz
        return (
          <div className="space-y-6">
            <QuizQuestion
              title={t('quiz.question1.title')}
              question={t('quiz.question1.question')}
              options={{
                a: t('quiz.question1.options.a'),
                b: t('quiz.question1.options.b'),
                c: t('quiz.question1.options.c'),
                d: t('quiz.question1.options.d'),
              }}
              selectedAnswer={quizAnswers.q1}
              onSelect={(answer) =>
                setQuizAnswers((prev) => ({ ...prev, q1: answer }))
              }
            />
            <QuizQuestion
              title={t('quiz.question2.title')}
              question={t('quiz.question2.question')}
              options={{
                a: t('quiz.question2.options.a'),
                b: t('quiz.question2.options.b'),
                c: t('quiz.question2.options.c'),
                d: t('quiz.question2.options.d'),
              }}
              selectedAnswer={quizAnswers.q2}
              onSelect={(answer) =>
                setQuizAnswers((prev) => ({ ...prev, q2: answer }))
              }
            />
            {showQuizError && (
              <div
                className="flex items-center gap-2 rounded-lg border border-danger bg-danger/10 p-3"
                role="alert"
              >
                <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
                <span className="text-sm text-danger">
                  {t('quiz.incorrectWarning')}
                </span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepIcon = (step: number) => {
    const icons = ['👋', '🛡️', '📜', '🚨', '✅'];
    return icons[step] || '📄';
  };

  const getStepTitle = () => {
    if (isCompleted) return t('completion.title');

    const titles: Record<number, string> = {
      0: t('welcome.title'),
      1: t('overview.title'),
      2: t('principles.title'),
      3: t('emergency.title'),
      4: t('quiz.title'),
    };
    return titles[currentStep];
  };

  const getStepSubtitle = () => {
    if (isCompleted) return '';

    const subtitles: Record<number, string> = {
      0: t('welcome.subtitle'),
      1: t('overview.subtitle'),
      2: t('principles.subtitle'),
      3: t('emergency.subtitle'),
      4: t('quiz.subtitle'),
    };
    return subtitles[currentStep];
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background p-6"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="w-full max-w-[900px]">
        {/* Progress */}
        {!isCompleted && (
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        )}

        {/* Content Card */}
        <Card padding="none" className="overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="border-b border-surface-tertiary p-8 text-center">
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-hinomaru/10 text-4xl"
              aria-hidden="true"
            >
              {isCompleted ? '🎉' : getStepIcon(currentStep)}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {getStepTitle()}
            </h1>
            {getStepSubtitle() && (
              <p className="text-sm text-foreground-secondary">{getStepSubtitle()}</p>
            )}
          </div>

          {/* Body */}
          <CardContent className="p-8">{renderStepContent()}</CardContent>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-surface-tertiary p-6">
            <div>
              {currentStep > 0 && !isCompleted && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                  {t('navigation.back')}
                </Button>
              )}
            </div>
            <div>
              {isCompleted ? (
                <Button variant="primary" onClick={handleGoToDashboard}>
                  {t('completion.dashboardButton')}
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              ) : currentStep === 0 ? (
                <Button variant="primary" onClick={handleNext}>
                  {t('welcome.startButton')}
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              ) : currentStep === steps.length - 1 ? (
                <Button
                  variant="success"
                  onClick={handleComplete}
                  disabled={!quizAnswers.q1 || !quizAnswers.q2}
                >
                  <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                  {t('quiz.completeButton')}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleNext}>
                  {t('navigation.next')}
                  <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
