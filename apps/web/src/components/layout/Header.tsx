'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const t = useTranslations('header');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-background/90 backdrop-blur-xl',
        'border-b border-border',
        className
      )}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
            aria-label="Quantum Shield Home"
          >
            <div className="relative w-10 h-10 flex items-center justify-center">
              {/* Outer ring */}
              <div
                className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-[spin_20s_linear_infinite]"
                aria-hidden="true"
              >
                <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
              </div>
              {/* Hinomaru center */}
              <div
                className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru"
                aria-hidden="true"
              />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight">
              Quantum Shield
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center gap-8"
            aria-label={t('ariaLabel')}
          >
            <a
              href="#features"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('product')}
            </a>
            <Link
              href="/consumer/security"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('security')}
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('howItWorks')}
            </a>
            <Link
              href="/consumer/faq"
              className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
            >
              {t('faq')}
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Link
              href="/consumer/onboarding"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-hinomaru text-white text-sm font-semibold rounded-full hover:bg-hinomaru-400 hover:shadow-qs transition-all"
            >
              {t('openApp')}
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground-secondary hover:text-foreground transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Menu className="w-6 h-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-6 py-4 space-y-4">
            <a
              href="#features"
              className="block text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('product')}
            </a>
            <Link
              href="/consumer/security"
              className="block text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('security')}
            </Link>
            <a
              href="#how-it-works"
              className="block text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('howItWorks')}
            </a>
            <Link
              href="/consumer/faq"
              className="block text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('faq')}
            </Link>
            <Link
              href="/consumer/onboarding"
              className="block w-full text-center px-6 py-3 bg-hinomaru text-white text-sm font-semibold rounded-qs hover:bg-hinomaru-400 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('openApp')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
