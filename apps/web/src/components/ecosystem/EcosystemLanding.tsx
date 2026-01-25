'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  Coins,
  Vote,
  Eye,
  Cpu,
  Search,
  ArrowRight,
  Lock,
  Unlock,
  Users,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Wallet,
  BarChart3,
  Gavel,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { EcosystemVisual } from './EcosystemVisual';

// アプリカテゴリ
const appCategories = {
  consumer: {
    titleKey: 'apps.categories.consumer',
    apps: [
      { key: 'consumerApp', icon: Shield, href: '/consumer/landing', color: 'hinomaru' },
      { key: 'qsHub', icon: Coins, href: '/qs-hub/landing', color: 'gold' },
      { key: 'explorer', icon: Search, href: '/explorer/landing', color: 'gold' },
    ],
  },
  participant: {
    titleKey: 'apps.categories.participant',
    apps: [
      { key: 'prover', icon: Cpu, href: '/prover/landing', color: 'hinomaru' },
      { key: 'observer', icon: Eye, href: '/observer/landing', color: 'gold' },
    ],
  },
  enterprise: {
    titleKey: 'apps.categories.enterprise',
    apps: [
      { key: 'enterprise', icon: Building2, href: '/enterprise/landing', color: 'gold' },
    ],
  },
};

const useCases = [
  { key: 'hodler', icon: Wallet, appKey: 'consumerApp', href: '/consumer/landing' },
  { key: 'investor', icon: BarChart3, appKey: 'qsHub', href: '/qs-hub/landing' },
  { key: 'curious', icon: Search, appKey: 'explorer', href: '/explorer/landing' },
  { key: 'governance', icon: Gavel, appKey: 'qsHub', href: '/qs-hub/landing' },
  { key: 'technical', icon: HardDrive, appKey: 'prover', href: '/prover/landing' },
  { key: 'security', icon: AlertTriangle, appKey: 'observer', href: '/observer/landing' },
];

function getColorClasses(color: string) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    hinomaru: { bg: 'bg-hinomaru/10', text: 'text-hinomaru' },
    gold: { bg: 'bg-gold/10', text: 'text-gold' },
  };
  return colorMap[color] || { bg: 'bg-foreground/10', text: 'text-foreground' };
}

export function EcosystemLanding() {
  const t = useTranslations('ecosystem');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleFaq = (key: string) => {
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(188, 0, 45, 0.15), transparent 60%)',
            opacity: 0.6,
          }}
        />
        <div
          className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(212, 175, 55, 0.1), transparent 60%)',
            opacity: 0.4,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center px-8 py-6" role="banner">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 relative flex items-center justify-center" aria-hidden="true">
            <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_25s_linear_infinite]">
              <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
            </div>
            <div className="w-6 h-6 bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold">Quantum Shield</span>
            <span className="text-[10px] text-gold tracking-[2px] uppercase">Ecosystem</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1200px] mx-auto px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-hinomaru/10 border border-hinomaru/30 rounded-full mb-6">
            <Lock className="w-4 h-4 text-hinomaru" aria-hidden="true" />
            <span className="text-sm text-hinomaru font-medium">{t('hero.badge')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('hero.title')}
            <br />
            <span className="text-gold">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
            {t('hero.description')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/consumer/landing">
              <Button variant="primary" size="lg" className="flex items-center gap-2">
                {t('hero.getStarted')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="#about">
              <Button variant="outline" size="lg">
                {t('hero.learnMore')}
              </Button>
            </Link>
          </div>

          {/* Custom Visual */}
          <div className="mt-12">
            <EcosystemVisual />
          </div>
        </section>

        {/* What is Quantum Shield - 概要セクション */}
        <section className="mb-20" id="about">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">{t('about.title')}</h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              {t('about.description')}
            </p>
          </div>

          {/* 簡潔なフロー説明 */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <Card className="p-6 text-center">
              <div className="w-14 h-14 bg-hinomaru/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-hinomaru" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('about.steps.lock.title')}</h3>
              <p className="text-sm text-foreground-secondary">
                {t('about.steps.lock.description')}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-gold" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('about.steps.protect.title')}</h3>
              <p className="text-sm text-foreground-secondary">
                {t('about.steps.protect.description')}
              </p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-14 h-14 bg-success/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Unlock className="w-7 h-7 text-success" />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('about.steps.unlock.title')}</h3>
              <p className="text-sm text-foreground-secondary">
                {t('about.steps.unlock.description')}
              </p>
            </Card>
          </div>

          {/* 主な特徴 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {(['quantumSafe', 'selfCustody', 'timelock', 'transparent'] as const).map((feature) => (
              <div key={feature} className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border/50">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">{t(`about.features.${feature}.title`)}</h4>
                  <p className="text-xs text-foreground-secondary mt-1">
                    {t(`about.features.${feature}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 詳細ページへのリンク */}
          <div className="text-center">
            <Link href="/ecosystem/technical">
              <Button variant="outline" className="inline-flex items-center gap-2">
                {t('about.technicalLink')}
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Apps Section - カテゴリ別 */}
        <section id="apps" className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">{t('apps.title')}</h2>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              {t('apps.description')}
            </p>
          </div>

          {/* 一般ユーザー向け */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              {t('apps.categories.consumer')}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {appCategories.consumer.apps.map((app) => {
                const colors = getColorClasses(app.color);
                return (
                  <Link key={app.key} href={app.href} className="group">
                    <Card className="p-6 h-full transition-all hover:border-gold/50 hover:shadow-lg">
                      <div className={cn('w-12 h-12 mb-4 rounded-xl flex items-center justify-center', colors.bg)}>
                        <app.icon className={cn('w-6 h-6', colors.text)} />
                      </div>
                      <h4 className="text-lg font-bold mb-1 group-hover:text-gold transition-colors">
                        {t(`apps.${app.key}.title`)}
                      </h4>
                      <p className="text-sm text-gold font-medium mb-2">
                        {t(`apps.${app.key}.tagline`)}
                      </p>
                      <p className="text-sm text-foreground-secondary line-clamp-2">
                        {t(`apps.${app.key}.description`)}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-gold text-sm font-medium group-hover:gap-3 transition-all">
                        {t('apps.explore')}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ネットワーク参加者向け */}
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-gold" />
              {t('apps.categories.participant')}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {appCategories.participant.apps.map((app) => {
                const colors = getColorClasses(app.color);
                return (
                  <Link key={app.key} href={app.href} className="group">
                    <Card className="p-6 h-full transition-all hover:border-gold/50 hover:shadow-lg">
                      <div className={cn('w-12 h-12 mb-4 rounded-xl flex items-center justify-center', colors.bg)}>
                        <app.icon className={cn('w-6 h-6', colors.text)} />
                      </div>
                      <h4 className="text-lg font-bold mb-1 group-hover:text-gold transition-colors">
                        {t(`apps.${app.key}.title`)}
                      </h4>
                      <p className="text-sm text-gold font-medium mb-2">
                        {t(`apps.${app.key}.tagline`)}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {t(`apps.${app.key}.description`)}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-gold text-sm font-medium group-hover:gap-3 transition-all">
                        {t('apps.explore')}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 企業向け */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              {t('apps.categories.enterprise')}
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {appCategories.enterprise.apps.map((app) => {
                const colors = getColorClasses(app.color);
                return (
                  <Link key={app.key} href={app.href} className="group">
                    <Card className="p-6 h-full transition-all hover:border-gold/50 hover:shadow-lg">
                      <div className={cn('w-12 h-12 mb-4 rounded-xl flex items-center justify-center', colors.bg)}>
                        <app.icon className={cn('w-6 h-6', colors.text)} />
                      </div>
                      <h4 className="text-lg font-bold mb-1 group-hover:text-gold transition-colors">
                        {t(`apps.${app.key}.title`)}
                      </h4>
                      <p className="text-sm text-gold font-medium mb-2">
                        {t(`apps.${app.key}.tagline`)}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {t(`apps.${app.key}.description`)}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-gold text-sm font-medium group-hover:gap-3 transition-all">
                        {t('apps.explore')}
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Use Cases Section - ペルソナ別おすすめ */}
        <section className="mb-20" id="use-cases">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">{t('useCases.title')}</h2>
            <p className="text-foreground-secondary max-w-xl mx-auto">
              {t('useCases.description')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase) => (
              <Card key={useCase.key} className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-hinomaru/10 rounded-lg flex items-center justify-center">
                    <useCase.icon className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold">{t(`useCases.${useCase.key}.title`)}</h3>
                </div>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t(`useCases.${useCase.key}.description`)}
                </p>
                <div className="bg-background-secondary rounded-lg p-4 mb-4">
                  <span className="text-xs font-medium text-gold uppercase tracking-wider">
                    {t('useCases.recommendedLabel')}
                  </span>
                  <p className="font-semibold text-foreground mt-1">
                    {t(`useCases.${useCase.key}.recommended`)}
                  </p>
                </div>
                <Link href={useCase.href} className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    {t(`useCases.${useCase.key}.recommended`)}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20" id="faq">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">{t('faq.title')}</h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {['q1', 'q2', 'q3', 'q4', 'q5'].map((qKey) => (
              <Card key={qKey} className="overflow-hidden">
                <button
                  onClick={() => toggleFaq(qKey)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-background-secondary/50 transition-colors"
                  aria-expanded={expandedFaq === qKey}
                >
                  <span className="font-semibold pr-4">{t(`faq.items.${qKey}.question`)}</span>
                  {expandedFaq === qKey ? (
                    <ChevronUp className="w-5 h-5 text-foreground-secondary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground-secondary flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === qKey && (
                  <div className="px-5 pb-5 text-foreground-secondary">
                    {t(`faq.items.${qKey}.answer`)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Expert Quotes Section */}
        <section
          id="expert-quotes"
          className="mb-20 py-16 bg-surface-secondary/30 -mx-8 px-8 rounded-2xl"
        >
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('expertQuotes.sectionLabel')}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('expertQuotes.title')}
            </h2>
            <p className="text-foreground-secondary mb-12">
              {t('expertQuotes.subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <article key={index} className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
                  <blockquote className="text-sm text-foreground-secondary leading-relaxed mb-4 italic">
                    &ldquo;{t(`expertQuotes.quotes.${index}.quote`)}&rdquo;
                  </blockquote>
                  <div className="border-t border-border pt-4">
                    <div className="font-semibold text-foreground">{t(`expertQuotes.quotes.${index}.author`)}</div>
                    <div className="text-xs text-foreground-tertiary">{t(`expertQuotes.quotes.${index}.title`)}</div>
                    <div className="text-xs text-gold mt-1">{t(`expertQuotes.quotes.${index}.source`)}</div>
                  </div>
                </article>
              ))}
            </div>

            <p className="text-xs text-foreground-tertiary text-center mt-6">
              {t('expertQuotes.disclaimer')}
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-br from-hinomaru/10 to-gold/10 rounded-2xl p-12 border border-hinomaru/20">
          <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-foreground-secondary mb-8 max-w-lg mx-auto">
            {t('cta.description')}
          </p>
          <Link href="/consumer/landing">
            <Button variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
              {t('cta.button')}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-20 py-8">
        <div className="max-w-[1200px] mx-auto px-8 text-center text-sm text-foreground-tertiary">
          <p>{t('footer.copyright')}</p>
        </div>
      </footer>

      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  );
}
