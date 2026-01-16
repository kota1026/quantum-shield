'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Lock,
  Vote,
  Gift,
  Users,
  HelpCircle,
  Mail,
  FileText,
  Activity,
  ChevronRight,
  PlayCircle,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface QuickLinkItem {
  id: string;
  icon: React.ReactNode;
  href: string;
}

interface ResourceItem {
  id: string;
  icon: React.ReactNode;
  href: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
  { id: 'tokenomics', icon: <BookOpen className="w-5 h-5" />, href: '/token-hub/onboarding' },
  { id: 'locking', icon: <Lock className="w-5 h-5" />, href: '/token-hub/lock' },
  { id: 'governance', icon: <Vote className="w-5 h-5" />, href: '/token-hub/delegate-list' },
  { id: 'rewards', icon: <Gift className="w-5 h-5" />, href: '/token-hub/rewards' },
];

const RESOURCES: ResourceItem[] = [
  { id: 'faq', icon: <HelpCircle className="w-5 h-5" />, href: '/token-hub/faq' },
  { id: 'getQS', icon: <Calculator className="w-5 h-5" />, href: '/token-hub/get-qs' },
  { id: 'docs', icon: <FileText className="w-5 h-5" />, href: '#' },
  { id: 'status', icon: <Activity className="w-5 h-5" />, href: '#' },
];

export function TokenHubHelp() {
  const t = useTranslations('token-hub.help');
  const [searchQuery, setSearchQuery] = useState('');

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
            href="/token-hub/settings"
            className={cn(
              'w-10 h-10 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Search */}
        <div className="relative mb-8">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-tertiary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.ariaLabel')}
            className={cn(
              'w-full pl-12 pr-4 py-3',
              'bg-surface border border-border rounded-qs-lg',
              'text-foreground placeholder:text-foreground-tertiary',
              'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru',
              'transition-all'
            )}
          />
        </div>

        {/* Quick Links */}
        <section className="mb-8" aria-labelledby="quick-links-heading">
          <h2
            id="quick-links-heading"
            className="text-lg font-semibold text-foreground mb-4"
          >
            {t('quickLinks.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 p-4',
                  'bg-surface border border-border rounded-qs-lg',
                  'hover:border-gold/50 hover:bg-surface-secondary',
                  'transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
                )}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center bg-hinomaru/10 rounded-qs text-hinomaru"
                  aria-hidden="true"
                >
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(`quickLinks.items.${item.id}.title`)}
                  </h3>
                  <p className="text-xs text-foreground-tertiary line-clamp-1">
                    {t(`quickLinks.items.${item.id}.description`)}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-foreground-tertiary flex-shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="mb-8" aria-labelledby="resources-heading">
          <h2
            id="resources-heading"
            className="text-lg font-semibold text-foreground mb-4"
          >
            {t('resources.title')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {RESOURCES.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-3 p-4',
                  'bg-surface border border-border rounded-qs-lg',
                  'hover:border-gold/50 hover:bg-surface-secondary',
                  'transition-all text-center',
                  'focus:outline-none focus:ring-2 focus:ring-hinomaru/30 focus:border-hinomaru'
                )}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center bg-gold/10 rounded-full text-gold"
                  aria-hidden="true"
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(`resources.${item.id}.title`)}
                  </h3>
                  <p className="text-xs text-foreground-tertiary mt-0.5">
                    {t(`resources.${item.id}.description`)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Tutorial CTA */}
        <section
          className={cn(
            'p-6 rounded-qs-xl',
            'bg-gradient-to-r from-hinomaru/10 to-gold/10',
            'border border-hinomaru/30'
          )}
          aria-labelledby="tutorial-heading"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div
              className="w-16 h-16 flex items-center justify-center bg-hinomaru/20 rounded-full"
              aria-hidden="true"
            >
              <PlayCircle className="w-8 h-8 text-hinomaru" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3
                id="tutorial-heading"
                className="text-lg font-semibold text-foreground"
              >
                {t('tutorial.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mt-1">
                {t('tutorial.description')}
              </p>
            </div>
            <Button variant="primary" asChild>
              <Link href="/token-hub/onboarding">
                {t('tutorial.button')}
              </Link>
            </Button>
          </div>
        </section>

        {/* Consumer App Link */}
        <section className="mt-8" aria-labelledby="consumer-app-heading">
          <div
            className={cn(
              'p-5 rounded-qs-lg',
              'bg-surface border border-border',
              'hover:border-gold/50 transition-all'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center bg-gold/10 rounded-qs text-gold"
                  aria-hidden="true"
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="consumer-app-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    {t('consumerApp.title')}
                  </h3>
                  <p className="text-xs text-foreground-tertiary">
                    {t('consumerApp.description')}
                  </p>
                </div>
              </div>
              <Link
                href="/consumer/dashboard"
                className={cn(
                  'px-4 py-2 text-sm font-medium',
                  'bg-gold/10 text-gold rounded-qs',
                  'hover:bg-gold/20 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-gold/30'
                )}
              >
                {t('consumerApp.button')}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default TokenHubHelp;
