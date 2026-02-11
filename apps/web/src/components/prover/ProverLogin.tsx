'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';
import { SiweMessage } from 'siwe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useProverAuthStore } from '@/stores/proverAuthStore';
import { proverApi } from '@/lib/api/prover/client';

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

type RegistrationState = 'checking' | 'signing' | 'authenticating' | 'registered' | 'not-registered' | 'error';

export function ProverLogin() {
  const t = useTranslations('prover');
  const locale = useLocale();
  const router = useRouter();

  // RainbowKit wallet connection
  const { openConnectModal } = useConnectModal();
  const { isConnected, isConnecting, address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Auth store
  const { authenticateSiwe, setProverId, isAuthenticated, isLoading: isAuthLoading, error: authError, clearError } = useProverAuthStore();

  // Registration check state
  const [registrationState, setRegistrationState] = useState<RegistrationState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // SIWE authentication flow
  const performSiweAuth = useCallback(async () => {
    if (!address || !chainId) return;

    try {
      setRegistrationState('checking');
      setErrorMessage(null);

      console.log('[ProverLogin] Checking prover status for wallet:', address);

      // First, check if the wallet is registered as an approved Prover
      const proverStatus = await proverApi.getProverStatusByWallet(address);

      console.log('[ProverLogin] Prover status response:', proverStatus);

      if (!proverStatus.registered) {
        setRegistrationState('not-registered');
        setErrorMessage(t('login.error.notRegistered'));
        return;
      }

      if (!proverStatus.can_access) {
        setRegistrationState('not-registered');
        const statusMessage = proverStatus.status === 'pending_approval'
          ? t('login.error.pendingApproval')
          : proverStatus.status === 'rejected'
          ? t('login.error.rejected')
          : t('login.error.accessDenied');
        setErrorMessage(statusMessage);
        return;
      }

      // Save prover_id to auth store
      if (proverStatus.prover_id) {
        console.log('[ProverLogin] Saving prover_id to store:', proverStatus.prover_id);
        setProverId(proverStatus.prover_id);
      }

      console.log('[ProverLogin] Prover approved, proceeding to signing');
      setRegistrationState('signing');

      // Create SIWE message
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Quantum Shield Prover Portal',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: Math.random().toString(36).substring(2, 15),
        issuedAt: new Date().toISOString(),
      });

      const message = siweMessage.prepareMessage();

      // Sign the message
      const signature = await signMessageAsync({ message });

      setRegistrationState('authenticating');

      // Authenticate with backend
      await authenticateSiwe(message, signature, address);

      // Authentication successful
      setRegistrationState('registered');
      setTimeout(() => {
        router.push('/prover/dashboard');
      }, 1500);
    } catch (error) {
      console.error('SIWE authentication failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Authentication failed';
      setErrorMessage(errorMsg);
      setRegistrationState('error');
    }
  }, [address, chainId, signMessageAsync, authenticateSiwe, setProverId, router]);

  // Check authentication status when wallet is connected
  useEffect(() => {
    console.log('[ProverLogin] useEffect:', { isConnected, address, isAuthenticated, registrationState });
    if (isConnected && address && !isAuthenticated && registrationState === null) {
      console.log('[ProverLogin] Starting auth flow, calling performSiweAuth directly...');
      performSiweAuth();
    }
  }, [isConnected, address, isAuthenticated, registrationState, performSiweAuth]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/prover/dashboard');
    }
  }, [isAuthenticated, router]);

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace('/prover/login', { locale: newLocale });
  };

  const handleWalletConnect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const resetState = () => {
    setRegistrationState(null);
    setErrorMessage(null);
    clearError();
  };

  const retryAuth = () => {
    resetState();
    if (isConnected && address) {
      performSiweAuth();
    }
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
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('login.backToLanding')}</span>
        </Link>

        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-foreground-secondary hover:text-foreground border border-surface-tertiary/30 rounded-full transition-colors"
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

          {/* Connecting State */}
          {isConnecting && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('login.connecting.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('login.connecting.walletPrompt')}
              </p>
            </Card>
          )}

          {/* Checking / Preparing */}
          {isConnected && registrationState === 'checking' && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('login.checking.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('login.checking.description')}
              </p>
            </Card>
          )}

          {/* Signing Message */}
          {isConnected && registrationState === 'signing' && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('login.signing.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('login.signing.description')}
              </p>
            </Card>
          )}

          {/* Authenticating */}
          {isConnected && registrationState === 'authenticating' && (
            <Card className="p-8 text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('login.authenticating.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('login.authenticating.description')}
              </p>
            </Card>
          )}

          {/* Error State */}
          {isConnected && registrationState === 'error' && (
            <Card className="p-8 text-center mb-6 border-danger bg-danger/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-danger/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-danger" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-danger">{t('login.error.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-4">
                {errorMessage || authError || t('login.error.description')}
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" onClick={retryAuth}>
                  {t('login.error.retryButton')}
                </Button>
                <Button variant="outline" onClick={resetState}>
                  {t('login.notRegistered.tryAnotherWallet')}
                </Button>
              </div>
            </Card>
          )}

          {/* Success - Registered */}
          {isConnected && registrationState === 'registered' && (
            <Card className="p-8 text-center mb-6 border-success bg-success/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-success">{t('login.success.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('login.success.description')}</p>
            </Card>
          )}

          {/* Not Registered */}
          {isConnected && registrationState === 'not-registered' && (
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
                <Button variant="outline" onClick={resetState}>
                  {t('login.notRegistered.tryAnotherWallet')}
                </Button>
              </div>
            </Card>
          )}

          {/* Wallet Selection */}
          {!isConnected && !isConnecting && (
            <Card className="p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gold" aria-hidden="true" />
                {t('login.selectWallet')}
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
                      <div className="font-medium">{t(`login.wallets.${wallet.nameKey}`)}</div>
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
          {!isConnected && !isConnecting && (
            <div className="text-center space-y-4">
              <p className="text-sm text-foreground-tertiary">
                {t('login.noWallet')}{' '}
                <a
                  href="https://metamask.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline inline-flex items-center gap-1 min-h-[44px]"
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
