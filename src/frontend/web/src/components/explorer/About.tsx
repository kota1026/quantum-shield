'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  Activity,
  Search,
  BarChart3,
  Eye,
  Lock,
  Unlock,
  Shield,
  Clock,
  CheckCircle2,
  FileText,
  Github,
  MessageCircle,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ExplorerAboutProps {
  locale?: string;
}

export function ExplorerAbout({ locale = 'ja' }: ExplorerAboutProps) {
  const t = useTranslations('explorer');

  const features = [
    {
      key: 'realtime',
      icon: Activity,
    },
    {
      key: 'search',
      icon: Search,
    },
    {
      key: 'analytics',
      icon: BarChart3,
    },
    {
      key: 'transparency',
      icon: Eye,
    },
  ];

  const steps = [
    { key: 'lock', icon: Lock, hasTooltip: false },
    { key: 'unlock', icon: Unlock, hasTooltip: true },
    { key: 'prover', icon: Shield, hasTooltip: true },
    { key: 'timelock', icon: Clock, hasTooltip: false },
    { key: 'complete', icon: CheckCircle2, hasTooltip: false },
  ];

  const resources = [
    { key: 'docs', icon: FileText, href: '#' },
    { key: 'github', icon: Github, href: 'https://github.com/quantum-shield' },
    { key: 'discord', icon: MessageCircle, href: '#' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background glow effect */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          {/* Logo */}
          <Link href={`/${locale}/explorer/overview`} className="flex items-center gap-4">
            <div className="w-11 h-11 relative flex items-center justify-center">
              <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_25s_linear_infinite]">
                <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] bg-gold rounded-full" />
              </div>
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight">Quantum Shield</span>
              <span className="text-[10px] text-gold tracking-widest uppercase">Explorer</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav
            className="flex gap-1 bg-background-secondary p-1 rounded-full border border-surface-tertiary overflow-x-auto"
            role="navigation"
            aria-label="Explorer navigation"
          >
            <Link
              href={`/${locale}/explorer/overview`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.overview')}
            </Link>
            <Link
              href={`/${locale}/explorer/locks`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.locks')}
            </Link>
            <Link
              href={`/${locale}/explorer/unlocks`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.unlocks')}
            </Link>
            <Link
              href={`/${locale}/explorer/challenges`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.challenges')}
            </Link>
            <Link
              href={`/${locale}/explorer/provers`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.provers')}
            </Link>
            <Link
              href={`/${locale}/explorer/analytics`}
              className="px-5 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground rounded-full transition-colors"
            >
              {t('common.header.analytics')}
            </Link>
          </nav>
        </header>

        {/* Hero Section */}
        <section className="text-center py-12 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('about.hero.title')}
          </h1>
          <p className="text-lg text-foreground-secondary max-w-3xl mx-auto mb-8">
            {t('about.hero.subtitle')}
          </p>
          <div className="flex justify-center gap-4">
            <Link href={`/${locale}/explorer/overview`}>
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                {t('about.cta.explore')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </section>

        {/* What is Section */}
        <section className="mb-12">
          <Card padding="lg" className="text-center">
            <h2 className="text-2xl font-semibold mb-4">{t('about.sections.whatIs.title')}</h2>
            <p className="text-foreground-secondary max-w-3xl mx-auto">
              {t('about.sections.whatIs.description')}
            </p>
          </Card>
        </section>

        {/* Features Section */}
        <section className="mb-12">
          <h2 className="text-[11px] uppercase tracking-wider text-gold mb-6 text-center">
            {t('about.sections.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.key} padding="lg" className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
                    <Icon className="w-6 h-6 text-gold" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`about.sections.features.items.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`about.sections.features.items.${feature.key}.description`)}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-12">
          <h2 className="text-[11px] uppercase tracking-wider text-gold mb-6 text-center">
            {t('about.sections.howItWorks.title')}
          </h2>
          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-surface-tertiary -translate-y-1/2 z-0" aria-hidden="true" />

            <Tooltip.Provider delayDuration={200}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-background border-2 border-gold rounded-full flex items-center justify-center relative">
                        <Icon className="w-7 h-7 text-gold" aria-hidden="true" />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-hinomaru rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="font-semibold mb-1 flex items-center justify-center gap-1">
                        {t(`about.sections.howItWorks.steps.${step.key}.title`)}
                        {step.hasTooltip && (
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button
                                type="button"
                                className="inline-flex text-foreground-secondary hover:text-gold transition-colors"
                                aria-label="詳細情報"
                              >
                                <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                className="z-50 max-w-xs px-3 py-2 text-xs bg-background-secondary border border-surface-tertiary rounded-lg shadow-lg"
                                sideOffset={5}
                              >
                                {t(`about.sections.howItWorks.steps.${step.key}.tooltip`)}
                                <Tooltip.Arrow className="fill-background-secondary" />
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )}
                      </h3>
                      <p className="text-xs text-foreground-secondary">
                        {t(`about.sections.howItWorks.steps.${step.key}.description`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Tooltip.Provider>
          </div>
        </section>

        {/* Resources Section */}
        <section className="mb-12">
          <h2 className="text-[11px] uppercase tracking-wider text-gold mb-6 text-center">
            {t('about.sections.resources.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <a
                  key={resource.key}
                  href={resource.href}
                  className="block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card padding="lg" className="text-center hover:border-gold transition-colors group">
                    <div className="w-12 h-12 mx-auto mb-4 bg-background-secondary rounded-full flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                      <Icon className="w-6 h-6 text-foreground-secondary group-hover:text-gold transition-colors" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold mb-1 group-hover:text-gold transition-colors">
                      {t(`about.sections.resources.${resource.key}.title`)}
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      {t(`about.sections.resources.${resource.key}.description`)}
                    </p>
                  </Card>
                </a>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12">
          <Card padding="lg" className="bg-gradient-to-r from-hinomaru/10 to-gold/10 border-gold/30">
            <h2 className="text-2xl font-semibold mb-4">{t('about.sections.whatIs.title')}</h2>
            <p className="text-foreground-secondary mb-6 max-w-2xl mx-auto">
              {t('about.hero.subtitle')}
            </p>
            <div className="flex justify-center gap-4">
              <Link href={`/${locale}/explorer/overview`}>
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  {t('about.cta.explore')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
