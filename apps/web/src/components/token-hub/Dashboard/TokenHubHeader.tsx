'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface TokenHubHeaderProps {
  walletAddress: string;
  onWalletClick: () => void;
}

export function TokenHubHeader({ walletAddress, onWalletClick }: TokenHubHeaderProps) {
  const t = useTranslations('token-hub.common.header');
  const pathname = usePathname();

  const navItems = [
    { key: 'dashboard', path: '/token-hub/dashboard' },
    { key: 'lock', path: '/token-hub/lock' },
    { key: 'delegate', path: '/token-hub/delegate' },
    { key: 'rewards', path: '/token-hub/rewards' },
  ];

  const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

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

      {/* Wallet Button */}
      <button
        onClick={onWalletClick}
        className={cn(
          'flex items-center gap-2 px-6 py-2',
          'bg-hinomaru/10 border border-hinomaru rounded-full',
          'text-hinomaru-400 text-sm font-medium',
          'hover:bg-hinomaru hover:text-white transition-colors',
          'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'order-2 md:order-3'
        )}
        aria-label={t('walletConnected', { address: shortAddress })}
      >
        <span className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
        {shortAddress}
      </button>
    </header>
  );
}
