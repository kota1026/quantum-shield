'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Eye,
  Wallet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Wallet options for display
const WALLET_OPTIONS = [
  {
    id: 'metamask',
    nameKey: 'metamask',
    icon: '🦊',
    popular: true,
  },
  {
    id: 'walletconnect',
    nameKey: 'walletConnect',
    icon: '🔗',
    popular: true,
  },
  {
    id: 'coinbase',
    nameKey: 'coinbase',
    icon: '💠',
    popular: false,
  },
];

type RegistrationState = 'checking' | 'registered' | 'not-registered';

export function ObserverLogin() {
  const t = useTranslations('observer.login');
  const locale = useLocale();
  const router = useRouter();

  // RainbowKit wallet connection
  const { openConnectModal } = useConnectModal();
  const { isConnected, isConnecting, address } = useAccount();

  // Registration check state (would be replaced with real API call)
  const [registrationState, setRegistrationState] = useState<RegistrationState | null>(null);

  // Check registration status when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      setRegistrationState('checking');

      // Mock registration check - in production, this would be an API call
      const checkRegistration = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // For demo: assume registered if address ends with even hex digit
        const lastChar = address.slice(-1).toLowerCase();
        const isRegistered = '02468ace'.includes(lastChar);

        if (isRegistered) {
          setRegistrationState('registered');
          setTimeout(() => {
            router.push('/observer/dashboard');
          }, 1500);
        } else {
          setRegistrationState('not-registered');
        }
      };

      checkRegistration();
    }
  }, [isConnected, address, router]);

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace('/observer/login', { locale: newLocale });
  };

  const handleWalletConnect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const resetState = () => {
    setRegistrationState(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link
          href="/observer/landing"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('backToLanding')}</span>
        </Link>

        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground border border-surface-tertiary/30 rounded-full transition-colors"
          aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {locale === 'ja' ? 'EN' : 'JA'}
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-gold-400 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <Eye className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
            <p className="text-foreground-secondary">{t('description')}</p>
          </div>

          {/* Connecting State */}
          {isConnecting && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('connecting.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('connecting.walletPrompt')}
              </p>
            </Card>
          )}

          {/* Checking Registration */}
          {isConnected && registrationState === 'checking' && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('checking.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('checking.description')}
              </p>
            </Card>
          )}

          {/* Success - Registered */}
          {isConnected && registrationState === 'registered' && (
            <Card className="p-8 text-center mb-6 border-success bg-success/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-success">{t('success.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('success.description')}</p>
            </Card>
          )}

          {/* Not Registered */}
          {isConnected && registrationState === 'not-registered' && (
            <Card className="p-8 text-center mb-6 border-warning bg-warning/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-warning/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-warning" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-warning">{t('notRegistered.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-6">{t('notRegistered.description')}</p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" asChild>
                  <Link href="/observer/application">{t('notRegistered.applyButton')}</Link>
                </Button>
                <Button variant="outline" onClick={resetState}>
                  {t('notRegistered.tryAnotherWallet')}
                </Button>
              </div>
            </Card>
          )}

          {/* Wallet Selection */}
          {!isConnected && !isConnecting && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gold" aria-hidden="true" />
                {t('selectWallet')}
              </h2>

              <div className="space-y-3">
                {WALLET_OPTIONS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={handleWalletConnect}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border border-surface-tertiary',
                      'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                    )}
                  >
                    <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center text-2xl">
                      {wallet.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{t(`wallets.${wallet.nameKey}`)}</div>
                      {wallet.popular && (
                        <span className="text-xs text-gold">{t('popular')}</span>
                      )}
                    </div>
                    <ArrowLeft className="h-4 w-4 text-foreground-tertiary rotate-180" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Help Section */}
          {!isConnected && !isConnecting && (
            <div className="text-center space-y-4">
              <p className="text-sm text-foreground-tertiary">
                {t('noWallet')}{' '}
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('getWallet')}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </p>

              <div className="pt-4 border-t border-surface-tertiary">
                <p className="text-sm text-foreground-secondary mb-3">
                  {t('newToObserver')}
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/observer/application">
                    {t('applyNow')}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-foreground-tertiary">
          {t('footer')}
        </p>
      </footer>
    </div>
  );
}
