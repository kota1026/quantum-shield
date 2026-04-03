'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Link as I18nLink } from '@/i18n/navigation';
import { HinomaryLogo } from '@/components/shared/HinomaryLogo';

// アプリ定義（Ecosystemと同じ）
const apps = [
  { key: 'consumer', href: '/consumer/landing' },
  { key: 'qsHub', href: '/qs-hub/landing' },
  { key: 'explorer', href: '/explorer/landing' },
  { key: 'prover', href: '/prover/landing' },
  { key: 'observer', href: '/observer/landing' },
  { key: 'enterprise', href: '/enterprise/landing' },
];

export function LandingFooter() {
  const t = useTranslations('ecosystemNew');
  const tCommon = useTranslations('common');

  return (
    <footer className="border-t border-border py-16" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <HinomaryLogo size="sm" />
              <span className="text-lg font-semibold">Quantum Shield</span>
            </div>
            <p className="text-sm text-foreground-secondary">
              {t('footer.brand.description')}
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
              {t('footer.products.title')}
            </h3>
            <ul className="space-y-1">
              {apps.map((app) => (
                <li key={app.key}>
                  <I18nLink
                    href={app.href}
                    className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] px-1"
                  >
                    {t(`apps.list.${app.key}.title`)}
                  </I18nLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
              {t('footer.resources.title')}
            </h3>
            <ul className="space-y-1">
              <li>
                <a
                  href="https://github.com/kota1026/quantum-shield/blob/main/docs/WHITEPAPER.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] px-1"
                >
                  {t('footer.resources.whitepaper')}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/kota1026/quantum-shield"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] px-1"
                >
                  {t('footer.resources.blog')}
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/kota1026/quantum-shield"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] px-1"
                >
                  {t('footer.resources.github')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-foreground-tertiary mb-4">
              {t('footer.support.title')}
            </h3>
            <ul className="space-y-1">
              <li>
                <I18nLink
                  href="/consumer/faq"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-1"
                >
                  {t('footer.support.faq')}
                </I18nLink>
              </li>
              <li>
                <I18nLink
                  href="/consumer/security"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] px-1"
                >
                  {t('footer.support.security')}
                </I18nLink>
              </li>
              <li>
                <a
                  href="mailto:support@quantumshield.io"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors inline-flex items-center min-h-[44px] px-1"
                >
                  {t('footer.support.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border gap-4">
          <p className="text-sm text-foreground-tertiary">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-2">
            <I18nLink
              href="/consumer/terms"
              className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors inline-flex items-center min-h-[44px] px-2"
            >
              {tCommon('footer.terms')}
            </I18nLink>
            <I18nLink
              href="/consumer/privacy"
              className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors inline-flex items-center min-h-[44px] px-2"
            >
              {tCommon('footer.privacy')}
            </I18nLink>
            <a
              href="/risk-disclosure.html"
              className="text-sm text-foreground-tertiary hover:text-foreground-secondary transition-colors inline-flex items-center min-h-[44px] px-2"
            >
              {t('footer.legal.risk')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
