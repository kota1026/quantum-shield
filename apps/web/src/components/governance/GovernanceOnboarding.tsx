'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Vote,
  Lock,
  FileText,
  Users,
  Shield,
  CheckCircle2,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function GovernanceOnboarding() {
  const t = useTranslations('governance.onboarding');

  const steps = [
    {
      icon: <Coins className="w-8 h-8 text-gold" />,
      title: t('steps.getQS.title'),
      description: t('steps.getQS.description'),
    },
    {
      icon: <Lock className="w-8 h-8 text-hinomaru" />,
      title: t('steps.lockQS.title'),
      description: t('steps.lockQS.description'),
    },
    {
      icon: <Vote className="w-8 h-8 text-success" />,
      title: t('steps.vote.title'),
      description: t('steps.vote.description'),
    },
  ];

  const benefits = [
    {
      icon: <FileText className="w-6 h-6" />,
      title: t('benefits.proposals.title'),
      description: t('benefits.proposals.description'),
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: t('benefits.delegate.title'),
      description: t('benefits.delegate.description'),
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: t('benefits.council.title'),
      description: t('benefits.council.description'),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)] opacity-50" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/governance/landing"
            className={cn(
              'inline-flex items-center gap-2 text-sm text-foreground-secondary',
              'hover:text-gold transition-colors mb-4'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToGovernance')}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </header>

        {/* What is Governance */}
        <section className="bg-card rounded-2xl p-6 md:p-8 mb-8 border border-border">
          <h2 className="text-xl font-semibold mb-4">{t('whatIs.title')}</h2>
          <p className="text-foreground-secondary mb-6 leading-relaxed">
            {t('whatIs.description')}
          </p>

          <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <p className="text-sm">{t('whatIs.highlight')}</p>
            </div>
          </div>
        </section>

        {/* How to Participate - Steps */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-6">{t('howTo.title')}</h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative bg-card rounded-xl p-6 border border-border hover:border-gold/50 transition-colors"
              >
                <div className="flex items-start gap-6">
                  {/* Step Number */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-hinomaru/20 to-gold/20 border border-gold/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-gold">{index + 1}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-8 bg-gradient-to-b from-gold/50 to-transparent mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-3 mb-2">
                      {step.icon}
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-foreground-secondary">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-6">{t('benefits.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-5 border border-border hover:border-gold/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center mb-4 text-gold">
                  {benefit.icon}
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-foreground-secondary">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* veQS Explanation */}
        <section className="bg-gradient-to-br from-hinomaru/10 to-gold/10 rounded-2xl p-6 md:p-8 mb-8 border border-gold/30">
          <h2 className="text-xl font-semibold mb-4">{t('veqs.title')}</h2>
          <p className="text-foreground-secondary mb-4">{t('veqs.description')}</p>

          <div className="bg-background/50 rounded-xl p-4 mb-4">
            <p className="text-sm font-mono text-center">
              <span className="text-gold">veQS</span> = <span className="text-hinomaru">QS</span> × (<span className="text-foreground-secondary">残り日数</span> / 730日)
            </p>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              <span>{t('veqs.point1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              <span>{t('veqs.point2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              <span>{t('veqs.point3')}</span>
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-xl font-semibold mb-4">{t('cta.title')}</h2>
          <p className="text-foreground-secondary mb-6">{t('cta.description')}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild variant="primary" size="lg" className="gap-2">
              <Link href="/qs-hub/stake/lock">
                {t('cta.lockButton')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="gap-2">
              <Link href="/governance/proposals">
                {t('cta.viewProposals')}
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default GovernanceOnboarding;
