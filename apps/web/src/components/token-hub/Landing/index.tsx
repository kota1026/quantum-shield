'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Lock,
  Coins,
  Users,
  Vote,
  Shield,
  ArrowRight,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { Tooltip } from '@/components/shared/Tooltip';
import { LandingHeader } from '@/components/shared/LandingHeader';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { HinomaryVisual } from '@/components/shared/HinomaryVisual';
import { cn } from '@/lib/utils';

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  tooltip?: string;
}

function FeatureCard({ icon, title, description, tooltip }: FeatureCardProps) {
  return (
    <Card className="bg-background-secondary border-surface-tertiary hover:border-gold/30 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {tooltip ? (
            <Tooltip content={tooltip} showHelpIcon>
              <span className="border-b border-dashed border-foreground-tertiary cursor-help">
                {title}
              </span>
            </Tooltip>
          ) : (
            title
          )}
        </h3>
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

// Expert Quote Card
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
            className="text-xs text-gold mt-1 inline-flex items-center gap-1 hover:underline"
          >
            {source}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        ) : (
          <div className="text-xs text-gold mt-1">{source}</div>
        )}
      </div>
    </article>
  );
}

export function TokenHubLanding() {
  const t = useTranslations('token-hub.landing');
  const tGlobal = useTranslations('common');

  const features = [
    {
      icon: <Lock className="h-6 w-6 text-gold" />,
      titleKey: 'features.lock.title',
      descriptionKey: 'features.lock.description',
      tooltipKey: 'features.lock.tooltip',
    },
    {
      icon: <Coins className="h-6 w-6 text-gold" />,
      titleKey: 'features.rewards.title',
      descriptionKey: 'features.rewards.description',
      tooltipKey: 'features.rewards.tooltip',
    },
    {
      icon: <Users className="h-6 w-6 text-gold" />,
      titleKey: 'features.delegate.title',
      descriptionKey: 'features.delegate.description',
      tooltipKey: 'features.delegate.tooltip',
    },
    {
      icon: <Vote className="h-6 w-6 text-gold" />,
      titleKey: 'features.governance.title',
      descriptionKey: 'features.governance.description',
      tooltipKey: 'features.governance.tooltip',
    },
  ];

  const benefits = [
    'benefits.earn',
    'benefits.vote',
    'benefits.boost',
    'benefits.delegate',
  ];

  const expertQuotes = [
    {
      quote: t('expertQuotes.quotes.0.quote'),
      author: t('expertQuotes.quotes.0.author'),
      title: t('expertQuotes.quotes.0.title'),
      source: t('expertQuotes.quotes.0.source'),
      sourceUrl: 'https://vitalik.eth.limo/general/2024/01/31/end.html',
    },
    {
      quote: t('expertQuotes.quotes.1.quote'),
      author: t('expertQuotes.quotes.1.author'),
      title: t('expertQuotes.quotes.1.title'),
      source: t('expertQuotes.quotes.1.source'),
      sourceUrl: 'https://a]6z.com/the-future-of-token-governance/',
    },
    {
      quote: t('expertQuotes.quotes.2.quote'),
      author: t('expertQuotes.quotes.2.author'),
      title: t('expertQuotes.quotes.2.title'),
      source: t('expertQuotes.quotes.2.source'),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        {tGlobal('accessibility.skipToContent')}
      </a>

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
        <div
          className={cn(
            'absolute bottom-[-100px] right-[-100px]',
            'w-[400px] h-[400px]',
            'bg-[radial-gradient(circle,rgba(188,0,45,0.08),transparent_60%)]',
            'opacity-30'
          )}
        />
      </div>

      {/* Fixed Header */}
      <LandingHeader
        appName="Token Hub"
        appKey="Token Hub"
        homeHref="/token-hub/landing"
        loginHref="/token-hub/login"
        registerHref="/token-hub/onboarding"
      />

      {/* Main Content - Add padding-top for fixed header */}
      <main id="main-content" role="main" className="relative z-10 pt-16">
        {/* Hero Section */}
        <section className="overflow-hidden px-6 py-24 lg:px-8">
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
              <Link href="/token-hub/login">
                <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  {t('hero.cta')}
                </Button>
              </Link>
              <Link href="/token-hub/login">
                <Button size="lg" variant="outline">
                  {t('hero.secondaryCta')}
                </Button>
              </Link>
            </div>

            {/* Custom Visual */}
            <div className="mt-16">
              <HinomaryVisual />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-16 lg:px-8">
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
                  tooltip={feature.tooltipKey ? t(feature.tooltipKey) : undefined}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="border-t border-surface-tertiary bg-background-secondary px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground">{t('howItWorks.title')}</h2>
              <p className="mt-4 text-foreground-secondary">{t('howItWorks.subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-hinomaru/10 border border-hinomaru/30 flex items-center justify-center group-hover:bg-hinomaru/20 transition-colors">
                  <span className="text-2xl font-bold text-hinomaru">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step1.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('howItWorks.step1.description')}</p>
              </div>
              {/* Step 2 */}
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                  <span className="text-2xl font-bold text-gold">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step2.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('howItWorks.step2.description')}</p>
              </div>
              {/* Step 3 */}
              <div className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 border border-success/30 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                  <span className="text-2xl font-bold text-success">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('howItWorks.step3.title')}</h3>
                <p className="text-sm text-foreground-secondary">{t('howItWorks.step3.description')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="border-t border-surface-tertiary px-6 py-24 lg:px-8">
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
                  <Link href="/token-hub/login">
                    <Button rightIcon={<ChevronRight className="h-4 w-4" />}>
                      {t('benefits.cta')}
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="bg-background-secondary border border-surface-tertiary rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-8 h-8 text-gold" />
                  <Tooltip content={t('veqs.tooltip')} showHelpIcon>
                    <span className="text-xl font-semibold cursor-help">{t('veqs.title')}</span>
                  </Tooltip>
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

        {/* Expert Quotes Section */}
        <section id="expert-quotes" className="border-t border-surface-tertiary py-20 bg-surface-secondary/30 px-6 lg:px-8">
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
              {expertQuotes.map((quote, index) => (
                <ExpertQuoteCard key={index} {...quote} />
              ))}
            </div>

            <p className="text-xs text-foreground-tertiary text-center mt-6">
              {t('expertQuotes.disclaimer')}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-surface-tertiary bg-gradient-to-b from-background-secondary to-background px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-foreground">{t('cta.title')}</h2>
            <p className="mt-4 text-foreground-secondary">{t('cta.description')}</p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/token-hub/login">
                <Button size="lg">{t('cta.button')}</Button>
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

export default TokenHubLanding;
