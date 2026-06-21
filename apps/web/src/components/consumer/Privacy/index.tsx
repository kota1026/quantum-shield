'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Privacy() {
  const t = useTranslations('consumer.privacy');

  const sections = [
    'intro',
    'collection',
    'notCollected',
    'usage',
    'sharing',
    'cookies',
    'security',
    'rights',
    'changes',
  ] as const;

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
          >
            <ArrowLeft className="w-4 h-4" />
            {t('header.back')}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-bold mb-4 tracking-tight">
          {t('header.title')}
        </h1>
        <p className="text-sm text-foreground-tertiary mb-12">
          {t('lastUpdated', { date: '2026-01-08' })}
        </p>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section} className="space-y-4">
              <h2 className="text-xl font-semibold text-gold">
                {t(`sections.${section}.title`)}
              </h2>
              <p className="text-foreground-secondary leading-relaxed">
                {t(`sections.${section}.content`)}
              </p>
              {/* Render items if exists for collection/notCollected sections */}
              {(section === 'collection' || section === 'notCollected') && (
                <ul className="list-disc list-inside space-y-2 text-foreground-secondary">
                  {['wallet', 'transaction', 'usage', 'device'].filter(item => {
                    if (section === 'collection') return true;
                    return ['keys', 'personal', 'seed'].includes(item);
                  }).map(item => {
                    try {
                      return (
                        <li key={item}>
                          {t(`sections.${section}.items.${item}`)}
                        </li>
                      );
                    } catch {
                      return null;
                    }
                  })}
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
            <Link href="/consumer/faq" className="text-sm text-foreground-secondary hover:text-foreground transition-colors">
              {t('footer.faq')}
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

export default Privacy;
