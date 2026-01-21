'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import {
  Search,
  Shield,
  Activity,
  Users,
  ArrowRight,
  TrendingUp,
  Lock,
  Unlock,
  AlertTriangle,
  Globe,
  BarChart3,
  Eye,
  Clock,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EcosystemLink } from '@/components/shared/EcosystemLink';
import { cn } from '@/lib/utils';

export function ExplorerLanding() {
  const t = useTranslations('explorer');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  };

  const stats = [
    {
      key: 'tvl',
      value: '12,450 ETH',
      icon: Database,
      highlight: true,
    },
    {
      key: 'totalLocks',
      value: '8,234',
      icon: Lock,
      highlight: false,
    },
    {
      key: 'totalUnlocks',
      value: '6,892',
      icon: Unlock,
      highlight: false,
    },
    {
      key: 'activeProvers',
      value: '47',
      icon: Users,
      highlight: false,
    },
  ];

  const features = [
    {
      key: 'realtime',
      icon: Activity,
    },
    {
      key: 'transparency',
      icon: Eye,
    },
    {
      key: 'analytics',
      icon: BarChart3,
    },
    {
      key: 'search',
      icon: Search,
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

      <div className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Header */}
        <header
          className="flex justify-between items-center py-5"
          role="banner"
        >
          <Link href="/explorer/landing" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
                aria-hidden="true"
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
              </div>
              <div
                className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-foreground group-hover:text-gold transition-colors">
                Quantum Shield
              </span>
              <span className="text-[10px] text-gold tracking-[2px] uppercase">
                Explorer
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <EcosystemLink variant="inline" />
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
              aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
            >
              <Globe className="w-4 h-4" />
              {locale === 'ja' ? 'EN' : 'JA'}
            </button>
            <Link href="/explorer/overview">
              <Button variant="primary" size="sm">
                {t('landing.hero.openExplorer')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main id="main-content" role="main">
          {/* Hero Section */}
          <section className="py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              {t('landing.hero.badge')}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {t('landing.hero.title')}
              <br />
              <span className="bg-gradient-to-r from-hinomaru to-gold bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight')}
              </span>
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10">
              {t('landing.hero.description')}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/explorer/overview">
                <Button variant="primary" size="lg">
                  {t('landing.hero.openExplorer')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/ecosystem">
                <Button variant="outline" size="lg">
                  {t('landing.hero.learnMore')}
                </Button>
              </Link>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card
                  key={stat.key}
                  className={cn(
                    'p-6 text-center',
                    stat.highlight && 'border-gold/50 bg-gold/5'
                  )}
                >
                  <stat.icon
                    className={cn(
                      'w-8 h-8 mx-auto mb-3',
                      stat.highlight ? 'text-gold' : 'text-foreground-secondary'
                    )}
                  />
                  <div className={cn(
                    'text-2xl md:text-3xl font-bold mb-1',
                    stat.highlight ? 'text-gold' : 'text-foreground'
                  )}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-foreground-secondary">
                    {t(`landing.stats.${stat.key}`)}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('landing.features.title')}</h2>
              <p className="text-foreground-secondary max-w-xl mx-auto">
                {t('landing.features.description')}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.key} className="p-6">
                  <div className="w-12 h-12 bg-hinomaru/10 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-hinomaru" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`landing.features.${feature.key}.title`)}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`landing.features.${feature.key}.description`)}
                  </p>
                </Card>
              ))}
            </div>
          </section>

          {/* What You Can Do Section */}
          <section className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">{t('landing.whatYouCanDo.title')}</h2>
              <p className="text-foreground-secondary max-w-xl mx-auto">
                {t('landing.whatYouCanDo.description')}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 hover:border-gold/50 transition-colors">
                <Lock className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('landing.whatYouCanDo.locks.title')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('landing.whatYouCanDo.locks.description')}
                </p>
                <Link
                  href="/explorer/locks"
                  className="text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('landing.whatYouCanDo.locks.link')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
              <Card className="p-6 hover:border-gold/50 transition-colors">
                <Unlock className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('landing.whatYouCanDo.unlocks.title')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('landing.whatYouCanDo.unlocks.description')}
                </p>
                <Link
                  href="/explorer/unlocks"
                  className="text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('landing.whatYouCanDo.unlocks.link')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
              <Card className="p-6 hover:border-gold/50 transition-colors">
                <BarChart3 className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('landing.whatYouCanDo.analytics.title')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('landing.whatYouCanDo.analytics.description')}
                </p>
                <Link
                  href="/explorer/analytics"
                  className="text-sm text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('landing.whatYouCanDo.analytics.link')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <Card className="p-12 text-center bg-gradient-to-br from-hinomaru/10 to-gold/10 border-hinomaru/30">
              <h2 className="text-3xl font-bold mb-4">{t('landing.cta.title')}</h2>
              <p className="text-foreground-secondary max-w-xl mx-auto mb-8">
                {t('landing.cta.description')}
              </p>
              <Link href="/explorer/overview">
                <Button variant="primary" size="lg">
                  {t('landing.cta.button')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          </section>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 text-sm text-foreground-tertiary">
              <span>{t('landing.footer.tagline')}</span>
              <span>|</span>
              <span>{t('landing.footer.madeIn')}</span>
            </div>
            <nav className="flex gap-6 text-sm">
              <Link
                href="/consumer/terms"
                className="text-foreground-tertiary hover:text-gold transition-colors"
              >
                {t('landing.footer.terms')}
              </Link>
              <Link
                href="/consumer/privacy"
                className="text-foreground-tertiary hover:text-gold transition-colors"
              >
                {t('landing.footer.privacy')}
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
