'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Shield,
  Zap,
  Lock,
  Users,
  Building2,
  ChevronRight,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EcosystemLink } from '@/components/shared/EcosystemLink';

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
}

function PlanCard({ name, description, features, recommended, priceLabel }: PlanCardProps) {
  return (
    <Card className={cn(
      'relative border-surface-tertiary',
      recommended && 'border-gold ring-1 ring-gold'
    )}>
      {recommended && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="success">
          Recommended
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
            Get Started
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function EnterpriseLanding() {
  const t = useTranslations('enterprise.landing');

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
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 lg:px-8">
        <Link href="/enterprise/landing" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-gold" />
          </div>
          <span className="font-semibold text-lg">Enterprise</span>
        </Link>
        <EcosystemLink variant="inline" />
      </header>

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
              />
            ))}
          </div>
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
    </div>
  );
}
