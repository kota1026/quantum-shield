'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Search, Bell, ChevronDown, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface EnterpriseTopBarProps {
  pageTitle: string;
  userName?: string;
  userInitial?: string;
  hasNotifications?: boolean;
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onUserMenuClick?: () => void;
  className?: string;
}

export function EnterpriseTopBar({
  pageTitle,
  userName = 'Admin',
  userInitial = 'A',
  hasNotifications = true,
  onSearch,
  onNotificationClick,
  onUserMenuClick,
  className,
}: EnterpriseTopBarProps) {
  const t = useTranslations('enterprise.topBar');
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header
      className={cn(
        'flex items-center justify-between',
        'px-8 py-4 bg-background-secondary border-b border-white/5',
        'sticky top-0 z-40',
        className
      )}
      role="banner"
    >
      <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        {/* Search Box */}
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2',
            'bg-background-tertiary border border-white/5 rounded-lg',
            'w-[280px]',
            'focus-within:border-gold/50 transition-colors'
          )}
        >
          <Search className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
          <input
            type="search"
            placeholder={t('searchPlaceholder')}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-tertiary"
            onChange={(e) => onSearch?.(e.target.value)}
            aria-label={t('searchAriaLabel')}
          />
        </div>

        {/* Notification Button */}
        <Link
          href="/enterprise/support"
          className={cn(
            'w-11 h-11 flex items-center justify-center',
            'bg-background-tertiary border border-white/5 rounded-lg',
            'text-foreground-secondary hover:text-foreground hover:border-white/10',
            'transition-colors relative'
          )}
          aria-label={t('notificationsAriaLabel')}
        >
          <Bell className="w-4 h-4" />
          {hasNotifications && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 bg-hinomaru rounded-full"
              aria-label={t('newNotifications')}
            />
          )}
        </Link>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 px-2 py-1',
              'bg-background-tertiary border border-white/5 rounded-lg',
              'hover:border-white/10 transition-colors'
            )}
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label={t('userMenuAriaLabel')}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
          >
            <div
              className={cn(
                'w-7 h-7 rounded flex items-center justify-center',
                'bg-hinomaru text-white text-xs font-semibold'
              )}
              aria-hidden="true"
            >
              {userInitial}
            </div>
            <span className="text-sm font-medium text-foreground">{userName}</span>
            <ChevronDown className="w-4 h-4 text-foreground-secondary" aria-hidden="true" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2 w-48',
                'bg-background-secondary border border-white/10 rounded-lg shadow-lg',
                'py-1 z-50'
              )}
              role="menu"
            >
              <Link
                href="/enterprise/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/5 transition-colors"
                role="menuitem"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                {t('menu.settings')}
              </Link>
              <Link
                href="/enterprise/login"
                className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-white/5 transition-colors"
                role="menuitem"
                onClick={() => setShowUserMenu(false)}
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                {t('menu.logout')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
