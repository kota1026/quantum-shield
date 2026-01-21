'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Lock,
  Clock,
  Vote,
  Gift,
  TrendingUp,
  ChevronRight,
  Calculator,
  Shield,
  Zap,
  Users,
  Atom,
  Wallet,
  FileText,
  Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

// Tokenomics timeline steps
const TIMELINE_STEPS = [
  { step: 1, icon: Coins, key: 'acquire' },
  { step: 2, icon: Lock, key: 'lock' },
  { step: 3, icon: Vote, key: 'vote' },
  { step: 4, icon: Gift, key: 'earn' },
];

// Lock duration examples
const LOCK_EXAMPLES = [
  { months: 6, multiplier: 0.125, veqs: 1250 },
  { months: 12, multiplier: 0.25, veqs: 2500 },
  { months: 24, multiplier: 0.5, veqs: 5000 },
  { months: 48, multiplier: 1.0, veqs: 10000 },
];

// Benefits
const BENEFITS = [
  { icon: Vote, key: 'governance' },
  { icon: Gift, key: 'rewards' },
  { icon: TrendingUp, key: 'boost' },
  { icon: Shield, key: 'security' },
];

export function TokenHubOnboarding() {
  const t = useTranslations('token-hub.onboarding');
  const tCommon = useTranslations('token-hub.common');
  const router = useRouter();

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect - Gold Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <TokenHubHeader />

        {/* Breadcrumb */}
        <nav className="mb-6" aria-label={t('breadcrumb.ariaLabel')}>
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/token-hub"
                className="text-foreground-tertiary hover:text-gold transition-colors"
              >
                {t('breadcrumb.dashboard')}
              </Link>
            </li>
            <li className="text-foreground-tertiary" aria-hidden="true">/</li>
            <li className="text-foreground" aria-current="page">
              {t('breadcrumb.current')}
            </li>
          </ol>
        </nav>

        {/* Hero Section */}
        <section className="text-center mb-12" aria-labelledby="hero-title">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
            <Coins className="w-4 h-4 text-gold" aria-hidden="true" />
            <span className="text-sm font-medium text-gold">{t('hero.badge')}</span>
          </div>
          <h1 id="hero-title" className="text-3xl sm:text-4xl font-bold mb-4">
            {t('hero.title')}
          </h1>
          <p className="text-foreground-secondary max-w-2xl mx-auto">
            {t('hero.description')}
          </p>
        </section>

        {/* What is Quantum Shield - Overview */}
        <Card padding="lg" className="mb-8 border-2 border-hinomaru/30">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-hinomaru/10 flex items-center justify-center flex-shrink-0">
              <Atom className="w-6 h-6 text-hinomaru" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('overview.title')}</h2>
              <p className="text-foreground-secondary">{t('overview.description')}</p>
            </div>
          </div>

          {/* Three Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-background-secondary rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-hinomaru/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{t('overview.pillars.protection.title')}</h3>
              </div>
              <p className="text-sm text-foreground-secondary">
                {t('overview.pillars.protection.description')}
              </p>
            </div>

            <div className="bg-background-secondary rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-gold" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{t('overview.pillars.wallet.title')}</h3>
              </div>
              <p className="text-sm text-foreground-secondary">
                {t('overview.pillars.wallet.description')}
              </p>
            </div>

            <div className="bg-background-secondary rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Vote className="w-5 h-5 text-success" aria-hidden="true" />
                </div>
                <h3 className="font-semibold">{t('overview.pillars.governance.title')}</h3>
              </div>
              <p className="text-sm text-foreground-secondary">
                {t('overview.pillars.governance.description')}
              </p>
            </div>
          </div>

          {/* Why Quantum Resistance */}
          <div className="bg-gradient-to-br from-hinomaru/5 to-gold/5 border border-hinomaru/20 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Atom className="w-5 h-5 text-hinomaru" aria-hidden="true" />
              {t('overview.whyQuantum.title')}
            </h3>
            <p className="text-sm text-foreground-secondary mb-4">
              {t('overview.whyQuantum.description')}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-hinomaru/10 text-hinomaru text-xs font-medium rounded-full">
                {t('overview.whyQuantum.tags.dilithium')}
              </span>
              <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full">
                {t('overview.whyQuantum.tags.stark')}
              </span>
              <span className="px-3 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                {t('overview.whyQuantum.tags.futureProof')}
              </span>
            </div>
          </div>
        </Card>

        {/* What does governance decide */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-success" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('governance.title')}</h2>
              <p className="text-foreground-secondary">{t('governance.description')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-background-secondary rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('governance.topics.fees.title')}</h3>
              <p className="text-sm text-foreground-tertiary">{t('governance.topics.fees.description')}</p>
            </div>
            <div className="bg-background-secondary rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('governance.topics.upgrades.title')}</h3>
              <p className="text-sm text-foreground-tertiary">{t('governance.topics.upgrades.description')}</p>
            </div>
            <div className="bg-background-secondary rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('governance.topics.treasury.title')}</h3>
              <p className="text-sm text-foreground-tertiary">{t('governance.topics.treasury.description')}</p>
            </div>
            <div className="bg-background-secondary rounded-lg p-4">
              <h3 className="font-medium mb-2">{t('governance.topics.parameters.title')}</h3>
              <p className="text-sm text-foreground-tertiary">{t('governance.topics.parameters.description')}</p>
            </div>
          </div>
        </Card>

        {/* What is QS Token */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
              <Coins className="w-6 h-6 text-gold" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('qs.title')}</h2>
              <p className="text-foreground-secondary">{t('qs.description')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-background-secondary rounded-lg p-4">
              <div className="text-sm text-foreground-tertiary mb-1">{t('qs.totalSupply')}</div>
              <div className="text-lg font-bold font-mono">1,000,000,000 QS</div>
            </div>
            <div className="bg-background-secondary rounded-lg p-4">
              <div className="text-sm text-foreground-tertiary mb-1">{t('qs.network')}</div>
              <div className="text-lg font-bold">Ethereum (L1)</div>
            </div>
            <div className="bg-background-secondary rounded-lg p-4">
              <div className="text-sm text-foreground-tertiary mb-1">{t('qs.type')}</div>
              <div className="text-lg font-bold">ERC-20</div>
            </div>
          </div>
        </Card>

        {/* What is veQS */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-hinomaru/10 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-hinomaru" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('veqs.title')}</h2>
              <p className="text-foreground-secondary">{t('veqs.description')}</p>
            </div>
          </div>

          {/* Formula Box */}
          <div className="bg-gradient-to-br from-background-secondary to-gold/5 border border-gold rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-gold" aria-hidden="true" />
              <span className="font-semibold">{t('veqs.formulaTitle')}</span>
            </div>
            <div className="text-2xl font-bold font-mono text-gold mb-4 text-center py-4 bg-background/50 rounded-lg">
              veQS = QS × (lock_period / 4{t('veqs.years')})
            </div>
            <p className="text-sm text-foreground-secondary">{t('veqs.formulaDescription')}</p>
          </div>

          {/* Lock Examples Table */}
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label={t('veqs.examplesAriaLabel')}>
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-tertiary">{t('veqs.lockPeriod')}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-foreground-tertiary">{t('veqs.multiplier')}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground-tertiary">{t('veqs.result')}</th>
                </tr>
              </thead>
              <tbody>
                {LOCK_EXAMPLES.map((example) => (
                  <tr key={example.months} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium">
                      {example.months < 12
                        ? `${example.months}${t('veqs.months')}`
                        : `${example.months / 12}${t('veqs.years')}`}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-gold">
                      ×{example.multiplier.toFixed(example.multiplier < 1 ? 3 : 1)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {example.veqs.toLocaleString()} veQS
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="text-xs text-foreground-tertiary">
                  <td colSpan={3} className="py-2 px-4">
                    * {t('veqs.tableNote')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* How It Works - Timeline */}
        <Card padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" aria-hidden="true" />
            {t('timeline.title')}
          </h2>
          <div
            className="grid grid-cols-1 sm:grid-cols-4 gap-6"
            role="list"
            aria-label={t('timeline.ariaLabel')}
          >
            {TIMELINE_STEPS.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="relative" role="listitem">
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div
                      className="hidden sm:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-gold to-gold/30"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-gold/10 border-2 border-gold flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-gold" aria-hidden="true" />
                    </div>
                    <div className="text-xs text-gold font-medium mb-1">
                      STEP {item.step}
                    </div>
                    <h3 className="text-sm font-semibold mb-1">
                      {t(`timeline.${item.key}.title`)}
                    </h3>
                    <p className="text-xs text-foreground-tertiary">
                      {t(`timeline.${item.key}.description`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Benefits */}
        <Card padding="lg" className="mb-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Gift className="w-5 h-5 text-success" aria-hidden="true" />
            {t('benefits.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.key}
                  className="flex items-start gap-4 p-4 bg-background-secondary rounded-xl"
                >
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-success" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{t(`benefits.${benefit.key}.title`)}</h3>
                    <p className="text-sm text-foreground-secondary">
                      {t(`benefits.${benefit.key}.description`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* veQS Decay Explanation */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-warning" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('decay.title')}</h2>
              <p className="text-foreground-secondary">{t('decay.description')}</p>
            </div>
          </div>

          {/* Visual Decay Indicator */}
          <div className="bg-background-secondary rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-foreground-secondary">{t('decay.start')}</span>
              <span className="text-sm text-foreground-secondary">{t('decay.end')}</span>
            </div>
            <div className="h-8 bg-background rounded-lg overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-gold via-gold/60 to-gold/10"
                style={{ width: '100%' }}
                role="img"
                aria-label={t('decay.visualAriaLabel')}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-mono text-foreground-secondary bg-background/80 px-2 py-0.5 rounded">
                  veQS → 0
                </span>
              </div>
            </div>
            <p className="text-xs text-foreground-tertiary mt-4 text-center">
              {t('decay.note')}
            </p>
          </div>
        </Card>

        {/* Become a Prover - New Section */}
        <Card padding="lg" className="mb-8 border-2 border-hinomaru/30">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-hinomaru/10 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-6 h-6 text-hinomaru" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('prover.title')}</h2>
              <p className="text-foreground-secondary">{t('prover.description')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-background-secondary rounded-xl p-4">
              <div className="text-sm text-foreground-tertiary mb-1">{t('prover.stake.label')}</div>
              <div className="text-lg font-bold font-mono text-gold">{t('prover.stake.value')}</div>
            </div>
            <div className="bg-background-secondary rounded-xl p-4">
              <div className="text-sm text-foreground-tertiary mb-1">{t('prover.reward.label')}</div>
              <div className="text-lg font-bold font-mono text-success">{t('prover.reward.value')}</div>
            </div>
            <div className="bg-background-secondary rounded-xl p-4">
              <div className="text-sm text-foreground-tertiary mb-1">{t('prover.status.label')}</div>
              <div className="text-lg font-bold">{t('prover.status.value')}</div>
            </div>
          </div>

          <Link
            href="/prover/landing"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold',
              'bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white',
              'transition-all duration-200',
              'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(188,0,45,0.4)]',
              'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background'
            )}
          >
            <Cpu className="w-5 h-5" aria-hidden="true" />
            {t('prover.button')}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Card>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-gold/10 to-hinomaru/10 border border-gold/30 rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-foreground-secondary mb-6 max-w-lg mx-auto">
            {t('cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleNavigate('/token-hub/lock')}
              className={cn(
                'px-8 py-3 rounded-xl font-semibold',
                'bg-gradient-to-r from-hinomaru to-hinomaru-400 text-white',
                'transition-all duration-200',
                'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(188,0,45,0.4)]',
                'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'flex items-center justify-center gap-2'
              )}
              aria-label={t('cta.lockButton')}
            >
              <Lock className="w-5 h-5" aria-hidden="true" />
              {t('cta.lockButton')}
            </button>
            <button
              onClick={() => handleNavigate('/token-hub/get-qs')}
              className={cn(
                'px-8 py-3 rounded-xl font-semibold',
                'bg-background-secondary border border-border',
                'transition-all duration-200',
                'hover:border-gold hover:text-gold',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'flex items-center justify-center gap-2'
              )}
              aria-label={t('cta.getQSButton')}
            >
              <Coins className="w-5 h-5" aria-hidden="true" />
              {t('cta.getQSButton')}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="text-center mb-12">
          <p className="text-foreground-secondary mb-4">{t('faqPreview.text')}</p>
          <Link
            href="/token-hub/faq"
            className="inline-flex items-center gap-2 text-gold hover:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            {t('faqPreview.link')}
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-border">
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4" aria-label={tCommon('footer.navLabel')}>
            <Link
              href="/consumer/terms"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.privacy')}
            </Link>
            <Link
              href="/consumer/help"
              className="text-xs text-foreground-tertiary hover:text-gold transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
            >
              {tCommon('footer.security')}
            </Link>
          </nav>
          <p className="text-xs text-foreground-tertiary text-center max-w-lg mx-auto leading-relaxed">
            {tCommon('footer.disclaimer')}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default TokenHubOnboarding;
