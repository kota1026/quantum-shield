'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Key,
  Mail,
  Smartphone,
  Save,
  CheckCircle,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ProverSidebar } from './ProverSidebar';

// Default initial state — TODO: integrate with useProverSettings() hook
const DEFAULT_SETTINGS = {
  profile: {
    proverId: '-',
    organizationName: '-',
    email: '-',
    country: '-',
    tier: '-',
    joinedDate: '-',
  },
  notifications: {
    email: false,
    slack: false,
    slaWarning: false,
    dailyReport: false,
    challengeAlert: false,
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: '-',
    apiKeys: 0,
    allowedIps: [] as string[],
  },
};

type TabType = 'profile' | 'notifications' | 'security';

export function ProverSettings() {
  const t = useTranslations('prover');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [notifications, setNotifications] = useState(DEFAULT_SETTINGS.notifications);
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <ProverSidebar activePage="settings" />

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Premium Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -top-24 left-1/2 -translate-x-1/2',
              'w-[800px] h-[500px]',
              'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
              'opacity-50'
            )}
          />
        </div>

        <div className="relative z-10">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
              <p className="text-foreground-secondary mt-1">{t('settings.description')}</p>
            </div>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saved}
              className="flex items-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                  {t('settings.saved')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {t('settings.save')}
                </>
              )}
            </Button>
          </div>

          {/* Tab Navigation */}
          <div
            className="flex gap-1 mb-6 bg-background-secondary p-1 rounded-xl w-fit"
            role="tablist"
            aria-label={t('settings.tabs')}
          >
            <button
              role="tab"
              aria-selected={activeTab === 'profile'}
              aria-controls="profile-panel"
              onClick={() => setActiveTab('profile')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px] ${
                activeTab === 'profile' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {t('settings.tab.profile')}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'notifications'}
              aria-controls="notifications-panel"
              onClick={() => setActiveTab('notifications')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px] ${
                activeTab === 'notifications' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {t('settings.tab.notifications')}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'security'}
              aria-controls="security-panel"
              onClick={() => setActiveTab('security')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px] ${
                activeTab === 'security' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t('settings.tab.security')}
            </button>
          </div>

          {/* Profile Tab */}
          <div
            id="profile-panel"
            role="tabpanel"
            aria-labelledby="profile-tab"
            className={activeTab === 'profile' ? '' : 'hidden'}
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-gold" aria-hidden="true" />
                  {t('settings.profile.basicInfo')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-foreground-tertiary mb-1">
                      {t('settings.profile.proverId')}
                    </label>
                    <div className="font-mono text-lg">{DEFAULT_SETTINGS.profile.proverId}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-tertiary mb-1">
                      {t('settings.profile.organization')}
                    </label>
                    <input
                      type="text"
                      defaultValue={DEFAULT_SETTINGS.profile.organizationName}
                      className="w-full px-4 py-2 bg-background border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-tertiary mb-1">
                      {t('settings.profile.email')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                      <span>{DEFAULT_SETTINGS.profile.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-tertiary mb-1">
                      {t('settings.profile.country')}
                    </label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                      <span>{DEFAULT_SETTINGS.profile.country}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Account Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gold" aria-hidden="true" />
                  {t('settings.profile.accountStatus')}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-sm text-foreground-secondary">{t('settings.profile.tier')}</span>
                    <Badge variant="success" className="text-[11px]">
                      {DEFAULT_SETTINGS.profile.tier}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-sm text-foreground-secondary">{t('settings.profile.status')}</span>
                    <Badge variant="success" className="text-[11px]">
                      <div className="w-2 h-2 bg-success rounded-full mr-1 animate-pulse" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                    <span className="text-sm text-foreground-secondary">{t('settings.profile.joinedDate')}</span>
                    <span className="text-sm">{DEFAULT_SETTINGS.profile.joinedDate}</span>
                  </div>
                </div>
              </Card>

              {/* Language Settings */}
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Languages className="h-5 w-5 text-gold" aria-hidden="true" />
                  {t('settings.profile.language')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('settings.profile.languageDescription')}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleLanguageChange('ja')}
                    className={cn(
                      'flex items-center gap-3 px-6 py-4 rounded-xl border transition-all',
                      locale === 'ja'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-surface-tertiary hover:border-foreground-tertiary'
                    )}
                  >
                    <span className="text-2xl">🇯🇵</span>
                    <div className="text-left">
                      <div className="font-medium">日本語</div>
                      <div className="text-xs text-foreground-tertiary">Japanese</div>
                    </div>
                    {locale === 'ja' && (
                      <CheckCircle className="h-5 w-5 text-gold ml-2" />
                    )}
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={cn(
                      'flex items-center gap-3 px-6 py-4 rounded-xl border transition-all',
                      locale === 'en'
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-surface-tertiary hover:border-foreground-tertiary'
                    )}
                  >
                    <span className="text-2xl">🇺🇸</span>
                    <div className="text-left">
                      <div className="font-medium">English</div>
                      <div className="text-xs text-foreground-tertiary">英語</div>
                    </div>
                    {locale === 'en' && (
                      <CheckCircle className="h-5 w-5 text-gold ml-2" />
                    )}
                  </button>
                </div>
              </Card>
            </div>
          </div>

          {/* Notifications Tab */}
          <div
            id="notifications-panel"
            role="tabpanel"
            aria-labelledby="notifications-tab"
            className={activeTab === 'notifications' ? '' : 'hidden'}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-gold" aria-hidden="true" />
                {t('settings.notifications.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-6">
                {t('settings.notifications.description')}
              </p>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-4 bg-background rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{t(`settings.notifications.${key}.title`)}</div>
                      <div className="text-sm text-foreground-tertiary">
                        {t(`settings.notifications.${key}.description`)}
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={value}
                      onClick={() => handleNotificationToggle(key as keyof typeof notifications)}
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors',
                        value ? 'bg-success' : 'bg-surface-tertiary'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                          value ? 'translate-x-7' : 'translate-x-1'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Security Tab */}
          <div
            id="security-panel"
            role="tabpanel"
            aria-labelledby="security-tab"
            className={activeTab === 'security' ? '' : 'hidden'}
          >
            <div className="grid grid-cols-2 gap-6">
              {/* Two-Factor Auth */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-gold" aria-hidden="true" />
                  {t('settings.security.twoFactor.title')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('settings.security.twoFactor.description')}
                </p>
                <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="font-medium">{t('settings.security.twoFactor.enabled')}</div>
                      <div className="text-xs text-foreground-tertiary">
                        {t('settings.security.twoFactor.lastUsed')}: 2026/01/17
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('settings.security.twoFactor.manage')}
                  </Button>
                </div>
              </Card>

              {/* API Keys */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-gold" aria-hidden="true" />
                  {t('settings.security.apiKeys.title')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('settings.security.apiKeys.description')}
                </p>
                <div className="p-4 bg-background rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-foreground-secondary">
                      {t('settings.security.apiKeys.active')}
                    </span>
                    <Badge variant="info">{DEFAULT_SETTINGS.security.apiKeys}</Badge>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    {t('settings.security.apiKeys.manage')}
                  </Button>
                </div>
              </Card>

              {/* IP Whitelist */}
              <Card className="p-6 col-span-2">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gold" aria-hidden="true" />
                  {t('settings.security.ipWhitelist.title')}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {t('settings.security.ipWhitelist.description')}
                </p>
                <div className="space-y-2">
                  {DEFAULT_SETTINGS.security.allowedIps.map((ip, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-background rounded-lg font-mono text-sm"
                    >
                      <span>{ip}</span>
                      <Button variant="ghost" size="sm" className="text-danger hover:text-danger">
                        {t('settings.security.ipWhitelist.remove')}
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4">
                  {t('settings.security.ipWhitelist.add')}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
