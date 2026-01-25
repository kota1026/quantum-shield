'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Algorithm {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeIcon: string;
}

interface SecurityFeature {
  id: string;
  name: string;
  type: string;
}

interface ExternalLink {
  id: string;
  icon: string;
  title: string;
  url: string;
}

export function Security() {
  const t = useTranslations('consumer.security');

  const algorithms: Algorithm[] = [
    {
      id: 'dilithium',
      icon: '🔐',
      title: t('algorithms.dilithium.title'),
      description: t('algorithms.dilithium.description'),
      badge: t('algorithms.dilithium.badge'),
      badgeIcon: '🏛️',
    },
    {
      id: 'sphincs',
      icon: '✍️',
      title: t('algorithms.sphincs.title'),
      description: t('algorithms.sphincs.description'),
      badge: t('algorithms.sphincs.badge'),
      badgeIcon: '🏛️',
    },
    {
      id: 'smtProof',
      icon: '🌳',
      title: t('algorithms.smtProof.title'),
      description: t('algorithms.smtProof.description'),
      badge: t('algorithms.smtProof.badge'),
      badgeIcon: '#️⃣',
    },
  ];

  const features: SecurityFeature[] = [
    { id: 'timelock', name: t('features.timelock.name'), type: t('features.timelock.type') },
    { id: 'emergency', name: t('features.emergency.name'), type: t('features.emergency.type') },
    { id: 'multisig', name: t('features.multisig.name'), type: t('features.multisig.type') },
    { id: 'challenge', name: t('features.challenge.name'), type: t('features.challenge.type') },
  ];

  const links: ExternalLink[] = [
    { id: 'whitepaper', icon: '📖', title: t('links.whitepaper'), url: 'https://docs.quantumshield.io/security' },
    { id: 'github', icon: '💻', title: t('links.github'), url: 'https://github.com/quantumshield/contracts' },
    { id: 'audits', icon: '🔒', title: t('links.audits'), url: 'https://docs.quantumshield.io/audits' },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Hero Section */}
        <section className="text-center mb-10" aria-labelledby="security-hero">
          <div className="text-6xl mb-4" aria-hidden="true">🛡️</div>
          <h2 id="security-hero" className="text-2xl font-bold text-foreground mb-2">
            {t('hero.title')}
          </h2>
          <p className="text-[15px] text-foreground-secondary">
            {t('hero.subtitle')}
          </p>
        </section>

        {/* Algorithms Section */}
        <section aria-labelledby="algorithms-section">
          <span
            id="algorithms-section"
            className={cn(
              'text-xs font-semibold tracking-wider uppercase text-gold',
              'flex items-center gap-2 mb-4'
            )}
          >
            <span className="w-4 h-px bg-gold" aria-hidden="true" />
            {t('sections.algorithms')}
          </span>

          <div className="space-y-4">
            {algorithms.map((algo) => (
              <article
                key={algo.id}
                className={cn(
                  'bg-card border border-border-subtle rounded-qs-xl p-6'
                )}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className={cn(
                      'w-12 h-12 flex items-center justify-center',
                      'bg-hinomaru/10 rounded-qs text-2xl'
                    )}
                    aria-hidden="true"
                  >
                    {algo.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {algo.title}
                  </h3>
                </div>
                <p className="text-sm text-foreground-secondary leading-relaxed mb-3">
                  {algo.description}
                </p>
                <span
                  className={cn(
                    'inline-flex items-center gap-2',
                    'text-xs px-3 py-1.5 rounded-full',
                    'bg-gold/10 border border-gold text-gold font-medium'
                  )}
                >
                  <span aria-hidden="true">{algo.badgeIcon}</span>
                  {algo.badge}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* Security Features Section */}
        <section className="mt-8" aria-labelledby="features-section">
          <span
            id="features-section"
            className={cn(
              'text-xs font-semibold tracking-wider uppercase text-gold',
              'flex items-center gap-2 mb-4'
            )}
          >
            <span className="w-4 h-px bg-gold" aria-hidden="true" />
            {t('sections.features')}
          </span>

          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={cn(
                  'bg-surface-secondary border border-border-subtle rounded-qs-lg p-4',
                  'text-center'
                )}
              >
                <div className="text-sm font-semibold text-foreground mb-1">
                  {feature.name}
                </div>
                <div className="text-xs text-foreground-tertiary">
                  {feature.type}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* External Links Section */}
        <section className="mt-8" aria-labelledby="links-section">
          <span
            id="links-section"
            className={cn(
              'text-xs font-semibold tracking-wider uppercase text-gold',
              'flex items-center gap-2 mb-4'
            )}
          >
            <span className="w-4 h-px bg-gold" aria-hidden="true" />
            {t('sections.links')}
          </span>

          <div className="space-y-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center justify-between px-5 py-4',
                  'bg-card border border-border-subtle rounded-qs-lg',
                  'text-foreground hover:border-gold',
                  'focus:outline-none focus:ring-2 focus:ring-gold/30',
                  'transition-all'
                )}
              >
                <span className="flex items-center gap-3 text-sm">
                  <span aria-hidden="true">{link.icon}</span>
                  {link.title}
                </span>
                <ExternalLink
                  className="w-4 h-4 text-gold"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Security;
