'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  Shield,
  Zap,
  Lock,
  Users,
  Building2,
  ChevronRight,
  Check,
  ArrowRight,
  Globe,
  ShieldCheck,
  Code,
  Webhook,
  FileText,
  Headphones,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import { EcosystemLink } from '@/components/shared/EcosystemLink';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { EnterpriseVisual } from './EnterpriseVisual';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="bg-background-secondary border-surface-tertiary">
      <CardContent className="pt-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-foreground-secondary">{description}</p>
      </CardContent>
    </Card>
  );
}

// Plan card component
interface PlanCardProps {
  name: string;
  description: string;
  features: string[];
  recommended?: boolean;
  priceLabel: string;
  recommendedLabel: string;
  ctaLabel: string;
}

function PlanCard({ name, description, features, recommended, priceLabel, recommendedLabel, ctaLabel }: PlanCardProps) {
  return (
    <Card className={cn(
      'relative border-surface-tertiary',
      recommended && 'border-gold ring-1 ring-gold'
    )}>
      {recommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="success">
          {recommendedLabel}
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <p className="text-sm text-foreground-secondary">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-2xl font-bold text-foreground">{priceLabel}</div>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground-secondary">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
              {feature}
            </li>
          ))}
        </ul>
        <Link href="/enterprise/apply">
          <Button
            className="w-full"
            variant={recommended ? 'primary' : 'outline'}
          >
            {ctaLabel}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function EnterpriseLanding() {
  const t = useTranslations('enterprise.landing');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  };

  const features = [
    {
      icon: <Shield className="h-6 w-6 text-gold" />,
      titleKey: 'features.quantumSecurity.title',
      descriptionKey: 'features.quantumSecurity.description',
    },
    {
      icon: <Zap className="h-6 w-6 text-gold" />,
      titleKey: 'features.highPerformance.title',
      descriptionKey: 'features.highPerformance.description',
    },
    {
      icon: <Lock className="h-6 w-6 text-gold" />,
      titleKey: 'features.compliance.title',
      descriptionKey: 'features.compliance.description',
    },
    {
      icon: <Users className="h-6 w-6 text-gold" />,
      titleKey: 'features.dedicatedSupport.title',
      descriptionKey: 'features.dedicatedSupport.description',
    },
  ];

  const plans = [
    {
      nameKey: 'plans.starter.name',
      descriptionKey: 'plans.starter.description',
      featuresKey: 'plans.starter.features',
      priceKey: 'plans.starter.price',
    },
    {
      nameKey: 'plans.business.name',
      descriptionKey: 'plans.business.description',
      featuresKey: 'plans.business.features',
      priceKey: 'plans.business.price',
      recommended: true,
    },
    {
      nameKey: 'plans.enterprise.name',
      descriptionKey: 'plans.enterprise.description',
      featuresKey: 'plans.enterprise.features',
      priceKey: 'plans.enterprise.price',
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

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 lg:px-8" role="banner">
        <Link href="/enterprise/landing" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
              aria-hidden="true"
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
            </div>
            <div
              className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
              Quantum Shield
            </span>
            <span className="text-[10px] text-gold tracking-[2px] uppercase">
              Enterprise
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <EcosystemLink variant="inline" />
          <button
            onClick={toggleLocale}
            className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            aria-label={tCommon('accessibility.switchToJapanese')}
          >
            <Globe className="w-4 h-4" />
            {locale === 'ja' ? 'EN' : 'JA'}
          </button>
          <Link href="/enterprise/dashboard">
            <Button variant="outline" size="sm">
              {t('header.login')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-24 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="gold" className="mb-4">
            {t('hero.badge')}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg text-foreground-secondary">
            {t('hero.description')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/enterprise/apply">
              <Button size="lg" leftIcon={<ArrowRight className="h-5 w-5" />}>
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
              <Building2 className="h-5 w-5" />
              <span>{t('hero.stats.companies')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>{t('hero.stats.tvl')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>{t('hero.stats.users')}</span>
            </div>
          </div>

          {/* Custom Visual */}
          <div className="mt-16">
            <EnterpriseVisual />
          </div>
        </div>
      </section>

        {/* Features Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">{t('features.title')}</h2>
              <p className="mt-4 text-foreground-secondary">{t('features.subtitle')}</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={t(feature.titleKey)}
                  description={t(feature.descriptionKey)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Plans Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">{t('plans.title')}</h2>
              <p className="mt-4 text-foreground-secondary">{t('plans.subtitle')}</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {plans.map((plan, index) => (
                <PlanCard
                  key={index}
                  name={t(plan.nameKey)}
                  description={t(plan.descriptionKey)}
                  features={t.raw(plan.featuresKey) as string[]}
                  priceLabel={t(plan.priceKey)}
                  recommended={plan.recommended}
                  recommendedLabel={t('plans.recommended')}
                  ctaLabel={t('plans.ctaLabel')}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Security & Compliance Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">{t('security.title')}</h2>
              <p className="mt-4 text-foreground-secondary">{t('security.subtitle')}</p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <ShieldCheck className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('security.soc2.title')}</h3>
                    <p className="mt-2 text-sm text-foreground-secondary">{t('security.soc2.description')}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <FileText className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('security.iso.title')}</h3>
                    <p className="mt-2 text-sm text-foreground-secondary">{t('security.iso.description')}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <Lock className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('security.encryption.title')}</h3>
                    <p className="mt-2 text-sm text-foreground-secondary">{t('security.encryption.description')}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
                    <Headphones className="h-6 w-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('security.support.title')}</h3>
                    <p className="mt-2 text-sm text-foreground-secondary">{t('security.support.description')}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Integration Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground">{t('integration.title')}</h2>
                <p className="mt-4 text-foreground-secondary">{t('integration.description')}</p>
                <ul className="mt-8 space-y-4">
                  {(t.raw('integration.features') as string[]).map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                      <span className="text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/enterprise/apply">
                    <Button variant="outline" rightIcon={<Code className="h-4 w-4" />}>
                      {t('integration.cta')}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hinomaru/10">
                      <Code className="h-5 w-5 text-hinomaru" />
                    </div>
                    <div>
                      <h3 className="font-bold">{t('integration.api.title')}</h3>
                      <p className="text-sm text-foreground-secondary">{t('integration.api.description')}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-hinomaru/10">
                      <Webhook className="h-5 w-5 text-hinomaru" />
                    </div>
                    <div>
                      <h3 className="font-bold">{t('integration.webhooks.title')}</h3>
                      <p className="text-sm text-foreground-secondary">{t('integration.webhooks.description')}</p>
                    </div>
                  </div>
                </Card>
              </div>
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
              {[0, 1, 2, 3].map((index) => (
                <Card key={index} className="overflow-hidden">
                  <button
                    className="flex w-full items-center justify-between p-6 text-left"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <span className="font-medium">{t(`faq.items.${index}.question`)}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-foreground-secondary" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-foreground-secondary" />
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
                    <div className="text-xs text-gold mt-1">{t(`expertQuotes.quotes.${index}.source`)}</div>
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
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/enterprise/apply">
                <Button size="lg">{t('cta.button')}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8 lg:px-8" role="contentinfo">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-foreground-tertiary">
            {tCommon('footer.copyright')}
          </div>
          <nav className="flex gap-6 text-sm" aria-label={tCommon('accessibility.footerNav')}>
            <Link
              href="/consumer/terms"
              className="text-foreground-tertiary hover:text-gold transition-colors"
            >
              {tCommon('footer.terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-foreground-tertiary hover:text-gold transition-colors"
            >
              {tCommon('footer.privacy')}
            </Link>
          </nav>
        </div>
      </footer>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
