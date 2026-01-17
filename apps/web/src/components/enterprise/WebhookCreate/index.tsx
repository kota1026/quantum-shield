'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

interface EventOption {
  id: string;
  category: 'transaction' | 'alert';
  key: string;
  checked: boolean;
}

interface WebhookCreateProps {
  className?: string;
}

export function WebhookCreate({ className }: WebhookCreateProps) {
  const t = useTranslations('enterprise.webhookCreate');

  const [webhookName, setWebhookName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [events, setEvents] = useState<EventOption[]>([
    { id: '1', category: 'transaction', key: 'created', checked: true },
    { id: '2', category: 'transaction', key: 'completed', checked: true },
    { id: '3', category: 'transaction', key: 'failed', checked: true },
    { id: '4', category: 'alert', key: 'security', checked: false },
    { id: '5', category: 'alert', key: 'limit', checked: false },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomSecret = 'whsec_' + Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
    setGeneratedSecret(randomSecret);
    setShowSuccess(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px] min-h-screen"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header
          className="flex items-center gap-4 px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-50"
          role="banner"
        >
          <Link
            href="/enterprise/webhooks"
            className="w-9 h-9 flex items-center justify-center bg-background-primary border border-white/10 rounded-lg text-text-secondary hover:bg-white/5"
            aria-label={t('backToList')}
          >
            ←
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[600px]">
          {showSuccess ? (
            <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-success">✓</span> {t('success.title')}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-text-secondary mb-4">{t('success.message')}</p>
                <div className="p-4 bg-background-primary border border-white/10 rounded-lg font-mono text-sm text-gold break-all mb-4">
                  {generatedSecret}
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" size="sm" onClick={handleCopy} className="flex-1">
                    {copied ? t('success.copied') : t('success.copy')}
                  </Button>
                  <Link href="/enterprise/webhooks" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      {t('success.done')}
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <form onSubmit={handleSubmit}>
              <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-base font-semibold text-text-primary">{t('card.title')}</h2>
                </div>
                <div className="p-6">
                  {/* Webhook Name */}
                  <div className="mb-6">
                    <label htmlFor="webhookName" className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.name.label')}
                    </label>
                    <input
                      type="text"
                      id="webhookName"
                      value={webhookName}
                      onChange={(e) => setWebhookName(e.target.value)}
                      placeholder={t('form.name.placeholder')}
                      className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm placeholder:text-text-muted"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">{t('form.name.hint')}</p>
                  </div>

                  {/* Endpoint URL */}
                  <div className="mb-6">
                    <label htmlFor="endpointUrl" className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.url.label')}
                    </label>
                    <input
                      type="url"
                      id="endpointUrl"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      placeholder={t('form.url.placeholder')}
                      className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm placeholder:text-text-muted font-mono"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">{t('form.url.hint')}</p>
                  </div>

                  {/* Events */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.events.label')}
                    </label>
                    <p className="text-xs text-text-tertiary mb-3">{t('form.events.hint')}</p>
                    <div className="flex flex-col gap-2">
                      {events.map((event) => (
                        <label
                          key={event.id}
                          className={cn(
                            'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                            event.checked
                              ? 'bg-gold/10 border-gold/30'
                              : 'bg-background-primary border-white/10 hover:border-white/20'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={event.checked}
                            onChange={() => toggleEvent(event.id)}
                            className="accent-gold"
                          />
                          <span className="text-sm text-text-primary">
                            {t(`form.events.${event.category}.${event.key}`)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    {t('submit')}
                  </Button>
                </div>
              </section>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
