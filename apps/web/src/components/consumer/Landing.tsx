'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Unlock,
  Clock,
  Eye,
  Key,
  AlertTriangle,
  Search,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface StatCardProps {
  value: string;
  label: string;
  highlight?: boolean;
}

function StatCard({ value, label, highlight }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 text-center transition-all duration-200 hover:border-border-secondary hover:-translate-y-1">
      <div className={`text-4xl font-bold mb-2 ${highlight ? 'text-hinomaru-400' : 'text-foreground'}`}>
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
}

function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-8 transition-all duration-200 hover:border-hinomaru hover:-translate-y-1">
      <div className="w-14 h-14 flex items-center justify-center bg-hinomaru/10 rounded-xl mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">{description}</p>
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gold/10 rounded-full text-gold mt-4 font-medium">
        {badge}
      </span>
    </div>
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
    <div className="flex-1 bg-card border border-border rounded-2xl p-8 relative">
      <div className="absolute -top-4 left-8 w-8 h-8 bg-hinomaru rounded-full flex items-center justify-center text-sm font-bold text-white">
        {number}
      </div>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">{description}</p>
    </div>
  );
}

function HinomaruVisual() {
  return (
    <div className="relative w-[300px] h-[300px] mx-auto my-16">
      <div className="absolute -inset-5 border border-gold rounded-full opacity-30 animate-[spin_15s_linear_infinite]" />
      <div className="absolute -inset-[50px] border border-dashed border-white/10 rounded-full animate-[spin_25s_linear_infinite_reverse]" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/[0.02] rounded-full border border-white/[0.08]" />
      <div className="absolute inset-[75px] bg-gradient-to-br from-[#ff3050] via-hinomaru to-[#8a001a] rounded-full shadow-[0_0_80px_rgba(188,0,45,0.4)] animate-hinomaru-pulse" />
    </div>
  );
}

export function Landing() {
  const t = useTranslations('consumer.landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(188,0,45,0.12),transparent_60%)] opacity-50" />
        <div className="absolute -bottom-[100px] -right-[100px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(201,169,98,0.1),transparent_60%)] opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/90 backdrop-blur-xl z-50 border-b border-border">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3" aria-label={t('header.logoAriaLabel')}>
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_20s_linear_infinite]">
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
              </div>
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-[0_0_15px_rgba(188,0,45,0.4)]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Quantum Shield</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8" role="navigation" aria-label={t('header.navAriaLabel')}>
            <Link href="#product" className="text-foreground-secondary text-sm font-medium hover:text-foreground transition-colors">
              {t('nav.product')}
            </Link>
            <Link href="/consumer/security" className="text-foreground-secondary text-sm font-medium hover:text-foreground transition-colors">
              {t('nav.security')}
            </Link>
            <Link href="#howitworks" className="text-foreground-secondary text-sm font-medium hover:text-foreground transition-colors">
              {t('nav.howitworks')}
            </Link>
            <Link href="/consumer/faq" className="text-foreground-secondary text-sm font-medium hover:text-foreground transition-colors">
              {t('nav.faq')}
            </Link>
          </nav>

          {/* CTA Button */}
          <Link
            href="/consumer/onboarding"
            className="hidden md:inline-flex px-6 py-2.5 bg-hinomaru text-white rounded-full text-sm font-semibold hover:bg-hinomaru-400 hover:shadow-[0_4px_16px_rgba(188,0,45,0.4)] transition-all"
          >
            {t('header.cta')}
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? t('header.closeMenu') : t('header.openMenu')}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-background border-t border-border p-6 flex flex-col gap-4">
            <Link href="#product" className="text-foreground-secondary text-base font-medium py-2">
              {t('nav.product')}
            </Link>
            <Link href="/consumer/security" className="text-foreground-secondary text-base font-medium py-2">
              {t('nav.security')}
            </Link>
            <Link href="#howitworks" className="text-foreground-secondary text-base font-medium py-2">
              {t('nav.howitworks')}
            </Link>
            <Link href="/consumer/faq" className="text-foreground-secondary text-base font-medium py-2">
              {t('nav.faq')}
            </Link>
            <Link
              href="/consumer/onboarding"
              className="mt-4 px-6 py-3 bg-hinomaru text-white rounded-xl text-center font-semibold"
            >
              {t('header.cta')}
            </Link>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-[1200px] mx-auto px-6">
          {/* Hero Section */}
          <section className="pt-40 pb-24 text-center" role="region" aria-labelledby="hero-title">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-hinomaru/10 border border-hinomaru rounded-full text-xs font-medium text-hinomaru-400 mb-6">
              <Shield className="w-4 h-4" />
              {t('hero.badge')}
            </span>
            <h1 id="hero-title" className="text-4xl md:text-6xl font-bold leading-tight mb-5 tracking-tight">
              {t('hero.titleLine1')}
              <br />
              <span className="bg-gradient-to-r from-hinomaru-400 to-gold bg-clip-text text-transparent">
                {t('hero.titleLine2')}
              </span>
            </h1>
            <p className="text-lg text-foreground-secondary max-w-[600px] mx-auto mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/consumer/onboarding"
                className="px-8 py-4 bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white rounded-xl text-base font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(188,0,45,0.4)] transition-all"
              >
                {t('hero.cta')}
              </Link>
              <Link
                href="#howitworks"
                className="px-8 py-4 bg-background-secondary text-foreground border border-border rounded-xl text-base font-medium hover:border-gold hover:text-gold transition-all"
              >
                {t('hero.secondary')}
              </Link>
            </div>

            <HinomaruVisual />
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-16" role="region" aria-label={t('stats.ariaLabel')}>
            <StatCard value={t('stats.tvl.value')} label={t('stats.tvl.label')} highlight />
            <StatCard value={t('stats.provers.value')} label={t('stats.provers.label')} />
            <StatCard value={t('stats.timelock.value')} label={t('stats.timelock.label')} />
            <StatCard value={t('stats.incidents.value')} label={t('stats.incidents.label')} />
          </section>

          {/* Features Section */}
          <section id="product" className="py-20" role="region" aria-labelledby="features-title">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" />
              Features
            </div>
            <h2 id="features-title" className="text-4xl font-bold mb-16">{t('features.title')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Lock className="w-7 h-7 text-hinomaru" />}
                title={t('features.dilithium.title')}
                description={t('features.dilithium.description')}
                badge={t('features.dilithium.badge')}
              />
              <FeatureCard
                icon={<Clock className="w-7 h-7 text-hinomaru" />}
                title={t('features.timelock.title')}
                description={t('features.timelock.description')}
                badge={t('features.timelock.badge')}
              />
              <FeatureCard
                icon={<Search className="w-7 h-7 text-hinomaru" />}
                title={t('features.zkstark.title')}
                description={t('features.zkstark.description')}
                badge={t('features.zkstark.badge')}
              />
              <FeatureCard
                icon={<Key className="w-7 h-7 text-hinomaru" />}
                title={t('features.selfcustody.title')}
                description={t('features.selfcustody.description')}
                badge={t('features.selfcustody.badge')}
              />
              <FeatureCard
                icon={<AlertTriangle className="w-7 h-7 text-hinomaru" />}
                title={t('features.emergency.title')}
                description={t('features.emergency.description')}
                badge={t('features.emergency.badge')}
              />
              <FeatureCard
                icon={<Eye className="w-7 h-7 text-hinomaru" />}
                title={t('features.transparency.title')}
                description={t('features.transparency.description')}
                badge={t('features.transparency.badge')}
              />
            </div>
          </section>

          {/* How It Works Section */}
          <section id="howitworks" className="py-20" role="region" aria-labelledby="howitworks-title">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" />
              How It Works
            </div>
            <h2 id="howitworks-title" className="text-4xl font-bold mb-16">{t('howitworks.title')}</h2>

            <div className="flex flex-col lg:flex-row gap-6">
              <StepCard
                number={1}
                icon={<Key className="w-10 h-10 text-gold" />}
                title={t('howitworks.step1.title')}
                description={t('howitworks.step1.description')}
              />
              <StepCard
                number={2}
                icon={<Lock className="w-10 h-10 text-gold" />}
                title={t('howitworks.step2.title')}
                description={t('howitworks.step2.description')}
              />
              <StepCard
                number={3}
                icon={<Unlock className="w-10 h-10 text-gold" />}
                title={t('howitworks.step3.title')}
                description={t('howitworks.step3.description')}
              />
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center py-20" role="region" aria-labelledby="cta-title">
            <h2 id="cta-title" className="text-4xl font-bold mb-4">{t('cta.title')}</h2>
            <p className="text-lg text-foreground-secondary max-w-[600px] mx-auto mb-10">
              {t('cta.description')}
            </p>
            <Link
              href="/consumer/onboarding"
              className="inline-flex px-8 py-4 bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white rounded-xl text-base font-semibold hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(188,0,45,0.4)] transition-all"
            >
              {t('cta.button')}
            </Link>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-20" role="contentinfo">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 relative flex items-center justify-center">
                  <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_20s_linear_infinite]">
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
                  </div>
                  <div className="w-5 h-5 bg-hinomaru rounded-full shadow-[0_0_15px_rgba(188,0,45,0.4)]" />
                </div>
                <span className="text-lg font-semibold">Quantum Shield</span>
              </div>
              <p className="text-sm text-foreground-secondary leading-relaxed">
                {t('footer.description')}
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground-tertiary mb-5">
                {t('footer.product.title')}
              </h4>
              <nav className="flex flex-col gap-3" aria-label={t('footer.product.title')}>
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://docs.quantumshield.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {t('footer.product.docs')} <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://api.quantumshield.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  API <ExternalLink className="w-3 h-3" />
                </a>
              </nav>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground-tertiary mb-5">
                {t('footer.resources.title')}
              </h4>
              <nav className="flex flex-col gap-3" aria-label={t('footer.resources.title')}>
                <Link href="/whitepaper.pdf" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  {t('footer.resources.whitepaper')}
                </Link>
                <a
                  href="https://blog.quantumshield.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {t('footer.resources.blog')} <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://github.com/quantumshield"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  GitHub <ExternalLink className="w-3 h-3" />
                </a>
              </nav>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-foreground-tertiary mb-5">
                {t('footer.support.title')}
              </h4>
              <nav className="flex flex-col gap-3" aria-label={t('footer.support.title')}>
                <Link href="/consumer/faq" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  FAQ
                </Link>
                <Link href="/consumer/security" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
                  {t('footer.support.security')}
                </Link>
                <a
                  href="mailto:support@quantumshield.io"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('footer.support.contact')}
                </a>
              </nav>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col sm:flex-row justify-between items-center pt-10 border-t border-border gap-5">
            <p className="text-sm text-foreground-tertiary">
              {t('footer.copyright')}
            </p>
            <nav className="flex gap-6" aria-label={t('footer.legal.ariaLabel')}>
              <Link href="/consumer/terms" className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                {t('footer.legal.terms')}
              </Link>
              <Link href="/consumer/privacy" className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                {t('footer.legal.privacy')}
              </Link>
              <Link href="/risk-disclosure" className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors">
                {t('footer.legal.risk')}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
