'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Cookie as CookieIcon, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CookieSettings {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

export function CookiePolicy() {
  const t = useTranslations('consumer.cookie');

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true,
    analytics: true,
    functional: true,
  });
  const [saved, setSaved] = useState(false);

  const sections = [
    'intro',
    'whatAreCookies',
    'essential',
    'analytics',
    'functional',
    'thirdParty',
    'manage',
    'changes',
  ] as const;

  const handleSaveSettings = () => {
    // Save settings (mock implementation)
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setShowSettings(false);
    }, 1500);
  };

  const handleAcceptAll = () => {
    setSettings({
      essential: true,
      analytics: true,
      functional: true,
    });
    handleSaveSettings();
  };

  return (
    <div className="min-h-screen bg-background">
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

      {/* Fixed Header */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'bg-background/90 backdrop-blur-xl',
          'border-b border-border-subtle'
        )}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href="/consumer"
            className="flex items-center gap-3 text-foreground hover:text-gold transition-colors"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 border border-gold rounded-full animate-[spin_20s_linear_infinite]">
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
              </div>
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-[0_0_15px_rgba(188,0,45,0.4)]" />
            </div>
            <span className="font-semibold">Quantum Shield</span>
          </Link>
          <Link
            href="/consumer"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('header.back')}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main role="main" className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <CookieIcon className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-bold tracking-tight">
            {t('header.title')}
          </h1>
        </div>
        <p className="text-sm text-foreground-tertiary mb-8">
          {t('lastUpdated', { date: '2026-01-08' })}
        </p>

        {/* Cookie Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            'w-full p-4 mb-8 rounded-qs-lg',
            'bg-gold/10 border border-gold/30',
            'flex items-center justify-between',
            'hover:bg-gold/15 transition-colors'
          )}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gold" />
            <div className="text-left">
              <h3 className="text-sm font-semibold">{t('consent.title')}</h3>
              <p className="text-xs text-foreground-secondary">{t('consent.description')}</p>
            </div>
          </div>
          <ArrowLeft className={cn(
            'w-4 h-4 text-foreground-secondary transition-transform',
            showSettings ? 'rotate-90' : '-rotate-90'
          )} />
        </button>

        {/* Cookie Settings Panel */}
        {showSettings && (
          <div className="mb-8 p-6 bg-surface rounded-qs-lg border border-border-subtle space-y-4">
            {/* Essential Cookies */}
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-qs">
              <div>
                <h4 className="text-sm font-medium">{t('consent.essential.title')}</h4>
                <p className="text-xs text-foreground-secondary">{t('consent.essential.description')}</p>
              </div>
              <div className="w-12 h-6 bg-gold/30 rounded-full flex items-center justify-end px-1">
                <div className="w-4 h-4 bg-gold rounded-full" />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-qs">
              <div>
                <h4 className="text-sm font-medium">{t('consent.analytics.title')}</h4>
                <p className="text-xs text-foreground-secondary">{t('consent.analytics.description')}</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, analytics: !s.analytics }))}
                className={cn(
                  'w-12 h-6 rounded-full flex items-center px-1 transition-colors',
                  settings.analytics ? 'bg-gold/30 justify-end' : 'bg-surface justify-start'
                )}
                role="switch"
                aria-checked={settings.analytics}
                aria-label={t('consent.analytics.title')}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full transition-colors',
                  settings.analytics ? 'bg-gold' : 'bg-foreground-tertiary'
                )} />
              </button>
            </div>

            {/* Functional Cookies */}
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-qs">
              <div>
                <h4 className="text-sm font-medium">{t('consent.functional.title')}</h4>
                <p className="text-xs text-foreground-secondary">{t('consent.functional.description')}</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, functional: !s.functional }))}
                className={cn(
                  'w-12 h-6 rounded-full flex items-center px-1 transition-colors',
                  settings.functional ? 'bg-gold/30 justify-end' : 'bg-surface justify-start'
                )}
                role="switch"
                aria-checked={settings.functional}
                aria-label={t('consent.functional.title')}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full transition-colors',
                  settings.functional ? 'bg-gold' : 'bg-foreground-tertiary'
                )} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={handleSaveSettings}
                disabled={saved}
                className="flex-1"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t('consent.saveSettings')}
                  </>
                ) : (
                  t('consent.saveSettings')
                )}
              </Button>
              <Button
                variant="primary"
                onClick={handleAcceptAll}
                disabled={saved}
                className="flex-1"
              >
                {t('consent.acceptAll')}
              </Button>
            </div>
          </div>
        )}

        {/* Policy Content */}
        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section} className="space-y-4">
              <h2 className="text-xl font-semibold text-gold">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="text-foreground-secondary leading-relaxed">
                {t(`sections.${section}.content`)}
              </p>
              {/* Render items if exists for specific sections */}
              {(section === 'essential' || section === 'analytics' || section === 'functional') && (
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary pl-2">
                  {section === 'essential' && (
                    <>
                      <li>{t('sections.essential.items.session')}</li>
                      <li>{t('sections.essential.items.security')}</li>
                      <li>{t('sections.essential.items.preferences')}</li>
                    </>
                  )}
                  {section === 'analytics' && (
                    <>
                      <li>{t('sections.analytics.items.pageViews')}</li>
                      <li>{t('sections.analytics.items.userJourney')}</li>
                      <li>{t('sections.analytics.items.performance')}</li>
                    </>
                  )}
                  {section === 'functional' && (
                    <>
                      <li>{t('sections.functional.items.walletConnection')}</li>
                      <li>{t('sections.functional.items.recentActivity')}</li>
                      <li>{t('sections.functional.items.notifications')}</li>
                    </>
                  )}
                </ul>
              )}
              {section === 'thirdParty' && (
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary pl-2">
                  <li>{t('sections.thirdParty.services.analytics')}</li>
                  <li>{t('sections.thirdParty.services.error')}</li>
                  <li>{t('sections.thirdParty.services.cdn')}</li>
                </ul>
              )}
            </section>
          ))}

          {/* Contact Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gold">
              {t('contact.title')}
            </h2>
            <p className="text-foreground-secondary leading-relaxed">
              {t('contact.content')}
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-subtle py-10">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex justify-center gap-6 mb-5">
            <Link href="/consumer" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('footer.home')}
            </Link>
            <Link href="/consumer/terms" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('footer.terms')}
            </Link>
            <Link href="/consumer/privacy" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="/consumer/cookie" className="text-sm text-gold hover:text-gold transition-colors">
              {t('footer.cookie')}
            </Link>
          </div>
          <p className="text-center text-sm text-foreground-tertiary">
            {t('footer.copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default CookiePolicy;
