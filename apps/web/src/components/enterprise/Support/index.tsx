'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

interface FAQItem {
  key: string;
  expanded: boolean;
}

export function Support() {
  const t = useTranslations('enterprise.support');

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const documentationItems = [
    { key: 'api', icon: '📚', url: 'https://docs.quantumshield.io/api' },
    {
      key: 'integration',
      icon: '🔧',
      url: 'https://docs.quantumshield.io/integration',
    },
    {
      key: 'security',
      icon: '🛡️',
      url: 'https://docs.quantumshield.io/security',
    },
    {
      key: 'compliance',
      icon: '📋',
      url: 'https://docs.quantumshield.io/compliance',
    },
  ];

  const faqItems = ['apiKey', 'emergency', 'ipAllowlist'];

  const toggleFaq = (key: string) => {
    setExpandedFaq(expandedFaq === key ? null : key);
  };

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
          <Button
            variant="primary"
            onClick={() =>
              window.open('https://support.quantumshield.io', '_blank')
            }
          >
            + {t('newTicket')}
          </Button>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Support Hero */}
          <div className="bg-gradient-to-br from-hinomaru/10 to-gold/10 border border-white/5 rounded-2xl p-8 mb-8 text-center">
            <h2 className="text-2xl font-semibold mb-2">{t('hero.title')}</h2>
            <p className="text-text-secondary mb-6">{t('hero.description')}</p>
            <div className="flex justify-center gap-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">
                  {t('hero.stats.uptime.value')}
                </div>
                <div className="text-xs text-text-tertiary">
                  {t('hero.stats.uptime.label')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">
                  {t('hero.stats.response.value')}
                </div>
                <div className="text-xs text-text-tertiary">
                  {t('hero.stats.response.label')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold">
                  {t('hero.stats.availability.value')}
                </div>
                <div className="text-xs text-text-tertiary">
                  {t('hero.stats.availability.label')}
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-3 gap-8">
            {/* Main Content - 2/3 */}
            <div className="col-span-2">
              {/* Documentation */}
              <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden mb-8">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <h2 className="text-base font-semibold">
                    {t('documentation.title')}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-col gap-3">
                    {documentationItems.map((item) => (
                      <a
                        key={item.key}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 bg-background-primary rounded-lg cursor-pointer transition-colors hover:bg-background-elevated"
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-info/10 text-info rounded-lg text-lg">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-0.5">
                            {t(`documentation.items.${item.key}.title`)}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {t(`documentation.items.${item.key}.description`)}
                          </div>
                        </div>
                        <span className="text-text-tertiary">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <h2 className="text-base font-semibold">{t('faq.title')}</h2>
                </div>
                <div className="p-6">
                  {faqItems.map((item) => (
                    <div
                      key={item}
                      className="py-4 border-b border-white/5 last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(item)}
                        className="w-full text-left text-sm font-medium flex justify-between items-center cursor-pointer"
                        aria-expanded={expandedFaq === item}
                      >
                        <span>{t(`faq.items.${item}.question`)}</span>
                        <span className="text-text-tertiary">
                          {expandedFaq === item ? '−' : '+'}
                        </span>
                      </button>
                      {expandedFaq === item && (
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {t(`faq.items.${item}.answer`)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Content - 1/3 */}
            <div>
              {/* Contact Support */}
              <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden mb-8">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <h2 className="text-base font-semibold">
                    {t('contact.title')}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="bg-background-primary rounded-lg p-4 mb-3">
                    <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                      📧 {t('contact.email.label')}
                    </div>
                    <div className="text-sm text-text-secondary">
                      <a
                        href={`mailto:${t('contact.email.value')}`}
                        className="text-gold hover:underline"
                      >
                        {t('contact.email.value')}
                      </a>
                    </div>
                  </div>
                  <div className="bg-background-primary rounded-lg p-4 mb-3">
                    <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                      📞 {t('contact.phone.label')}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {t('contact.phone.value')}
                    </div>
                  </div>
                  <div className="bg-background-primary rounded-lg p-4">
                    <div className="text-sm font-semibold mb-1 flex items-center gap-2">
                      💬 {t('contact.slack.label')}
                    </div>
                    <div className="text-sm text-text-secondary">
                      <span className="text-gold">{t('contact.slack.value')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your SLA */}
              <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <h2 className="text-base font-semibold">{t('sla.title')}</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-success/10 text-success rounded text-xs font-semibold">
                      ✓ {t('sla.badge')}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary leading-loose">
                    <div>
                      <strong>{t('sla.responseTime')}:</strong> &lt;2
                      {' '}hours
                    </div>
                    <div>
                      <strong>{t('sla.uptimeSla')}:</strong> 99.9%
                    </div>
                    <div>
                      <strong>{t('sla.dedicatedCsm')}:</strong> 山田 太郎
                    </div>
                    <div>
                      <strong>{t('sla.contractExpires')}:</strong> 2026-12-31
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
