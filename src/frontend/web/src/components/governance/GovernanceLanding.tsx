'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Vote,
  Users,
  FileText,
  Shield,
  ArrowRight,
  Clock,
  Coins,
  Scale,
  CheckCircle2,
  LucideIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { Tooltip } from '@/components/shared/Tooltip';
import { LandingHeader } from '@/components/shared/LandingHeader';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { HinomaryVisual } from '@/components/shared/HinomaryVisual';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  tooltipKey?: string;
  t: (key: string) => string;
}

function FeatureCard({ icon: Icon, titleKey, descriptionKey, tooltipKey, t }: FeatureCardProps) {
  const title = t(titleKey);
  return (
    <Card className="p-6 hover:border-gold/50 transition-colors">
      <div className="w-12 h-12 bg-hinomaru/10 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-hinomaru" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {tooltipKey ? (
          <Tooltip content={t(tooltipKey)} showHelpIcon>
            <span className="border-b border-dashed border-foreground-tertiary cursor-help">
              {title}
            </span>
          </Tooltip>
        ) : (
          title
        )}
      </h3>
      <p className="text-sm text-foreground-secondary">{t(descriptionKey)}</p>
    </Card>
  );
}

interface StepCardProps {
  number: number;
  titleKey: string;
  descriptionKey: string;
  t: (key: string) => string;
}

function StepCard({ number, titleKey, descriptionKey, t }: StepCardProps) {
  const stepColors = {
    1: 'bg-hinomaru text-white',
    2: 'bg-gold text-white',
    3: 'bg-success text-white',
  };

  return (
    <div className="flex gap-4 group">
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 transition-transform group-hover:scale-110',
        stepColors[number as keyof typeof stepColors] || stepColors[1]
      )}>
        {number}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{t(titleKey)}</h3>
        <p className="text-sm text-foreground-secondary">{t(descriptionKey)}</p>
      </div>
    </div>
  );
}

interface ExpertQuoteCardProps {
  quote: string;
  author: string;
  title: string;
  source: string;
  sourceUrl?: string;
}

function ExpertQuoteCard({ quote, author, title, source, sourceUrl }: ExpertQuoteCardProps) {
  return (
    <article className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
      <blockquote className="text-sm text-foreground-secondary leading-relaxed mb-4 italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="border-t border-border pt-4">
        <div className="font-semibold text-foreground">{author}</div>
        <div className="text-xs text-foreground-tertiary">{title}</div>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold mt-1 min-h-[44px] inline-flex items-center gap-1 hover:underline"
          >
            {source}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        ) : (
          <div className="text-xs text-gold mt-1 min-h-[44px] flex items-center">{source}</div>
        )}
      </div>
    </article>
  );
}

export function GovernanceLanding() {
  const t = useTranslations('governance');
  const tCommon = useTranslations('common');

  const stats = [
    { key: 'activeProposals', value: '5', icon: FileText, highlight: true },
    { key: 'participationRate', value: '78', icon: Users, suffix: '%' },
    { key: 'totalProposals', value: '47', icon: Clock },
  ];

  const features = [
    {
      icon: Vote,
      titleKey: 'landing.hero.whatIsGovernance.point1.title',
      descriptionKey: 'landing.hero.whatIsGovernance.point1.description',
      tooltipKey: 'landing.hero.whatIsGovernance.point1.tooltip',
    },
    {
      icon: Coins,
      titleKey: 'landing.hero.whatIsGovernance.point2.title',
      descriptionKey: 'landing.hero.whatIsGovernance.point2.description',
      tooltipKey: 'landing.hero.whatIsGovernance.point2.tooltip',
    },
    {
      icon: Shield,
      titleKey: 'landing.hero.whatIsGovernance.point3.title',
      descriptionKey: 'landing.hero.whatIsGovernance.point3.description',
      tooltipKey: 'landing.hero.whatIsGovernance.point3.tooltip',
    },
  ];

  const steps = [
    { titleKey: 'onboarding.steps.getQS.title', descriptionKey: 'onboarding.steps.getQS.description' },
    { titleKey: 'onboarding.steps.lockQS.title', descriptionKey: 'onboarding.steps.lockQS.description' },
    { titleKey: 'onboarding.steps.vote.title', descriptionKey: 'onboarding.steps.vote.description' },
  ];

  const expertQuotes = [
    {
      quote: t('landing.expertQuotes.quotes.0.quote'),
      author: t('landing.expertQuotes.quotes.0.author'),
      title: t('landing.expertQuotes.quotes.0.title'),
      source: t('landing.expertQuotes.quotes.0.source'),
      sourceUrl: 'https://vitalik.eth.limo/general/2017/12/17/voting.html',
    },
    {
      quote: t('landing.expertQuotes.quotes.1.quote'),
      author: t('landing.expertQuotes.quotes.1.author'),
      title: t('landing.expertQuotes.quotes.1.title'),
      source: t('landing.expertQuotes.quotes.1.source'),
    },
    {
      quote: t('landing.expertQuotes.quotes.2.quote'),
      author: t('landing.expertQuotes.quotes.2.author'),
      title: t('landing.expertQuotes.quotes.2.title'),
      source: t('landing.expertQuotes.quotes.2.source'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        {tCommon('accessibility.skipToContent')}
      </a>

      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-50"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
          }}
        />
        <div
          className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgba(201, 169, 98, 0.12), transparent 60%)',
          }}
        />
      </div>

      {/* Fixed Header */}
      <LandingHeader
        appName="Governance"
        appKey="Governance"
        homeHref="/governance/landing"
        loginHref="/governance/login"
        registerHref="/governance/onboarding"
      />

      {/* Main Content - Add padding-top for fixed header */}
      <main id="main-content" role="main" className="relative z-10 pt-16">
        <div className="max-w-7xl mx-auto px-8">
          {/* Hero Section */}
          <section className="py-20 text-center" aria-label={t('landing.ariaLabel')}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6">
              <Scale className="w-4 h-4" />
              {t('landing.pageTitle')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('landing.hero.whatIsGovernance.title')}
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10">
              {t('landing.hero.whatIsGovernance.description')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/governance/login">
                <Button variant="primary" size="lg">
                  {t('onboarding.cta.lockButton')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Custom Visual */}
            <div className="mt-16">
              <HinomaryVisual />
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16" aria-label={t('landing.stats.ariaLabel')}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <Card
                  key={stat.key}
                  className={cn(
                    'p-6 text-center hover:scale-[1.02] transition-transform',
                    stat.highlight && 'border-gold/50 bg-gold/5'
                  )}
                  data-testid={`governance-${stat.key}-card`}
                >
                  <stat.icon
                    className={cn(
                      'w-8 h-8 mx-auto mb-3',
                      stat.highlight ? 'text-gold' : 'text-foreground-secondary'
                    )}
                  />
                  <div className={cn(
                    'text-2xl md:text-3xl font-bold mb-1 font-mono',
                    stat.highlight ? 'text-gold' : 'text-foreground'
                  )}
                    data-testid={`governance-${stat.key}-value`}
                  >
                    {stat.value}{stat.suffix || ''}
                  </div>
                  <div className="text-sm text-foreground-secondary">
                    {t(`landing.stats.${stat.key}.label`)}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('onboarding.benefits.title')}</h2>
              <p className="text-foreground-secondary max-w-xl mx-auto">
                {t('onboarding.whatIs.highlight')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  titleKey={feature.titleKey}
                  descriptionKey={feature.descriptionKey}
                  tooltipKey={feature.tooltipKey}
                  t={t}
                />
              ))}
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('onboarding.howTo.title')}</h2>
            </div>
            <div className="max-w-2xl mx-auto space-y-8">
              {steps.map((step, index) => (
                <StepCard
                  key={index}
                  number={index + 1}
                  titleKey={step.titleKey}
                  descriptionKey={step.descriptionKey}
                  t={t}
                />
              ))}
            </div>
          </section>

          {/* veQS Section */}
          <section className="py-16">
            <Card className="p-8 md:p-12 bg-gradient-to-br from-gold/5 to-hinomaru/5 border-gold/30">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    <Tooltip content={t('landing.stats.votingPower.tooltip')} showHelpIcon>
                      <span className="cursor-help">{t('onboarding.veqs.title')}</span>
                    </Tooltip>
                  </h2>
                  <p className="text-foreground-secondary mb-6">
                    {t('onboarding.veqs.description')}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{t('onboarding.veqs.point1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{t('onboarding.veqs.point2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{t('onboarding.veqs.point3')}</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gold/20 border-2 border-gold mb-4 animate-pulse">
                    <span className="text-4xl font-bold text-gold font-mono">veQS</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">{t('landing.stats.votingPower.tooltip')}</p>
                </div>
              </div>
            </Card>
          </section>

          {/* Expert Quotes Section */}
          <section id="expert-quotes" className="py-20 bg-surface-secondary/30 -mx-8 px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
                <span className="w-6 h-px bg-gold" aria-hidden="true" />
                {t('landing.expertQuotes.sectionLabel')}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.expertQuotes.title')}
              </h2>
              <p className="text-foreground-secondary mb-12">
                {t('landing.expertQuotes.subtitle')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {expertQuotes.map((quote, index) => (
                  <ExpertQuoteCard key={index} {...quote} />
                ))}
              </div>

              <p className="text-xs text-foreground-tertiary text-center mt-6">
                {t('landing.expertQuotes.disclaimer')}
              </p>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <Card className="p-12 text-center bg-gradient-to-br from-hinomaru/10 to-gold/10 border-hinomaru/30">
              <h2 className="text-3xl font-bold mb-4">{t('onboarding.cta.title')}</h2>
              <p className="text-foreground-secondary max-w-xl mx-auto mb-8">
                {t('onboarding.cta.description')}
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/governance/login">
                  <Button variant="secondary" size="lg">
                    {t('onboarding.cta.lockButton')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>

        {/* Ecosystem Footer */}
        <LandingFooter />
      </main>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
