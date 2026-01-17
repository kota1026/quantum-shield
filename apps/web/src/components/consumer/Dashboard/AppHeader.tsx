'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Coins } from 'lucide-react';
import { HinomaryLogo } from '../Landing/HinomaryLogo';
import { cn } from '@/lib/utils';
import { formatAddress } from '@/lib/utils';

interface AppHeaderProps {
  walletAddress?: string;
  onWalletClick?: () => void;
  onLockClick?: () => void;
}

export function AppHeader({
  walletAddress = '0x7a3f9c2d8e1b4f6a',
  onWalletClick,
  onLockClick,
}: AppHeaderProps) {
  const t = useTranslations('consumer.common.header');
  const pathname = usePathname();

  const navItems = [
    { key: 'dashboard', href: '/consumer/dashboard', onClick: undefined },
    { key: 'lock', href: '#', onClick: onLockClick },
    { key: 'unlock', href: '/consumer/unlock', onClick: undefined },
    { key: 'history', href: '/consumer/history', onClick: undefined },
  ];

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname?.includes(href.split('/').pop() || '');
  };

  return (
    <header className="flex justify-between items-center mb-8">
      {/* Logo */}
      <Link
        href="/consumer/dashboard"
        className="flex items-center gap-3 text-foreground hover:opacity-80 transition-opacity"
        aria-label="Quantum Shield - Back to Dashboard"
      >
        <HinomaryLogo size="sm" />
        <span className="text-xl font-bold">Quantum Shield</span>
      </Link>

      {/* Desktop Navigation */}
      <nav
        className="hidden md:flex gap-1 bg-surface rounded-qs-xl p-1 border border-border"
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map((item) => (
          item.onClick ? (
            <button
              key={item.key}
              onClick={item.onClick}
              className={cn(
                'px-5 py-2 text-sm rounded-qs-lg transition-all relative overflow-hidden',
                'text-foreground-secondary hover:text-foreground hover:bg-surface-secondary'
              )}
            >
              {t(item.key)}
            </button>
          ) : (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'px-5 py-2 text-sm rounded-qs-lg transition-all relative overflow-hidden',
                isActive(item.href)
                  ? 'bg-surface-secondary text-foreground border border-gold/30'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface-secondary border border-transparent'
              )}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {/* Gradient top accent for active tab */}
              {isActive(item.href) && (
                <span
                  className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-hinomaru to-gold"
                  aria-hidden="true"
                />
              )}
              {t(item.key)}
            </Link>
          )
        ))}
      </nav>

      {/* Header Actions */}
      <div className="flex gap-3 items-center">
        {/* Token Hub Button */}
        <Link
          href="/token-hub/dashboard"
          className={cn(
            'hidden sm:flex items-center gap-2 px-4 py-2',
            'bg-gold/10 border border-gold/50 rounded-full',
            'text-gold text-sm font-medium',
            'hover:bg-gold hover:text-background transition-all'
          )}
          aria-label={t('tokenHub')}
        >
          <Coins className="w-4 h-4" aria-hidden="true" />
          {t('tokenHub')}
        </Link>

        {/* Settings Button */}
        <Link
          href="/consumer/settings"
          className={cn(
            'w-10 h-10 flex items-center justify-center',
            'bg-surface border border-border rounded-qs',
            'text-foreground-secondary hover:border-gold hover:text-gold',
            'transition-all'
          )}
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>

        {/* Wallet Button */}
        <button
          onClick={onWalletClick}
          className={cn(
            'flex items-center gap-2 px-4 py-2',
            'bg-hinomaru/10 border border-hinomaru rounded-full',
            'text-hinomaru text-sm font-medium',
            'hover:bg-hinomaru hover:text-white transition-all'
          )}
          aria-label="Wallet menu"
        >
          <span className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
          {formatAddress(walletAddress, 4)}
        </button>
      </div>
    </header>
  );
}
