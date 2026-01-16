'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Lock, Unlock, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  onLockClick?: () => void;
}

export function MobileNav({ onLockClick }: MobileNavProps) {
  const t = useTranslations('consumer.common.mobileNav');
  const pathname = usePathname();

  const navItems = [
    { key: 'dashboard', href: '/consumer/dashboard', icon: LayoutDashboard, onClick: undefined },
    { key: 'lock', href: '#', icon: Lock, onClick: onLockClick },
    { key: 'unlock', href: '/consumer/unlock', icon: Unlock, onClick: undefined },
    { key: 'history', href: '/consumer/history', icon: History, onClick: undefined },
    { key: 'settings', href: '/consumer/settings', icon: Settings, onClick: undefined },
  ];

  const isActive = (href: string) => {
    if (href === '#') return false;
    return pathname?.includes(href.split('/').pop() || '');
  };

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'bg-surface border-t border-border',
        'px-4 pb-6 pt-2'
      )}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          if (item.onClick) {
            return (
              <button
                key={item.key}
                onClick={item.onClick}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-qs',
                  'text-foreground-tertiary hover:text-hinomaru transition-colors',
                  'min-w-[60px]'
                )}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px]">{t(item.key)}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-qs',
                'transition-colors min-w-[60px]',
                active
                  ? 'text-hinomaru'
                  : 'text-foreground-tertiary hover:text-hinomaru'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px]">{t(item.key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
