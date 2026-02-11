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
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useConsumerAuthStore } from '@/stores/consumerAuthStore';

type AuthState = 'idle' | 'signing' | 'authenticating' | 'success' | 'error';

export function ConsumerLogin() {
  const t = useTranslations('consumer');
  const locale = useLocale();
  const router = useRouter();

  // RainbowKit wallet connection
  const { openConnectModal } = useConnectModal();
  const { isConnected, isConnecting, address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();

  // Auth store
  const { authenticateSiwe, isAuthenticated, error: authError, clearError } = useConsumerAuthStore();

  // Auth state
  const [authState, setAuthState] = useState<AuthState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/consumer/dashboard');
    }
  }, [isAuthenticated, router]);

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace('/consumer/login', { locale: newLocale });
  };

  // SIWE authentication flow - only called when user clicks "Sign In" button
  const performSiweAuth = useCallback(async () => {
    if (!address || !chainId) return;

    try {
      setAuthState('signing');
      setErrorMessage(null);

      // Create SIWE message
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Quantum Shield Consumer App',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: Math.random().toString(36).substring(2, 15),
        issuedAt: new Date().toISOString(),
      });

      const message = siweMessage.prepareMessage();

      // Sign the message
      const signature = await signMessageAsync({ message });

      setAuthState('authenticating');

      // Authenticate with backend
      await authenticateSiwe(message, signature, address);

      // Authentication successful
      setAuthState('success');
      setTimeout(() => {
        router.push('/consumer/dashboard');
      }, 1500);
    } catch (error) {
      console.error('SIWE authentication failed:', error);
      const errMsg = error instanceof Error ? error.message : 'Authentication failed';
      setErrorMessage(errMsg);
      setAuthState('error');
    }
  }, [address, chainId, signMessageAsync, authenticateSiwe, router]);

  const handleWalletConnect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const handleSignIn = () => {
    if (isConnected && address) {
      performSiweAuth();
    }
  };

  const handleChangeWallet = () => {
    disconnect();
    setAuthState('idle');
    setErrorMessage(null);
    clearError();
  };

  const resetState = () => {
    setAuthState('idle');
    setErrorMessage(null);
    clearError();
  };

  // Format wallet address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6">
        <Link
          href="/consumer"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors min-h-[44px]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('login.backToLanding')}</span>
        </Link>

        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-foreground-secondary hover:text-foreground border border-border rounded-full transition-colors"
          aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {locale === 'ja' ? 'EN' : 'JA'}
        </button>
      </header>

      {/* Main Content */}
      <main role="main" className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-hinomaru rounded-2xl flex items-center justify-center shadow-lg shadow-hinomaru/20">
              <Shield className="h-10 w-10 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('login.title')}</h1>
            <p className="text-foreground-secondary">{t('login.description')}</p>
          </div>

          {/* Connecting State */}
          {isConnecting && (
            <Card className="p-8 text-center mb-6 bg-surface border-border">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gold animate-spin" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('login.connecting.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('login.connecting.walletPrompt')}
              </p>
            </Card>
          )}

          {/* Signing Message */}
          {isConnected && authState === 'signing' && (
            <Card className="p-8 text-center mb-6 bg-surface border-border">
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
          {isConnected && authState === 'authenticating' && (
            <Card className="p-8 text-center mb-6 bg-surface border-border">
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
          {isConnected && authState === 'error' && (
            <Card className="p-8 text-center mb-6 border-destructive/50 bg-destructive/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-destructive">{t('login.error.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {errorMessage || authError || t('login.error.description')}
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" onClick={handleSignIn} className="min-h-[44px]">
                  {t('login.error.retryButton')}
                </Button>
                <Button variant="outline" onClick={handleChangeWallet} className="min-h-[44px]">
                  {t('login.error.tryAnotherWallet')}
                </Button>
              </div>
            </Card>
          )}

          {/* Success */}
          {isConnected && authState === 'success' && (
            <Card className="p-8 text-center mb-6 border-success/50 bg-success/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-success">{t('login.success.title')}</h2>
              <p className="text-sm text-foreground-secondary">{t('login.success.description')}</p>
            </Card>
          )}

          {/* Connected - Ready to Sign In */}
          {isConnected && !isConnecting && authState === 'idle' && (
            <Card className="p-6 mb-6 bg-surface border-border">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{t('login.connected.title')}</h2>
                <p className="text-sm text-foreground-secondary mb-2">
                  {t('login.connected.description')}
                </p>
                <p className="text-sm font-mono text-gold">
                  {address && formatAddress(address)}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  onClick={handleSignIn}
                  className="w-full min-h-[48px] text-base"
                >
                  <Shield className="h-5 w-5 mr-2" aria-hidden="true" />
                  {t('login.connected.signInButton')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleChangeWallet}
                  className="w-full min-h-[44px]"
                >
                  {t('login.connected.changeWallet')}
                </Button>
              </div>
            </Card>
          )}

          {/* Wallet Selection - Not Connected */}
          {!isConnected && !isConnecting && (
            <Card className="p-6 mb-6 bg-surface border-border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-gold" aria-hidden="true" />
                {t('login.selectWallet')}
              </h2>

              <Button
                variant="primary"
                onClick={handleWalletConnect}
                className="w-full min-h-[48px] text-base mb-4"
              >
                <Wallet className="h-5 w-5 mr-2" aria-hidden="true" />
                {t('login.connectWallet')}
              </Button>

              <p className="text-xs text-foreground-tertiary text-center">
                {t('login.supportedWallets')}
              </p>
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
                  className="text-gold hover:underline inline-flex items-center gap-1"
                >
                  {t('login.getWallet')}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </p>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-foreground-secondary mb-3">
                  {t('login.newUser')}
                </p>
                <Button variant="outline" asChild className="w-full min-h-[44px]">
                  <Link href="/consumer">
                    {t('login.learnMore')}
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

export default ConsumerLogin;
