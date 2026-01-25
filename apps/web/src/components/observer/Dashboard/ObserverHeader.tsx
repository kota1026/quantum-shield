'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAddress } from '@/lib/utils';
import { EcosystemLink } from '@/components/shared/EcosystemLink';

interface ObserverHeaderProps {
  walletAddress?: string;
  onWalletClick?: () => void;
}

export function ObserverHeader({
  walletAddress = '0x7a3f9c2d8e1b4f6a',
  onWalletClick,
}: ObserverHeaderProps) {
  const t = useTranslations('observer.common.header');
  const pathname = usePathname();

  const navItems = [
    { key: 'dashboard', href: '/observer/dashboard' },
    { key: 'pending', href: '/observer/pending' },
    { key: 'suspicious', href: '/observer/suspicious' },
    { key: 'history', href: '/observer/history' },
    { key: 'earnings', href: '/observer/earnings' },
  ];

  const isActive = (href: string) => {
    return pathname?.includes(href.split('/').pop() || '');
  };

  return (
    <header className="flex justify-between items-center mb-8" role="banner">
      {/* Logo */}
      <Link
        href="/observer/dashboard"
        className="flex items-center gap-4 text-foreground hover:opacity-80 transition-opacity"
        aria-label="Quantum Shield Observer Portal - Back to Dashboard"
      >
        {/* Hinomaru Logo */}
        <div
          className="w-12 h-12 relative flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_25s_linear_infinite]">
            <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full" />
          </div>
          <div className="w-6 h-6 bg-hinomaru rounded-full shadow-glow-hinomaru" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold">Quantum Shield</span>
          <span className="text-[10px] text-gold tracking-[2px] uppercase">
            Observer Portal
          </span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav
        className="hidden lg:flex gap-1 bg-background-secondary rounded-full p-1 border border-border/30"
        role="navigation"
        aria-label="Observer navigation"
      >
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              'px-6 py-2 text-sm font-medium rounded-full transition-all',
              isActive(item.href)
                ? 'bg-background-tertiary text-foreground'
                : 'text-foreground-secondary hover:text-foreground'
            )}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {t(item.key)}
          </Link>
        ))}
      </nav>

      {/* Header Actions */}
      <div className="flex gap-2 items-center">
        {/* Ecosystem Link */}
        <EcosystemLink variant="inline" className="hidden xl:flex" />

        {/* Settings Button */}
        <Link
          href="/observer/settings"
          className={cn(
            'w-11 h-11 flex items-center justify-center',
            'border border-border rounded-full',
            'text-foreground-secondary hover:border-gold hover:text-gold',
            'transition-colors',
            'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          )}
          aria-label={t('settings')}
        >
          <Settings className="w-5 h-5" aria-hidden="true" />
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
          <span
            className="w-2 h-2 bg-success rounded-full"
            aria-hidden="true"
          />
          {formatAddress(walletAddress, 4)}
        </button>
      </div>
    </header>
  );
}
