'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Code,
  Book,
  Terminal,
  Key,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  Webhook,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useApiKeys, useWebhooks } from '@/hooks/enterprise';
import { MOCK_API_KEYS as MOCK_API_KEYS_DATA, MOCK_WEBHOOKS as MOCK_WEBHOOKS_DATA } from '@/lib/api/enterprise/mock';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsed: string | null;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered: string | null;
}

// Fallback data for when API is unavailable
const FALLBACK_API_KEYS: ApiKey[] = MOCK_API_KEYS_DATA.map(k => ({
  id: k.id,
  name: k.name,
  prefix: k.maskedKey.split('...')[0] || 'qs_live_',
  permissions: k.environment === 'production' ? ['read', 'write', 'delete'] : ['read'],
  lastUsed: k.createdAt,
  createdAt: k.createdAt,
}));

const FALLBACK_WEBHOOKS: Webhook[] = MOCK_WEBHOOKS_DATA.map(w => ({
  id: w.id,
  url: w.url,
  events: w.events,
  status: w.isActive ? 'active' : 'inactive',
  lastTriggered: w.lastTriggered ?? null,
}));

export function DeveloperTab() {
  const t = useTranslations('enterprise.settings.developer');

  // Use API hooks with fallback
  const { data: apiKeysData } = useApiKeys();
  const { data: webhooksData } = useWebhooks();

  const apiKeys: ApiKey[] = apiKeysData?.api_keys?.map(k => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    permissions: k.status === 'active' ? ['read', 'write', 'delete'] : ['read'],
    lastUsed: k.last_used ?? null,
    createdAt: k.created_at,
  })) ?? FALLBACK_API_KEYS;

  const webhooks: Webhook[] = webhooksData?.webhooks?.map(w => ({
    id: w.id,
    url: w.url,
    events: w.events,
    status: w.is_active ? 'active' : 'inactive',
    lastTriggered: w.last_triggered ?? null,
  })) ?? FALLBACK_WEBHOOKS;

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* API Documentation Links */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Book className="w-5 h-5 text-hinomaru" />
            {t('docs.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('docs.description')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: FileCode, key: 'apiReference', href: '#' },
              { icon: Terminal, key: 'sdks', href: '#' },
              { icon: Code, key: 'examples', href: '#' },
              { icon: Webhook, key: 'webhooks', href: '#' },
            ].map(({ icon: Icon, key, href }) => (
              <a
                key={key}
                href={href}
                className="flex items-center gap-4 p-4 bg-background-primary rounded-xl border border-white/5 hover:border-hinomaru/30 transition-colors group"
              >
                <div className="w-10 h-10 bg-hinomaru/10 rounded-lg flex items-center justify-center group-hover:bg-hinomaru/20 transition-colors">
                  <Icon className="w-5 h-5 text-hinomaru" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary group-hover:text-hinomaru transition-colors">
                    {t(`docs.items.${key}.title`)}
                  </p>
                  <p className="text-xs text-text-tertiary">{t(`docs.items.${key}.description`)}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-text-tertiary group-hover:text-hinomaru transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* API Keys Management */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Key className="w-5 h-5 text-gold" />
              {t('apiKeys.title')}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{t('apiKeys.description')}</p>
          </div>
          <Button variant="primary" size="sm" className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            {t('apiKeys.create')}
          </Button>
        </div>
        <div className="divide-y divide-white/5">
          {apiKeys.map((key) => (
            <div key={key.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{key.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-text-secondary font-mono bg-background-primary px-2 py-0.5 rounded">
                        {key.prefix}••••••••
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(key.prefix + '••••••••', key.id)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label={t('apiKeys.copy')}
                      >
                        {copiedId === key.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    {t('apiKeys.rotate')}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 text-xs text-text-tertiary">
                <span>
                  {t('apiKeys.permissions')}: {key.permissions.map((p) => t(`apiKeys.permissionTypes.${p}`)).join(', ')}
                </span>
                <span>
                  {t('apiKeys.lastUsed')}: {key.lastUsed || t('apiKeys.never')}
                </span>
                <span>
                  {t('apiKeys.created')}: {key.createdAt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Webhooks */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Webhook className="w-5 h-5 text-info" />
              {t('webhooks.title')}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{t('webhooks.description')}</p>
          </div>
          <Button variant="primary" size="sm" className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            {t('webhooks.create')}
          </Button>
        </div>
        <div className="divide-y divide-white/5">
          {webhooks.length === 0 ? (
            <div className="p-12 text-center">
              <Webhook className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-tertiary">{t('webhooks.empty')}</p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div key={webhook.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm text-text-primary font-mono">{webhook.url}</code>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        webhook.status === 'active' ? 'bg-success/20 text-success' : 'bg-white/10 text-text-tertiary'
                      )}>
                        {t(`webhooks.status.${webhook.status}`)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-0.5 bg-info/10 text-info text-xs rounded-full"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">{t('webhooks.test')}</Button>
                    <Button variant="ghost" size="sm">{t('webhooks.edit')}</Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {webhook.lastTriggered && (
                  <p className="text-xs text-text-tertiary mt-2">
                    {t('webhooks.lastTriggered')}: {webhook.lastTriggered}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Code Snippets */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            {t('snippets.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('snippets.description')}</p>
        </div>
        <div className="p-6">
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <span className="text-xs text-gray-400">JavaScript / TypeScript</span>
              <button
                type="button"
                onClick={() => copyToClipboard(`const qs = new QuantumShield({
  apiKey: 'qs_live_...',
});

// Lock tokens
const lockResult = await qs.lock({
  amount: '1.0',
  token: 'ETH',
});`, 'snippet')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {copiedId === 'snippet' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="p-4 text-sm text-gray-300 overflow-x-auto">
              <code>{`const qs = new QuantumShield({
  apiKey: 'qs_live_...',
});

// Lock tokens
const lockResult = await qs.lock({
  amount: '1.0',
  token: 'ETH',
});`}</code>
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
