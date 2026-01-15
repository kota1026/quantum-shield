'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Shield,
  Clock,
  Search,
  Key,
  AlertTriangle,
  Eye,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-hinomaru/10 border border-hinomaru rounded-full text-sm font-medium text-hinomaru-400 mb-6">
              <Shield className="w-4 h-4" aria-hidden="true" />
              {t('hero.badge')}
            </span>

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
              />
              <FeatureCard
                icon={<Clock />}
                title={t('features.timeLock.title')}
                description={t('features.timeLock.description')}
                badge={t('features.timeLock.badge')}
                tooltip={t('features.timeLock.tooltip')}
              />
              <FeatureCard
                icon={<Search />}
                title={t('features.zkStark.title')}
                description={t('features.zkStark.description')}
                badge={t('features.zkStark.badge')}
                tooltip={t('features.zkStark.tooltip')}
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
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('howItWorks.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-16">
              {t('howItWorks.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    <div className="card text-center hover:border-hinomaru/30 hover:-translate-y-1 transition-all duration-300">
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
}

function FeatureCard({
  icon,
  title,
  description,
  badge,
  tooltip,
}: FeatureCardProps) {
  return (
    <article className="card hover:border-hinomaru/30 hover:-translate-y-1 transition-all duration-300 group">
      <div
        className="w-14 h-14 flex items-center justify-center bg-hinomaru/10 rounded-qs-lg mb-5 text-hinomaru-400 group-hover:bg-hinomaru/20 transition-colors"
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
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-gold/10 text-gold rounded-full">
        {badge}
      </span>
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
  return (
    <article className="card relative pt-8" aria-labelledby={`step-${number}-title`}>
      <div
        className="absolute -top-4 left-8 w-8 h-8 bg-hinomaru rounded-full flex items-center justify-center text-sm font-bold text-white"
        aria-hidden="true"
      >
        {number}
      </div>
      <div className="text-foreground-secondary mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 id={`step-${number}-title`} className="text-lg font-semibold mb-2">
        <span className="sr-only">Step {number}: </span>
        {title}
      </h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">
        {description}
      </p>
    </article>
  );
}

export default Landing;
