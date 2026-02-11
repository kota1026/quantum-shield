'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Key,
  Wallet,
  Bell,
  Mail,
  Moon,
  Globe,
  DollarSign,
  Lock,
  Fingerprint,
  HelpCircle,
  MessageCircle,
  FileText,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from './SettingsSection';
import { SettingsItem } from './SettingsItem';
import { useUserSettingsV2, useUpdateUserSettings } from '@/hooks/consumer';

// Type definition for user settings
interface UserSettings {
  walletAddress: string;
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  biometricAuth: boolean;
  currency: string;
  autoLockMinutes: number;
  locale: string;
}

// Fallback data (used when API is unavailable)
const FALLBACK_SETTINGS: UserSettings = {
  walletAddress: '0x1234...5678',
  pushNotifications: true,
  emailNotifications: false,
  darkMode: true,
  biometricAuth: false,
  currency: 'JPY (¥)',
  autoLockMinutes: 5,
  locale: 'ja',
};
const VERSION = '1.0.0';
const BUILD = '2026.01.06';

export function Settings() {
  const t = useTranslations('consumer.settings');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // Fetch user settings using new API hooks
  const { data: settingsData } = useUserSettingsV2();

  // Transform API data to component format
  const settings: UserSettings = settingsData ? {
    walletAddress: settingsData.address,
    pushNotifications: true, // TODO: Add to API
    emailNotifications: settingsData.notifications?.emailEnabled ?? false,
    darkMode: true, // TODO: Add to API
    biometricAuth: settingsData.twoFactorEnabled ?? false,
    currency: 'JPY (¥)', // TODO: Add to API
    autoLockMinutes: 5, // TODO: Add to API
    locale: settingsData.language || 'ja',
  } : FALLBACK_SETTINGS;

  // Toggle states (initialized from API data)
  const [pushNotifications, setPushNotifications] = useState(settings.pushNotifications ?? true);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications ?? false);
  const [darkMode, setDarkMode] = useState(settings.darkMode ?? true);
  const [biometricAuth, setBiometricAuth] = useState(settings.biometricAuth ?? true);
  const [currency, setCurrency] = useState(settings.currency ?? 'JPY (¥)');
  const [autoLockMinutes, setAutoLockMinutes] = useState(settings.autoLockMinutes ?? 5);

  // Navigation handlers
  const handleKeyManagement = useCallback(() => {
    router.push('/consumer/key-management');
  }, [router]);

  const handleConnectedWallet = useCallback(() => {
    // Future: Open wallet modal or navigate
    console.log('Connected wallet clicked');
  }, []);

  const handleLanguage = useCallback(() => {
    // Toggle between Japanese and English
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    // Use next-intl's router to switch locale while staying on the same page
    router.replace(pathname, { locale: newLocale });
  }, [locale, pathname, router]);

  const handleCurrency = useCallback(() => {
    // Simple currency toggle for demo
    const currencies = ['JPY (¥)', 'USD ($)', 'EUR (€)'];
    const currentIndex = currencies.indexOf(currency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setCurrency(currencies[nextIndex]);
  }, [currency]);

  const handleAutoLock = useCallback(() => {
    // Simple auto-lock toggle for demo
    const options = [5, 10, 15, 30];
    const currentIndex = options.indexOf(autoLockMinutes);
    const nextIndex = (currentIndex + 1) % options.length;
    setAutoLockMinutes(options[nextIndex]);
  }, [autoLockMinutes]);

  const handleFAQ = useCallback(() => {
    router.push('/consumer/faq');
  }, [router]);

  const handleContact = useCallback(() => {
    router.push('/consumer/contact');
  }, [router]);

  const handleLegal = useCallback(() => {
    router.push('/consumer/terms');
  }, [router]);

  const handleDisconnectWallet = useCallback(() => {
    // Future: Confirm and disconnect wallet
    console.log('Disconnect wallet clicked');
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <main role="main" className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/dashboard"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* Account Section */}
        <SettingsSection title={t('sections.account')}>
          <SettingsItem
            icon={<Key className="w-5 h-5" />}
            title={t('account.keyManagement.title')}
            description={t('account.keyManagement.description')}
            action={{ type: 'navigate', onClick: handleKeyManagement }}
          />
          <SettingsItem
            icon={<Wallet className="w-5 h-5" />}
            title={t('account.connectedWallet.title')}
            description={t('account.connectedWallet.description')}
            action={{
              type: 'value',
              value: settings.walletAddress,
              onClick: handleConnectedWallet,
            }}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title={t('sections.notifications')}>
          <SettingsItem
            icon={<Bell className="w-5 h-5" />}
            title={t('notifications.push.title')}
            description={t('notifications.push.description')}
            action={{
              type: 'toggle',
              checked: pushNotifications,
              onChange: setPushNotifications,
            }}
          />
          <SettingsItem
            icon={<Mail className="w-5 h-5" />}
            title={t('notifications.email.title')}
            description={t('notifications.email.description')}
            action={{
              type: 'toggle',
              checked: emailNotifications,
              onChange: setEmailNotifications,
            }}
          />
        </SettingsSection>

        {/* Display Section */}
        <SettingsSection title={t('sections.display')}>
          <SettingsItem
            icon={<Moon className="w-5 h-5" />}
            title={t('display.darkMode.title')}
            description={t('display.darkMode.description')}
            action={{
              type: 'toggle',
              checked: darkMode,
              onChange: setDarkMode,
            }}
          />
          <SettingsItem
            icon={<Globe className="w-5 h-5" />}
            title={t('display.language.title')}
            description={t('display.language.description')}
            action={{
              type: 'value',
              value: locale === 'ja' ? t('display.language.japanese') : t('display.language.english'),
              onClick: handleLanguage,
            }}
          />
          <SettingsItem
            icon={<DollarSign className="w-5 h-5" />}
            title={t('display.currency.title')}
            description={t('display.currency.description')}
            action={{
              type: 'value',
              value: currency,
              onClick: handleCurrency,
            }}
          />
        </SettingsSection>

        {/* Security Section */}
        <SettingsSection title={t('sections.security')}>
          <SettingsItem
            icon={<Lock className="w-5 h-5" />}
            title={t('security.autoLock.title')}
            description={t('security.autoLock.description')}
            action={{
              type: 'value',
              value: t('security.autoLock.minutes', { count: autoLockMinutes }),
              onClick: handleAutoLock,
            }}
          />
          <SettingsItem
            icon={<Fingerprint className="w-5 h-5" />}
            title={t('security.biometric.title')}
            description={t('security.biometric.description')}
            action={{
              type: 'toggle',
              checked: biometricAuth,
              onChange: setBiometricAuth,
            }}
          />
        </SettingsSection>

        {/* Support Section */}
        <SettingsSection title={t('sections.support')}>
          <SettingsItem
            icon={<HelpCircle className="w-5 h-5" />}
            title={t('support.faq.title')}
            description={t('support.faq.description')}
            action={{ type: 'navigate', onClick: handleFAQ }}
          />
          <SettingsItem
            icon={<MessageCircle className="w-5 h-5" />}
            title={t('support.contact.title')}
            description={t('support.contact.description')}
            action={{ type: 'navigate', onClick: handleContact }}
          />
          <SettingsItem
            icon={<FileText className="w-5 h-5" />}
            title={t('support.legal.title')}
            description={t('support.legal.description')}
            action={{ type: 'navigate', onClick: handleLegal }}
          />
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title={t('sections.dangerZone')}
          variant="danger"
          className="mt-12"
        >
          <SettingsItem
            icon={<LogOut className="w-5 h-5" />}
            title={t('danger.disconnectWallet.title')}
            description={t('danger.disconnectWallet.description')}
            action={{ type: 'navigate', onClick: handleDisconnectWallet }}
            variant="danger"
          />
        </SettingsSection>

        {/* Version Info */}
        <footer className="text-center mt-12 py-6">
          <p className="text-xs text-foreground-tertiary mb-2">
            {t('version.label')}
          </p>
          <p className="text-sm text-foreground-secondary font-mono">
            {t('version.version', { version: VERSION, build: BUILD })}
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Settings;
