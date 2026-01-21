'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Lock,
  Coins,
  Users,
  Vote,
  Shield,
  TrendingUp,
  ArrowRight,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EcosystemLink } from '@/components/shared/EcosystemLink';
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

// Stats component
interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-gold font-mono">{value}</div>
      <div className="text-sm text-foreground-secondary mt-1">{label}</div>
    </div>
  );
}

export function TokenHubLanding() {
  const t = useTranslations('token-hub.landing');

  const features = [
    {
      icon: <Lock className="h-6 w-6 text-gold" />,
      titleKey: 'features.lock.title',
      descriptionKey: 'features.lock.description',
    },
    {
      icon: <Coins className="h-6 w-6 text-gold" />,
      titleKey: 'features.rewards.title',
      descriptionKey: 'features.rewards.description',
    },
    {
      icon: <Users className="h-6 w-6 text-gold" />,
      titleKey: 'features.delegate.title',
      descriptionKey: 'features.delegate.description',
    },
    {
      icon: <Vote className="h-6 w-6 text-gold" />,
      titleKey: 'features.governance.title',
      descriptionKey: 'features.governance.description',
    },
  ];

  const benefits = [
    'benefits.earn',
    'benefits.vote',
    'benefits.boost',
    'benefits.delegate',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background Effect - Gold Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Header with Ecosystem Link */}
      <header className="relative z-10 flex justify-between items-center px-6 py-4 lg:px-8">
        <Link href="/token-hub/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-gold" />
          </div>
          <span className="font-semibold text-lg">Token Hub</span>
        </Link>
        <EcosystemLink variant="inline" />
      </header>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <Badge variant="gold" className="mb-4">
            {t('hero.badge')}
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg text-foreground-secondary max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/token-hub/dashboard">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                {t('hero.cta')}
              </Button>
            </Link>
            <Link href="/token-hub/onboarding">
              <Button size="lg" variant="outline">
                {t('hero.secondaryCta')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 border-t border-surface-tertiary bg-background-secondary px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem value={t('stats.totalLocked.value')} label={t('stats.totalLocked.label')} />
            <StatItem value={t('stats.holders.value')} label={t('stats.holders.label')} />
            <StatItem value={t('stats.apy.value')} label={t('stats.apy.label')} />
            <StatItem value={t('stats.distributed.value')} label={t('stats.distributed.label')} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 border-t border-surface-tertiary px-6 py-24 lg:px-8">
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

      {/* How it Works Section */}
      <section className="relative z-10 border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground">{t('howItWorks.title')}</h2>
            <p className="mt-4 text-foreground-secondary">{t('howItWorks.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-gold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step1.title')}</h3>
              <p className="text-sm text-foreground-secondary">{t('howItWorks.step1.description')}</p>
            </div>
            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-gold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step2.title')}</h3>
              <p className="text-sm text-foreground-secondary">{t('howItWorks.step2.description')}</p>
            </div>
            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-gold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step3.title')}</h3>
              <p className="text-sm text-foreground-secondary">{t('howItWorks.step3.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 border-t border-surface-tertiary px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">{t('benefits.title')}</h2>
              <ul className="space-y-4">
                {benefits.map((benefitKey, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center mt-0.5">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-foreground-secondary">{t(benefitKey)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/token-hub/dashboard">
                  <Button rightIcon={<ChevronRight className="h-4 w-4" />}>
                    {t('benefits.cta')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="bg-background-secondary border border-surface-tertiary rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-gold" />
                <span className="text-xl font-semibold">{t('veqs.title')}</span>
              </div>
              <p className="text-foreground-secondary mb-6">{t('veqs.description')}</p>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-tertiary">{t('veqs.lockPeriod')}</span>
                  <span className="font-mono font-medium">1-4 {t('veqs.years')}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-tertiary">{t('veqs.maxMultiplier')}</span>
                  <span className="font-mono font-medium text-gold">4x</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-tertiary">{t('veqs.rewardsBoost')}</span>
                  <span className="font-mono font-medium text-success">{t('veqs.upTo')} 2.5x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-surface-tertiary bg-gradient-to-b from-background-secondary to-background px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground">{t('cta.title')}</h2>
          <p className="mt-4 text-foreground-secondary">{t('cta.description')}</p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/token-hub/dashboard">
              <Button size="lg">{t('cta.button')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default TokenHubLanding;
