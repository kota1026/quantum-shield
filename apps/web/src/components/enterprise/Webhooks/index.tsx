'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

type WebhookStatus = 'active' | 'inactive';

interface WebhookEvent {
  type: string;
  label: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  status: WebhookStatus;
  events: WebhookEvent[];
  lastDelivery: string;
  successRate: number;
  totalDeliveries: number;
}

// Mock data
const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: '1',
    name: 'Production Events',
    url: 'https://api.acme.com/webhooks/quantum',
    status: 'active',
    events: [
      { type: 'transaction.created', label: 'transaction.created' },
      { type: 'transaction.completed', label: 'transaction.completed' },
      { type: 'transaction.failed', label: 'transaction.failed' },
    ],
    lastDelivery: '2',
    successRate: 99.8,
    totalDeliveries: 12847,
  },
  {
    id: '2',
    name: 'Slack Notifications',
    url: 'https://hooks.slack.com/services/T00.../B00.../xxx',
    status: 'active',
    events: [
      { type: 'alert.security', label: 'alert.security' },
      { type: 'alert.limit', label: 'alert.limit' },
    ],
    lastDelivery: '60',
    successRate: 100,
    totalDeliveries: 234,
  },
  {
    id: '3',
    name: 'Staging Events',
    url: 'https://staging-api.acme.com/webhooks',
    status: 'inactive',
    events: [{ type: 'transaction.created', label: 'transaction.created' }],
    lastDelivery: '4320',
    successRate: 95.2,
    totalDeliveries: 1024,
  },
];

interface WebhooksProps {
  className?: string;
}

export function Webhooks({ className }: WebhooksProps) {
  const t = useTranslations('enterprise.webhooks');

  const formatLastDelivery = (minutes: string) => {
    const mins = parseInt(minutes);
    if (mins < 60) {
      return t('webhook.time.minutesAgo', { count: mins });
    } else if (mins < 1440) {
      return t('webhook.time.hoursAgo', { count: Math.floor(mins / 60) });
    } else {
      return t('webhook.time.daysAgo', { count: Math.floor(mins / 1440) });
    }
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
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-50"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
          <Link href="/enterprise/webhooks/create">
            <Button variant="primary" size="sm">
              + {t('addWebhook')}
            </Button>
          </Link>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="flex flex-col gap-4" aria-label={t('list.ariaLabel')}>
            {MOCK_WEBHOOKS.map((webhook) => (
              <article
                key={webhook.id}
                className="bg-background-secondary border border-white/5 rounded-2xl p-6 hover:border-hinomaru/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-text-primary mb-1">
                      {webhook.name}
                    </h2>
                    <p className="font-mono text-sm text-gold">{webhook.url}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium',
                      webhook.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-white/5 text-text-tertiary'
                    )}
                  >
                    {webhook.status === 'active' ? '●' : '○'}{' '}
                    {t(`webhook.status.${webhook.status}`)}
                  </span>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {webhook.events.map((event) => (
                    <span
                      key={event.type}
                      className="px-3 py-1 bg-background-primary rounded-lg text-xs text-text-secondary"
                    >
                      {event.label}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex gap-6 pt-4 border-t border-white/5 text-xs text-text-tertiary">
                  <span>
                    {t('webhook.meta.lastDelivery')}:{' '}
                    <span className="text-text-secondary">
                      {formatLastDelivery(webhook.lastDelivery)}
                    </span>
                  </span>
                  <span>
                    {t('webhook.meta.successRate')}:{' '}
                    <span
                      className={cn(
                        webhook.successRate >= 99
                          ? 'text-success'
                          : webhook.successRate >= 95
                            ? 'text-warning'
                            : 'text-hinomaru'
                      )}
                    >
                      {webhook.successRate}%
                    </span>
                  </span>
                  <span>
                    {t('webhook.meta.totalDeliveries')}:{' '}
                    <span className="text-text-secondary">
                      {webhook.totalDeliveries.toLocaleString()}
                    </span>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
