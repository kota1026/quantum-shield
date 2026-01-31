'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { ArrowLeft, Globe, AlertTriangle, Shield, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ProverTerms() {
  const t = useTranslations('prover.terms');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  };

  const sections = [
    'definitions',
    'eligibility',
    'obligations',
    'staking',
    'slashing',
    'termination',
    'liability',
    'modifications',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)] opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-8">
        {/* Header */}
        <header className="flex justify-between items-center py-5" role="banner">
          <Link href="/prover/landing" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
                aria-hidden="true"
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
              </div>
              <div
                className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-semibold tracking-tight">Quantum Shield</span>
              <span className="text-[10px] text-gold tracking-widest uppercase">
                Prover Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px] text-sm font-medium text-foreground-secondary hover:text-foreground border border-surface-tertiary/30 rounded-full transition-colors"
              aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
            >
              <Globe className="h-4 w-4" aria-hidden="true" />
              {locale === 'ja' ? 'EN' : 'JA'}
            </button>
            <Link
              href="/prover/application"
              className="flex items-center gap-2 min-h-[44px] text-foreground-secondary hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t('backToApplication')}
            </Link>
          </div>
        </header>

        <main className="pb-16">
          {/* Hero */}
          <section className="text-center py-12">
            <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-gold" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
            <p className="text-foreground-secondary">
              {t('lastUpdated')}: 2026-01-15
            </p>
          </section>

          {/* Important Notice */}
          <Card className="p-6 mb-8 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-lg mb-2">{t('notice.title')}</h2>
                <p className="text-foreground-secondary text-sm">
                  {t('notice.content')}
                </p>
              </div>
            </div>
          </Card>

          {/* Table of Contents */}
          <Card className="p-6 mb-8">
            <h2 className="font-semibold text-lg mb-4">{t('toc.title')}</h2>
            <nav>
              <ol className="space-y-1">
                {sections.map((section, index) => (
                  <li key={section}>
                    <a
                      href={`#${section}`}
                      className="inline-flex items-center min-h-[44px] text-foreground-secondary hover:text-gold transition-colors"
                    >
                      {index + 1}. {t(`sections.${section}.title`)}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </Card>

          {/* Terms Content */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={section} id={section} className="scroll-mt-24">
                <Card className="p-8">
                  <h2 className="text-xl font-bold mb-4">
                    {index + 1}. {t(`sections.${section}.title`)}
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-foreground-secondary whitespace-pre-line">
                      {t(`sections.${section}.content`)}
                    </p>
                  </div>
                </Card>
              </section>
            ))}
          </div>

          {/* Acceptance */}
          <Card className="p-8 mt-8 text-center bg-gradient-to-r from-hinomaru/5 to-gold/5">
            <Shield className="h-12 w-12 text-gold mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-xl font-bold mb-4">{t('acceptance.title')}</h2>
            <p className="text-foreground-secondary mb-6 max-w-xl mx-auto">
              {t('acceptance.content')}
            </p>
            <Link
              href="/prover/application"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-background font-semibold rounded-lg hover:bg-gold/90 transition-colors"
            >
              {t('acceptance.button')}
            </Link>
          </Card>
        </main>
      </div>
    </div>
  );
}
