'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Settings,
  ChevronRight,
  Globe,
  Bell,
  Database,
  Shield,
  Mail,
  Clock,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Mock data
const mockSystemSettings = {
  general: {
    siteName: 'Quantum Shield Admin',
    siteUrl: 'https://admin.quantumshield.io',
    supportEmail: 'support@quantumshield.io',
    defaultLanguage: 'ja',
    timezone: 'Asia/Tokyo',
  },
  notifications: {
    emailNotifications: true,
    slackIntegration: true,
    webhookAlerts: true,
    dailyDigest: false,
  },
  security: {
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    passwordExpiry: '90',
    requireMfa: true,
    ipWhitelist: false,
  },
  maintenance: {
    maintenanceMode: false,
    scheduledMaintenance: null,
    lastBackup: '2026-01-18 03:00',
    backupFrequency: 'daily',
  },
};

export function SettingsSystem() {
  const t = useTranslations('admin.settingsSystem');
  const [settings, setSettings] = useState(mockSystemSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (section: string, key: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: !(prev[section as keyof typeof prev] as Record<string, boolean>)[key],
      },
    }));
    setHasChanges(true);
  };

  const handleInputChange = (section: string, key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/settings/members" className="hover:text-foreground">
                {t('breadcrumbParent')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              {hasChanges && (
                <Button variant="primary" leftIcon={<Save className="h-4 w-4" />}>
                  {t('actions.saveChanges')}
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Globe className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('general.title')}</CardTitle>
                    <p className="text-sm text-foreground-tertiary">{t('general.description')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('general.siteName')}</label>
                    <input
                      type="text"
                      value={settings.general.siteName}
                      onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
                      className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('general.siteUrl')}</label>
                    <input
                      type="text"
                      value={settings.general.siteUrl}
                      onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
                      className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('general.supportEmail')}</label>
                    <input
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                      className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('general.timezone')}</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                      className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                    >
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Bell className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('notifications.title')}</CardTitle>
                    <p className="text-sm text-foreground-tertiary">{t('notifications.description')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: t('notifications.emailNotifications') },
                    { key: 'slackIntegration', label: t('notifications.slackIntegration') },
                    { key: 'webhookAlerts', label: t('notifications.webhookAlerts') },
                    { key: 'dailyDigest', label: t('notifications.dailyDigest') },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4"
                    >
                      <span className="text-sm">{item.label}</span>
                      <button
                        onClick={() => handleToggle('notifications', item.key)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          settings.notifications[item.key as keyof typeof settings.notifications]
                            ? 'bg-gold'
                            : 'bg-foreground-tertiary'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                            settings.notifications[item.key as keyof typeof settings.notifications] && 'translate-x-5'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Shield className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('security.title')}</CardTitle>
                    <p className="text-sm text-foreground-tertiary">{t('security.description')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('security.sessionTimeout')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => handleInputChange('security', 'sessionTimeout', e.target.value)}
                        className="w-24 rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                      />
                      <span className="text-sm text-foreground-tertiary">{t('security.minutes')}</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('security.maxLoginAttempts')}</label>
                    <input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => handleInputChange('security', 'maxLoginAttempts', e.target.value)}
                      className="w-24 rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('security.passwordExpiry')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.security.passwordExpiry}
                        onChange={(e) => handleInputChange('security', 'passwordExpiry', e.target.value)}
                        className="w-24 rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                      />
                      <span className="text-sm text-foreground-tertiary">{t('security.days')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  {[
                    { key: 'requireMfa', label: t('security.requireMfa') },
                    { key: 'ipWhitelist', label: t('security.ipWhitelist') },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4"
                    >
                      <span className="text-sm">{item.label}</span>
                      <button
                        onClick={() => handleToggle('security', item.key)}
                        className={cn(
                          'relative h-6 w-11 rounded-full transition-colors',
                          settings.security[item.key as keyof typeof settings.security]
                            ? 'bg-gold'
                            : 'bg-foreground-tertiary'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                            settings.security[item.key as keyof typeof settings.security] && 'translate-x-5'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Maintenance Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                    <Database className="h-5 w-5 text-danger" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{t('maintenance.title')}</CardTitle>
                    <p className="text-sm text-foreground-tertiary">{t('maintenance.description')}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4">
                    <div>
                      <div className="text-sm font-medium">{t('maintenance.maintenanceMode')}</div>
                      <div className="text-xs text-foreground-tertiary">{t('maintenance.maintenanceModeDescription')}</div>
                    </div>
                    <button
                      onClick={() => handleToggle('maintenance', 'maintenanceMode')}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        settings.maintenance.maintenanceMode
                          ? 'bg-danger'
                          : 'bg-foreground-tertiary'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                          settings.maintenance.maintenanceMode && 'translate-x-5'
                        )}
                      />
                    </button>
                  </div>

                  <div className="rounded-lg border border-surface-tertiary p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{t('maintenance.lastBackup')}</div>
                        <div className="text-xs text-foreground-tertiary">{settings.maintenance.lastBackup}</div>
                      </div>
                      <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
                        {t('maintenance.runBackup')}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">{t('maintenance.backupFrequency')}</label>
                    <select
                      value={settings.maintenance.backupFrequency}
                      onChange={(e) => handleInputChange('maintenance', 'backupFrequency', e.target.value)}
                      className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                    >
                      <option value="hourly">{t('maintenance.frequencies.hourly')}</option>
                      <option value="daily">{t('maintenance.frequencies.daily')}</option>
                      <option value="weekly">{t('maintenance.frequencies.weekly')}</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
