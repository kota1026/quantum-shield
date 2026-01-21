'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Shield,
  Wallet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock wallet options
const WALLET_OPTIONS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/images/wallets/metamask.svg',
    popular: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/images/wallets/walletconnect.svg',
    popular: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/images/wallets/coinbase.svg',
    popular: false,
  },
  {
    id: 'rabby',
    name: 'Rabby',
    icon: '/images/wallets/rabby.svg',
    popular: false,
  },
];

type ConnectionState = 'idle' | 'connecting' | 'success' | 'error' | 'not-registered';

export function ProverLogin() {
  const t = useTranslations('prover');
  const locale = useLocale();
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleWalletConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setConnectionState('connecting');
    setErrorMessage('');

    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // For demo: randomly succeed, fail, or show not-registered
    const random = Math.random();
    if (random < 0.6) {
      // Success - redirect to dashboard
      setConnectionState('success');
      setTimeout(() => {
        router.push('/prover/dashboard');
      }, 1500);
    } else if (random < 0.8) {
      // Not registered
      setConnectionState('not-registered');
    } else {
      // Error
      setConnectionState('error');
      setErrorMessage(t('login.error.connectionFailed'));
    }
  };

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace('/prover/login', { locale: newLocale });
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
          href="/prover/landing"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('login.backToLanding')}</span>
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
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-hinomaru to-hinomaru-400 rounded-2xl flex items-center justify-center shadow-lg shadow-hinomaru/20">
              <Shield className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('login.title')}</h1>
            <p className="text-foreground-secondary">{t('login.description')}</p>
          </div>

          {/* Connection States */}
          {connectionState === 'connecting' && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('login.connecting.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('login.connecting.description', { wallet: WALLET_OPTIONS.find(w => w.id === selectedWallet)?.name })}
              </p>
            </Card>
          )}

          {connectionState === 'success' && (
            <Card className="p-8 text-center mb-6 border-success bg-success/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-success">{t('login.success.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('login.success.description')}</p>
            </Card>
          )}

          {connectionState === 'error' && (
            <Card className="p-8 text-center mb-6 border-danger bg-danger/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-danger/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-danger" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-danger">{t('login.error.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-4">{errorMessage}</p>
              <Button variant="outline" onClick={() => setConnectionState('idle')}>
                {t('login.error.tryAgain')}
              </Button>
            </Card>
          )}

          {connectionState === 'not-registered' && (
            <Card className="p-8 text-center mb-6 border-warning bg-warning/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-warning/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-warning" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-warning">{t('login.notRegistered.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-6">{t('login.notRegistered.description')}</p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" asChild>
                  <Link href="/prover/application">{t('login.notRegistered.applyButton')}</Link>
                </Button>
                <Button variant="outline" onClick={() => setConnectionState('idle')}>
                  {t('login.notRegistered.tryAnotherWallet')}
                </Button>
              </div>
            </Card>
          )}

          {/* Wallet Selection */}
          {(connectionState === 'idle' || connectionState === 'error') && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gold" aria-hidden="true" />
                {t('login.selectWallet')}
              </h2>

              <div className="space-y-3">
                {WALLET_OPTIONS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletConnect(wallet.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border border-surface-tertiary',
                      'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                      'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                    )}
                  >
                    <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-foreground-secondary" aria-hidden="true" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{wallet.name}</div>
                      {wallet.popular && (
                        <span className="text-xs text-gold">{t('login.popular')}</span>
                      )}
                    </div>
                    <ArrowLeft className="h-4 w-4 text-foreground-tertiary rotate-180" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Help Section */}
          {connectionState === 'idle' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-foreground-tertiary">
                {t('login.noWallet')}{' '}
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('login.getWallet')}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </p>

              <div className="pt-4 border-t border-surface-tertiary">
                <p className="text-sm text-foreground-secondary mb-3">
                  {t('login.newToProver')}
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/prover/application">
                    {t('login.applyNow')}
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
          {t('login.footer')}
        </p>
      </footer>
    </div>
  );
}
