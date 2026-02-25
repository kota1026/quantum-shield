'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

type Environment = 'production' | 'test';
type Expiration = 'never' | '30days' | '90days' | '1year';

interface Permission {
  id: 'read' | 'write' | 'admin';
  checked: boolean;
}

interface ApiKeyCreateProps {
  className?: string;
}

export function ApiKeyCreate({ className }: ApiKeyCreateProps) {
  const t = useTranslations('enterprise.apiKeyCreate');

  const [keyName, setKeyName] = useState('');
  const [environment, setEnvironment] = useState<Environment>('production');
  const [expiration, setExpiration] = useState<Expiration>('never');
  const [permissions, setPermissions] = useState<Permission[]>([
    { id: 'read', checked: true },
    { id: 'write', checked: true },
    { id: 'admin', checked: false },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  const togglePermission = (id: 'read' | 'write' | 'admin') => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate a mock API key
    const prefix = environment === 'production' ? 'qs_live_' : 'qs_test_';
    const randomPart = Array.from({ length: 32 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
    setGeneratedKey(`${prefix}${randomPart}`);
    setShowSuccess(true);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedKey);
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
            href="/enterprise/api-keys"
            className="w-11 h-11 flex items-center justify-center bg-background-primary border border-white/10 rounded-lg text-text-secondary hover:bg-white/5"
            aria-label={t('backToList')}
          >
            ←
          </Link>
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-[600px]">
          {showSuccess ? (
            /* Success State */
            <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                  <span className="text-success">✓</span> {t('success.title')}
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-text-secondary mb-4">{t('success.message')}</p>
                <div className="p-4 bg-background-primary border border-white/10 rounded-lg font-mono text-sm text-gold break-all mb-4">
                  {generatedKey}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCopy}
                    className="flex-1"
                  >
                    {copied ? t('success.copied') : t('success.copy')}
                  </Button>
                  <Link href="/enterprise/api-keys" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      {t('success.done')}
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit}>
              <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h2 className="text-base font-semibold text-text-primary">{t('card.title')}</h2>
                </div>
                <div className="p-6">
                  {/* Key Name */}
                  <div className="mb-6">
                    <label htmlFor="keyName" className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.name.label')}
                    </label>
                    <input
                      type="text"
                      id="keyName"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder={t('form.name.placeholder')}
                      className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm placeholder:text-text-muted"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">{t('form.name.hint')}</p>
                  </div>

                  {/* Environment */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.environment.label')}
                    </label>
                    <div className="flex flex-col gap-2">
                      <label
                        className={cn(
                          'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                          environment === 'production'
                            ? 'bg-hinomaru/10 border-hinomaru'
                            : 'bg-background-primary border-white/10 hover:border-white/20'
                        )}
                      >
                        <input
                          type="radio"
                          name="environment"
                          value="production"
                          checked={environment === 'production'}
                          onChange={() => setEnvironment('production')}
                          className="accent-hinomaru"
                        />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{t('form.environment.production')}</div>
                          <div className="text-xs text-text-tertiary">{t('form.environment.productionDesc')}</div>
                        </div>
                      </label>
                      <label
                        className={cn(
                          'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                          environment === 'test'
                            ? 'bg-info/10 border-info'
                            : 'bg-background-primary border-white/10 hover:border-white/20'
                        )}
                      >
                        <input
                          type="radio"
                          name="environment"
                          value="test"
                          checked={environment === 'test'}
                          onChange={() => setEnvironment('test')}
                          className="accent-info"
                        />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{t('form.environment.test')}</div>
                          <div className="text-xs text-text-tertiary">{t('form.environment.testDesc')}</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Expiration */}
                  <div className="mb-6">
                    <label htmlFor="expiration" className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.expiration.label')}
                    </label>
                    <select
                      id="expiration"
                      value={expiration}
                      onChange={(e) => setExpiration(e.target.value as Expiration)}
                      className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                    >
                      <option value="never">{t('form.expiration.never')}</option>
                      <option value="30days">{t('form.expiration.days30')}</option>
                      <option value="90days">{t('form.expiration.days90')}</option>
                      <option value="1year">{t('form.expiration.year1')}</option>
                    </select>
                  </div>

                  {/* Permissions */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('form.permissions.label')}
                    </label>
                    <div className="flex flex-col gap-2">
                      {permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className={cn(
                            'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                            permission.checked
                              ? 'bg-gold/10 border-gold/30'
                              : 'bg-background-primary border-white/10 hover:border-white/20'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={permission.checked}
                            onChange={() => togglePermission(permission.id)}
                            className="accent-gold"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-text-primary">
                              {t(`form.permissions.${permission.id}.name`)}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              {t(`form.permissions.${permission.id}.description`)}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Warning */}
                  <div
                    className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-lg mb-6"
                    role="alert"
                  >
                    <span className="text-warning" aria-hidden="true">⚠️</span>
                    <p className="text-sm text-warning">{t('warning.message')}</p>
                  </div>

                  {/* Submit Button */}
                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    <span aria-hidden="true">🔑</span> {t('submit')}
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
