'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

// Demo data - In production, this would come from API/hooks
const DEMO_WALLET_ADDRESS = '0x7a3f...9c2d';
const DEMO_AUTO_LOCK_MINUTES = 5;
const DEMO_CURRENCY = 'JPY (¥)';
const VERSION = '1.0.0';
const BUILD = '2026.01.06';

export function Settings() {
  const t = useTranslations('consumer.settings');
  const router = useRouter();

  // Toggle states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(true);

  // Navigation handlers
  const handleKeyManagement = useCallback(() => {
    router.push('/consumer/key-management');
  }, [router]);

  const handleConnectedWallet = useCallback(() => {
    // Future: Open wallet modal or navigate
    console.log('Connected wallet clicked');
  }, []);

  const handleLanguage = useCallback(() => {
    // Future: Open language selector
    console.log('Language clicked');
  }, []);

  const handleCurrency = useCallback(() => {
    // Future: Open currency selector
    console.log('Currency clicked');
  }, []);

  const handleAutoLock = useCallback(() => {
    // Future: Open auto-lock selector
    console.log('Auto lock clicked');
  }, []);

  const handleFAQ = useCallback(() => {
    router.push('/consumer/faq');
  }, [router]);

  const handleContact = useCallback(() => {
    // Future: Open contact form or email
    console.log('Contact clicked');
  }, []);

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
      <div className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/dashboard"
            className={cn(
              'w-10 h-10 flex items-center justify-center',
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
              value: DEMO_WALLET_ADDRESS,
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
              value: t('display.language.japanese'),
              onClick: handleLanguage,
            }}
          />
          <SettingsItem
            icon={<DollarSign className="w-5 h-5" />}
            title={t('display.currency.title')}
            description={t('display.currency.description')}
            action={{
              type: 'value',
              value: DEMO_CURRENCY,
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
              value: t('security.autoLock.minutes', { count: DEMO_AUTO_LOCK_MINUTES }),
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
      </div>
    </div>
  );
}

export default Settings;
