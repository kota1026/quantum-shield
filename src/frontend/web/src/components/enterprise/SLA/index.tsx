'use client';

import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';

export function SLA() {
  const t = useTranslations('enterprise.slaPage');

  const sections = [
    'availability',
    'support',
    'credits',
    'exclusions',
    'reporting',
    'monitoring',
  ] as const;

  const metrics = ['uptime', 'response', 'resolution'] as const;

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
        <div className="p-8 max-w-4xl">
          <p className="text-sm text-text-tertiary mb-8">
            {t('lastUpdated', { date: '2026-01-15' })}
          </p>

          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gold mb-2">
              {t('overview.title')}
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {t('overview.description')}
            </p>
          </section>

          {/* Metrics Cards */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gold mb-4">
              {t('metrics.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric}
                  className="p-6 bg-background-secondary border border-white/5 rounded-xl text-center"
                >
                  <div className="text-2xl font-bold text-gold mb-1">
                    {t(`metrics.${metric}.value`)}
                  </div>
                  <div className="text-sm font-medium mb-1">
                    {t(`metrics.${metric}.label`)}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {t(`metrics.${metric}.description`)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Sections */}
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section} className="space-y-3">
                <h2 className="text-lg font-semibold text-gold">
                  {t(`sections.${section}.title`)}
                </h2>
                <p className="text-text-secondary leading-relaxed">
                  {t(`sections.${section}.content`)}
                </p>
              </section>
            ))}

            {/* Contact Section */}
            <section className="pt-4 border-t border-white/5 space-y-3">
              <h2 className="text-lg font-semibold text-gold">
                {t('contactInfo.title')}
              </h2>
              <p className="text-text-secondary leading-relaxed">
                {t('contactInfo.content')}
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
