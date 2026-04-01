'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link';
import { Link as I18nLink, usePathname, useRouter } from '@/i18n/navigation';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Clock,
  Eye,
  Cpu,
  Users,
  Vote,
  Coins,
  Search,
  Building2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Zap,
  PieChart,
  TrendingUp,
  Percent,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { HinomaryLogo } from '@/components/shared/HinomaryLogo';
import { HinomaryVisual } from '@/components/shared/HinomaryVisual';

// アプリ定義
const apps = [
  {
    key: 'consumer',
    icon: Shield,
    href: '/consumer/landing',
    color: 'hinomaru',
    role: 'user',
  },
  {
    key: 'qsHub',
    icon: Coins,
    href: '/qs-hub/landing',
    color: 'gold',
    role: 'user',
  },
  {
    key: 'explorer',
    icon: Search,
    href: '/explorer/landing',
    color: 'gold',
    role: 'user',
  },
  {
    key: 'prover',
    icon: Cpu,
    href: '/prover/landing',
    color: 'hinomaru',
    role: 'operator',
  },
  {
    key: 'observer',
    icon: Eye,
    href: '/observer/landing',
    color: 'gold',
    role: 'operator',
  },
  {
    key: 'enterprise',
    icon: Building2,
    href: '/enterprise/login',
    color: 'gold',
    role: 'enterprise',
  },
];

// 登場人物
const players = [
  { key: 'user', icon: Users },
  { key: 'tokenHolder', icon: Coins },
  { key: 'prover', icon: Cpu },
  { key: 'observer', icon: Eye },
  { key: 'enterprise', icon: Building2 },
];

export function EcosystemLandingNew() {
  const t = useTranslations('ecosystemNew');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [cookieBannerVisible, setCookieBannerVisible] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  };

  const toggleFaq = (key: string) => {
    setExpandedFaq(expandedFaq === key ? null : key);
  };

  return (
    <div className="relative min-h-screen">
      {/* Beta Banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500/10 border-b border-amber-500/20 text-center py-1.5">
        <p className="text-xs text-amber-200/90">
          {t('beta.banner')}
        </p>
      </div>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(201,169,98,0.1),transparent_60%)] opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-[33px] left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/ecosystem"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            aria-label="Quantum Shield Home"
          >
            <HinomaryLogo size="sm" />
            <span className="text-lg font-semibold text-foreground">
              Quantum Shield
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-hinomaru/20 text-hinomaru rounded-full border border-hinomaru/30 uppercase tracking-wider">
              Beta
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Main navigation"
            role="navigation"
          >
            <Link
              href="#security"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.threat')}
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.howItWorks')}
            </Link>
            <Link
              href="#tokenomics"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.tokenomics')}
            </Link>
            <Link
              href="#apps"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('header.apps')}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
            >
              <Globe className="w-4 h-4" aria-hidden="true" />
              {locale === 'ja' ? 'EN' : 'JA'}
            </button>

            <Link href="#apps">
              <Button variant="primary" size="sm">
                {t('header.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10" role="main">
        {/* Hero Section */}
        <section className="pt-40 pb-24 text-center">
          <div className="container mx-auto px-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-hinomaru/10 border border-hinomaru rounded-full text-sm font-medium text-hinomaru-400 mb-6">
              <Shield className="w-4 h-4" aria-hidden="true" />
              {t('hero.badge')}
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              {t('hero.title')}
            </h1>

            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              {t('hero.subtitle')}
            </p>

            <div className="mt-16">
              <HinomaryVisual />
            </div>
          </div>
        </section>

        {/* Quantum Threat Section */}
        <section id="security" className="py-20 bg-surface-secondary/30">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('threat.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('threat.title')}
            </h2>
            <p className="text-foreground-secondary max-w-3xl mb-12">
              {t('threat.description')}
            </p>

            {/* Quantum Development Progress */}
            <div className="card bg-surface mb-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('threat.progress.title')}</h3>
                  <p className="text-foreground-secondary">{t('threat.progress.description')}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProgressCard
                  company={t('threat.progress.items.0.company')}
                  achievement={t('threat.progress.items.0.achievement')}
                  year={t('threat.progress.items.0.year')}
                  source={t('threat.progress.items.0.source')}
                  sourceUrl="https://newsroom.ibm.com/2023-12-04-IBM-Debuts-Next-Generation-Quantum-Processor-IBM-Quantum-System-Two"
                />
                <ProgressCard
                  company={t('threat.progress.items.1.company')}
                  achievement={t('threat.progress.items.1.achievement')}
                  year={t('threat.progress.items.1.year')}
                  source={t('threat.progress.items.1.source')}
                  sourceUrl="https://blog.google/technology/research/google-willow-quantum-chip/"
                />
                <ProgressCard
                  company={t('threat.progress.items.2.company')}
                  achievement={t('threat.progress.items.2.achievement')}
                  year={t('threat.progress.items.2.year')}
                  source={t('threat.progress.items.2.source')}
                  sourceUrl="https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.132.030601"
                />
                <ProgressCard
                  company={t('threat.progress.items.3.company')}
                  achievement={t('threat.progress.items.3.achievement')}
                  year={t('threat.progress.items.3.year')}
                  source={t('threat.progress.items.3.source')}
                  sourceUrl="https://www.microsoft.com/en-us/research/blog/microsofts-majorana-1-chip-carves-new-path-for-quantum-computing/"
                />
              </div>
            </div>

            {/* HARVEST NOW Attack Explanation */}
            <div className="card bg-surface mb-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{t('threat.harvestNow.title')}</h3>
                  <p className="text-foreground-secondary">{t('threat.harvestNow.description')}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="text-sm font-medium mb-1">{t('threat.harvestNow.step1.label')}</div>
                  <div className="text-foreground-secondary text-sm">{t('threat.harvestNow.step1.text')}</div>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="text-sm font-medium mb-1">{t('threat.harvestNow.step2.label')}</div>
                  <div className="text-foreground-secondary text-sm">{t('threat.harvestNow.step2.text')}</div>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="text-sm font-medium mb-1">{t('threat.harvestNow.step3.label')}</div>
                  <div className="text-foreground-secondary text-sm">{t('threat.harvestNow.step3.text')}</div>
                </div>
              </div>
            </div>

            {/* Expert Quotes with Real Sources */}
            <h3 className="text-xl font-semibold mb-6">{t('threat.experts.title')}</h3>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <ExpertQuoteCard
                quote={t('threat.experts.quotes.0.quote')}
                author={t('threat.experts.quotes.0.author')}
                title={t('threat.experts.quotes.0.title')}
                source={t('threat.experts.quotes.0.source')}
                sourceUrl="https://globalriskinstitute.org/publication/2023-quantum-threat-timeline-report/"
              />
              <ExpertQuoteCard
                quote={t('threat.experts.quotes.1.quote')}
                author={t('threat.experts.quotes.1.author')}
                title={t('threat.experts.quotes.1.title')}
                source={t('threat.experts.quotes.1.source')}
                sourceUrl="https://csrc.nist.gov/projects/post-quantum-cryptography"
              />
            </div>

            {/* Probability Timeline */}
            <div className="card bg-surface">
              <h3 className="text-lg font-semibold mb-4">
                {t('threat.probability.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ProbabilityCard
                  year={t('threat.probability.timeline.0.year')}
                  probability={t('threat.probability.timeline.0.probability')}
                  description={t('threat.probability.timeline.0.description')}
                  variant="low"
                />
                <ProbabilityCard
                  year={t('threat.probability.timeline.1.year')}
                  probability={t('threat.probability.timeline.1.probability')}
                  description={t('threat.probability.timeline.1.description')}
                  variant="medium"
                />
                <ProbabilityCard
                  year={t('threat.probability.timeline.2.year')}
                  probability={t('threat.probability.timeline.2.probability')}
                  description={t('threat.probability.timeline.2.description')}
                  variant="high"
                />
              </div>
              <p className="text-xs text-foreground-tertiary mt-4">
                {t('threat.probability.source')}
                <a
                  href="https://globalriskinstitute.org/publication/2023-quantum-threat-timeline-report/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline ml-1 inline-flex items-center gap-1"
                >
                  Global Risk Institute
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* QS Solution Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('solution.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('solution.title')}
            </h2>
            <p className="text-foreground-secondary max-w-3xl mb-12">
              {t('solution.description')}
            </p>

            {/* NIST Certification Badge */}
            <div className="card bg-gradient-to-br from-gold/10 to-transparent border-gold/30 mb-12">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-10 h-10 text-gold" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gold uppercase tracking-wider mb-1">
                    {t('solution.nist.badge')}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t('solution.nist.title')}</h3>
                  <p className="text-foreground-secondary text-sm">{t('solution.nist.description')}</p>
                  <a
                    href="https://csrc.nist.gov/pubs/fips/204/final"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gold hover:underline mt-2 inline-flex items-center gap-1"
                  >
                    NIST FIPS 204 (ML-DSA / Dilithium)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Key Protection Features */}
            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Key className="w-6 h-6" />}
                title={t('solution.features.dilithium.title')}
                description={t('solution.features.dilithium.description')}
              />
              <FeatureCard
                icon={<Clock className="w-6 h-6" />}
                title={t('solution.features.timelock.title')}
                description={t('solution.features.timelock.description')}
              />
              <FeatureCard
                icon={<Eye className="w-6 h-6" />}
                title={t('solution.features.monitoring.title')}
                description={t('solution.features.monitoring.description')}
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-surface-secondary/30">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('howItWorks.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('howItWorks.title')}
            </h2>
            <p className="text-foreground-secondary max-w-3xl mb-12">
              {t('howItWorks.description')}
            </p>

            {/* Animated Steps - Sequential Flow */}
            <div className="relative mb-12">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                {/* Step 1 */}
                <div className="flex-1 max-w-sm animate-[fadeInUp_0.6s_ease-out_0s_both]">
                  <SequentialStepCard
                    number={1}
                    icon={<Key className="w-8 h-8" />}
                    title={t('howItWorks.steps.0.title')}
                    subtitle={t('howItWorks.steps.0.subtitle')}
                    description={t('howItWorks.steps.0.description')}
                    color="hinomaru"
                  />
                </div>

                {/* Arrow 1→2 */}
                <div className="hidden md:flex items-center justify-center w-16 animate-[fadeIn_0.3s_ease-out_0.4s_both]">
                  <div className="relative">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-hinomaru to-gold animate-[flowRight_1.5s_ease-in-out_infinite]" />
                    <ArrowRight className="absolute -right-2 -top-2 w-5 h-5 text-gold" />
                  </div>
                </div>
                <div className="md:hidden flex items-center justify-center h-8 animate-[fadeIn_0.3s_ease-out_0.4s_both]">
                  <ChevronDown className="w-6 h-6 text-gold animate-bounce" />
                </div>

                {/* Step 2 */}
                <div className="flex-1 max-w-sm animate-[fadeInUp_0.6s_ease-out_0.5s_both]">
                  <SequentialStepCard
                    number={2}
                    icon={<Lock className="w-8 h-8" />}
                    title={t('howItWorks.steps.1.title')}
                    subtitle={t('howItWorks.steps.1.subtitle')}
                    description={t('howItWorks.steps.1.description')}
                    color="gold"
                  />
                </div>

                {/* Arrow 2→3 */}
                <div className="hidden md:flex items-center justify-center w-16 animate-[fadeIn_0.3s_ease-out_0.9s_both]">
                  <div className="relative">
                    <div className="w-12 h-0.5 bg-gradient-to-r from-gold to-success animate-[flowRight_1.5s_ease-in-out_infinite_0.5s]" />
                    <ArrowRight className="absolute -right-2 -top-2 w-5 h-5 text-success" />
                  </div>
                </div>
                <div className="md:hidden flex items-center justify-center h-8 animate-[fadeIn_0.3s_ease-out_0.9s_both]">
                  <ChevronDown className="w-6 h-6 text-success animate-bounce" />
                </div>

                {/* Step 3 */}
                <div className="flex-1 max-w-sm animate-[fadeInUp_0.6s_ease-out_1s_both]">
                  <SequentialStepCard
                    number={3}
                    icon={<Unlock className="w-8 h-8" />}
                    title={t('howItWorks.steps.2.title')}
                    subtitle={t('howItWorks.steps.2.subtitle')}
                    description={t('howItWorks.steps.2.description')}
                    color="success"
                  />
                </div>
              </div>

              {/* Flow Animation Keyframes */}
              <style jsx>{`
                @keyframes fadeInUp {
                  from { opacity: 0; transform: translateY(20px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes flowRight {
                  0%, 100% { opacity: 0.3; transform: scaleX(0.5); transform-origin: left; }
                  50% { opacity: 1; transform: scaleX(1); }
                }
              `}</style>
            </div>

            {/* Players in the System */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-2">{t('howItWorks.players.title')}</h3>
              <p className="text-foreground-secondary mb-6">{t('howItWorks.players.description')}</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              {players.map((player) => (
                <div key={player.key} className="card bg-surface hover:border-gold/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <player.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{t(`howItWorks.players.${player.key}.title`)}</h4>
                      <span className="text-xs text-gold">{t(`howItWorks.players.${player.key}.role`)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-secondary mb-3">{t(`howItWorks.players.${player.key}.description`)}</p>
                  <div className="pt-2 border-t border-border">
                    <span className="text-xs text-foreground-tertiary">{t('howItWorks.players.incentiveLabel')}:</span>
                    <p className="text-xs text-gold font-medium">{t(`howItWorks.players.${player.key}.incentive`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/ecosystem/technical">
                <Button variant="outline" size="lg">
                  {t('howItWorks.detailLink')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Tokenomics Section */}
        <section id="tokenomics" className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('tokenomics.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('tokenomics.title')}
            </h2>
            <p className="text-foreground-secondary max-w-3xl mb-12">
              {t('tokenomics.description')}
            </p>

            {/* Why Tokens - Incentive Design */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-6">{t('tokenomics.why.title')}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="card bg-surface hover:border-gold/30 transition-all">
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-3">
                      {i === 0 && <Cpu className="w-5 h-5 text-gold" />}
                      {i === 1 && <Eye className="w-5 h-5 text-gold" />}
                      {i === 2 && <Vote className="w-5 h-5 text-gold" />}
                      {i === 3 && <Shield className="w-5 h-5 text-gold" />}
                    </div>
                    <h4 className="font-semibold mb-2">{t(`tokenomics.why.items.${i}.title`)}</h4>
                    <p className="text-sm text-foreground-secondary">{t(`tokenomics.why.items.${i}.description`)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Token Info & Distribution with Pie Chart */}
              <div className="card bg-surface">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center">
                    <Coins className="w-8 h-8 text-gold" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{t('tokenomics.token.name')}</div>
                    <div className="text-foreground-secondary">{t('tokenomics.token.symbol')} • {t('tokenomics.token.network')}</div>
                  </div>
                </div>
                <div className="text-sm text-foreground-secondary mb-6">
                  Total Supply: <span className="text-foreground font-semibold">{t('tokenomics.token.totalSupply')}</span>
                </div>

                <h4 className="text-lg font-semibold mb-4">{t('tokenomics.distribution.title')}</h4>

                {/* Pie Chart */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <TokenPieChart />
                  <div className="space-y-2 flex-1">
                    {[
                      { color: 'bg-hinomaru', label: t('tokenomics.distribution.items.0.category'), pct: '40%' },
                      { color: 'bg-gold', label: t('tokenomics.distribution.items.1.category'), pct: '20%' },
                      { color: 'bg-success', label: t('tokenomics.distribution.items.2.category'), pct: '20%' },
                      { color: 'bg-info', label: t('tokenomics.distribution.items.3.category'), pct: '15%' },
                      { color: 'bg-warning', label: t('tokenomics.distribution.items.4.category'), pct: '5%' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={cn('w-3 h-3 rounded-sm', item.color)} />
                        <span className="flex-1 text-foreground-secondary">{item.label}</span>
                        <span className="font-semibold">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Token Utility */}
              <div className="card bg-surface">
                <h4 className="text-lg font-semibold mb-6">{t('tokenomics.utility.title')}</h4>
                <div className="grid gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-background rounded-lg border border-border">
                      <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {i === 0 && <Vote className="w-5 h-5 text-gold" />}
                        {i === 1 && <TrendingUp className="w-5 h-5 text-gold" />}
                        {i === 2 && <Percent className="w-5 h-5 text-gold" />}
                        {i === 3 && <Cpu className="w-5 h-5 text-gold" />}
                      </div>
                      <div>
                        <div className="font-semibold mb-1">{t(`tokenomics.utility.items.${i}.title`)}</div>
                        <div className="text-sm text-foreground-secondary">{t(`tokenomics.utility.items.${i}.description`)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Apps Section */}
        <section id="apps" className="py-20 bg-surface-secondary/30">
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
              <span className="w-6 h-px bg-gold" aria-hidden="true" />
              {t('apps.sectionLabel')}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('apps.title')}
            </h2>
            <p className="text-foreground-secondary max-w-3xl mb-12">
              {t('apps.description')}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apps.map((app) => (
                <AppCard
                  key={app.key}
                  icon={<app.icon className="w-6 h-6" />}
                  title={t(`apps.list.${app.key}.title`)}
                  tagline={t(`apps.list.${app.key}.tagline`)}
                  description={t(`apps.list.${app.key}.description`)}
                  href={app.href}
                  color={app.color}
                  learnMore={t('apps.learnMore')}
                />
              ))}
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
      <footer className="border-t border-border py-16" role="contentinfo">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <HinomaryLogo size="sm" />
                <span className="text-lg font-semibold">Quantum Shield</span>
              </div>
              <p className="text-sm text-foreground-secondary">
                {t('footer.brand.description')}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
                {t('footer.products.title')}
              </h3>
              <ul className="space-y-3">
                {apps.map((app) => (
                  <li key={app.key}>
                    <Link
                      href={app.href}
                      className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                    >
                      {t(`apps.list.${app.key}.title`)}
                    </Link>
                  </li>
                ))}
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
              {t('footer.copyright')}
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
          className="fixed bottom-6 left-6 right-6 max-w-md bg-surface border border-border rounded-xl p-5 flex items-center gap-5 z-50"
          role="alertdialog"
          aria-modal="false"
        >
          <p className="flex-1 text-sm text-foreground-secondary">
            {t('cookie.message')}{' '}
            <a href="/cookie-policy.html" className="text-gold hover:underline">
              {t('cookie.details')}
            </a>
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCookieBannerVisible(false)}
          >
            {t('cookie.accept')}
          </Button>
          <button
            onClick={() => setCookieBannerVisible(false)}
            className="text-foreground-tertiary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-components

interface ExpertQuoteCardProps {
  quote: string;
  author: string;
  title: string;
  source: string;
  sourceUrl: string;
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
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold mt-1 inline-flex items-center gap-1 hover:underline"
        >
          {source}
          <ExternalLink className="w-3 h-3" />
        </a>
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
  const styles = {
    low: { border: 'border-success/30', bg: 'bg-success/5', text: 'text-success' },
    medium: { border: 'border-warning/30', bg: 'bg-warning/5', text: 'text-warning' },
    high: { border: 'border-hinomaru/30', bg: 'bg-hinomaru/5', text: 'text-hinomaru-400' },
  };
  const s = styles[variant];

  return (
    <div className={cn('p-4 rounded-lg border', s.border, s.bg)}>
      <div className="text-sm font-medium mb-1">{year}</div>
      <div className={cn('text-2xl font-bold mb-1', s.text)}>{probability}</div>
      <div className="text-xs text-foreground-secondary">{description}</div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="card hover:border-gold/30 transition-all">
      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4 text-gold">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-foreground-secondary">{description}</p>
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
  const colors = {
    1: { bg: 'bg-hinomaru', icon: 'text-hinomaru' },
    2: { bg: 'bg-gold', icon: 'text-gold' },
    3: { bg: 'bg-success', icon: 'text-success' },
  };
  const c = colors[number as keyof typeof colors] || colors[1];

  return (
    <div className="card relative pt-10">
      <div className={cn('absolute -top-5 left-6 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold', c.bg)}>
        {number}
      </div>
      <div className={cn('mb-4', c.icon)}>{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-foreground-secondary">{description}</p>
    </div>
  );
}

interface AnimatedStepCardProps extends StepCardProps {
  delay: number;
  subtitle?: string;
}

function AnimatedStepCard({ number, icon, title, subtitle, description, delay }: AnimatedStepCardProps) {
  const colors = {
    1: { bg: 'bg-hinomaru', icon: 'text-hinomaru', glow: 'shadow-[0_0_30px_rgba(188,0,45,0.3)]' },
    2: { bg: 'bg-gold', icon: 'text-gold', glow: 'shadow-[0_0_30px_rgba(201,169,98,0.3)]' },
    3: { bg: 'bg-success', icon: 'text-success', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]' },
  };
  const c = colors[number as keyof typeof colors] || colors[1];

  return (
    <div
      className="card relative pt-10 hover:-translate-y-2 transition-all duration-500 group"
      style={{
        animation: `fadeInUp 0.6s ease-out ${delay * 0.2}s both`,
      }}
    >
      {/* Animated Number Badge */}
      <div
        className={cn(
          'absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-300',
          c.bg,
          'group-hover:scale-110',
          c.glow
        )}
      >
        {number}
      </div>

      {/* Icon with pulse animation */}
      <div className="flex justify-center mb-4">
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
            'bg-surface border-2 border-border group-hover:border-gold/50',
            c.icon
          )}
        >
          <div className="animate-pulse">{icon}</div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-1 text-center">{title}</h3>
      {subtitle && (
        <p className={cn('text-xs font-medium mb-3 text-center', c.icon)}>{subtitle}</p>
      )}
      <p className="text-sm text-foreground-secondary text-center leading-relaxed">{description}</p>

      {/* CSS for fadeInUp animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

interface SequentialStepCardProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: 'hinomaru' | 'gold' | 'success';
}

function SequentialStepCard({ number, icon, title, subtitle, description, color }: SequentialStepCardProps) {
  const colorStyles = {
    hinomaru: {
      badge: 'bg-hinomaru',
      icon: 'text-hinomaru',
      border: 'border-hinomaru/30 hover:border-hinomaru/50',
      glow: 'shadow-[0_0_20px_rgba(188,0,45,0.2)]',
    },
    gold: {
      badge: 'bg-gold',
      icon: 'text-gold',
      border: 'border-gold/30 hover:border-gold/50',
      glow: 'shadow-[0_0_20px_rgba(201,169,98,0.2)]',
    },
    success: {
      badge: 'bg-success',
      icon: 'text-success',
      border: 'border-success/30 hover:border-success/50',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
    },
  };
  const c = colorStyles[color];

  return (
    <div className={cn('card relative pt-8 transition-all duration-300', c.border, c.glow)}>
      {/* Number Badge */}
      <div
        className={cn(
          'absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
          c.badge
        )}
      >
        {number}
      </div>

      {/* Icon */}
      <div className="flex justify-center mb-3">
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center bg-surface border border-border', c.icon)}>
          {icon}
        </div>
      </div>

      <h3 className="text-base font-semibold mb-1 text-center">{title}</h3>
      <p className={cn('text-xs font-medium mb-2 text-center', c.icon)}>{subtitle}</p>
      <p className="text-xs text-foreground-secondary text-center leading-relaxed">{description}</p>
    </div>
  );
}

interface AppCardProps {
  icon: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
  href: string;
  color: string;
  learnMore: string;
}

function AppCard({ icon, title, tagline, description, href, color, learnMore }: AppCardProps) {
  const colorStyles = color === 'hinomaru'
    ? 'bg-hinomaru/10 text-hinomaru'
    : 'bg-gold/10 text-gold';

  return (
    <Link href={href} className="group">
      <article className="card h-full hover:border-gold/30 hover:-translate-y-1 transition-all duration-300">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', colorStyles)}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold mb-1 group-hover:text-gold transition-colors">{title}</h3>
        <p className="text-sm text-gold mb-2">{tagline}</p>
        <p className="text-sm text-foreground-secondary">{description}</p>
        <div className="mt-4 text-sm text-gold flex items-center gap-1 group-hover:gap-2 transition-all">
          {learnMore}
          <ArrowRight className="w-4 h-4" />
        </div>
      </article>
    </Link>
  );
}

interface ProgressCardProps {
  company: string;
  achievement: string;
  year: string;
  source: string;
  sourceUrl: string;
}

function ProgressCard({ company, achievement, year, source, sourceUrl }: ProgressCardProps) {
  return (
    <div className="p-4 bg-background rounded-lg border border-border hover:border-gold/30 transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">{company}</span>
        <span className="text-xs text-gold bg-gold/10 px-2 py-1 rounded">{year}</span>
      </div>
      <p className="text-sm text-foreground-secondary mb-2">{achievement}</p>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gold hover:underline inline-flex items-center gap-1"
      >
        {source}
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

interface TokenDistributionBarProps {
  category: string;
  percentage: string;
  description: string;
  index: number;
}

function TokenDistributionBar({ category, percentage, description, index }: TokenDistributionBarProps) {
  const colors = [
    'bg-hinomaru',
    'bg-gold',
    'bg-success',
    'bg-info',
    'bg-warning',
  ];
  const widths = ['w-[40%]', 'w-[20%]', 'w-[20%]', 'w-[15%]', 'w-[5%]'];

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium">{category}</span>
        <span className="text-gold font-semibold">{percentage}</span>
      </div>
      <div className="h-2 bg-background rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[index], widths[index])}
          style={{ animationDelay: `${index * 100}ms` }}
        />
      </div>
      <p className="text-xs text-foreground-tertiary mt-1">{description}</p>
    </div>
  );
}

function TokenPieChart() {
  // CSS conic-gradient pie chart using design system colors
  // 40% Community (hinomaru #BC002D), 20% Team (gold #C9A962), 20% Ecosystem (success #00C896),
  // 15% Treasury (info #3B82F6), 5% Liquidity (warning #F0A030)
  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(
            #BC002D 0deg 144deg,
            #C9A962 144deg 216deg,
            #00C896 216deg 288deg,
            #3B82F6 288deg 342deg,
            #F0A030 342deg 360deg
          )`,
        }}
      />
      {/* Center hole for donut effect */}
      <div className="absolute inset-4 bg-surface rounded-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold">1B</div>
          <div className="text-xs text-foreground-tertiary">QS</div>
        </div>
      </div>
    </div>
  );
}

export default EcosystemLandingNew;
