'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Shield,
  AlertTriangle,
  Play,
  Pause,
  ChevronRight,
  Users,
  Clock,
  CheckCircle2,
  Wallet,
  Server,
  FileCheck,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Animated Flow Diagram Component
function AnimatedFlowDiagram({
  steps,
  activeStep,
  variant,
}: {
  steps: { label: string; icon: React.ReactNode; description: string }[];
  activeStep: number;
  variant: 'lock' | 'unlock' | 'emergency';
}) {
  const variantColors = {
    lock: { bg: 'bg-gold/10', border: 'border-gold/30', text: 'text-gold', glow: 'shadow-glow-gold' },
    unlock: { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success', glow: 'shadow-[0_0_20px_rgba(0,200,150,0.4)]' },
    emergency: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', glow: 'shadow-[0_0_20px_rgba(240,160,48,0.4)]' },
  };

  const colors = variantColors[variant];

  return (
    <div className="relative py-8">
      {/* Connection line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 hidden md:block" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            {/* Step card */}
            <div
              className={cn(
                'relative z-10 p-6 rounded-qs-xl border transition-all duration-500',
                index <= activeStep
                  ? `${colors.bg} ${colors.border} ${colors.glow}`
                  : 'bg-surface border-border opacity-50'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto transition-all duration-500',
                  index <= activeStep ? `${colors.bg} ${colors.text}` : 'bg-surface-secondary text-foreground-tertiary'
                )}
              >
                {step.icon}
              </div>
              <h4 className={cn(
                'text-sm font-semibold text-center mb-2 transition-colors',
                index <= activeStep ? 'text-foreground' : 'text-foreground-tertiary'
              )}>
                {step.label}
              </h4>
              <p className="text-xs text-foreground-secondary text-center leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Arrow for desktop */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-20">
                <ChevronRight
                  className={cn(
                    'w-6 h-6 transition-colors duration-500',
                    index < activeStep ? colors.text : 'text-foreground-tertiary'
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Process Section Component
function ProcessSection({
  id,
  title,
  subtitle,
  icon,
  variant,
  steps,
  actors,
  benefits,
  note,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  variant: 'lock' | 'unlock' | 'emergency';
  steps: { label: string; icon: React.ReactNode; description: string }[];
  actors: { name: string; role: string; description: string }[];
  benefits: string[];
  note?: { title: string; description: string };
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const variantStyles = {
    lock: { headerBg: 'bg-gold/5', headerBorder: 'border-gold/20', iconColor: 'text-gold' },
    unlock: { headerBg: 'bg-success/5', headerBorder: 'border-success/20', iconColor: 'text-success' },
    emergency: { headerBg: 'bg-warning/5', headerBorder: 'border-warning/20', iconColor: 'text-warning' },
  };

  const styles = variantStyles[variant];

  const playAnimation = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setActiveStep(-1);

    steps.forEach((_, index) => {
      setTimeout(() => {
        setActiveStep(index);
        if (index === steps.length - 1) {
          setTimeout(() => setIsPlaying(false), 1500);
        }
      }, (index + 1) * 1200);
    });
  };

  return (
    <section id={id} className="mb-16 scroll-mt-24" aria-labelledby={`${id}-title`}>
      {/* Section Header */}
      <div className={cn('rounded-qs-xl border p-6 mb-6', styles.headerBg, styles.headerBorder)}>
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', styles.headerBg, styles.iconColor)}>
            {icon}
          </div>
          <div className="flex-1">
            <h2 id={`${id}-title`} className="text-xl font-bold mb-2">{title}</h2>
            <p className="text-foreground-secondary">{subtitle}</p>
          </div>
          <button
            onClick={playAnimation}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full border transition-all',
              isPlaying
                ? 'bg-surface border-border text-foreground'
                : 'bg-gold/10 border-gold/30 text-gold hover:bg-gold/20'
            )}
            aria-label={isPlaying ? 'アニメーションを停止' : 'プロセスを再生'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="text-sm font-medium">停止</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="text-sm font-medium">再生</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Animated Flow */}
      <AnimatedFlowDiagram steps={steps} activeStep={activeStep} variant={variant} />

      {/* Actors & Benefits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Actors */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">
            登場人物
          </h3>
          <div className="space-y-4">
            {actors.map((actor, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-foreground-secondary">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-sm">{actor.name}</div>
                  <div className="text-xs text-gold">{actor.role}</div>
                  <div className="text-xs text-foreground-secondary mt-1">{actor.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">
            解決する課題
          </h3>
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground-secondary">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Note */}
      {note && (
        <div className={cn('mt-6 p-4 rounded-qs-lg border', styles.headerBg, styles.headerBorder)}>
          <p className="text-sm text-foreground-secondary">
            <strong className={styles.iconColor}>{note.title}</strong>{' '}
            {note.description}
          </p>
        </div>
      )}
    </section>
  );
}

export function HowItWorks() {
  const t = useTranslations('consumer.howItWorksPage');
  const mainRef = useRef<HTMLElement>(null);

  // Lock process steps
  const lockSteps = [
    { label: t('processes.lock.steps.0.label'), icon: <Wallet className="w-6 h-6" />, description: t('processes.lock.steps.0.description') },
    { label: t('processes.lock.steps.1.label'), icon: <Lock className="w-6 h-6" />, description: t('processes.lock.steps.1.description') },
    { label: t('processes.lock.steps.2.label'), icon: <Server className="w-6 h-6" />, description: t('processes.lock.steps.2.description') },
    { label: t('processes.lock.steps.3.label'), icon: <Shield className="w-6 h-6" />, description: t('processes.lock.steps.3.description') },
  ];

  const lockActors = [
    { name: t('processes.lock.actors.0.name'), role: t('processes.lock.actors.0.role'), description: t('processes.lock.actors.0.description') },
    { name: t('processes.lock.actors.1.name'), role: t('processes.lock.actors.1.role'), description: t('processes.lock.actors.1.description') },
  ];

  const lockBenefits = [
    t('processes.lock.benefits.0'),
    t('processes.lock.benefits.1'),
    t('processes.lock.benefits.2'),
  ];

  // Unlock process steps
  const unlockSteps = [
    { label: t('processes.unlock.steps.0.label'), icon: <Unlock className="w-6 h-6" />, description: t('processes.unlock.steps.0.description') },
    { label: t('processes.unlock.steps.1.label'), icon: <FileCheck className="w-6 h-6" />, description: t('processes.unlock.steps.1.description') },
    { label: t('processes.unlock.steps.2.label'), icon: <Clock className="w-6 h-6" />, description: t('processes.unlock.steps.2.description') },
    { label: t('processes.unlock.steps.3.label'), icon: <Wallet className="w-6 h-6" />, description: t('processes.unlock.steps.3.description') },
  ];

  const unlockActors = [
    { name: t('processes.unlock.actors.0.name'), role: t('processes.unlock.actors.0.role'), description: t('processes.unlock.actors.0.description') },
    { name: t('processes.unlock.actors.1.name'), role: t('processes.unlock.actors.1.role'), description: t('processes.unlock.actors.1.description') },
    { name: t('processes.unlock.actors.2.name'), role: t('processes.unlock.actors.2.role'), description: t('processes.unlock.actors.2.description') },
  ];

  const unlockBenefits = [
    t('processes.unlock.benefits.0'),
    t('processes.unlock.benefits.1'),
    t('processes.unlock.benefits.2'),
  ];

  // Emergency unlock process steps
  const emergencySteps = [
    { label: t('processes.emergency.steps.0.label'), icon: <AlertTriangle className="w-6 h-6" />, description: t('processes.emergency.steps.0.description') },
    { label: t('processes.emergency.steps.1.label'), icon: <Shield className="w-6 h-6" />, description: t('processes.emergency.steps.1.description') },
    { label: t('processes.emergency.steps.2.label'), icon: <Clock className="w-6 h-6" />, description: t('processes.emergency.steps.2.description') },
    { label: t('processes.emergency.steps.3.label'), icon: <Wallet className="w-6 h-6" />, description: t('processes.emergency.steps.3.description') },
  ];

  const emergencyActors = [
    { name: t('processes.emergency.actors.0.name'), role: t('processes.emergency.actors.0.role'), description: t('processes.emergency.actors.0.description') },
    { name: t('processes.emergency.actors.1.name'), role: t('processes.emergency.actors.1.role'), description: t('processes.emergency.actors.1.description') },
  ];

  const emergencyBenefits = [
    t('processes.emergency.benefits.0'),
    t('processes.emergency.benefits.1'),
    t('processes.emergency.benefits.2'),
  ];

  return (
    <div className="relative min-h-screen">
      {/* Skip Link */}
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-hinomaru focus:text-white focus:rounded-qs"
      >
        Skip to main content
      </a>

      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-30" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(201,169,98,0.1),transparent_60%)] opacity-30" />
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="relative z-10 outline-none"
        role="main"
        aria-label={t('meta.title')}
      >
        <div className="container mx-auto max-w-5xl px-6 py-8">
          {/* Header */}
          <header className="flex items-center gap-4 mb-8">
            <Link
              href="/consumer"
              className="w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-qs hover:border-gold hover:text-gold transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background"
              aria-label={t('header.backAriaLabel')}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('header.title')}</h1>
              <p className="text-sm text-foreground-secondary">{t('header.subtitle')}</p>
            </div>
          </header>

          {/* Why Quantum Shield Section */}
          <section id="why-qs" className="mb-16 scroll-mt-24" aria-labelledby="why-qs-title">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('whyQS.sectionLabel')}
            </div>
            <h2 id="why-qs-title" className="text-3xl font-bold mb-6">
              {t('whyQS.title')}
            </h2>
            <p className="text-foreground-secondary text-lg mb-8 max-w-3xl">
              {t('whyQS.description')}
            </p>

            {/* Key Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card hover:border-gold/30 transition-all group">
                <div className="w-12 h-12 rounded-full bg-hinomaru/10 flex items-center justify-center mb-4 text-hinomaru group-hover:bg-hinomaru/20 transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{t('whyQS.points.0.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('whyQS.points.0.description')}</p>
              </div>
              <div className="card hover:border-gold/30 transition-all group">
                <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4 text-gold group-hover:bg-gold/20 transition-colors">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{t('whyQS.points.1.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('whyQS.points.1.description')}</p>
              </div>
              <div className="card hover:border-gold/30 transition-all group">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4 text-success group-hover:bg-success/20 transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{t('whyQS.points.2.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('whyQS.points.2.description')}</p>
              </div>
            </div>
          </section>

          {/* Lock Process */}
          <ProcessSection
            id="lock-process"
            title={t('processes.lock.title')}
            subtitle={t('processes.lock.subtitle')}
            icon={<Lock className="w-6 h-6" />}
            variant="lock"
            steps={lockSteps}
            actors={lockActors}
            benefits={lockBenefits}
            note={{
              title: t('processes.lock.note.title'),
              description: t('processes.lock.note.description'),
            }}
          />

          {/* Unlock Process */}
          <ProcessSection
            id="unlock-process"
            title={t('processes.unlock.title')}
            subtitle={t('processes.unlock.subtitle')}
            icon={<Unlock className="w-6 h-6" />}
            variant="unlock"
            steps={unlockSteps}
            actors={unlockActors}
            benefits={unlockBenefits}
            note={{
              title: t('processes.unlock.note.title'),
              description: t('processes.unlock.note.description'),
            }}
          />

          {/* Emergency Unlock Process */}
          <ProcessSection
            id="emergency-process"
            title={t('processes.emergency.title')}
            subtitle={t('processes.emergency.subtitle')}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="emergency"
            steps={emergencySteps}
            actors={emergencyActors}
            benefits={emergencyBenefits}
            note={{
              title: t('processes.emergency.note.title'),
              description: t('processes.emergency.note.description'),
            }}
          />

          {/* CTA */}
          <section className="mb-8">
            <div className="card bg-gradient-to-r from-hinomaru/10 to-gold/10 border-hinomaru/20">
              <div className="text-center">
                <h2 className="text-xl font-bold mb-2">{t('cta.title')}</h2>
                <p className="text-foreground-secondary mb-6">{t('cta.description')}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/consumer/onboarding">
                    <Button variant="primary" size="lg">
                      {t('cta.startButton')}
                    </Button>
                  </Link>
                  <Link href="/consumer/security">
                    <Button variant="secondary" size="lg">
                      {t('cta.securityButton')}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default HowItWorks;
