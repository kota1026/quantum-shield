'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
  LogIn,
  Calculator,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Header */}
        <header
          className="flex justify-between items-center py-5"
          role="banner"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-lg font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-[1.5px]">
                Prover Portal
              </div>
            </div>
          </div>

          <nav
            className="flex gap-1 bg-background-secondary p-1 rounded-full border border-surface-tertiary/30"
            role="navigation"
            aria-label="Main navigation"
          >
            <Link
              href="/prover/landing"
              className="px-5 py-2.5 text-sm font-medium text-foreground bg-surface rounded-full"
              aria-current="page"
            >
              {t('common.header.overview')}
            </Link>
            <Link
              href="/prover/requirements"
              className="px-5 py-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.requirements')}
            </Link>
            <Link
              href="/prover/requirements#economics"
              className="px-5 py-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.economics')}
            </Link>
            <Link
              href="/prover/application"
              className="px-5 py-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.apply')}
            </Link>
          </nav>

          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/prover/status">
                <LogIn className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('common.login')}
              </Link>
            </Button>
            <Button variant="primary" asChild>
              <Link href="/prover/application">{t('common.applyNow')}</Link>
            </Button>
          </div>
        </header>

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
              <Link href="/prover/requirements">
                {t('landing.hero.requirementsButton')}
              </Link>
            </Button>
          </div>
        </main>

        {/* Stats Section */}
        <section
          className="py-16"
          role="region"
          aria-label="Network statistics"
        >
          <div className="grid grid-cols-4 gap-5">
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

        {/* Requirements Preview Section */}
        <section
          className="py-20"
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

          <div className="grid grid-cols-3 gap-6">
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
            <Button variant="outline" asChild>
              <Link href="/prover/requirements">
                {t('landing.requirements.viewAll')}
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section
          className="py-20"
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
            <p className="text-foreground-secondary mb-8">
              {t('landing.cta.description')}
            </p>
            <Button variant="primary" size="lg" asChild>
              <Link href="/prover/application">{t('landing.cta.button')}</Link>
            </Button>
          </Card>
        </section>

        {/* Footer */}
        <footer
          className="py-10 border-t border-surface-tertiary text-center"
          role="contentinfo"
        >
          <div className="flex items-center justify-center gap-3 text-[11px] tracking-[2px] text-gold uppercase mb-4">
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-hinomaru rounded-full" />
            </div>
            {t('landing.footer.tagline')} • {t('landing.footer.madeIn')}
            <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-hinomaru rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-foreground-tertiary">
            <Link
              href="/prover/terms"
              className="hover:text-foreground transition-colors"
            >
              {t('landing.footer.terms')}
            </Link>
            <Link
              href="/prover/privacy"
              className="hover:text-foreground transition-colors"
            >
              {t('landing.footer.privacy')}
            </Link>
            <Link
              href="/prover/cookie"
              className="hover:text-foreground transition-colors"
            >
              {t('landing.footer.cookie')}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
