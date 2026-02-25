'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { ArrowLeft, Wallet, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ConnectionState = 'idle' | 'connecting' | 'checking' | 'success' | 'error';

const WALLETS = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', popular: true },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', popular: false },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '💰', popular: false },
];

export function QSHubLogin() {
  const t = useTranslations('qs-hub.login');
  const tCommon = useTranslations('qs-hub.common');
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleWalletConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setConnectionState('connecting');

    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setConnectionState('checking');

    // Simulate checking veQS balance
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setConnectionState('success');

    // Redirect to dashboard
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/qs-hub/dashboard');
  };

  const handleRetry = () => {
    setConnectionState('idle');
    setSelectedWallet(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute top-1/4 left-1/2 -translate-x-1/2',
            'w-[600px] h-[400px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.15),transparent_60%)]'
          )}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/qs-hub/landing"
          className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToLanding')}
        </Link>

        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-6 h-6 bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-lg font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-wider">{tCommon('portalName')}</div>
          </div>
        </div>

        {/* Main Card */}
        <Card className="p-6">
          {connectionState === 'idle' && (
            <>
              <h1 className="text-xl font-bold text-center mb-2">{t('title')}</h1>
              <p className="text-sm text-foreground-secondary text-center mb-6">
                {t('description')}
              </p>

              <div className="space-y-3">
                <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
                  {t('selectWallet')}
                </div>
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleWalletConnect(wallet.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl',
                      'border border-border hover:border-gold/50',
                      'bg-surface hover:bg-gold/5',
                      'transition-all duration-200'
                    )}
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <span className="font-medium">{wallet.name}</span>
                    {wallet.popular && (
                      <span className="ml-auto text-xs px-2 py-0.5 bg-gold/10 text-gold rounded-full">
                        {t('popular')}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-foreground-secondary">
                  {t('noVeQS')}{' '}
                  <Link href="/qs-hub/stake/lock" className="text-gold hover:underline">
                    {t('lockQS')}
                  </Link>
                </p>
              </div>
            </>
          )}

          {connectionState === 'connecting' && (
            <div className="text-center py-8" role="status" aria-live="polite">
              <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
              <h2 className="text-lg font-semibold mb-2">{t('connecting.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('connecting.walletPrompt')}
              </p>
            </div>
          )}

          {connectionState === 'checking' && (
            <div className="text-center py-8" role="status" aria-live="polite">
              <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
              <h2 className="text-lg font-semibold mb-2">{t('checking.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('checking.description')}
              </p>
            </div>
          )}

          {connectionState === 'success' && (
            <div className="text-center py-8" role="status" aria-live="polite">
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('success.title')}</h2>
              <p className="text-sm text-foreground-secondary">
                {t('success.description')}
              </p>
            </div>
          )}

          {connectionState === 'error' && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-6 h-6 text-danger" />
              </div>
              <h2 className="text-lg font-semibold mb-2">{t('error.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-4">
                {t('error.connectionFailed')}
              </p>
              <Button variant="outline" onClick={handleRetry}>
                {t('error.tryAgain')}
              </Button>
            </div>
          )}
        </Card>

        {/* Footer */}
        <p className="text-xs text-foreground-tertiary text-center mt-6">
          {t('footer')}
        </p>
      </div>
    </div>
  );
}

export default QSHubLogin;
