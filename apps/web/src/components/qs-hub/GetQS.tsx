'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Coins,
  Users,
  Gift,
  Shield,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ExchangeItem {
  id: string;
  name: string;
  type: 'cex' | 'dex';
  url: string;
}

interface AirdropMethod {
  id: string;
  icon: React.ReactNode;
}

const EXCHANGES: ExchangeItem[] = [
  { id: 'uniswap', name: 'Uniswap', type: 'dex', url: 'https://app.uniswap.org' },
  { id: 'curve', name: 'Curve', type: 'dex', url: 'https://curve.fi' },
  { id: 'balancer', name: 'Balancer', type: 'dex', url: 'https://balancer.fi' },
];

const AIRDROP_METHODS: AirdropMethod[] = [
  { id: 'staking', icon: <Coins className="w-5 h-5" /> },
  { id: 'governance', icon: <Users className="w-5 h-5" /> },
  { id: 'referral', icon: <Gift className="w-5 h-5" /> },
];

export function QSHubGetQS() {
  const t = useTranslations('qs-hub.getQS');

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
      <div className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/qs-hub/dashboard"
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('header.title')}
            </h1>
            <p className="text-sm text-foreground-secondary mt-1">
              {t('header.subtitle')}
            </p>
          </div>
        </header>

        {/* Token Info Card */}
        <section
          className={cn(
            'mb-8 p-6 rounded-qs-xl',
            'bg-gradient-to-r from-hinomaru/10 to-gold/10',
            'border border-hinomaru/30'
          )}
          aria-labelledby="token-info-heading"
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 bg-hinomaru/20 rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              <Coins className="w-8 h-8 text-hinomaru" />
            </div>
            <div>
              <h2 id="token-info-heading" className="text-xl font-bold text-foreground">
                {t('tokenInfo.name')}
              </h2>
              <p className="text-sm text-foreground-secondary">
                {t('tokenInfo.symbol')}
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground-secondary">
            {t('tokenInfo.description')}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold" aria-hidden="true" />
            <span className="text-xs text-gold font-medium">
              {t('tokenInfo.verified')}
            </span>
          </div>
        </section>

        {/* Buy from Exchanges */}
        <section className="mb-8" aria-labelledby="exchanges-heading">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-4 h-px bg-gold" aria-hidden="true" />
            <h2
              id="exchanges-heading"
              className="text-xs font-semibold tracking-wider uppercase text-gold"
            >
              {t('exchanges.title')}
            </h2>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            {t('exchanges.description')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXCHANGES.map((exchange) => (
              <a
                key={exchange.id}
                href={exchange.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center justify-between p-4 min-h-[44px]',
                  'bg-surface border border-border rounded-qs-lg',
                  'hover:border-gold hover:bg-surface-elevated',
                  'transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-hinomaru/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <Coins className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{exchange.name}</span>
                    <span
                      className={cn(
                        'ml-2 text-xs px-2 py-0.5 rounded-full',
                        exchange.type === 'dex'
                          ? 'bg-success/10 text-success'
                          : 'bg-gold/10 text-gold'
                      )}
                    >
                      {t(`exchanges.types.${exchange.type}`)}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>

        {/* Earn through Activities */}
        <section className="mb-8" aria-labelledby="earn-heading">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-4 h-px bg-gold" aria-hidden="true" />
            <h2
              id="earn-heading"
              className="text-xs font-semibold tracking-wider uppercase text-gold"
            >
              {t('earn.title')}
            </h2>
          </div>
          <p className="text-sm text-foreground-secondary mb-4">
            {t('earn.description')}
          </p>
          <div className="space-y-3">
            {AIRDROP_METHODS.map((method) => (
              <div
                key={method.id}
                className={cn(
                  'flex items-center gap-4 p-4',
                  'bg-surface border border-border rounded-qs-lg'
                )}
              >
                <div
                  className="w-10 h-10 bg-hinomaru/10 rounded-full flex items-center justify-center text-hinomaru"
                  aria-hidden="true"
                >
                  {method.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">
                    {t(`earn.methods.${method.id}.title`)}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`earn.methods.${method.id}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Security Warning */}
        <section
          className={cn(
            'mb-8 p-4 rounded-qs-lg',
            'bg-warning/10 border border-warning/30'
          )}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning mb-1">
                {t('security.title')}
              </h3>
              <p className="text-sm text-foreground-secondary">
                {t('security.description')}
              </p>
              <ul className="mt-2 space-y-1">
                <li className="text-sm text-foreground-secondary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-warning rounded-full" aria-hidden="true" />
                  {t('security.tips.1')}
                </li>
                <li className="text-sm text-foreground-secondary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-warning rounded-full" aria-hidden="true" />
                  {t('security.tips.2')}
                </li>
                <li className="text-sm text-foreground-secondary flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-warning rounded-full" aria-hidden="true" />
                  {t('security.tips.3')}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Button variant="primary" asChild className="min-h-[44px]">
            <Link href="/qs-hub/stake/lock">
              {t('cta.button')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-xs text-foreground-tertiary mt-3">
            {t('cta.description')}
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            {t('footer.copyright')}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default QSHubGetQS;
