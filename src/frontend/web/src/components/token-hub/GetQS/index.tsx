'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Coins,
  ArrowRightLeft,
  Gift,
  Droplets,
  Shield,
  ExternalLink,
  Lock,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TokenHubHeader } from '../Dashboard/TokenHubHeader';
import { Link } from '@/i18n/navigation';

// Acquisition methods
const ACQUISITION_METHODS = [
  {
    id: 'dex',
    icon: ArrowRightLeft,
    color: 'gold',
    recommended: true,
  },
  {
    id: 'rewards',
    icon: Gift,
    color: 'success',
    recommended: false,
  },
  {
    id: 'airdrop',
    icon: Droplets,
    color: 'hinomaru',
    recommended: false,
  },
  {
    id: 'staking',
    icon: Shield,
    color: 'gold',
    recommended: false,
  },
] as const;

// DEX list for purchasing QS
const DEX_OPTIONS = [
  {
    name: 'Uniswap',
    url: 'https://app.uniswap.org',
    network: 'Ethereum',
    pairs: ['QS/ETH', 'QS/USDC'],
  },
  {
    name: 'SushiSwap',
    url: 'https://app.sushi.com',
    network: 'Ethereum',
    pairs: ['QS/ETH'],
  },
] as const;

export function TokenHubGetQS() {
  const t = useTranslations('token-hub.getQS');
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

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-4">
            <Coins className="w-4 h-4 text-gold" aria-hidden="true" />
            <span className="text-sm font-medium text-gold">{t('badge')}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-foreground-secondary max-w-2xl mx-auto">{t('description')}</p>
        </div>

        {/* Acquisition Methods Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {ACQUISITION_METHODS.map((method) => {
            const Icon = method.icon;
            const colorClass = method.color === 'gold' ? 'text-gold' : method.color === 'success' ? 'text-success' : 'text-hinomaru';
            const bgClass = method.color === 'gold' ? 'bg-gold/10' : method.color === 'success' ? 'bg-success/10' : 'bg-hinomaru/10';

            return (
              <Card
                key={method.id}
                padding="lg"
                className={cn(
                  'relative overflow-hidden',
                  method.recommended && 'border-gold'
                )}
              >
                {method.recommended && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gold text-background text-xs font-semibold rounded-bl-lg">
                    {t('recommended')}
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', bgClass)}>
                    <Icon className={cn('w-6 h-6', colorClass)} aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-2">{t(`methods.${method.id}.title`)}</h2>
                    <p className="text-sm text-foreground-secondary mb-3">
                      {t(`methods.${method.id}.description`)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {t(`methods.${method.id}.tags`).split(',').map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-background-secondary rounded-full text-foreground-tertiary"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* DEX Section */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-gold" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('dex.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('dex.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            {DEX_OPTIONS.map((dex) => (
              <a
                key={dex.name}
                href={dex.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center justify-between p-4 bg-background-secondary rounded-xl',
                  'hover:bg-background-secondary/80 transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-gold">{dex.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium">{dex.name}</div>
                    <div className="text-sm text-foreground-tertiary">{dex.network}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {dex.pairs.map((pair) => (
                      <span
                        key={pair}
                        className="px-2 py-0.5 text-xs bg-background rounded-full text-foreground-secondary"
                      >
                        {pair}
                      </span>
                    ))}
                  </div>
                  <ExternalLink className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>

          {/* How to Buy Steps */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="font-medium mb-4">{t('dex.howToBuy.title')}</h3>
            <ol className="space-y-3" role="list">
              {[1, 2, 3, 4].map((step) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 text-sm font-medium text-gold">
                    {step}
                  </span>
                  <span className="text-sm text-foreground-secondary">
                    {t(`dex.howToBuy.step${step}`)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </Card>

        {/* Token Contract Info */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{t('contract.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('contract.subtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 bg-background-secondary rounded-xl">
              <div>
                <div className="text-sm text-foreground-tertiary mb-1">{t('contract.network')}</div>
                <div className="font-medium">Ethereum Mainnet</div>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
                <code className="text-sm font-mono text-foreground-secondary break-all">
                  0x1234...5678
                </code>
              </div>
            </div>

            <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">{t('contract.warning.title')}</p>
                  <p className="text-sm text-foreground-secondary">{t('contract.warning.description')}</p>
                </div>
              </div>
            </div>
          </div>
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
              onClick={() => handleNavigate('/token-hub/onboarding')}
              className={cn(
                'px-8 py-3 rounded-xl font-semibold',
                'bg-background-secondary border border-border',
                'transition-all duration-200',
                'hover:border-gold hover:text-gold',
                'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'flex items-center justify-center gap-2'
              )}
              aria-label={t('cta.learnButton')}
            >
              {t('cta.learnButton')}
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
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

export default TokenHubGetQS;
