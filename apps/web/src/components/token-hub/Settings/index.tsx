'use client';

import { useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname, Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Wallet,
  Bell,
  Mail,
  Moon,
  Globe,
  DollarSign,
  Shield,
  Lock,
  HelpCircle,
  MessageCircle,
  FileText,
  LogOut,
  Vote,
  Percent,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SettingsSection } from '@/components/consumer/Settings/SettingsSection';
import { SettingsItem } from '@/components/consumer/Settings/SettingsItem';

// Demo data - In production, this would come from API/hooks
const DEMO_WALLET_ADDRESS = '0x7a3f...9c2d';
const VERSION = '1.0.0';
const BUILD = '2026.01.16';

export function TokenHubSettings() {
  const t = useTranslations('token-hub.settings');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  // Toggle states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [rewardAutoCompound, setRewardAutoCompound] = useState(false);
  const [voteReminders, setVoteReminders] = useState(true);
  const [currency, setCurrency] = useState('JPY (¥)');

  // Navigation handlers
  const handleConnectedWallet = useCallback(() => {
    // Future: Open wallet modal
    console.log('Connected wallet clicked');
  }, []);

  const handleLanguage = useCallback(() => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  }, [locale, pathname, router]);

  const handleCurrency = useCallback(() => {
    const currencies = ['JPY (¥)', 'USD ($)', 'EUR (€)'];
    const currentIndex = currencies.indexOf(currency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setCurrency(currencies[nextIndex]);
  }, [currency]);

  const handleDelegations = useCallback(() => {
    router.push('/token-hub/delegate-list');
  }, [router]);

  const handleLockPositions = useCallback(() => {
    router.push('/token-hub/unlock');
  }, [router]);

  const handleFAQ = useCallback(() => {
    router.push('/token-hub/faq');
  }, [router]);

  const handleContact = useCallback(() => {
    // Open contact or support page
    router.push('/token-hub/faq');
  }, [router]);

  const handleLegal = useCallback(() => {
    // Navigate to terms page
    window.open('/terms', '_blank');
  }, []);

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
            href="/token-hub/dashboard"
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
            icon={<Wallet className="w-5 h-5" />}
            title={t('account.connectedWallet.title')}
            description={t('account.connectedWallet.description')}
            action={{
              type: 'value',
              value: DEMO_WALLET_ADDRESS,
              onClick: handleConnectedWallet,
            }}
          />
          <SettingsItem
            icon={<Lock className="w-5 h-5" />}
            title={t('account.lockPositions.title')}
            description={t('account.lockPositions.description')}
            action={{ type: 'navigate', onClick: handleLockPositions }}
          />
          <SettingsItem
            icon={<Vote className="w-5 h-5" />}
            title={t('account.delegations.title')}
            description={t('account.delegations.description')}
            action={{ type: 'navigate', onClick: handleDelegations }}
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
          <SettingsItem
            icon={<Vote className="w-5 h-5" />}
            title={t('notifications.voteReminders.title')}
            description={t('notifications.voteReminders.description')}
            action={{
              type: 'toggle',
              checked: voteReminders,
              onChange: setVoteReminders,
            }}
          />
        </SettingsSection>

        {/* Rewards Section */}
        <SettingsSection title={t('sections.rewards')}>
          <SettingsItem
            icon={<Percent className="w-5 h-5" />}
            title={t('rewards.autoCompound.title')}
            description={t('rewards.autoCompound.description')}
            action={{
              type: 'toggle',
              checked: rewardAutoCompound,
              onChange: setRewardAutoCompound,
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

export default TokenHubSettings;
