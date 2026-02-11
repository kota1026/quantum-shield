'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
  Key,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular?: boolean;
}

export function WalletConnectPage() {
  const t = useTranslations('consumer.walletConnect');
  const router = useRouter();

  const { openConnectModal } = useConnectModal();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [showHelp, setShowHelp] = useState(false);

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: t('wallets.metamask.name'),
      description: t('wallets.metamask.description'),
      icon: '🦊',
      popular: true,
    },
    {
      id: 'walletconnect',
      name: t('wallets.walletconnect.name'),
      description: t('wallets.walletconnect.description'),
      icon: '🔗',
    },
    {
      id: 'coinbase',
      name: t('wallets.coinbase.name'),
      description: t('wallets.coinbase.description'),
      icon: '💙',
    },
  ];

  // Watch for connection status changes
  useEffect(() => {
    if (isConnected && connectionState !== 'connected') {
      setConnectionState('connected');
    }
  }, [isConnected, connectionState]);

  const handleConnect = useCallback(() => {
    if (openConnectModal) {
      setConnectionState('connecting');
      openConnectModal();
    }
  }, [openConnectModal]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setConnectionState('idle');
  }, [disconnect]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Connected State
  if (connectionState === 'connected' && isConnected && address) {
    return (
      <div className="min-h-screen bg-background">
        <main role="main" className="max-w-lg mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>

            <h1 className="text-2xl font-bold mb-3">{t('connected.title')}</h1>
            <p className="text-sm text-foreground-secondary mb-6">
              {t('connected.description')}
            </p>

            <div className="p-4 bg-surface rounded-qs mb-8">
              <p className="text-xs text-foreground-secondary mb-1">{t('connected.address')}</p>
              <p className="text-lg font-mono font-semibold text-gold">{formatAddress(address)}</p>
            </div>

            <div className="space-y-3">
              <Link href="/consumer/onboarding" className="block">
                <Button variant="primary" fullWidth>
                  {t('connected.startOnboarding')}
                </Button>
              </Link>
              <Link href="/consumer/dashboard" className="block">
                <Button variant="secondary" fullWidth>
                  {t('connected.continue')}
                </Button>
              </Link>
              <button
                onClick={handleDisconnect}
                className="w-full text-sm text-foreground-secondary hover:text-foreground transition-colors py-2"
              >
                {t('error.retry')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/consumer"
            aria-label={t('header.back')}
            className="p-2 -ml-2 hover:bg-surface rounded-qs transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">{t('header.title')}</h1>
        </div>
      </header>

      <main role="main" className="max-w-lg mx-auto px-4 py-6">
        {/* Intro */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gold/20 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t('intro.title')}</h2>
          <p className="text-sm text-foreground-secondary">
            {t('intro.description')}
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="p-3 bg-surface rounded-qs text-center">
            <Shield className="w-5 h-5 text-gold mx-auto mb-2" />
            <p className="text-xs font-medium">{t('features.selfCustody.title')}</p>
            <p className="text-xs text-foreground-secondary mt-1">{t('features.selfCustody.description')}</p>
          </div>
          <div className="p-3 bg-surface rounded-qs text-center">
            <Lock className="w-5 h-5 text-gold mx-auto mb-2" />
            <p className="text-xs font-medium">{t('features.secure.title')}</p>
            <p className="text-xs text-foreground-secondary mt-1">{t('features.secure.description')}</p>
          </div>
          <div className="p-3 bg-surface rounded-qs text-center">
            <Key className="w-5 h-5 text-gold mx-auto mb-2" />
            <p className="text-xs font-medium">{t('features.quantum.title')}</p>
            <p className="text-xs text-foreground-secondary mt-1">{t('features.quantum.description')}</p>
          </div>
        </div>

        {/* Wallet Options */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold mb-4">{t('wallets.title')}</h3>
          <div className="space-y-3">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                onClick={handleConnect}
                className={cn(
                  'w-full p-4 bg-surface border border-border-subtle rounded-qs-lg',
                  'flex items-center gap-4',
                  'hover:border-gold/50 hover:bg-surface-hover transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-gold/50'
                )}
                aria-label={`${wallet.name}${t('wallets.metamask.description')}`}
              >
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{wallet.name}</span>
                    {wallet.popular && (
                      <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full">
                        {t('wallets.metamask.popular')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    {wallet.description}
                  </p>
                </div>
                <ArrowLeft className="w-4 h-4 text-foreground-secondary rotate-180" />
              </button>
            ))}
          </div>
        </div>

        {/* Connecting State */}
        {connectionState === 'connecting' && (
          <div className="p-6 bg-surface rounded-qs-lg border border-gold/30 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
              <div>
                <h4 className="font-medium">{t('connecting.title')}</h4>
                <p className="text-sm text-foreground-secondary">{t('connecting.waiting')}</p>
              </div>
            </div>
            <button
              onClick={() => setConnectionState('idle')}
              className="mt-4 text-sm text-foreground-secondary hover:text-foreground"
            >
              {t('connecting.cancel')}
            </button>
          </div>
        )}

        {/* Help Section */}
        <div className="border-t border-border-subtle pt-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full flex items-center justify-between p-3 hover:bg-surface rounded-qs transition-colors"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-gold" />
              <span className="text-sm font-medium">{t('help.title')}</span>
            </div>
            <ArrowLeft className={cn(
              'w-4 h-4 text-foreground-secondary transition-transform',
              showHelp ? 'rotate-90' : '-rotate-90'
            )} />
          </button>

          {showHelp && (
            <div className="mt-3 p-4 bg-surface rounded-qs space-y-4">
              <p className="text-sm text-foreground-secondary">
                {t('help.description')}
              </p>

              <a
                href="https://metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-gold hover:underline"
              >
                {t('help.link')}
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="pt-3 border-t border-border-subtle">
                <h5 className="text-sm font-medium mb-2">{t('help.security.title')}</h5>
                <ul className="space-y-2 text-xs text-foreground-secondary">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-hinomaru mt-0.5 flex-shrink-0" />
                    {t('help.security.tips.seed')}
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-hinomaru mt-0.5 flex-shrink-0" />
                    {t('help.security.tips.official')}
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-hinomaru mt-0.5 flex-shrink-0" />
                    {t('help.security.tips.verify')}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WalletConnectPage;
