'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseStatCard } from '../Dashboard/EnterpriseStatCard';
import { Button } from '@/components/ui/button';
import { useApiKeys } from '@/hooks/enterprise';
import { MOCK_API_KEYS, type MockApiKey } from '@/lib/api/enterprise/mock';

export type KeyEnvironment = 'production' | 'test';

export type ApiKey = MockApiKey;

// Fallback data for when API is unavailable
const FALLBACK_API_KEYS = MOCK_API_KEYS;

interface ApiKeyListProps {
  className?: string;
}

export function ApiKeyList({ className }: ApiKeyListProps) {
  const t = useTranslations('enterprise.apiKeys');

  // Use API hook with fallback
  const { data: apiKeysData } = useApiKeys();
  const apiKeys = apiKeysData?.api_keys?.map(k => ({
    id: k.id,
    name: k.name,
    environment: (k.status === 'active' ? 'production' : 'test') as KeyEnvironment,
    maskedKey: k.key_prefix,
    isActive: k.status === 'active',
    createdAt: k.created_at,
    expiresAt: undefined,
    revokedAt: k.status === 'revoked' ? k.last_used : undefined,
    callsToday: 0,
    createdBy: '',
  })) ?? FALLBACK_API_KEYS;

  const stats = {
    total: apiKeys.length,
    active: apiKeys.filter((k) => k.isActive).length,
    callsToday: apiKeys.reduce((sum, k) => sum + k.callsToday, 0),
    rateLimit: '1000/min',
  };

  const expiringKey = apiKeys.find(
    (k) => k.isActive && k.expiresAt && new Date(k.expiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  const formatCalls = (calls: number) => {
    if (calls >= 1000) {
      return `${(calls / 1000).toFixed(1)}K`;
    }
    return calls.toString();
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
          <div className="flex items-center gap-3">
            <Link href="/enterprise/api-keys/usage">
              <Button variant="secondary" size="sm">
                <span aria-hidden="true">📊</span> {t('usage')}
              </Button>
            </Link>
            <Link href="/enterprise/webhooks">
              <Button variant="secondary" size="sm">
                <span aria-hidden="true">🔗</span> {t('webhooks')}
              </Button>
            </Link>
            <Link href="/enterprise/api-keys/new">
              <Button variant="primary" size="sm">
                + {t('createKey')}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Stats Row */}
          <section
            className="grid grid-cols-4 gap-4 mb-8"
            aria-label={t('stats.ariaLabel')}
          >
            <EnterpriseStatCard
              label={t('stats.totalKeys.label')}
              value={stats.total}
              tooltip={t('stats.totalKeys.tooltip')}
              icon="document"
            />
            <EnterpriseStatCard
              label={t('stats.activeKeys.label')}
              value={stats.active}
              tooltip={t('stats.activeKeys.tooltip')}
              icon="activity"
            />
            <EnterpriseStatCard
              label={t('stats.apiCallsToday.label')}
              value={formatCalls(stats.callsToday)}
              tooltip={t('stats.apiCallsToday.tooltip')}
              icon="chart"
            />
            <EnterpriseStatCard
              label={t('stats.rateLimit.label')}
              value={stats.rateLimit}
              tooltip={t('stats.rateLimit.tooltip')}
              icon="trending"
            />
          </section>

          {/* Expiring Key Alert */}
          {expiringKey && (
            <div
              className="flex items-center gap-4 p-4 mb-8 bg-warning/10 border border-warning rounded-lg"
              role="alert"
            >
              <span className="text-xl" aria-hidden="true">⚠️</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-warning">{t('alert.expiringTitle')}</div>
                <div className="text-xs text-text-secondary">
                  {t('alert.expiringDesc', { keyName: expiringKey.name, days: 7 })}
                </div>
              </div>
              <Button variant="secondary" size="sm">
                {t('alert.rotateKey')}
              </Button>
            </div>
          )}

          {/* API Keys List */}
          <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h2 id="api-keys-title" className="text-base font-semibold text-text-primary">
                {t('list.title')}
              </h2>
            </div>
            <div className="p-6">
              <ul className="space-y-4" aria-labelledby="api-keys-title">
                {apiKeys.map((apiKey) => (
                  <li
                    key={apiKey.id}
                    className={cn(
                      'bg-background-primary border border-white/5 rounded-xl p-6 transition-colors',
                      apiKey.isActive && 'hover:border-white/10'
                    )}
                  >
                    {/* Key Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-2 h-2 rounded-full',
                            apiKey.isActive
                              ? 'bg-success shadow-[0_0_8px_var(--success)]'
                              : 'bg-text-muted'
                          )}
                          aria-label={apiKey.isActive ? t('key.status.active') : t('key.status.inactive')}
                        />
                        <span className="text-sm font-semibold text-text-primary">{apiKey.name}</span>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-semibold',
                            apiKey.environment === 'production'
                              ? 'bg-success/10 text-success'
                              : 'bg-warning/10 text-warning'
                          )}
                        >
                          {t(`key.environment.${apiKey.environment}`)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {apiKey.isActive ? (
                          <>
                            <Button variant="secondary" size="sm" className="text-xs px-2 py-1">
                              {t('key.actions.rotate')}
                            </Button>
                            <Button variant="secondary" size="sm" className="text-xs px-2 py-1">
                              {t('key.actions.revoke')}
                            </Button>
                          </>
                        ) : (
                          <Button variant="secondary" size="sm" className="text-xs px-2 py-1">
                            {t('key.actions.delete')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Key Value */}
                    <div className={cn('flex items-center gap-4 mb-4', !apiKey.isActive && 'opacity-50')}>
                      <code className="flex-1 px-4 py-2 bg-background rounded-lg font-mono text-sm text-text-secondary">
                        {apiKey.maskedKey}
                      </code>
                      {apiKey.isActive && (
                        <Button variant="secondary" size="sm" className="text-xs px-2 py-1">
                          {t('key.actions.copy')}
                        </Button>
                      )}
                    </div>

                    {/* Key Meta */}
                    <div className={cn('flex gap-8 text-xs text-text-tertiary', !apiKey.isActive && 'opacity-50')}>
                      <span className="flex items-center gap-1">
                        <span aria-hidden="true">📅</span>
                        {t('key.meta.created')}: {apiKey.createdAt}
                      </span>
                      {apiKey.expiresAt && (
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true">⏰</span>
                          {t('key.meta.expires')}: {apiKey.expiresAt}
                        </span>
                      )}
                      {apiKey.revokedAt && (
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true">❌</span>
                          {t('key.meta.revoked')}: {apiKey.revokedAt}
                        </span>
                      )}
                      {apiKey.isActive && (
                        <span className="flex items-center gap-1">
                          <span aria-hidden="true">📊</span>
                          {apiKey.callsToday.toLocaleString()} {t('key.meta.callsToday')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span aria-hidden="true">👤</span>
                        {t('key.meta.createdBy')}: {apiKey.createdBy}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
