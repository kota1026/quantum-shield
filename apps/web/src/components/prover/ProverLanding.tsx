'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Shield,
  Users,
  TrendingUp,
  Activity,
  Coins,
  Lock,
  Clock,
  ArrowRight,
  AlertTriangle,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { Tooltip } from '@/components/shared/Tooltip';
import { LandingHeader } from '@/components/shared/LandingHeader';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { HinomaryVisual } from '@/components/shared/HinomaryVisual';

// ROI calculation helper
function calculateROI(stakeAmount: number, monthlyVolume: number, uptime: number) {
  // Base fee rate: 0.04% of monthly volume
  const baseFeeRate = 0.0004;
  // Monthly signature fees based on volume
  const monthlySignatureFees = monthlyVolume * baseFeeRate;
  // Annual signature fees
  const annualSignatureFees = monthlySignatureFees * 12;

  // Performance bonus: based on uptime above 99.5%
  const uptimeBonus = uptime > 99.5 ? (uptime - 99.5) * 0.5 : 0; // 0.5% bonus per 0.1% above 99.5%
  const performanceBonus = annualSignatureFees * (uptimeBonus / 100);

  // Total earnings
  const totalEarnings = annualSignatureFees + performanceBonus;

  // ROI percentage
  const roi = stakeAmount > 0 ? (totalEarnings / stakeAmount) * 100 : 0;

  return {
    signatureFees: annualSignatureFees,
    performanceBonus,
    totalEarnings,
    roi,
  };
}

export function ProverLanding() {
  const t = useTranslations('prover');

  // Calculator state
  const [stakeAmount, setStakeAmount] = useState(150);
  const [monthlyVolume, setMonthlyVolume] = useState(50000);
  const [uptime, setUptime] = useState(99.9);

  // Calculate ROI based on inputs
  const roiResults = useMemo(() => {
    return calculateROI(stakeAmount, monthlyVolume, uptime);
  }, [stakeAmount, monthlyVolume, uptime]);

  const stats = [
    {
      key: 'activeProvers',
      icon: Users,
      highlight: true,
    },
    {
      key: 'totalStaked',
      icon: Coins,
      highlight: false,
    },
    {
      key: 'annualRoi',
      icon: TrendingUp,
      highlight: false,
      gold: true,
    },
    {
      key: 'uptime',
      icon: Activity,
      highlight: false,
    },
  ];

  const requirements = [
    {
      key: 'stake',
      icon: Coins,
    },
    {
      key: 'hsm',
      icon: Lock,
    },
    {
      key: 'sla',
      icon: Clock,
    },
  ];

  const slashingData = [
    { provers: '1 Prover', rate: '10%', loss: '$40,000', danger: false },
    { provers: '2 Provers', rate: '40%', loss: '$160,000', danger: true },
    { provers: '3 Provers', rate: '90%', loss: '$360,000', danger: true },
    { provers: '4+ Provers', rate: '100%', loss: '$400,000', danger: true },
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
        appName="Prover Portal"
        appKey="Prover"
        homeHref="/prover/landing"
        loginHref="/prover/login"
        registerHref="/prover/application"
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
            <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
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

          <p className="text-lg text-foreground-secondary max-w-xl mx-auto mb-10">
            {t('landing.hero.description')}
          </p>

          <div className="flex gap-4 justify-center">
            <Button variant="primary" size="lg" asChild>
              <Link href="/prover/application">
                {t('landing.hero.applyButton')}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#requirements-section">
                {t('landing.hero.requirementsButton')}
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
          id="about-section"
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
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              {t('landing.about.description')}
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card variant="hoverGradient" className="p-8">
              <div className="w-12 h-12 bg-hinomaru/10 rounded-lg flex items-center justify-center mb-5">
                <Shield className="h-6 w-6 text-hinomaru" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{t('landing.about.step1.title')}</h3>
              <p className="text-sm text-foreground-secondary">{t('landing.about.step1.description')}</p>
            </Card>
            <Card variant="hoverGradient" className="p-8">
              <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-5">
                <Users className="h-6 w-6 text-gold" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{t('landing.about.step2.title')}</h3>
              <p className="text-sm text-foreground-secondary">{t('landing.about.step2.description')}</p>
            </Card>
            <Card variant="hoverGradient" className="p-8">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-5">
                <Coins className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold mb-3">{t('landing.about.step3.title')}</h3>
              <p className="text-sm text-foreground-secondary">{t('landing.about.step3.description')}</p>
            </Card>
          </div>

          {/* Ecosystem connections */}
          <div className="bg-background-secondary rounded-2xl p-8 border border-border">
            <h3 className="text-xl font-semibold mb-6 text-center">{t('landing.about.ecosystem.title')}</h3>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-hinomaru/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-hinomaru" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('landing.about.ecosystem.consumer.title')}</h4>
                <p className="text-sm text-foreground-secondary mb-3">{t('landing.about.ecosystem.consumer.description')}</p>
                <Link href="/consumer/landing" className="text-sm text-gold hover:underline">
                  {t('landing.about.ecosystem.consumer.link')} →
                </Link>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="h-8 w-8 text-gold" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('landing.about.ecosystem.qsHub.title')}</h4>
                <p className="text-sm text-foreground-secondary mb-3">{t('landing.about.ecosystem.qsHub.description')}</p>
                <Link href="/qs-hub/landing" className="text-sm text-gold hover:underline">
                  {t('landing.about.ecosystem.qsHub.link')} →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Requirements Preview Section */}
        <section
          id="requirements-section"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {requirements.map((req) => (
              <Card key={req.key} variant="hoverGradient" className="p-8">
                <div className="w-12 h-12 bg-hinomaru/10 rounded-lg flex items-center justify-center mb-5">
                  <req.icon className="h-6 w-6 text-hinomaru" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold mb-3">
                  {t(`landing.requirements.${req.key}.title`)}
                </h3>
                <div className="text-2xl font-bold font-mono text-gold mb-2">
                  {t(`landing.requirements.${req.key}.value`)}
                </div>
                <p className="text-sm text-foreground-secondary">
                  {t(`landing.requirements.${req.key}.description`)}
                </p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/prover/requirements"
              className="inline-flex items-center gap-2 px-6 py-3 border border-surface-tertiary text-foreground bg-transparent hover:bg-surface-secondary hover:border-foreground-tertiary rounded-lg transition-all"
            >
              {t('landing.requirements.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section
          id="calculator-section"
          className="py-20 scroll-mt-24"
          role="region"
          aria-labelledby="calculator-title"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[2px] text-gold mb-4">
              <div className="w-6 h-px bg-gold" />
              {t('landing.calculator.sectionLabel')}
              <div className="w-6 h-px bg-gold" />
            </div>
            <h2 id="calculator-title" className="text-4xl font-bold mb-4">
              {t('landing.calculator.title')}
            </h2>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              {t('landing.calculator.description')}
            </p>
          </div>

          <div className="bg-background-secondary rounded-2xl p-12">
            <div className="grid grid-cols-2 gap-12 items-center">
              {/* Calculator Form */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="stake-amount"
                    className="text-sm text-foreground-secondary"
                  >
                    {t('landing.calculator.stakeAmount.label')}
                  </label>
                  <input
                    id="stake-amount"
                    type="number"
                    className="w-full px-5 py-4 bg-background border border-surface-tertiary rounded-lg text-foreground font-mono text-lg focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(Number(e.target.value) || 0)}
                    placeholder={t('landing.calculator.stakeAmount.placeholder')}
                    min="0"
                    step="1"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="monthly-volume"
                    className="text-sm text-foreground-secondary"
                  >
                    {t('landing.calculator.monthlyVolume.label')}
                  </label>
                  <input
                    id="monthly-volume"
                    type="number"
                    className="w-full px-5 py-4 bg-background border border-surface-tertiary rounded-lg text-foreground font-mono text-lg focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Number(e.target.value) || 0)}
                    placeholder={t('landing.calculator.monthlyVolume.placeholder')}
                    min="0"
                    step="100"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="uptime"
                    className="text-sm text-foreground-secondary"
                  >
                    {t('landing.calculator.uptime.label')}
                  </label>
                  <input
                    id="uptime"
                    type="number"
                    className="w-full px-5 py-4 bg-background border border-surface-tertiary rounded-lg text-foreground font-mono text-lg focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    value={uptime}
                    onChange={(e) => setUptime(Number(e.target.value) || 0)}
                    placeholder={t('landing.calculator.uptime.placeholder')}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-foreground-secondary bg-background/50 rounded-lg p-3">
                  <Calculator className="h-4 w-4 text-gold" aria-hidden="true" />
                  <span>{t('landing.calculator.realTimeHint')}</span>
                </div>
              </div>

              {/* Calculator Result */}
              <Card className="border-gold p-8" role="region" aria-live="polite" aria-label="ROI calculation results">
                <div className="text-sm text-foreground-secondary mb-2">
                  {t('landing.calculator.result.title')}
                </div>
                <div className="text-5xl font-bold font-mono text-success mb-4">
                  {roiResults.totalEarnings.toFixed(2)} ETH
                </div>

                <div className="border-t border-surface-tertiary pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">
                      {t('landing.calculator.result.signatureFees')}
                    </span>
                    <span className="font-mono font-semibold">{roiResults.signatureFees.toFixed(2)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">
                      {t('landing.calculator.result.performanceBonus')}
                    </span>
                    <span className="font-mono font-semibold">{roiResults.performanceBonus.toFixed(2)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">
                      {t('landing.calculator.result.roiOnStake')}
                    </span>
                    <span className="font-mono font-semibold text-success">
                      {roiResults.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Slashing Warning */}
          <Card className="mt-12 border-warning p-8">
            <div className="flex items-center gap-3 mb-5">
              <AlertTriangle
                className="h-6 w-6 text-warning"
                aria-hidden="true"
              />
              <h3 className="text-lg font-semibold text-warning">
                {t('landing.slashing.title')}
              </h3>
            </div>

            <p className="text-foreground-secondary mb-5">
              {t('landing.slashing.description')}
            </p>

            <div className="overflow-x-auto">
              <table
                className="w-full"
                role="table"
                aria-label="Slashing penalties table"
              >
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="text-left py-3 px-4 text-xs text-foreground-tertiary font-semibold uppercase">
                      {t('landing.slashing.violators')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-foreground-tertiary font-semibold uppercase">
                      {t('landing.slashing.rate')}
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-foreground-tertiary font-semibold uppercase">
                      {t('landing.slashing.lossOn400k')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slashingData.map((row) => (
                    <tr
                      key={row.provers}
                      className="border-b border-surface-tertiary/50"
                    >
                      <td className="py-3 px-4 font-mono">{row.provers}</td>
                      <td className="py-3 px-4 font-mono">{row.rate}</td>
                      <td
                        className={`py-3 px-4 font-mono ${row.danger ? 'text-danger' : ''}`}
                      >
                        {row.loss}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
                      className="text-xs text-gold hover:underline mt-1 inline-block"
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
            className="text-center p-16 relative overflow-hidden border-hinomaru"
            style={{
              background:
                'linear-gradient(135deg, var(--color-bg-secondary), var(--color-bg-card))',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: 'linear-gradient(90deg, var(--color-hinomaru), var(--color-gold))',
              }}
            />

            <h2 id="cta-title" className="text-3xl font-bold mb-4">
              {t('landing.cta.title')}
            </h2>
            <p className="text-foreground-secondary mb-8">
              {t('landing.cta.description')}
            </p>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/prover/application">
                {t('landing.cta.button')}
              </Link>
            </Button>
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
