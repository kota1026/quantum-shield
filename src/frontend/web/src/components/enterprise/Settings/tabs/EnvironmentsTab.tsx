'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Server, Globe, Shield, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useEnvironments } from '@/hooks/enterprise';
import { MOCK_ENVIRONMENTS as MOCK_ENVIRONMENTS_DATA } from '@/lib/api/enterprise/mock';

interface Environment {
  id: string;
  name: string;
  type: 'production' | 'staging' | 'test';
  endpoint: string;
  apiKey: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Fallback data for when API is unavailable
const FALLBACK_ENVIRONMENTS: Environment[] = MOCK_ENVIRONMENTS_DATA.map(e => ({
  id: e.id,
  name: e.name,
  type: e.type as 'production' | 'staging' | 'test',
  endpoint: e.endpoint,
  apiKey: e.api_key,
  status: e.status as 'active' | 'inactive',
  createdAt: e.created_at,
}));

const ENV_COLORS = {
  production: { bg: 'bg-hinomaru/10', text: 'text-hinomaru', border: 'border-hinomaru/30' },
  staging: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/30' },
  test: { bg: 'bg-info/10', text: 'text-info', border: 'border-info/30' },
};

export function EnvironmentsTab() {
  const t = useTranslations('enterprise.settings.environments');

  // Use API hook with fallback
  const { data: envsData } = useEnvironments();
  const environments: Environment[] = envsData?.environments?.map(e => ({
    id: e.id,
    name: e.name,
    type: e.type as 'production' | 'staging' | 'test',
    endpoint: e.endpoint,
    apiKey: e.api_key,
    status: e.status as 'active' | 'inactive',
    createdAt: e.created_at,
  })) ?? FALLBACK_ENVIRONMENTS;

  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      {/* Environment Overview */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Server className="w-5 h-5 text-hinomaru" />
              {t('title')}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{t('description')}</p>
          </div>
          <Button variant="primary" size="sm" className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-2" />
            {t('addEnvironment')}
          </Button>
        </div>

        <div className="divide-y divide-white/5">
          {environments.map((env) => (
            <div key={env.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', ENV_COLORS[env.type].bg)}>
                    <Globe className={cn('w-5 h-5', ENV_COLORS[env.type].text)} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary">{env.name}</h3>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        ENV_COLORS[env.type].bg,
                        ENV_COLORS[env.type].text
                      )}>
                        {t(`types.${env.type}`)}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        env.status === 'active' ? 'bg-success/20 text-success' : 'bg-white/10 text-text-tertiary'
                      )}>
                        {t(`status.${env.status}`)}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {t('createdAt')}: {env.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEnv(selectedEnv === env.id ? null : env.id)}>
                    {selectedEnv === env.id ? t('hideDetails') : t('showDetails')}
                  </Button>
                  {env.type !== 'production' && (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Environment Details */}
              {selectedEnv === env.id && (
                <div className="mt-4 p-4 bg-background-primary rounded-xl border border-white/5 space-y-4">
                  {/* Endpoint */}
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">{t('endpoint')}</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-background-secondary rounded-lg text-sm text-text-primary font-mono">
                        {env.endpoint}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(env.endpoint)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/5 rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label={t('copy')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-xs text-text-tertiary mb-1">{t('apiKey')}</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-background-secondary rounded-lg text-sm text-text-primary font-mono">
                        {visibleKeys.has(env.id) ? env.apiKey : maskApiKey(env.apiKey)}
                      </code>
                      <button
                        type="button"
                        onClick={() => toggleKeyVisibility(env.id)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/5 rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label={visibleKeys.has(env.id) ? t('hideKey') : t('showKey')}
                      >
                        {visibleKeys.has(env.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(env.apiKey)}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/5 rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label={t('copy')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="secondary" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t('rotateKey')}
                    </Button>
                    <Button variant="ghost" size="sm">
                      {t('viewLogs')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Environment Permissions */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Shield className="w-5 h-5 text-gold" />
            {t('permissions.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('permissions.description')}</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background-primary rounded-xl border border-white/5">
              <div>
                <p className="font-medium text-text-primary">{t('permissions.prodAccess.title')}</p>
                <p className="text-sm text-text-tertiary">{t('permissions.prodAccess.description')}</p>
              </div>
              <select className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm">
                <option value="admin">{t('permissions.roles.admin')}</option>
                <option value="developer">{t('permissions.roles.developer')}</option>
                <option value="viewer">{t('permissions.roles.viewer')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-primary rounded-xl border border-white/5">
              <div>
                <p className="font-medium text-text-primary">{t('permissions.stagingAccess.title')}</p>
                <p className="text-sm text-text-tertiary">{t('permissions.stagingAccess.description')}</p>
              </div>
              <select className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm">
                <option value="developer">{t('permissions.roles.developer')}</option>
                <option value="admin">{t('permissions.roles.admin')}</option>
                <option value="viewer">{t('permissions.roles.viewer')}</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-background-primary rounded-xl border border-white/5">
              <div>
                <p className="font-medium text-text-primary">{t('permissions.testAccess.title')}</p>
                <p className="text-sm text-text-tertiary">{t('permissions.testAccess.description')}</p>
              </div>
              <select className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-text-primary text-sm">
                <option value="all">{t('permissions.roles.all')}</option>
                <option value="developer">{t('permissions.roles.developer')}</option>
                <option value="admin">{t('permissions.roles.admin')}</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
