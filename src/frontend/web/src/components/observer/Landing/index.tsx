'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Eye,
  Shield,
  AlertTriangle,
  Coins,
  Users,
  CheckCircle,
  Zap,
  Search,
  Gavel,
  Award,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { LandingHeader } from '@/components/shared/LandingHeader';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { HinomaryVisual } from '@/components/shared/HinomaryVisual';

export function ObserverLanding() {
  const t = useTranslations('observer');

  const stats = [
    {
      key: 'activeObservers',
      icon: Users,
      highlight: true,
    },
    {
      key: 'totalMonitored',
      icon: Eye,
      highlight: false,
    },
    {
      key: 'fraudPrevented',
      icon: Shield,
      highlight: false,
      gold: true,
    },
    {
      key: 'rewardsDistributed',
      icon: Coins,
      highlight: false,
    },
  ];

  const howItWorks = [
    {
      step: 1,
      key: 'monitor',
      icon: Search,
    },
    {
      step: 2,
      key: 'detect',
      icon: AlertTriangle,
    },
    {
      step: 3,
      key: 'dispute',
      icon: Gavel,
    },
    {
      step: 4,
      key: 'earn',
      icon: Award,
    },
  ];

  const requirements = [
    {
      key: 'stake',
      icon: Lock,
    },
    {
      key: 'bond',
      icon: Coins,
    },
    {
      key: 'knowledge',
      icon: Eye,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
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
        appName="Observer"
        appKey="Observer"
        homeHref="/observer/landing"
        loginHref="/observer/login"
        registerHref="/observer/application"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-16">

        {/* Hero Section */}
        <main
          id="main-content"
          className="text-center py-20 pb-16"
          role="main"
          aria-labelledby="hero-title"
        >
          <Badge
            variant="outline-gold"
            className="mb-6 px-4 py-2 bg-gold/10"
          >
            <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
            {t('landing.hero.badge')}
          </Badge>

          <h1
            id="hero-title"
            className="text-5xl font-bold tracking-tight mb-5 leading-tight"
          >
            {t('landing.hero.title')}
            <br />
            <span className="text-hinomaru-400">
              {t('landing.hero.titleHighlight')}
            </span>
          </h1>

          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10">
            {t('landing.hero.description')}
          </p>

          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link href="/observer/application">
                {t('landing.hero.applyButton')}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#about-quantum-shield">
                {t('landing.hero.learnMore')}
              </a>
            </Button>
          </div>

          {/* Custom Visual */}
          <div className="mt-16">
            <HinomaryVisual />
          </div>
        </main>

        {/* Stats Section */}
        <section
          className="py-16"
          role="region"
          aria-label="Network statistics"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((stat) => (
              <Card
                key={stat.key}
                variant="hoverGradient"
                className="text-center py-7"
              >
                <stat.icon
                  className={`h-8 w-8 mx-auto mb-3 ${stat.gold ? 'text-gold' : 'text-foreground-secondary'}`}
                  aria-hidden="true"
                />
                <div
                  className={`text-4xl font-bold font-mono mb-2 ${
                    stat.highlight
                      ? 'text-hinomaru-400'
                      : stat.gold
                        ? 'text-gold'
                        : 'text-foreground'
                  }`}
                >
                  {t(`landing.stats.${stat.key}.value`)}
                </div>
                <div className="text-sm text-foreground-secondary">
                  {t(`landing.stats.${stat.key}.label`)}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* About Quantum Shield Section */}
        <section
          id="about-quantum-shield"
          className="py-20 scroll-mt-24"
          role="region"
          aria-labelledby="about-title"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[2px] text-gold mb-4">
              <div className="w-6 h-px bg-gold" />
              {t('landing.about.sectionLabel')}
              <div className="w-6 h-px bg-gold" />
            </div>
            <h2 id="about-title" className="text-4xl font-bold mb-4">
              {t('landing.about.title')}
            </h2>
            <p className="text-foreground-secondary max-w-3xl mx-auto">
              {t('landing.about.description')}
            </p>
          </div>

          {/* What is Quantum Shield */}
          <Card variant="hoverGradient" className="p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-16 h-16 bg-hinomaru/10 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="h-8 w-8 text-hinomaru" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('landing.about.whatIsQS.title')}</h3>
                <p className="text-foreground-secondary mb-4">{t('landing.about.whatIsQS.description1')}</p>
                <p className="text-foreground-secondary">{t('landing.about.whatIsQS.description2')}</p>
              </div>
              <div className="bg-background-secondary rounded-xl p-6 border border-surface-tertiary">
                <h4 className="font-semibold mb-4 text-gold">{t('landing.about.whatIsQS.flowTitle')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-hinomaru/20 rounded-full flex items-center justify-center text-sm font-bold text-hinomaru">1</div>
                    <p className="text-sm">{t('landing.about.whatIsQS.flow1')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-hinomaru/20 rounded-full flex items-center justify-center text-sm font-bold text-hinomaru">2</div>
                    <p className="text-sm">{t('landing.about.whatIsQS.flow2')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-sm font-bold text-gold">3</div>
                    <p className="text-sm">{t('landing.about.whatIsQS.flow3')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center text-sm font-bold text-success">4</div>
                    <p className="text-sm">{t('landing.about.whatIsQS.flow4')}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* What is Observer */}
          <Card variant="hoverGradient" className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 bg-background-secondary rounded-xl p-6 border border-surface-tertiary">
                <h4 className="font-semibold mb-4 text-gold">{t('landing.about.whatIsObserver.roleTitle')}</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm">{t('landing.about.whatIsObserver.role1')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm">{t('landing.about.whatIsObserver.role2')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm">{t('landing.about.whatIsObserver.role3')}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm">{t('landing.about.whatIsObserver.role4')}</span>
                  </li>
                </ul>
              </div>
              <div className="order-1 md:order-2">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-6">
                  <Eye className="h-8 w-8 text-gold" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('landing.about.whatIsObserver.title')}</h3>
                <p className="text-foreground-secondary mb-4">{t('landing.about.whatIsObserver.description1')}</p>
                <p className="text-foreground-secondary">{t('landing.about.whatIsObserver.description2')}</p>
              </div>
            </div>
          </Card>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 scroll-mt-24"
          role="region"
          aria-labelledby="how-it-works-title"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[2px] text-gold mb-4">
              <div className="w-6 h-px bg-gold" />
              {t('landing.howItWorks.sectionLabel')}
              <div className="w-6 h-px bg-gold" />
            </div>
            <h2 id="how-it-works-title" className="text-4xl font-bold mb-4">
              {t('landing.howItWorks.title')}
            </h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              {t('landing.howItWorks.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item) => (
              <Card key={item.key} variant="hoverGradient" className="p-8 relative">
                <div className="absolute top-4 right-4 text-4xl font-bold text-foreground-tertiary/20">
                  {item.step}
                </div>
                <div className="w-12 h-12 bg-hinomaru/10 rounded-lg flex items-center justify-center mb-5">
                  <item.icon className="h-6 w-6 text-hinomaru" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  {t(`landing.howItWorks.steps.${item.key}.title`)}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {t(`landing.howItWorks.steps.${item.key}.description`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Reward System Section */}
        <section
          id="rewards"
          className="py-20"
          role="region"
          aria-labelledby="rewards-title"
        >
          <div className="bg-background-secondary rounded-2xl p-12 border border-surface-tertiary">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[2px] text-gold mb-4">
                <div className="w-6 h-px bg-gold" />
                {t('landing.rewards.sectionLabel')}
                <div className="w-6 h-px bg-gold" />
              </div>
              <h2 id="rewards-title" className="text-3xl font-bold mb-4">
                {t('landing.rewards.title')}
              </h2>
              <p className="text-foreground-secondary max-w-2xl mx-auto">
                {t('landing.rewards.description')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Reward Distribution */}
              <div>
                <h3 className="text-xl font-semibold mb-6">{t('landing.rewards.distribution.title')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-surface-tertiary">
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-success" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{t('landing.rewards.distribution.challenger')}</span>
                        <span className="text-success font-mono font-bold">60%</span>
                      </div>
                      <p className="text-sm text-foreground-secondary">{t('landing.rewards.distribution.challengerDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-surface-tertiary">
                    <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-6 w-6 text-gold" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{t('landing.rewards.distribution.insurance')}</span>
                        <span className="text-gold font-mono font-bold">20%</span>
                      </div>
                      <p className="text-sm text-foreground-secondary">{t('landing.rewards.distribution.insuranceDesc')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-background rounded-xl border border-surface-tertiary">
                    <div className="w-12 h-12 bg-foreground-tertiary/10 rounded-lg flex items-center justify-center">
                      <Zap className="h-6 w-6 text-foreground-tertiary" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{t('landing.rewards.distribution.burn')}</span>
                        <span className="text-foreground-tertiary font-mono font-bold">20%</span>
                      </div>
                      <p className="text-sm text-foreground-secondary">{t('landing.rewards.distribution.burnDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Calculation */}
              <Card className="border-gold p-8">
                <h3 className="text-lg font-semibold mb-6">{t('landing.rewards.example.title')}</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-sm text-foreground-secondary mb-1">{t('landing.rewards.example.fraudAmount')}</div>
                    <div className="text-2xl font-bold font-mono">50 ETH</div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-sm text-foreground-secondary mb-1">{t('landing.rewards.example.proverStake')}</div>
                    <div className="text-2xl font-bold font-mono">100 ETH</div>
                  </div>
                  <div className="p-4 bg-background-secondary rounded-lg">
                    <div className="text-sm text-foreground-secondary mb-1">{t('landing.rewards.example.slashRate')}</div>
                    <div className="text-2xl font-bold font-mono text-warning">10%</div>
                    <div className="text-xs text-foreground-tertiary mt-1">{t('landing.rewards.example.slashNote')}</div>
                  </div>
                  <div className="border-t border-surface-tertiary pt-4">
                    <div className="text-sm text-foreground-secondary mb-1">{t('landing.rewards.example.yourReward')}</div>
                    <div className="text-3xl font-bold font-mono text-success">6 ETH</div>
                    <div className="text-xs text-foreground-tertiary mt-1">
                      {t('landing.rewards.example.calculation')}
                    </div>
                  </div>
                  <div className="p-3 bg-success/10 rounded-lg border border-success/30">
                    <div className="flex items-center gap-2 text-success text-sm">
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      {t('landing.rewards.example.bondReturn')}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Warning */}
            <div className="mt-8 p-6 bg-warning/10 rounded-xl border border-warning/30">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h4 className="font-semibold text-warning mb-2">{t('landing.rewards.warning.title')}</h4>
                  <p className="text-sm text-foreground-secondary">{t('landing.rewards.warning.description')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Section */}
        <section
          id="requirements"
          className="py-20 scroll-mt-24"
          role="region"
          aria-labelledby="requirements-title"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[2px] text-gold mb-4">
              <div className="w-6 h-px bg-gold" />
              {t('landing.requirements.sectionLabel')}
              <div className="w-6 h-px bg-gold" />
            </div>
            <h2 id="requirements-title" className="text-4xl font-bold mb-4">
              {t('landing.requirements.title')}
            </h2>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              {t('landing.requirements.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {requirements.map((req) => (
              <Card key={req.key} variant="hoverGradient" className="p-8">
                <div className="w-12 h-12 bg-hinomaru/10 rounded-lg flex items-center justify-center mb-5">
                  <req.icon className="h-6 w-6 text-hinomaru" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  {t(`landing.requirements.items.${req.key}.title`)}
                </h3>
                <div className="text-2xl font-bold font-mono text-gold mb-2">
                  {t(`landing.requirements.items.${req.key}.value`)}
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t(`landing.requirements.items.${req.key}.description`)}
                </p>
              </Card>
            ))}
          </div>

          {/* Bond Calculation Table */}
          <Card className="p-8">
            <h3 className="text-lg font-semibold mb-6">{t('landing.requirements.bondTable.title')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="text-left py-3 px-4 text-xs text-foreground-tertiary font-semibold uppercase">
                      {t('landing.requirements.bondTable.unlockAmount')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-foreground-tertiary font-semibold uppercase">
                      {t('landing.requirements.bondTable.calculation')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-foreground-tertiary font-semibold uppercase">
                      {t('landing.requirements.bondTable.bondRequired')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-surface-tertiary/50">
                    <td className="py-3 px-4 font-mono">5 ETH</td>
                    <td className="py-3 px-4 font-mono text-foreground-secondary">MAX(0.1, 5 × 1%)</td>
                    <td className="py-3 px-4 font-mono text-gold font-semibold">0.1 ETH</td>
                  </tr>
                  <tr className="border-b border-surface-tertiary/50">
                    <td className="py-3 px-4 font-mono">20 ETH</td>
                    <td className="py-3 px-4 font-mono text-foreground-secondary">MAX(0.1, 20 × 1%)</td>
                    <td className="py-3 px-4 font-mono text-gold font-semibold">0.2 ETH</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-mono">100 ETH</td>
                    <td className="py-3 px-4 font-mono text-foreground-secondary">MAX(0.1, 100 × 1%)</td>
                    <td className="py-3 px-4 font-mono text-gold font-semibold">1.0 ETH</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-foreground-tertiary mt-4">
              {t('landing.requirements.bondTable.note')}
            </p>
          </Card>
        </section>

        {/* Ecosystem Section */}
        <section
          className="py-20"
          role="region"
          aria-labelledby="ecosystem-title"
        >
          <div className="bg-background-secondary rounded-2xl p-8 border border-surface-tertiary">
            <h3 id="ecosystem-title" className="text-xl font-semibold mb-6 text-center">
              {t('landing.ecosystem.title')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-hinomaru/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-hinomaru" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('landing.ecosystem.consumer.title')}</h4>
                <p className="text-sm text-foreground-secondary mb-3">
                  {t('landing.ecosystem.consumer.description')}
                </p>
                <Link href="/consumer/landing" className="inline-flex items-center min-h-[44px] text-sm text-gold hover:underline">
                  {t('landing.ecosystem.consumer.link')} →
                </Link>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-gold" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('landing.ecosystem.prover.title')}</h4>
                <p className="text-sm text-foreground-secondary mb-3">
                  {t('landing.ecosystem.prover.description')}
                </p>
                <Link href="/prover/landing" className="inline-flex items-center min-h-[44px] text-sm text-gold hover:underline">
                  {t('landing.ecosystem.prover.link')} →
                </Link>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-success" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('landing.ecosystem.governance.title')}</h4>
                <p className="text-sm text-foreground-secondary mb-3">
                  {t('landing.ecosystem.governance.description')}
                </p>
                <Link href="/governance/landing" className="inline-flex items-center min-h-[44px] text-sm text-gold hover:underline">
                  {t('landing.ecosystem.governance.link')} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Expert Quotes Section */}
        <section
          id="expert-quotes"
          className="py-20 bg-surface-secondary/30 -mx-8 px-8"
          role="region"
          aria-labelledby="expert-quotes-title"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('landing.expertQuotes.sectionLabel')}
            </div>
            <h2 id="expert-quotes-title" className="text-3xl md:text-4xl font-bold mb-4">
              {t('landing.expertQuotes.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('landing.expertQuotes.subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <article key={index} className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
                  <blockquote className="text-sm text-foreground-secondary leading-relaxed mb-4 italic">
                    &ldquo;{t(`landing.expertQuotes.quotes.${index}.quote`)}&rdquo;
                  </blockquote>
                  <div className="border-t border-border pt-4">
                    <div className="font-semibold text-foreground">{t(`landing.expertQuotes.quotes.${index}.author`)}</div>
                    <div className="text-xs text-foreground-tertiary">{t(`landing.expertQuotes.quotes.${index}.title`)}</div>
                    <a
                      href={t(`landing.expertQuotes.quotes.${index}.sourceUrl`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gold hover:underline mt-1 inline-flex items-center min-h-[44px]"
                    >
                      {t(`landing.expertQuotes.quotes.${index}.source`)} →
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <p className="text-xs text-foreground-tertiary text-center mt-6">
              {t('landing.expertQuotes.disclaimer')}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" role="region" aria-labelledby="cta-title">
          <Card
            className="text-center p-16 border-hinomaru relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-card))',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-hinomaru), var(--color-gold))',
              }}
            />

            <h2 id="cta-title" className="text-3xl font-bold mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-foreground-secondary mb-8 max-w-xl mx-auto">
              {t('landing.cta.description')}
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <Link href="/observer/application">{t('landing.cta.button')}</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/observer/login">{t('landing.cta.loginButton')}</Link>
              </Button>
            </div>
          </Card>
        </section>

      </div>

      {/* Ecosystem Footer */}
      <LandingFooter />

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
