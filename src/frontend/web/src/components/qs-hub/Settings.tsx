'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Tab = 'profile' | 'notifications' | 'security';

// Demo data
const FALLBACK_USER = {
  address: '0x7a3f9c2d8e1b4f6a...3d4e',
  email: 'user@example.com',
  veQS: 125000,
  joinedDate: '2024-01-15',
};

export function QSHubSettings() {
  const t = useTranslations('qs-hub.settings');
  const tCommon = useTranslations('qs-hub.common');
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [language, setLanguage] = useState('ja');

  const [notifications, setNotifications] = useState({
    email: true,
    browser: false,
    proposalUpdates: true,
    rewardAlerts: true,
    delegationChanges: true,
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const tabs = [
    { id: 'profile' as const, icon: User, label: t('tabs.profile') },
    { id: 'notifications' as const, icon: Bell, label: t('tabs.notifications') },
    { id: 'security' as const, icon: Shield, label: t('tabs.security') },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      <main className="relative z-10 max-w-[1000px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/dashboard"
            className="min-h-[44px] px-2 -ml-2 inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {tCommon('backToHome')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">{tCommon('portalName')}</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-6">
          {/* Tabs */}
          <nav
            className="flex lg:flex-col gap-2"
            role="tablist"
            aria-label={t('tabs.ariaLabel')}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            {activeTab === 'profile' && (
              <Card className="p-6">
                <h2 className="font-semibold mb-6">{t('profile.title')}</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground-tertiary mb-2">
                      {t('profile.walletAddress')}
                    </label>
                    <div className="px-4 py-3 bg-surface rounded-lg font-mono text-sm">
                      {FALLBACK_USER.address}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-tertiary mb-2">
                      {t('profile.email')}
                    </label>
                    <input
                      type="email"
                      defaultValue={FALLBACK_USER.email}
                      className={cn(
                        'w-full px-4 py-3 rounded-lg',
                        'bg-surface border border-border',
                        'focus:border-gold focus:ring-1 focus:ring-gold',
                        'transition-colors'
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground-tertiary mb-2">
                      {t('profile.language')}
                    </label>
                    <div className="flex gap-2">
                      {[
                        { id: 'ja', label: '日本語', icon: '🇯🇵' },
                        { id: 'en', label: 'English', icon: '🇺🇸' },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => setLanguage(lang.id)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                            language === lang.id
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border hover:border-foreground-tertiary'
                          )}
                        >
                          <span>{lang.icon}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 p-4 bg-surface rounded-lg">
                    <div>
                      <div className="text-sm text-foreground-tertiary">{t('profile.veQSBalance')}</div>
                      <div className="text-lg font-semibold text-gold">
                        {FALLBACK_USER.veQS.toLocaleString()} veQS
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-foreground-tertiary">{t('profile.memberSince')}</div>
                      <div className="text-lg font-semibold">{FALLBACK_USER.joinedDate}</div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card className="p-6">
                <h2 className="font-semibold mb-6">{t('notifications.title')}</h2>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-surface rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{t(`notifications.${key}.title`)}</div>
                        <div className="text-sm text-foreground-tertiary">
                          {t(`notifications.${key}.description`)}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications({ ...notifications, [key]: !value })
                        }
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          value ? 'bg-gold' : 'bg-foreground-tertiary/30'
                        )}
                        role="switch"
                        aria-checked={value}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                            value ? 'left-7' : 'left-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="p-6">
                <h2 className="font-semibold mb-6">{t('security.title')}</h2>

                <div className="space-y-6">
                  <div className="p-4 bg-surface rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">{t('security.twoFactor.title')}</div>
                        <div className="text-sm text-foreground-tertiary">
                          {t('security.twoFactor.description')}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('security.twoFactor.enable')}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-surface rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="font-medium">{t('security.sessions.title')}</div>
                        <div className="text-sm text-foreground-tertiary">
                          {t('security.sessions.description')}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {t('security.sessions.manage')}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border border-danger/30 bg-danger/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-danger">{t('security.dangerZone.title')}</div>
                        <div className="text-sm text-foreground-tertiary">
                          {t('security.dangerZone.description')}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-danger text-danger">
                        {t('security.dangerZone.disconnect')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 mt-6">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">{t('saveSuccess')}</span>
                </div>
              )}
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveButton')
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            © 2024 Quantum Shield. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default QSHubSettings;
