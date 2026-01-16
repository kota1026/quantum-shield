'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';

function WalletButton() {
  const t = useTranslations('token-hub.common.header');
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { address, isConnected } = useAccount();

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  const handleWalletClick = () => {
    if (isConnected && openAccountModal) {
      openAccountModal();
    } else if (openConnectModal) {
      openConnectModal();
    }
  };

  return (
    <button
      onClick={handleWalletClick}
      className={cn(
        'flex items-center gap-2 px-6 py-2',
        'border rounded-full',
        'text-sm font-medium',
        'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'order-2 md:order-3 transition-colors',
        isConnected
          ? 'bg-hinomaru/10 border-hinomaru text-hinomaru-400 hover:bg-hinomaru hover:text-white focus-visible:ring-hinomaru'
          : 'bg-gold/10 border-gold text-gold hover:bg-gold hover:text-background focus-visible:ring-gold'
      )}
      aria-label={isConnected ? t('walletConnected', { address: shortAddress }) : t('connectWallet')}
    >
      {isConnected ? (
        <>
          <span className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
          {shortAddress}
        </>
      ) : (
        t('connectWallet')
      )}
    </button>
  );
}

function WalletButtonPlaceholder() {
  const t = useTranslations('token-hub.common.header');

  return (
    <button
      disabled
      className={cn(
        'flex items-center gap-2 px-6 py-2',
        'border rounded-full',
        'text-sm font-medium',
        'order-2 md:order-3',
        'bg-gold/10 border-gold text-gold opacity-50'
      )}
      aria-label={t('connectWallet')}
    >
      {t('connectWallet')}
    </button>
  );
}

export function TokenHubHeader() {
  const t = useTranslations('token-hub.common.header');
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { key: 'dashboard', path: '/token-hub/dashboard' },
    { key: 'lock', path: '/token-hub/lock' },
    { key: 'delegate', path: '/token-hub/delegate' },
    { key: 'rewards', path: '/token-hub/rewards' },
  ];

  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
      {/* Logo */}
      <Link
        href="/token-hub/dashboard"
        className="flex items-center gap-4 group"
        aria-label="Quantum Shield Token Hub"
      >
        <div className="relative w-12 h-12 flex items-center justify-center">
          {/* Outer rotating ring */}
          <div
            className="absolute inset-0 border border-gold rounded-full animate-[spin_25s_linear_infinite]"
            aria-hidden="true"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
          </div>
          {/* Inner hinomaru */}
          <div
            className="w-6 h-6 bg-hinomaru rounded-full shadow-[0_0_20px_rgba(188,0,45,0.4)]"
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold tracking-tight">Quantum Shield</span>
          <span className="text-[10px] text-gold tracking-widest uppercase">Token Hub</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav
        className="flex gap-1 bg-background-secondary p-1 rounded-full border border-border order-3 md:order-2"
        role="navigation"
        aria-label={t('navLabel')}
      >
        {navItems.map((item) => {
          const isActive = pathname?.includes(item.path);
          return (
            <Link
              key={item.key}
              href={item.path}
              className={cn(
                'px-6 py-2 text-sm font-medium rounded-full transition-colors',
                isActive
                  ? 'bg-background-tertiary text-foreground'
                  : 'text-foreground-secondary hover:text-foreground'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Wallet Button - only render with wagmi hooks after mounting */}
      {mounted ? <WalletButton /> : <WalletButtonPlaceholder />}
    </header>
  );
}
