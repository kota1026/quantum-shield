'use client';

import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Settings, LogOut, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const t = useTranslations('qsAdmin');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const switchLocale = (newLocale: string) => {
    // Handle both cases: with or without locale prefix
    const pathWithoutLocale = pathname.replace(/^\/(ja|en)/, '');
    const newPath = `/${newLocale}${pathWithoutLocale || '/qs-admin/dashboard'}`;
    router.push(newPath);
    setLangMenuOpen(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
          <Input
            type="text"
            placeholder={t('header.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Language Switch */}
        <div className="relative" ref={langMenuRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            aria-expanded={langMenuOpen}
            aria-haspopup="true"
            aria-label={t('header.language')}
          >
            <Globe className="h-5 w-5" />
          </Button>
          {langMenuOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-card rounded-lg shadow-lg border border-border z-50">
              <div className="py-1">
                <button
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-surface flex items-center ${locale === 'ja' ? 'text-hinomaru font-medium' : ''}`}
                  onClick={() => switchLocale('ja')}
                >
                  🇯🇵 日本語
                </button>
                <button
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-surface flex items-center ${locale === 'en' ? 'text-hinomaru font-medium' : ''}`}
                  onClick={() => switchLocale('en')}
                >
                  🇺🇸 English
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-hinomaru-red rounded-full" />
          </Button>
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold">{t('header.notifications')}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="py-4 px-4 text-sm text-foreground-secondary text-center">
                {t('header.noNotifications')}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-hinomaru-red to-gold flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
          </Button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold">{t('sidebar.user.name')}</p>
                <p className="text-sm text-foreground-secondary">{t('sidebar.user.role')}</p>
              </div>
              <div className="py-1">
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-surface flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('sidebar.user.settings')}
                </button>
                <div className="border-t border-border my-1" />
                <button
                  className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-surface flex items-center"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('sidebar.user.logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
