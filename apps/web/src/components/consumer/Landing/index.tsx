'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Link as I18nLink } from '@/i18n/navigation';
import {
  Lock,
  Unlock,
  Shield,
  Clock,
  GitBranch,
  Key,
  AlertTriangle,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EcosystemLink } from '@/components/shared/EcosystemLink';
import { HinomaryLogo } from './HinomaryLogo';
import { HinomaryVisual } from './HinomaryVisual';
import { Tooltip } from './Tooltip';

export function Landing() {
  const t = useTranslations('consumer.landing');
  const [cookieBannerVisible, setCookieBannerVisible] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  // Handle skip link focus
  const handleSkipToMain = () => {
    mainRef.current?.focus();
    mainRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen">
      {/* Skip Link for Accessibility - WCAG 2.4.1 */}
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          handleSkipToMain();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-hinomaru focus:text-white focus:rounded-qs"
      >
        Skip to main content
      </a>
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(201,169,98,0.1),transparent_60%)] opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/consumer"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Quantum Shield Home"
          >
            <HinomaryLogo size="sm" />
            <span className="text-lg font-semibold text-foreground">
              Quantum Shield
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Main navigation"
            role="navigation"
          >
            <EcosystemLink variant="inline" />
            <Link
              href="#features"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.product')}
            </Link>
            <Link
              href="/consumer/security"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.security')}
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.howItWorks')}
            </Link>
            <Link
              href="/consumer/faq"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.faq')}
            </Link>
          </nav>

          <Link href="/consumer/onboarding">
            <Button variant="primary" size="sm">
              {t('header.openApp')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="relative z-10 outline-none"
        role="main"
        aria-label="Main content"
      >
        {/* Hero Section */}
        <section className="pt-40 pb-24 text-center">
          <div className="container mx-auto px-6">
            <Tooltip content={t('hero.badgeTooltip')} showHelpIcon>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-hinomaru/10 border border-hinomaru rounded-full text-sm font-medium text-hinomaru-400 mb-6 cursor-help">
                <Shield className="w-4 h-4" aria-hidden="true" />
                {t('hero.badge')}
              </span>
            </Tooltip>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {t('hero.titleLine1')}
              <br />
              <span className="text-gradient-hinomaru">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/consumer/onboarding">
                <Button variant="primary" size="lg">
                  {t('hero.ctaPrimary')}
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="secondary" size="lg">
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>

            <div className="mt-16">
              <HinomaryVisual />
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          className="py-16"
          aria-label={t('stats.ariaLabel')}
        >
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                value={t('stats.protectedAssets.value')}
                label={t('stats.protectedAssets.label')}
                highlight
              />
              <StatCard
                value={t('stats.activeProvers.value')}
                label={t('stats.activeProvers.label')}
              />
              <StatCard
                value={t('stats.timeLock.value')}
                label={t('stats.timeLock.label')}
              />
              <StatCard
                value={t('stats.incidents.value')}
                label={t('stats.incidents.label')}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('features.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-16">
              {t('features.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Lock />}
                title={t('features.dilithium.title')}
                description={t('features.dilithium.description')}
                badge={t('features.dilithium.badge')}
                tooltip={t('features.dilithium.tooltip')}
                learnMoreUrl="https://csrc.nist.gov/pubs/fips/204/final"
                learnMoreLabel="NIST公式"
              />
              <FeatureCard
                icon={<Clock />}
                title={t('features.timeLock.title')}
                description={t('features.timeLock.description')}
                badge={t('features.timeLock.badge')}
                tooltip={t('features.timeLock.tooltip')}
              />
              <FeatureCard
                icon={<GitBranch />}
                title={t('features.smtProof.title')}
                description={t('features.smtProof.description')}
                badge={t('features.smtProof.badge')}
                tooltip={t('features.smtProof.tooltip')}
              />
              <FeatureCard
                icon={<Key />}
                title={t('features.selfCustody.title')}
                description={t('features.selfCustody.description')}
                badge={t('features.selfCustody.badge')}
                tooltip={t('features.selfCustody.tooltip')}
              />
              <FeatureCard
                icon={<AlertTriangle />}
                title={t('features.emergency.title')}
                description={t('features.emergency.description')}
                badge={t('features.emergency.badge')}
                tooltip={t('features.emergency.tooltip')}
              />
              <FeatureCard
                icon={<Eye />}
                title={t('features.transparency.title')}
                description={t('features.transparency.description')}
                badge={t('features.transparency.badge')}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(201,169,98,0.08),transparent_60%)] -translate-y-1/2" />
            <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(188,0,45,0.08),transparent_60%)] -translate-y-1/2" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('howItWorks.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('howItWorks.title')}
            </h2>
            <p className="text-foreground-secondary max-w-2xl mb-16">
              Quantum Shieldは複雑な技術をシンプルに。3つのステップであなたの資産を量子コンピュータの脅威から保護します。
            </p>

            {/* Steps with connecting line */}
            <div className="relative">
              {/* Connecting line - desktop only */}
              <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-hinomaru via-gold to-success opacity-30" aria-hidden="true" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                <StepCard
                  number={1}
                  icon={<Key className="w-10 h-10" />}
                  title={t('howItWorks.step1.title')}
                  description={t('howItWorks.step1.description')}
                />
                <StepCard
                  number={2}
                  icon={<Lock className="w-10 h-10" />}
                  title={t('howItWorks.step2.title')}
                  description={t('howItWorks.step2.description')}
                />
                <StepCard
                  number={3}
                  icon={<Unlock className="w-10 h-10" />}
                  title={t('howItWorks.step3.title')}
                  description={t('howItWorks.step3.description')}
                />
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/consumer/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold/10 border border-gold/30 rounded-full text-gold hover:bg-gold/20 transition-all text-sm font-medium"
              >
                {t('howItWorks.learnMore')}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Expert Quotes Section */}
        <section id="expert-quotes" className="py-20 bg-surface-secondary/30">
          <div className="container mx-auto px-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ExpertQuoteCard
                quote={t('expertQuotes.quotes.0.quote')}
                author={t('expertQuotes.quotes.0.author')}
                title={t('expertQuotes.quotes.0.title')}
                source={t('expertQuotes.quotes.0.source')}
                sourceUrl="https://ethereum-magicians.org/t/eip-7212-precompile-for-secp256r1-curve-support/14789"
              />
              <ExpertQuoteCard
                quote={t('expertQuotes.quotes.1.quote')}
                author={t('expertQuotes.quotes.1.author')}
                title={t('expertQuotes.quotes.1.title')}
                source={t('expertQuotes.quotes.1.source')}
                sourceUrl="https://globalriskinstitute.org/publication/2023-quantum-threat-timeline-report/"
              />
              <ExpertQuoteCard
                quote={t('expertQuotes.quotes.2.quote')}
                author={t('expertQuotes.quotes.2.author')}
                title={t('expertQuotes.quotes.2.title')}
                source={t('expertQuotes.quotes.2.source')}
                sourceUrl="https://csrc.nist.gov/projects/post-quantum-cryptography"
              />
            </div>

            {/* Probability Timeline */}
            <div className="card bg-surface">
              <h3 className="text-lg font-semibold mb-4">
                {t('expertQuotes.probability.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProbabilityCard
                  year={t('expertQuotes.probability.timeline.0.year')}
                  probability={t('expertQuotes.probability.timeline.0.probability')}
                  description={t('expertQuotes.probability.timeline.0.description')}
                  variant="low"
                />
                <ProbabilityCard
                  year={t('expertQuotes.probability.timeline.1.year')}
                  probability={t('expertQuotes.probability.timeline.1.probability')}
                  description={t('expertQuotes.probability.timeline.1.description')}
                  variant="medium"
                />
                <ProbabilityCard
                  year={t('expertQuotes.probability.timeline.2.year')}
                  probability={t('expertQuotes.probability.timeline.2.probability')}
                  description={t('expertQuotes.probability.timeline.2.description')}
                  variant="high"
                />
              </div>
              <p className="text-xs text-foreground-tertiary mt-4">
                {t('expertQuotes.probability.source')}
              </p>
            </div>

            <p className="text-xs text-foreground-tertiary text-center mt-6">
              {t('expertQuotes.disclaimer')}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10">
              {t('cta.description')}
            </p>
            <Link href="/consumer/onboarding">
              <Button variant="primary" size="lg">
                {t('cta.button')}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-border mt-20 py-16"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <HinomaryLogo size="sm" />
                <span className="text-lg font-semibold">Quantum Shield</span>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {t('footer.brand.description')}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
                {t('footer.product.title')}
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://sepolia.etherscan.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.product.explorer')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.quantumshield.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.product.docs')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://api.quantumshield.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.product.api')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
                {t('footer.resources.title')}
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="/whitepaper.pdf"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.resources.whitepaper')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://blog.quantumshield.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.resources.blog')}
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/quantumshield"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.resources.github')}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
                {t('footer.support.title')}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/consumer/faq"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.support.faq')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/consumer/security"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.support.security')}
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@quantumshield.io"
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                  >
                    {t('footer.support.contact')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border gap-4">
            <p className="text-sm text-foreground-tertiary">
              {t('footer.copyright')} 🇯🇵
            </p>
            <div className="flex gap-6">
              <Link
                href="/consumer/terms"
                className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors"
              >
                {t('footer.legal.terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors"
              >
                {t('footer.legal.privacy')}
              </Link>
              <a
                href="/risk-disclosure.html"
                className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors"
              >
                {t('footer.legal.risk')}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      {cookieBannerVisible && (
        <div
          className="fixed bottom-6 left-6 right-6 max-w-md bg-surface border border-border rounded-qs-xl p-5 flex items-center gap-5 z-50"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-desc"
        >
          <p id="cookie-banner-title" className="sr-only">
            Cookie Consent
          </p>
          <p id="cookie-banner-desc" className="flex-1 text-sm text-foreground-secondary">
            {t('cookie.message')}{' '}
            <a
              href="/cookie-policy.html"
              className="text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-surface rounded"
            >
              {t('cookie.details')}
            </a>
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCookieBannerVisible(false)}
            aria-label={t('cookie.accept')}
          >
            {t('cookie.accept')}
          </Button>
          <button
            onClick={() => setCookieBannerVisible(false)}
            className="text-foreground-tertiary hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-hinomaru focus:ring-offset-2 focus:ring-offset-surface rounded"
            aria-label="Close cookie banner"
            type="button"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-components

interface StatCardProps {
  value: string;
  label: string;
  highlight?: boolean;
}

function StatCard({ value, label, highlight }: StatCardProps) {
  return (
    <div className="card text-center hover:border-gold/30 hover:-translate-y-1 transition-all duration-300">
      <div
        className={cn(
          'text-3xl md:text-4xl font-bold mb-2',
          highlight ? 'text-hinomaru-400' : 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-sm text-foreground-secondary">{label}</div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  tooltip?: string;
  learnMoreUrl?: string;
  learnMoreLabel?: string;
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
  tooltip,
  learnMoreUrl,
  learnMoreLabel = '詳細を見る',
}: FeatureCardProps) {
  return (
    <article className="card hover:border-gold/30 hover:-translate-y-1 transition-all duration-300 group">
      <div
        className="w-14 h-14 flex items-center justify-center bg-gold/10 rounded-qs-lg mb-5 text-gold group-hover:bg-gold/20 transition-colors"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-3">
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
      <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-gold/10 text-gold rounded-full">
          {badge}
        </span>
        {learnMoreUrl && (
          <a
            href={learnMoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
            aria-label={`${title}について詳しく見る（外部リンク）`}
          >
            {learnMoreLabel}
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </article>
  );
}

interface StepCardProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

function StepCard({ number, icon, title, description }: StepCardProps) {
  const stepColors = {
    1: {
      bg: 'from-hinomaru/10 to-transparent',
      border: 'border-hinomaru/20 hover:border-hinomaru/40',
      glow: 'hover:shadow-[0_0_40px_rgba(188,0,45,0.15)]',
      numberBg: 'bg-hinomaru',
      iconColor: 'text-hinomaru',
    },
    2: {
      bg: 'from-gold/10 to-transparent',
      border: 'border-gold/20 hover:border-gold/40',
      glow: 'hover:shadow-[0_0_40px_rgba(201,169,98,0.15)]',
      numberBg: 'bg-gold',
      iconColor: 'text-gold',
    },
    3: {
      bg: 'from-success/10 to-transparent',
      border: 'border-success/20 hover:border-success/40',
      glow: 'hover:shadow-[0_0_40px_rgba(0,200,150,0.15)]',
      numberBg: 'bg-success',
      iconColor: 'text-success',
    },
  };
  const colors = stepColors[number as keyof typeof stepColors] || stepColors[1];

  return (
    <article
      className={cn(
        'group relative pt-14 pb-8 px-6 rounded-qs-xl border bg-surface',
        'bg-gradient-to-b',
        colors.bg,
        colors.border,
        colors.glow,
        'transition-all duration-500 hover:-translate-y-2'
      )}
      aria-labelledby={`step-${number}-title`}
    >
      {/* Step number badge */}
      <div
        className={cn(
          'absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white transition-transform duration-500 group-hover:scale-110',
          colors.numberBg
        )}
        aria-hidden="true"
      >
        {number}
      </div>

      {/* Icon container with animated ring */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className={cn(
            'w-20 h-20 rounded-full bg-surface-secondary flex items-center justify-center border border-border transition-all duration-500',
            'group-hover:border-transparent'
          )}>
            <div className={cn('transition-colors duration-500', colors.iconColor)} aria-hidden="true">
              {icon}
            </div>
          </div>
          {/* Animated ring on hover */}
          <div className={cn(
            'absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500',
            'border-2',
            colors.border.replace('hover:', '')
          )} />
        </div>
      </div>

      <h3 id={`step-${number}-title`} className="text-lg font-semibold mb-3 text-center">
        <span className="sr-only">Step {number}: </span>
        {title}
      </h3>
      <p className="text-sm text-foreground-secondary leading-relaxed text-center">
        {description}
      </p>

      {/* Decorative dots */}
      {number < 3 && (
        <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10" aria-hidden="true">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-gold/50" />
            <span className="w-2 h-2 rounded-full bg-gold/30" />
            <span className="w-2 h-2 rounded-full bg-gold/10" />
          </div>
        </div>
      )}
    </article>
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
    <article className="card hover:border-gold/30 transition-all duration-300">
      <blockquote className="text-sm text-foreground-secondary leading-relaxed mb-4 italic">
        "{quote}"
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

interface ProbabilityCardProps {
  year: string;
  probability: string;
  description: string;
  variant: 'low' | 'medium' | 'high';
}

function ProbabilityCard({ year, probability, description, variant }: ProbabilityCardProps) {
  const variantStyles = {
    low: 'border-success/30 bg-success/5',
    medium: 'border-warning/30 bg-warning/5',
    high: 'border-hinomaru/30 bg-hinomaru/5',
  };

  const probabilityStyles = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-hinomaru-400',
  };

  return (
    <div className={cn('p-4 rounded-qs-lg border', variantStyles[variant])}>
      <div className="text-sm font-medium text-foreground mb-1">{year}</div>
      <div className={cn('text-2xl font-bold mb-1', probabilityStyles[variant])}>
        {probability}
      </div>
      <div className="text-xs text-foreground-secondary">{description}</div>
    </div>
  );
}

export default Landing;
