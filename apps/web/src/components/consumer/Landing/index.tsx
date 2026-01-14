'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import {
  Lock,
  Unlock,
  Shield,
  Key,
  AlertTriangle,
  Eye,
  Clock,
  Search,
  ChevronRight,
} from 'lucide-react';

// Hinomaru Visual Component
function HinomaruVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn('relative w-[300px] h-[300px] mx-auto', className)}
      role="img"
      aria-label="Quantum Shield Hinomaru Symbol"
    >
      {/* Outer orbit ring */}
      <div
        className="absolute inset-[-20px] border border-gold/30 rounded-full animate-[spin_15s_linear_infinite]"
        aria-hidden="true"
      />
      {/* Second orbit ring */}
      <div
        className="absolute inset-[-50px] border border-dashed border-foreground-tertiary/20 rounded-full animate-[spin_25s_linear_infinite_reverse]"
        aria-hidden="true"
      />
      {/* White outer circle */}
      <div
        className="absolute inset-0 rounded-full border border-foreground-tertiary/10"
        style={{
          background:
            'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
        }}
        aria-hidden="true"
      />
      {/* Hinomaru red center */}
      <div
        className="absolute inset-[75px] rounded-full shadow-glow-hinomaru animate-pulse-slow"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, #ff3050, #bc002d, #8a001a)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}

// Stats Card Component
function StatCard({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-qs-xl p-8',
        'text-center transition-all hover:border-border-secondary hover:-translate-y-1'
      )}
    >
      <div
        className={cn(
          'text-4xl font-bold mb-2',
          highlight ? 'text-hinomaru-400' : 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-sm text-foreground-secondary">{label}</div>
    </div>
  );
}

// Feature Card Component with expandable tooltip
function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  tooltip,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge: string;
  tooltip?: string;
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const tooltipId = tooltip ? `tooltip-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined;

  return (
    <article
      className={cn(
        'bg-surface border border-border rounded-qs-xl p-8',
        'transition-all hover:border-hinomaru/30 group'
      )}
    >
      <div
        className="w-14 h-14 flex items-center justify-center bg-hinomaru/10 rounded-qs-lg mb-5"
        aria-hidden="true"
      >
        <Icon className="w-7 h-7 text-hinomaru-400" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
      <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
        {description}
      </p>

      {/* Expandable tooltip for technical terms */}
      {tooltip && (
        <div className="mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gold hover:text-gold-400 underline underline-offset-2 transition-colors"
            aria-expanded={isExpanded}
            aria-controls={tooltipId}
          >
            {isExpanded ? '閉じる' : 'もっと詳しく'}
          </button>
          <div
            id={tooltipId}
            className={cn(
              'overflow-hidden transition-all duration-300',
              isExpanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
            )}
            aria-hidden={!isExpanded}
          >
            <p className="text-xs text-foreground-secondary bg-background-secondary p-3 rounded-qs leading-relaxed">
              {tooltip}
            </p>
          </div>
        </div>
      )}

      <span
        className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-gold/10 text-gold rounded-full"
      >
        {badge}
      </span>
    </article>
  );
}

// Step Card Component (renders as li for semantic list)
function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <li className="relative bg-surface border border-border rounded-qs-xl p-8 flex-1 list-none">
      {/* Step Number - visible but not for screen readers since ol handles numbering */}
      <div
        className="absolute -top-4 left-8 w-8 h-8 bg-hinomaru rounded-full flex items-center justify-center text-sm font-bold text-white"
        aria-hidden="true"
      >
        {number}
      </div>
      <div className="text-4xl mb-4" aria-hidden="true">
        <Icon className="w-10 h-10 text-foreground-secondary" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">
        {description}
      </p>
    </li>
  );
}

// Main Landing Page Component
export function Landing() {
  const t = useTranslations();

  return (
    <div className="relative min-h-screen">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* Red glow */}
        <div
          className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-50"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
          }}
        />
        {/* Gold glow */}
        <div
          className="absolute -bottom-[100px] -right-[100px] w-[400px] h-[400px] opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgba(201, 169, 98, 0.1), transparent 60%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section
          className="container mx-auto px-6 pt-40 pb-24 text-center"
          aria-label={t('hero.ariaLabel')}
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-hinomaru/10 border border-hinomaru rounded-full text-xs font-medium text-hinomaru-400 mb-6">
            <Shield className="w-4 h-4" aria-hidden="true" />
            {t('hero.badge')}
          </span>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            {t('hero.title')}
            <br />
            <span className="bg-gradient-to-r from-hinomaru-400 to-gold bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/consumer/onboarding"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'px-8 py-4 bg-gradient-hinomaru text-white font-semibold rounded-qs-lg',
                'hover:shadow-qs-hover hover:-translate-y-0.5 transition-all'
              )}
            >
              {t('hero.ctaPrimary')}
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                'inline-flex items-center justify-center',
                'px-8 py-4 bg-surface border border-border text-foreground font-medium rounded-qs-lg',
                'hover:border-gold hover:text-gold transition-all'
              )}
            >
              {t('hero.ctaSecondary')}
            </a>
          </div>

          {/* Hinomaru Visual */}
          <HinomaruVisual className="my-16" />
        </section>

        {/* Stats Section */}
        <section
          className="container mx-auto px-6 py-16"
          aria-label={t('stats.ariaLabel')}
        >
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
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="container mx-auto px-6 py-20"
          aria-label={t('features.ariaLabel')}
        >
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            <span className="w-6 h-[1px] bg-gold" aria-hidden="true" />
            {t('features.sectionLabel')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            {t('features.title')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Lock}
              title={t('features.dilithium.title')}
              description={t('features.dilithium.description')}
              badge={t('features.dilithium.badge')}
              tooltip={t('features.dilithium.tooltip')}
            />
            <FeatureCard
              icon={Clock}
              title={t('features.timeLock.title')}
              description={t('features.timeLock.description')}
              badge={t('features.timeLock.badge')}
              tooltip={t('features.timeLock.tooltip')}
            />
            <FeatureCard
              icon={Search}
              title={t('features.zkStark.title')}
              description={t('features.zkStark.description')}
              badge={t('features.zkStark.badge')}
              tooltip={t('features.zkStark.tooltip')}
            />
            <FeatureCard
              icon={Key}
              title={t('features.selfCustody.title')}
              description={t('features.selfCustody.description')}
              badge={t('features.selfCustody.badge')}
            />
            <FeatureCard
              icon={AlertTriangle}
              title={t('features.emergency.title')}
              description={t('features.emergency.description')}
              badge={t('features.emergency.badge')}
            />
            <FeatureCard
              icon={Eye}
              title={t('features.transparency.title')}
              description={t('features.transparency.description')}
              badge={t('features.transparency.badge')}
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="container mx-auto px-6 py-20"
          aria-label={t('howItWorks.ariaLabel')}
        >
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-gold mb-4">
            <span className="w-6 h-[1px] bg-gold" aria-hidden="true" />
            {t('howItWorks.sectionLabel')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            {t('howItWorks.title')}
          </h2>

          <ol className="flex flex-col lg:flex-row gap-6" role="list">
            <StepCard
              number={1}
              icon={Key}
              title={t('howItWorks.step1.title')}
              description={t('howItWorks.step1.description')}
            />
            <StepCard
              number={2}
              icon={Lock}
              title={t('howItWorks.step2.title')}
              description={t('howItWorks.step2.description')}
            />
            <StepCard
              number={3}
              icon={Unlock}
              title={t('howItWorks.step3.title')}
              description={t('howItWorks.step3.description')}
            />
          </ol>
        </section>

        {/* CTA Section */}
        <section
          className="container mx-auto px-6 py-20 text-center"
          aria-label={t('cta.ariaLabel')}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t('cta.title')}
          </h2>
          <p className="text-lg text-foreground-secondary max-w-xl mx-auto mb-10">
            {t('cta.description')}
          </p>
          <Link
            href="/consumer/onboarding"
            className={cn(
              'inline-flex items-center justify-center gap-2',
              'px-8 py-4 bg-gradient-hinomaru text-white font-semibold rounded-qs-lg',
              'hover:shadow-qs-hover hover:-translate-y-0.5 transition-all'
            )}
          >
            {t('cta.button')}
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}

export default Landing;
