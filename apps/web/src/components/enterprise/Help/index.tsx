'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

export function Help() {
  const t = useTranslations('enterprise.help');
  const [searchQuery, setSearchQuery] = useState('');

  const gettingStartedItems = [
    { key: 'setup', icon: '🚀', href: '/enterprise/settings' },
    { key: 'apiKeys', icon: '🔑', href: '/enterprise/api-keys' },
    { key: 'integration', icon: '🔧', href: '#' },
    { key: 'security', icon: '🛡️', href: '/enterprise/settings' },
  ];

  const topicItems = [
    { key: 'transactions', icon: '📊', href: '/enterprise/transactions' },
    { key: 'users', icon: '👥', href: '/enterprise/users' },
    { key: 'webhooks', icon: '🔔', href: '/enterprise/webhooks' },
    { key: 'reports', icon: '📈', href: '/enterprise/reports' },
  ];

  const resourceItems = [
    { key: 'docs', icon: '📚', href: 'https://docs.quantumshield.io' },
    { key: 'support', icon: '🎧', href: '/enterprise/support' },
    { key: 'changelog', icon: '📋', href: '#' },
    { key: 'status', icon: '⚡', href: '/enterprise/status' },
  ];

  return (
    <div className="flex min-h-screen bg-background-primary">
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px]"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5">
          <h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Search */}
          <div className="relative mb-8 max-w-2xl mx-auto">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
              🔍
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              aria-label={t('search.ariaLabel')}
              className="w-full pl-12 pr-4 py-3 bg-background-secondary border border-white/10 rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-hinomaru transition-all"
            />
          </div>

          {/* Getting Started */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {t('gettingStarted.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gettingStartedItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-4 p-4 bg-background-secondary border border-white/5 rounded-xl hover:border-hinomaru/30 transition-all"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-hinomaru/10 rounded-lg text-lg">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">
                      {t(`gettingStarted.items.${item.key}.title`)}
                    </h3>
                    <p className="text-xs text-text-tertiary truncate">
                      {t(`gettingStarted.items.${item.key}.description`)}
                    </p>
                  </div>
                  <span className="text-text-tertiary">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Popular Topics */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{t('topics.title')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topicItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-4 p-4 bg-background-secondary border border-white/5 rounded-xl hover:border-gold/30 transition-all"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-gold/10 rounded-lg text-lg">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold">
                      {t(`topics.items.${item.key}.title`)}
                    </h3>
                    <p className="text-xs text-text-tertiary truncate">
                      {t(`topics.items.${item.key}.description`)}
                    </p>
                  </div>
                  <span className="text-text-tertiary">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Resources */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              {t('resources.title')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {resourceItems.map((item) => {
                const isExternal = item.href.startsWith('http');
                const LinkComponent = isExternal ? 'a' : Link;
                const linkProps = isExternal
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {};

                return (
                  <LinkComponent
                    key={item.key}
                    href={item.href}
                    {...linkProps}
                    className="flex flex-col items-center gap-3 p-6 bg-background-secondary border border-white/5 rounded-xl hover:border-white/10 transition-all text-center"
                  >
                    <div className="w-12 h-12 flex items-center justify-center bg-info/10 rounded-full text-xl">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">
                        {t(`resources.items.${item.key}.title`)}
                      </h3>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        {t(`resources.items.${item.key}.description`)}
                      </p>
                    </div>
                  </LinkComponent>
                );
              })}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="p-6 rounded-2xl bg-gradient-to-br from-hinomaru/10 to-gold/10 border border-hinomaru/20">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center bg-hinomaru/20 rounded-full text-2xl">
                💬
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">{t('contact.title')}</h3>
                <p className="text-sm text-text-secondary mt-1">
                  {t('contact.description')}
                </p>
              </div>
              <Button variant="primary" asChild>
                <Link href="/enterprise/support">{t('contact.button')}</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
