'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Shield,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Layers,
  Server,
  Wallet,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '../Landing/Tooltip';

interface Actor {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  role: string;
}

interface FlowStep {
  step: number;
  title: string;
  description: string;
  actor: string;
  duration?: string;
}

export function HowItWorks() {
  const t = useTranslations('consumer.howItWorksPage');
  const mainRef = useRef<HTMLElement>(null);

  const actors: Actor[] = [
    {
      id: 'user',
      icon: <Wallet className="w-6 h-6" />,
      name: t('actors.user.name'),
      description: t('actors.user.description'),
      role: t('actors.user.role'),
    },
    {
      id: 'l3',
      icon: <Server className="w-6 h-6" />,
      name: t('actors.l3.name'),
      description: t('actors.l3.description'),
      role: t('actors.l3.role'),
    },
    {
      id: 'prover',
      icon: <FileCheck className="w-6 h-6" />,
      name: t('actors.prover.name'),
      description: t('actors.prover.description'),
      role: t('actors.prover.role'),
    },
    {
      id: 'vault',
      icon: <Shield className="w-6 h-6" />,
      name: t('actors.vault.name'),
      description: t('actors.vault.description'),
      role: t('actors.vault.role'),
    },
  ];

  const lockSteps: FlowStep[] = [
    {
      step: 1,
      title: t('lockFlow.step1.title'),
      description: t('lockFlow.step1.description'),
      actor: 'user',
    },
    {
      step: 2,
      title: t('lockFlow.step2.title'),
      description: t('lockFlow.step2.description'),
      actor: 'l3',
    },
    {
      step: 3,
      title: t('lockFlow.step3.title'),
      description: t('lockFlow.step3.description'),
      actor: 'vault',
    },
  ];

  const unlockSteps: FlowStep[] = [
    {
      step: 1,
      title: t('unlockFlow.step1.title'),
      description: t('unlockFlow.step1.description'),
      actor: 'user',
    },
    {
      step: 2,
      title: t('unlockFlow.step2.title'),
      description: t('unlockFlow.step2.description'),
      actor: 'l3',
    },
    {
      step: 3,
      title: t('unlockFlow.step3.title'),
      description: t('unlockFlow.step3.description'),
      actor: 'prover',
    },
    {
      step: 4,
      title: t('unlockFlow.step4.title'),
      description: t('unlockFlow.step4.description'),
      actor: 'vault',
      duration: '24h',
    },
    {
      step: 5,
      title: t('unlockFlow.step5.title'),
      description: t('unlockFlow.step5.description'),
      actor: 'user',
    },
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

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-30" />
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
        <div className="container mx-auto max-w-4xl px-6 py-8">
          {/* Header */}
          <header className="flex items-center gap-4 mb-8">
            <Link
              href="/consumer"
              className="w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-qs hover:border-hinomaru hover:text-hinomaru-400 transition-colors focus:outline-none focus:ring-2 focus:ring-hinomaru focus:ring-offset-2 focus:ring-offset-background"
              aria-label={t('header.backAriaLabel')}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{t('header.title')}</h1>
              <p className="text-sm text-foreground-secondary">{t('header.subtitle')}</p>
            </div>
          </header>

          {/* Introduction */}
          <section className="mb-12">
            <div className="card">
              <p className="text-foreground-secondary leading-relaxed">
                {t('intro.description')}
              </p>
            </div>
          </section>

          {/* System Architecture */}
          <section className="mb-12" aria-labelledby="architecture-title">
            <h2 id="architecture-title" className="text-xl font-bold mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('architecture.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {actors.map((actor) => (
                <div
                  key={actor.id}
                  className="card hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-gold/10 rounded-qs text-gold">
                      {actor.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{actor.name}</h3>
                      <p className="text-xs text-gold mb-2">{actor.role}</p>
                      <p className="text-sm text-foreground-secondary">{actor.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Diagram */}
            <div className="mt-6 card bg-surface-secondary">
              <div className="text-center text-sm text-foreground-tertiary mb-4">
                {t('architecture.diagramLabel')}
              </div>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-qs border border-border">
                  <Wallet className="w-4 h-4 text-hinomaru" />
                  <span className="text-sm font-medium">User</span>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground-tertiary rotate-90 md:rotate-0" />
                <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-qs border border-gold/30">
                  <Server className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium">L3 Aegis</span>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground-tertiary rotate-90 md:rotate-0" />
                <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-qs border border-success/30">
                  <FileCheck className="w-4 h-4 text-success" />
                  <span className="text-sm font-medium">Prover (2/5)</span>
                </div>
                <ArrowRight className="w-4 h-4 text-foreground-tertiary rotate-90 md:rotate-0" />
                <div className="flex items-center gap-2 px-4 py-2 bg-surface rounded-qs border border-hinomaru/30">
                  <Shield className="w-4 h-4 text-hinomaru" />
                  <span className="text-sm font-medium">L1 Vault</span>
                </div>
              </div>
            </div>
          </section>

          {/* Lock Flow */}
          <section className="mb-12" aria-labelledby="lock-flow-title">
            <h2 id="lock-flow-title" className="text-xl font-bold mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gold" aria-hidden="true" />
              {t('lockFlow.title')}
            </h2>

            <div className="space-y-4">
              {lockSteps.map((step, index) => (
                <FlowStepCard
                  key={step.step}
                  step={step}
                  isLast={index === lockSteps.length - 1}
                />
              ))}
            </div>

            <div className="mt-4 p-4 bg-gold/5 border border-gold/20 rounded-qs-lg">
              <p className="text-sm text-foreground-secondary">
                <strong className="text-gold">{t('lockFlow.note.title')}</strong>{' '}
                {t('lockFlow.note.description')}
              </p>
            </div>
          </section>

          {/* Unlock Flow (Normal Path) */}
          <section className="mb-12" aria-labelledby="unlock-flow-title">
            <h2 id="unlock-flow-title" className="text-xl font-bold mb-6 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-success" aria-hidden="true" />
              {t('unlockFlow.title')}
            </h2>

            <div className="space-y-4">
              {unlockSteps.map((step, index) => (
                <FlowStepCard
                  key={step.step}
                  step={step}
                  isLast={index === unlockSteps.length - 1}
                />
              ))}
            </div>

            <div className="mt-4 p-4 bg-success/5 border border-success/20 rounded-qs-lg">
              <p className="text-sm text-foreground-secondary">
                <strong className="text-success">{t('unlockFlow.note.title')}</strong>{' '}
                {t('unlockFlow.note.description')}
              </p>
            </div>
          </section>

          {/* Emergency Path */}
          <section className="mb-12" aria-labelledby="emergency-title">
            <h2 id="emergency-title" className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
              {t('emergencyPath.title')}
            </h2>

            <div className="card border-warning/20">
              <p className="text-foreground-secondary mb-4">{t('emergencyPath.description')}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-surface-secondary rounded-qs">
                  <div className="text-2xl font-bold text-warning mb-1">72h</div>
                  <div className="text-xs text-foreground-tertiary">{t('emergencyPath.trigger')}</div>
                </div>
                <div className="p-4 bg-surface-secondary rounded-qs">
                  <div className="text-2xl font-bold text-warning mb-1">7{t('emergencyPath.days')}</div>
                  <div className="text-xs text-foreground-tertiary">{t('emergencyPath.waitTime')}</div>
                </div>
                <div className="p-4 bg-surface-secondary rounded-qs">
                  <div className="text-2xl font-bold text-warning mb-1">5%</div>
                  <div className="text-xs text-foreground-tertiary">{t('emergencyPath.bond')}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Security Features */}
          <section className="mb-12" aria-labelledby="security-title">
            <h2 id="security-title" className="text-xl font-bold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-hinomaru" aria-hidden="true" />
              {t('security.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold">{t('security.multiProver.title')}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t('security.multiProver.description')}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold">{t('security.timeLock.title')}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t('security.timeLock.description')}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold">{t('security.challenge.title')}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t('security.challenge.description')}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-gold" />
                  <h3 className="font-semibold">{t('security.cryptography.title')}</h3>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t('security.cryptography.description')}
                </p>
              </div>
            </div>
          </section>

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

function FlowStepCard({ step, isLast }: { step: FlowStep; isLast: boolean }) {
  const actorColors: Record<string, string> = {
    user: 'text-hinomaru border-hinomaru/30',
    l3: 'text-gold border-gold/30',
    prover: 'text-success border-success/30',
    vault: 'text-hinomaru border-hinomaru/30',
  };

  return (
    <div className="relative">
      <div className={cn('card', actorColors[step.actor])}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gold/10 rounded-full text-gold font-bold text-sm">
            {step.step}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{step.title}</h3>
              {step.duration && (
                <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded-full">
                  {step.duration}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground-secondary">{step.description}</p>
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="absolute left-[30px] top-full w-0.5 h-4 bg-border" aria-hidden="true" />
      )}
    </div>
  );
}

export default HowItWorks;
