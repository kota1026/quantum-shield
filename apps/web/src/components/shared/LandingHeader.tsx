'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Link as I18nLink, usePathname, useRouter } from '@/i18n/navigation';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HinomaryLogo } from '@/components/shared/HinomaryLogo';
import { EcosystemLink } from '@/components/shared/EcosystemLink';
import { cn } from '@/lib/utils';

interface LandingHeaderProps {
  appName: string;
  appKey: string;
  homeHref: string;
  loginHref: string;
  registerHref: string;
  navItems?: { label: string; href: string }[];
  className?: string;
}

export function LandingHeader({
  appName,
  appKey,
  homeHref,
  loginHref,
  registerHref,
  navItems,
  className,
}: LandingHeaderProps) {
  const t = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border',
        className
      )}
      role="banner"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <I18nLink
          href={homeHref}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          aria-label={`${appName} Home`}
        >
          <HinomaryLogo size="sm" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">
              Quantum Shield
            </span>
            <span className="text-[10px] text-gold tracking-[2px] uppercase">
              {appKey}
            </span>
          </div>
        </I18nLink>

        {/* Navigation (optional) */}
        {navItems && navItems.length > 0 && (
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Main navigation"
            role="navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Right side: Ecosystem, Language, Login, Register */}
        <div className="flex items-center gap-3">
          {/* Ecosystem Link */}
          <EcosystemLink variant="inline" className="hidden lg:flex" />

          {/* Language Switcher */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
          >
            <Globe className="w-4 h-4" aria-hidden="true" />
            {locale === 'ja' ? 'EN' : 'JA'}
          </button>

          {/* Login Button */}
          <Button variant="outline" size="sm" asChild>
            <I18nLink href={loginHref}>
              {t('header.login')}
            </I18nLink>
          </Button>

          {/* Register Button */}
          <Button variant="primary" size="sm" asChild>
            <I18nLink href={registerHref}>
              {t('header.getStarted')}
            </I18nLink>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default LandingHeader;
