'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Shield,
  Lock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Server,
  Code,
  Eye,
  Layout,
  Webhook,
  Database,
  Landmark,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  ShieldCheck,
  Box,
} from 'lucide-react';
import { useState } from 'react';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { LandingHeader } from '@/components/shared/LandingHeader';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { HinomaryVisual } from '@/components/shared/HinomaryVisual';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function EnterpriseLanding() {
  const t = useTranslations('enterprise.landing');
  const tCommon = useTranslations('common');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const componentIcons = [Server, Code, Cpu, Eye, Layout, Webhook];
  const complianceIcons: Record<string, React.ElementType> = {
    database: Database,
    fileText: FileText,
    shield: ShieldCheck,
    landmark: Landmark,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        {tCommon('accessibility.skipToContent')}
      </a>

      {/* Fixed Header */}
      <LandingHeader
        appName="Enterprise"
        appKey="Enterprise"
        homeHref="/enterprise/landing"
        loginHref="/enterprise/dashboard"
        registerHref="/enterprise/apply"
      />

      {/* Main Content */}
      <main id="main-content" role="main" className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-24 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
          <div className="relative mx-auto max-w-5xl text-center">
            <Badge variant="gold" className="mb-4">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              {t('hero.title')}
              <br />
              <span className="bg-gradient-to-r from-hinomaru to-gold bg-clip-text text-transparent">
                {t('hero.titleHighlight')}
              </span>
            </h1>
            <p className="mt-6 text-lg text-foreground-secondary max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/enterprise/apply">
                <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link href="/enterprise/support">
                <Button size="lg" variant="outline">
                  {t('hero.secondaryCta')}
                </Button>
              </Link>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-foreground-tertiary">
              <div className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                <span>{t('hero.stats.components')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>{t('hero.stats.pqc')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                <span>{t('hero.stats.control')}</span>
              </div>
            </div>

            {/* Custom Visual */}
            <div className="mt-16">
              <HinomaryVisual />
            </div>
          </div>
        </section>

        {/* Why Quantum Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('whyQuantum.sectionLabel')}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('whyQuantum.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('whyQuantum.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <AlertTriangle className="h-8 w-8 text-hinomaru mb-4" />
                <h3 className="text-lg font-bold mb-2">{t('whyQuantum.threat.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('whyQuantum.threat.description')}</p>
              </Card>
              <Card className="p-6">
                <Database className="h-8 w-8 text-hinomaru mb-4" />
                <h3 className="text-lg font-bold mb-2">{t('whyQuantum.harvest.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('whyQuantum.harvest.description')}</p>
              </Card>
              <Card className="p-6">
                <TrendingUp className="h-8 w-8 text-hinomaru mb-4" />
                <h3 className="text-lg font-bold mb-2">{t('whyQuantum.regulation.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('whyQuantum.regulation.description')}</p>
              </Card>
            </div>
          </div>
        </section>

        {/* What Is Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('whatIs.sectionLabel')}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('whatIs.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('whatIs.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <Card key={index} className="p-6 border-gold/20 hover:border-gold/50 transition-colors">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    {t(`whatIs.points.${index}.title`)}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`whatIs.points.${index}.description`)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('components.sectionLabel')}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('components.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('components.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const Icon = componentIcons[index];
                return (
                  <Card key={index} className="p-6">
                    <Icon className="h-8 w-8 text-gold mb-4" />
                    <h3 className="text-lg font-bold mb-2">
                      {t(`components.items.${index}.title`)}
                    </h3>
                    <p className="text-sm text-foreground-secondary mb-3">
                      {t(`components.items.${index}.description`)}
                    </p>
                    <Badge variant="outline-gold" className="text-xs">
                      {t(`components.items.${index}.tech`)}
                    </Badge>
                  </Card>
                );
              })}
            </div>

            {/* Maintenance */}
            <Card className="p-8 bg-gold/5 border-gold/30">
              <h3 className="text-xl font-bold mb-4">{t('components.maintenance.title')}</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(t.raw('components.maintenance.items') as string[]).map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-foreground-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* Tech Specs Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('techSpecs.sectionLabel')}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('techSpecs.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('techSpecs.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((index) => (
                <Card key={index} className="p-6">
                  <Badge variant="outline-gold" className="mb-4">
                    {t(`techSpecs.specs.${index}.category`)}
                  </Badge>
                  <h3 className="text-lg font-bold mb-2">
                    {t(`techSpecs.specs.${index}.title`)}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`techSpecs.specs.${index}.description`)}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('compliance.sectionLabel')}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('compliance.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('compliance.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map((index) => {
                const iconKey = t(`compliance.items.${index}.icon`);
                const Icon = complianceIcons[iconKey] || Shield;
                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold mb-2">
                          {t(`compliance.items.${index}.title`)}
                        </h3>
                        <p className="text-sm text-foreground-secondary">
                          {t(`compliance.items.${index}.description`)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('process.sectionLabel')}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {t('process.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('process.subtitle')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative">
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-gold/50 to-transparent z-0" />
                  )}
                  <Card className="p-6 relative z-10">
                    <div className="w-10 h-10 bg-gold text-background rounded-full flex items-center justify-center font-bold mb-4">
                      {t(`process.steps.${index}.step`)}
                    </div>
                    <h3 className="text-lg font-bold mb-2">
                      {t(`process.steps.${index}.title`)}
                    </h3>
                    <p className="text-sm text-foreground-secondary mb-3">
                      {t(`process.steps.${index}.description`)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gold">
                      <Clock className="h-4 w-4" />
                      {t(`process.steps.${index}.duration`)}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">{t('faq.title')}</h2>
              <p className="mt-4 text-foreground-secondary">{t('faq.subtitle')}</p>
            </div>
            <div className="mt-12 space-y-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Card key={index} className="overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between p-6 text-left"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <span className="font-medium">{t(`faq.items.${index}.question`)}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-foreground-secondary flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-foreground-secondary flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="border-t border-surface-tertiary px-6 py-4">
                      <p className="text-sm text-foreground-secondary">{t(`faq.items.${index}.answer`)}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Expert Quotes Section */}
        <section
          id="expert-quotes"
          className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8"
        >
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('expertQuotes.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('expertQuotes.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('expertQuotes.subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <article key={index} className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
                  <blockquote className="text-sm text-foreground-secondary leading-relaxed mb-4 italic">
                    &ldquo;{t(`expertQuotes.quotes.${index}.quote`)}&rdquo;
                  </blockquote>
                  <div className="border-t border-border pt-4">
                    <div className="font-semibold text-foreground">{t(`expertQuotes.quotes.${index}.author`)}</div>
                    <div className="text-xs text-foreground-tertiary">{t(`expertQuotes.quotes.${index}.title`)}</div>
                    <a
                      href={t(`expertQuotes.quotes.${index}.sourceUrl`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gold hover:underline mt-1 inline-block"
                    >
                      {t(`expertQuotes.quotes.${index}.source`)} →
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <p className="text-xs text-foreground-tertiary text-center mt-6">
              {t('expertQuotes.disclaimer')}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('cta.title')}</h2>
            <p className="mt-4 text-foreground-secondary">{t('cta.description')}</p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Link href="/enterprise/apply">
                <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  {t('cta.button')}
                </Button>
              </Link>
              <Link href="/enterprise/support">
                <Button size="lg" variant="outline">
                  {t('cta.secondaryButton')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Ecosystem Footer */}
      <LandingFooter />

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
