'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Vote,
  Lock,
  Gift,
  ArrowRight,
  Wallet,
  Clock,
  BadgeCheck,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FeatureItem {
  id: string;
  icon: React.ReactNode;
}

const CONSUMER_FEATURES: FeatureItem[] = [
  { id: 'lock', icon: <Lock className="w-5 h-5" /> },
  { id: 'unlock', icon: <Clock className="w-5 h-5" /> },
  { id: 'emergency', icon: <Shield className="w-5 h-5" /> },
  { id: 'history', icon: <Wallet className="w-5 h-5" /> },
];

const TOKEN_HUB_FEATURES: FeatureItem[] = [
  { id: 'veqs', icon: <BadgeCheck className="w-5 h-5" /> },
  { id: 'governance', icon: <Vote className="w-5 h-5" /> },
  { id: 'delegate', icon: <Vote className="w-5 h-5" /> },
  { id: 'rewards', icon: <Gift className="w-5 h-5" /> },
];

export function ConsumerLink() {
  const t = useTranslations('token-hub.consumerLink');

  return (
    <div className="min-h-screen bg-background pb-24">
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
      <main className="relative z-10 max-w-[900px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <Link
            href="/token-hub/dashboard"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
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

        {/* App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Consumer App Card */}
          <section
            className={cn(
              'bg-surface border border-border rounded-qs-xl p-6',
              'hover:border-gold/50 transition-all'
            )}
            aria-labelledby="consumer-app-heading"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 flex items-center justify-center bg-gold/10 rounded-qs text-gold"
                aria-hidden="true"
              >
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="consumer-app-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  {t('consumerApp.title')}
                </h2>
                <p className="text-xs text-foreground-tertiary">
                  {t('consumerApp.subtitle')}
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground-secondary mb-6">
              {t('consumerApp.description')}
            </p>

            {/* Features List */}
            <ul className="space-y-3 mb-6" aria-label={t('consumerApp.featuresLabel')}>
              {CONSUMER_FEATURES.map((feature) => (
                <li key={feature.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center bg-surface-secondary rounded text-foreground-secondary"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {t(`consumerApp.features.${feature.id}.title`)}
                    </span>
                    <p className="text-xs text-foreground-tertiary">
                      {t(`consumerApp.features.${feature.id}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Button variant="secondary" asChild className="w-full">
              <Link href="/consumer/dashboard">
                {t('consumerApp.button')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </section>

          {/* Token Hub Card */}
          <section
            className={cn(
              'bg-surface border-2 border-hinomaru/50 rounded-qs-xl p-6',
              'relative overflow-hidden'
            )}
            aria-labelledby="token-hub-heading"
          >
            {/* Current Badge */}
            <div
              className="absolute top-4 right-4 px-2 py-1 text-[10px] font-medium bg-hinomaru text-white rounded"
            >
              {t('tokenHub.currentBadge')}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 flex items-center justify-center bg-hinomaru/10 rounded-qs text-hinomaru"
                aria-hidden="true"
              >
                <Vote className="w-6 h-6" />
              </div>
              <div>
                <h2
                  id="token-hub-heading"
                  className="text-lg font-semibold text-foreground"
                >
                  {t('tokenHub.title')}
                </h2>
                <p className="text-xs text-foreground-tertiary">
                  {t('tokenHub.subtitle')}
                </p>
              </div>
            </div>

            <p className="text-sm text-foreground-secondary mb-6">
              {t('tokenHub.description')}
            </p>

            {/* Features List */}
            <ul className="space-y-3 mb-6" aria-label={t('tokenHub.featuresLabel')}>
              {TOKEN_HUB_FEATURES.map((feature) => (
                <li key={feature.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center bg-hinomaru/10 rounded text-hinomaru"
                    aria-hidden="true"
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {t(`tokenHub.features.${feature.id}.title`)}
                    </span>
                    <p className="text-xs text-foreground-tertiary">
                      {t(`tokenHub.features.${feature.id}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Button variant="primary" asChild className="w-full">
              <Link href="/token-hub/dashboard">
                {t('tokenHub.button')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </section>
        </div>

        {/* Connection Explanation */}
        <section
          className={cn(
            'p-6 rounded-qs-xl',
            'bg-gradient-to-r from-gold/5 to-hinomaru/5',
            'border border-border'
          )}
          aria-labelledby="connection-heading"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div
              className="w-12 h-12 flex items-center justify-center bg-gold/10 rounded-full"
              aria-hidden="true"
            >
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <div
              className="hidden sm:flex items-center text-foreground-tertiary"
              aria-hidden="true"
            >
              <ArrowRight className="w-6 h-6" />
            </div>
            <div
              className="w-12 h-12 flex items-center justify-center bg-hinomaru/10 rounded-full"
              aria-hidden="true"
            >
              <Vote className="w-6 h-6 text-hinomaru" />
            </div>
          </div>

          <h3
            id="connection-heading"
            className="text-lg font-semibold text-foreground mb-2"
          >
            {t('connection.title')}
          </h3>
          <p className="text-sm text-foreground-secondary">
            {t('connection.description')}
          </p>
        </section>
      </main>
    </div>
  );
}

export default ConsumerLink;
