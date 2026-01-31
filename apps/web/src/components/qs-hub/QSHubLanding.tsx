'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Lock,
  Vote,
  Coins,
  ChevronRight,
  Shield,
  Users,
  Award,
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Demo stats
const DEMO_STATS = {
  totalLocked: '24.5M',
  veQSHolders: '12,847',
  activeProposals: 3,
  totalRewardsDistributed: '1.2M',
};

export function QSHubLanding() {
  const t = useTranslations('qs-hub.landing');

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[1000px] h-[600px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.15),transparent_60%)]',
            'opacity-60'
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center py-5 px-8 max-w-7xl mx-auto">
        <Link href="/qs-hub/landing" className="flex items-center gap-3">
          <div className="w-11 h-11 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-lg font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1.5px]">QS HUB</div>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="#features" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
            {t('nav.features')}
          </Link>
          <Link href="#how-it-works" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
            {t('nav.howItWorks')}
          </Link>
          <Link href="/qs-hub/login">
            <Button variant="outline" size="sm">
              {t('nav.login')}
            </Button>
          </Link>
          <Link href="/qs-hub/dashboard">
            <Button variant="primary" size="sm">
              {t('nav.launchApp')}
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-24 text-center" aria-labelledby="hero-title">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
          <Coins className="w-4 h-4 text-gold" />
          <span className="text-sm text-gold font-medium">{t('hero.badge')}</span>
        </div>
        <h1 id="hero-title" className="text-5xl md:text-6xl font-bold mb-6">
          {t('hero.title')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-hinomaru to-gold">
            {t('hero.titleHighlight')}
          </span>
        </h1>
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto mb-10">
          {t('hero.description')}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/qs-hub/stake/lock">
            <Button variant="primary" size="lg" className="px-8">
              <Lock className="w-5 h-5 mr-2" />
              {t('hero.lockButton')}
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="px-8">
              {t('hero.learnMore')}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-20" aria-label={t('stats.sectionAriaLabel')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: t('stats.totalLocked'), value: DEMO_STATS.totalLocked, unit: 'QS', icon: Lock },
            { label: t('stats.veQSHolders'), value: DEMO_STATS.veQSHolders, icon: Users },
            { label: t('stats.activeProposals'), value: DEMO_STATS.activeProposals, icon: Vote },
            { label: t('stats.rewardsDistributed'), value: DEMO_STATS.totalRewardsDistributed, unit: 'QS', icon: Award },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-card border border-border/50 rounded-xl p-6 text-center hover:border-gold/50 transition-colors"
            >
              <stat.icon className="w-6 h-6 text-gold mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">
                {stat.value}
                {stat.unit && <span className="text-lg text-foreground-secondary ml-1">{stat.unit}</span>}
              </div>
              <div className="text-sm text-foreground-tertiary">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 py-20" aria-labelledby="features-title">
        <h2 id="features-title" className="text-3xl font-bold text-center mb-4">{t('features.title')}</h2>
        <p className="text-foreground-secondary text-center max-w-2xl mx-auto mb-12">
          {t('features.subtitle')}
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Lock,
              title: t('features.stake.title'),
              description: t('features.stake.description'),
              link: '/qs-hub/stake/lock',
              color: 'hinomaru',
            },
            {
              icon: Vote,
              title: t('features.vote.title'),
              description: t('features.vote.description'),
              link: '/qs-hub/vote/proposals',
              color: 'gold',
            },
            {
              icon: Award,
              title: t('features.rewards.title'),
              description: t('features.rewards.description'),
              link: '/qs-hub/rewards',
              color: 'success',
            },
          ].map((feature, index) => (
            <Link
              key={index}
              href={feature.link}
              className="group bg-card border border-border/50 rounded-xl p-8 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 transition-all"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-6',
                  feature.color === 'hinomaru' && 'bg-hinomaru/10',
                  feature.color === 'gold' && 'bg-gold/10',
                  feature.color === 'success' && 'bg-success/10'
                )}
              >
                <feature.icon
                  className={cn(
                    'w-6 h-6',
                    feature.color === 'hinomaru' && 'text-hinomaru',
                    feature.color === 'gold' && 'text-gold',
                    feature.color === 'success' && 'text-success'
                  )}
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-foreground-secondary mb-4">{feature.description}</p>
              <div className="flex items-center text-gold text-sm font-medium group-hover:gap-2 transition-all">
                {t('features.learnMore')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-8 py-20" aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title" className="text-3xl font-bold text-center mb-4">{t('howItWorks.title')}</h2>
        <p className="text-foreground-secondary text-center max-w-2xl mx-auto mb-12">
          {t('howItWorks.subtitle')}
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: 1, icon: Coins, title: t('howItWorks.step1.title'), description: t('howItWorks.step1.description') },
            { step: 2, icon: Lock, title: t('howItWorks.step2.title'), description: t('howItWorks.step2.description') },
            { step: 3, icon: Vote, title: t('howItWorks.step3.title'), description: t('howItWorks.step3.description') },
            { step: 4, icon: Award, title: t('howItWorks.step4.title'), description: t('howItWorks.step4.description') },
          ].map((item, index) => (
            <div key={index} className="relative">
              {index < 3 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gold/50 to-transparent" />
              )}
              <div className="bg-card border border-border/50 rounded-xl p-6 text-center relative">
                <div className="w-16 h-16 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-hinomaru rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-foreground-secondary">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-20" aria-labelledby="cta-title">
        <div className="bg-gradient-to-r from-hinomaru/10 to-gold/10 border border-gold/30 rounded-2xl p-12 text-center">
          <h2 id="cta-title" className="text-3xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-foreground-secondary max-w-xl mx-auto mb-8">
            {t('cta.description')}
          </p>
          <Link href="/qs-hub/dashboard">
            <Button variant="gold" size="lg" className="px-10">
              {t('cta.button')}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Security Notice - Anti-Phishing */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 py-8" aria-labelledby="security-notice">
        <div className="bg-background-secondary border border-border/50 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 id="security-notice" className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-hinomaru" />
                {t('security.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-3">
                {t('security.description')}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-foreground-secondary">{t('security.officialUrl')}:</span>
                  <code className="px-2 py-0.5 bg-background rounded text-gold font-mono text-xs">
                    https://app.quantumshield.io
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span className="text-foreground-secondary">{t('security.contractVerified')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm text-foreground-tertiary">
          {t('footer.copyright')}
        </div>
      </footer>
    </div>
  );
}
