'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const t = useTranslations('footer');

  return (
    <footer
      className={cn(
        'border-t border-border mt-20 py-16 lg:py-20',
        className
      )}
      role="contentinfo"
      aria-label={t('ariaLabel')}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 flex items-center justify-center">
                <div
                  className="absolute inset-0 border-[1.5px] border-gold rounded-full"
                  aria-hidden="true"
                />
                <div
                  className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru"
                  aria-hidden="true"
                />
              </div>
              <span className="text-lg font-semibold text-foreground">
                Quantum Shield
              </span>
            </div>
            <p className="text-sm text-foreground-secondary leading-relaxed max-w-xs">
              {t('brand.description')}
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-5">
              {t('product.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('product.explorer')}
                </a>
              </li>
              <li>
                <a
                  href="https://docs.quantumshield.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('product.documentation')}
                </a>
              </li>
              <li>
                <a
                  href="https://api.quantumshield.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('product.api')}
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-5">
              {t('resources.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/whitepaper.pdf"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('resources.whitepaper')}
                </a>
              </li>
              <li>
                <a
                  href="https://blog.quantumshield.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('resources.blog')}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/quantumshield"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('resources.github')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-tertiary mb-5">
              {t('support.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/consumer/faq"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('support.faq')}
                </Link>
              </li>
              <li>
                <Link
                  href="/consumer/security"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('support.security')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@quantumshield.io"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  {t('support.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-foreground-tertiary">
            {t('copyright')} <span aria-label="Japan flag">🇯🇵</span>
          </p>
          <nav className="flex items-center gap-6">
            <Link
              href="/consumer/terms"
              className="text-xs text-foreground-tertiary hover:text-foreground-secondary transition-colors"
            >
              {t('terms')}
            </Link>
            <Link
              href="/consumer/privacy"
              className="text-xs text-foreground-tertiary hover:text-foreground-secondary transition-colors"
            >
              {t('privacy')}
            </Link>
            <a
              href="/risk-disclosure"
              className="text-xs text-foreground-tertiary hover:text-foreground-secondary transition-colors"
            >
              {t('riskDisclosure')}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
