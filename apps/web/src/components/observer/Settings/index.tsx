'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import {
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
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { useObserverSettings } from '@/hooks/observer';

// Fallback data (used when API is unavailable)
const FALLBACK_SETTINGS = {
  profile: {
    observerId: 'OBS-2025-1842',
    walletAddress: '0x5c3e2d9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e',
    email: 'observer@example.com',
    joinedDate: '2025-11-15',
  },
  notifications: {
    emergencyUnlock: true,
    highRiskAlert: true,
    challengeUpdate: true,
    rewardPayment: true,
  },
  security: {
    lastLogin: '2026-01-17 09:15:42 UTC',
    loginHistory: '24',
  },
};

type TabType = 'profile' | 'notifications' | 'security';

export function ObserverSettings() {
  const t = useTranslations('observer.settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saved, setSaved] = useState(false);

  // Fetch data using hooks
  const { data: settingsApi } = useObserverSettings();

  // Use API data with fallback
  const settings = settingsApi ?? FALLBACK_SETTINGS;

  const [notifications, setNotifications] = useState(settings.notifications);

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
    <div className="min-h-screen bg-background">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      <main className="relative z-10 max-w-[1200px] mx-auto px-8 py-8">
        <ObserverHeader />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-foreground-secondary mt-1">{t('description')}</p>
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
                {t('saved')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('save')}
              </>
            )}
          </Button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 mb-6 bg-background-secondary p-1 rounded-xl w-fit"
          role="tablist"
          aria-label={t('tabs')}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'profile'}
            aria-controls="profile-panel"
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'profile' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4" aria-hidden="true" />
            {t('tab.profile')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'notifications'}
            aria-controls="notifications-panel"
            onClick={() => setActiveTab('notifications')}
            className={`px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'notifications' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {t('tab.notifications')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'security'}
            aria-controls="security-panel"
            onClick={() => setActiveTab('security')}
            className={`px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'security' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" aria-hidden="true" />
            {t('tab.security')}
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
                <User className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                {t('profile.basicInfo')}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-foreground-tertiary mb-1">
                    {t('profile.observerId')}
                  </label>
                  <div className="font-mono text-lg">{settings.profile.observerId}</div>
                </div>
                <div>
                  <label className="block text-sm text-foreground-tertiary mb-1">
                    {t('profile.walletAddress')}
                  </label>
                  <div className="flex items-center gap-2 font-mono text-sm">
                    {settings.profile.walletAddress}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-foreground-tertiary mb-1">
                    {t('profile.email')}
                  </label>
                  <input
                    type="email"
                    defaultValue={settings.profile.email}
                    className="w-full px-4 py-2 bg-background border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-hinomaru"
                  />
                </div>
              </div>
            </Card>

            {/* Account Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                {t('profile.accountStatus')}
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-secondary">{t('profile.status')}</span>
                  <Badge variant="success" className="text-[11px]">
                    <div className="w-2 h-2 bg-success rounded-full mr-1 animate-pulse" />
                    {t('profile.statusActive')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-secondary">{t('profile.joinedDate')}</span>
                  <span className="text-sm">{settings.profile.joinedDate}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-secondary">{t('profile.totalChallenges')}</span>
                  <span className="text-sm font-semibold">14</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background rounded-lg">
                  <span className="text-sm text-foreground-secondary">{t('profile.successRate')}</span>
                  <span className="text-sm font-semibold text-success">85.7%</span>
                </div>
              </div>
            </Card>

            {/* Language Settings */}
            <Card className="p-6 col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Languages className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                {t('profile.language')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                {t('profile.languageDescription')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleLanguageChange('ja')}
                  className={cn(
                    'flex items-center gap-3 px-6 py-4 rounded-xl border transition-all',
                    locale === 'ja'
                      ? 'border-hinomaru bg-hinomaru/10 text-hinomaru'
                      : 'border-surface-tertiary hover:border-foreground-tertiary'
                  )}
                >
                  <span className="text-2xl">🇯🇵</span>
                  <div className="text-left">
                    <div className="font-medium">日本語</div>
                    <div className="text-xs text-foreground-tertiary">Japanese</div>
                  </div>
                  {locale === 'ja' && (
                    <CheckCircle className="h-5 w-5 text-hinomaru ml-2" />
                  )}
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={cn(
                    'flex items-center gap-3 px-6 py-4 rounded-xl border transition-all',
                    locale === 'en'
                      ? 'border-hinomaru bg-hinomaru/10 text-hinomaru'
                      : 'border-surface-tertiary hover:border-foreground-tertiary'
                  )}
                >
                  <span className="text-2xl">🇺🇸</span>
                  <div className="text-left">
                    <div className="font-medium">English</div>
                    <div className="text-xs text-foreground-tertiary">英語</div>
                  </div>
                  {locale === 'en' && (
                    <CheckCircle className="h-5 w-5 text-hinomaru ml-2" />
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
              <Bell className="h-5 w-5 text-hinomaru" aria-hidden="true" />
              {t('notifications.title')}
            </h3>
            <p className="text-sm text-foreground-secondary mb-6">
              {t('notifications.description')}
            </p>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-background rounded-lg"
                >
                  <div>
                    <div className="font-medium">{t(`notifications.${key}.title`)}</div>
                    <div className="text-sm text-foreground-tertiary">
                      {t(`notifications.${key}.description`)}
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
                <Smartphone className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                {t('security.twoFactor.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                {t('security.twoFactor.description')}
              </p>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">{t('security.twoFactor.enabled')}</div>
                    <div className="text-xs text-foreground-tertiary">
                      {t('security.twoFactor.lastUsed')}: 2026/01/17
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t('security.twoFactor.manage')}
                </Button>
              </div>
            </Card>

            {/* Login History */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Key className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                {t('security.loginHistory.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                {t('security.loginHistory.description')}
              </p>
              <div className="p-4 bg-background rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-foreground-secondary">
                    {t('security.loginHistory.lastLogin')}
                  </span>
                  <span className="text-sm">{settings.security.lastLogin}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">
                    {t('security.loginHistory.totalLogins')}
                  </span>
                  <Badge variant="info">{settings.security.loginHistory}</Badge>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 col-span-2 border-danger/30">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-danger">
                <Shield className="h-5 w-5" aria-hidden="true" />
                {t('security.dangerZone.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                {t('security.dangerZone.description')}
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="border-danger text-danger hover:bg-danger/10">
                  {t('security.dangerZone.deactivate')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
