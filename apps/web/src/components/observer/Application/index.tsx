'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  Eye,
  ArrowLeft,
  Wallet,
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock wallet options
const WALLET_OPTIONS = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '/images/wallets/metamask.svg',
    popular: true,
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '/images/wallets/walletconnect.svg',
    popular: true,
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '/images/wallets/coinbase.svg',
    popular: false,
  },
  {
    id: 'rabby',
    name: 'Rabby',
    icon: '/images/wallets/rabby.svg',
    popular: false,
  },
];

type ApplicationStep = 'connect' | 'terms' | 'confirm' | 'success';

export function ObserverApplication() {
  const t = useTranslations('observer.application');
  const locale = useLocale();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('connect');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLocale = () => {
    const newLocale = locale === 'ja' ? 'en' : 'ja';
    router.replace('/observer/application', { locale: newLocale });
  };

  const handleWalletConnect = async (walletId: string) => {
    setSelectedWallet(walletId);
    setIsConnecting(true);

    // Simulate wallet connection
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock successful connection
    setWalletAddress('0x1234...5678');
    setIsConnecting(false);
    setCurrentStep('terms');
  };

  const handleTermsAgree = () => {
    if (termsAgreed) {
      setCurrentStep('confirm');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate registration
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setCurrentStep('success');
  };

  const steps = [
    { key: 'connect', label: t('steps.connect.title'), icon: Wallet },
    { key: 'terms', label: t('steps.terms.title'), icon: FileText },
    { key: 'confirm', label: t('steps.confirm.title'), icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Premium Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link
          href="/observer/landing"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-medium">{t('backToLanding')}</span>
        </Link>

        <button
          onClick={toggleLocale}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground border border-surface-tertiary/30 rounded-full transition-colors"
          aria-label={locale === 'ja' ? 'Switch to English' : '日本語に切り替え'}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
          {locale === 'ja' ? 'EN' : 'JA'}
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-gold to-gold-400 rounded-2xl flex items-center justify-center shadow-lg shadow-gold/20">
              <Eye className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
            <p className="text-foreground-secondary">{t('description')}</p>
          </div>

          {/* Progress Steps */}
          {currentStep !== 'success' && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {steps.map((step, index) => (
                <div key={step.key} className="flex items-center">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                      index < currentStepIndex
                        ? 'bg-success text-white'
                        : index === currentStepIndex
                          ? 'bg-gold text-white'
                          : 'bg-surface-tertiary text-foreground-tertiary'
                    )}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'w-12 h-0.5 mx-2',
                        index < currentStepIndex ? 'bg-success' : 'bg-surface-tertiary'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step: Connect Wallet */}
          {currentStep === 'connect' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">{t('steps.connect.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {t('steps.connect.description')}
              </p>

              {isConnecting ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 text-gold animate-spin mx-auto mb-4" />
                  <p className="text-sm text-foreground-secondary">
                    {t('steps.connect.connecting', { wallet: WALLET_OPTIONS.find((w) => w.id === selectedWallet)?.name })}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {WALLET_OPTIONS.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleWalletConnect(wallet.id)}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border border-surface-tertiary',
                        'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                        'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                      )}
                    >
                      <div className="w-10 h-10 bg-background-secondary rounded-lg flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-foreground-secondary" aria-hidden="true" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{wallet.name}</div>
                        {wallet.popular && (
                          <span className="text-xs text-gold">{t('steps.connect.popular')}</span>
                        )}
                      </div>
                      <ArrowLeft className="h-4 w-4 text-foreground-tertiary rotate-180" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Step: Terms */}
          {currentStep === 'terms' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">{t('steps.terms.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {t('steps.terms.description')}
              </p>

              <div className="bg-background-secondary rounded-lg p-4 mb-6 max-h-48 overflow-y-auto text-sm text-foreground-secondary">
                <p className="mb-3">
                  {t('steps.terms.termsIntro')}
                </p>
                <ul className="list-disc list-inside space-y-2">
                  <li>{t('steps.terms.termsItem1')}</li>
                  <li>{t('steps.terms.termsItem2')}</li>
                  <li>{t('steps.terms.termsItem3')}</li>
                  <li>{t('steps.terms.termsItem4')}</li>
                </ul>
              </div>

              <label className="flex items-start gap-3 p-4 bg-gold/5 rounded-lg border border-gold/30 cursor-pointer mb-6">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-surface-tertiary text-gold focus:ring-gold"
                />
                <div>
                  <div className="font-medium">{t('steps.terms.agree')}</div>
                  <div className="text-sm text-foreground-secondary">
                    {t('steps.terms.agreeDetails')}
                  </div>
                </div>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep('connect')}
                >
                  {t('steps.terms.back')}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleTermsAgree}
                  disabled={!termsAgreed}
                >
                  {t('steps.terms.next')}
                </Button>
              </div>
            </Card>
          )}

          {/* Step: Confirm */}
          {currentStep === 'confirm' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-2">{t('steps.confirm.title')}</h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {t('steps.confirm.description')}
              </p>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                  <span className="text-sm text-foreground-secondary">
                    {t('steps.confirm.walletAddress')}
                  </span>
                  <span className="font-mono text-sm">{walletAddress}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                  <span className="text-sm text-foreground-secondary">
                    {t('steps.confirm.registrationFee')}
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-sm text-success">{t('steps.confirm.free')}</span>
                    <p className="text-xs text-foreground-tertiary">{t('steps.confirm.feeNote')}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep('terms')}
                  disabled={isSubmitting}
                >
                  {t('steps.confirm.back')}
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('submitting')}
                    </>
                  ) : (
                    t('submit')
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Step: Success */}
          {currentStep === 'success' && (
            <Card className="p-8 text-center border-success bg-success/5">
              <div className="w-16 h-16 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-success" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-success">
                {t('success.title')}
              </h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {t('success.description')}
              </p>
              <Button variant="primary" asChild>
                <Link href="/observer/dashboard">{t('success.goToDashboard')}</Link>
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <p className="text-xs text-foreground-tertiary">
          © 2025 Quantum Shield. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
