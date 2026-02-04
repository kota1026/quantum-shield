'use client';

import { useTranslations } from 'next-intl';
import { Link as I18nLink } from '@/i18n/navigation';
import { Wallet, ArrowLeft } from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { LandingHeader } from '@/components/shared/LandingHeader';
import { LandingFooter } from '@/components/shared/LandingFooter';
import { HinomaryLogo } from '@/components/shared/HinomaryLogo';

export default function LoginPage() {
  const t = useTranslations('consumer.login');
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect to dashboard when connected
  useEffect(() => {
    if (isConnected) {
      router.push('/consumer/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-30" />
      </div>

      {/* Header */}
      <LandingHeader
        appName="Consumer App"
        appKey="Consumer"
        homeHref="/consumer/landing"
        loginHref="/consumer/login"
        registerHref="/consumer/onboarding"
      />

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-md">
          {/* Back Link */}
          <I18nLink
            href="/consumer/landing"
            className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors mb-8 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('backToHome')}
          </I18nLink>

          {/* Login Card */}
          <div className="bg-surface rounded-qs-lg border border-border p-8 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <HinomaryLogo size="lg" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('title')}
            </h1>
            <p className="text-foreground-secondary mb-8">
              {t('description')}
            </p>

            {/* Connect Wallet Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full mb-4"
              onClick={() => openConnectModal?.()}
            >
              <Wallet className="w-5 h-5 mr-2" aria-hidden="true" />
              {t('connectWallet')}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-4 text-foreground-muted">
                  {t('or')}
                </span>
              </div>
            </div>

            {/* Create Account Link */}
            <p className="text-sm text-foreground-secondary">
              {t('noAccount')}{' '}
              <I18nLink
                href="/consumer/onboarding"
                className="text-gold hover:text-gold-light transition-colors min-h-[44px] inline-flex items-center"
              >
                {t('createAccount')}
              </I18nLink>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
