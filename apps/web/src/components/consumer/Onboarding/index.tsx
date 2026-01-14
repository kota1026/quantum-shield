'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Key,
  Download,
  AlertTriangle,
  HelpCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type OnboardingStep = 1 | 2 | 3 | 4;

interface ModalState {
  walletHelp: boolean;
  dilithium: boolean;
  tutorial: boolean;
}

export function Onboarding() {
  const t = useTranslations('onboarding');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    downloaded: false,
    saved: false,
  });
  const [modals, setModals] = useState<ModalState>({
    walletHelp: false,
    dilithium: false,
    tutorial: false,
  });
  const mainRef = useRef<HTMLElement>(null);

  // Wallet selection handler
  const handleWalletSelect = useCallback((wallet: string) => {
    setSelectedWallet(wallet);
    // Simulate wallet connection and proceed to next step
    setTimeout(() => {
      setCurrentStep(2);
    }, 500);
  }, []);

  // Key generation handler
  const handleGenerateKeys = useCallback(() => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setKeysGenerated(true);
          setTimeout(() => {
            setCurrentStep(3);
          }, 1000);
          return 100;
        }
        return next;
      });
    }, 200);
  }, []);

  // Backup download handler
  const handleDownloadBackup = useCallback(() => {
    const backupData = {
      version: '1.0',
      algorithm: 'Dilithium-III',
      created: new Date().toISOString(),
      encrypted_private_key: 'ENCRYPTED_KEY_PLACEHOLDER_' + Date.now(),
      public_key: '0x04a7b3c8d9e2f1a0b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9...',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-shield-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupDownloaded(true);
    setCheckboxes((prev) => ({ ...prev, downloaded: true }));
  }, []);

  // Modal handlers
  const openModal = useCallback((modal: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modal]: true }));
  }, []);

  const closeModal = useCallback((modal: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modal]: false }));
  }, []);

  // Checkbox handler
  const handleCheckboxChange = useCallback(
    (checkbox: 'downloaded' | 'saved') => {
      setCheckboxes((prev) => ({ ...prev, [checkbox]: !prev[checkbox] }));
    },
    []
  );

  // Continue to step 4
  const handleContinueToReady = useCallback(() => {
    setCurrentStep(4);
  }, []);

  // Progress indicator
  const renderProgressBar = () => (
    <div className="flex gap-2 mb-10" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={cn(
            'flex-1 h-1 rounded-full transition-all duration-300',
            step < currentStep
              ? 'bg-gradient-to-r from-hinomaru to-gold'
              : step === currentStep
              ? 'bg-gradient-to-r from-hinomaru to-gold'
              : 'bg-surface-secondary'
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  // Step 1: Wallet Connect
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">
        {t('progress.step', { current: 1, total: 4 })}
      </div>
      <h2 className="text-2xl font-bold">{t('step1.title')}</h2>
      <p className="text-foreground-secondary leading-relaxed">
        {t('step1.description')}
      </p>

      <div className="space-y-3">
        {(['metamask', 'walletconnect', 'coinbase'] as const).map((wallet) => (
          <button
            key={wallet}
            onClick={() => handleWalletSelect(wallet)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-qs-lg border transition-all',
              selectedWallet === wallet
                ? 'border-hinomaru bg-hinomaru/10'
                : 'border-border bg-surface hover:border-hinomaru hover:bg-hinomaru/5'
            )}
            aria-pressed={selectedWallet === wallet}
          >
            <div className="w-11 h-11 flex items-center justify-center bg-surface-secondary rounded-qs text-2xl">
              {wallet === 'metamask' && '🦊'}
              {wallet === 'walletconnect' && '🔗'}
              {wallet === 'coinbase' && '💠'}
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold">
                {t(`step1.wallets.${wallet}.name`)}
              </div>
              <div className="text-sm text-foreground-secondary">
                {t(`step1.wallets.${wallet}.description`)}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-foreground-tertiary" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="text-center pt-4">
        <button
          onClick={() => openModal('walletHelp')}
          className="text-sm text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-background rounded"
        >
          {t('step1.helpLink')}
        </button>
      </div>
    </div>
  );

  // Step 2: Key Generation
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">
        {t('progress.step', { current: 2, total: 4 })}
      </div>
      <h2 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
        <span className="relative group">
          {t('step2.title')}
          <button
            onClick={() => openModal('dilithium')}
            className="inline-flex items-center justify-center w-5 h-5 ml-1 bg-gold/10 border border-gold rounded-full text-xs font-bold text-gold cursor-help hover:bg-gold hover:text-background transition-colors"
            aria-label={t('step2.learnMore')}
          >
            ?
          </button>
        </span>
      </h2>
      <p className="text-foreground-secondary leading-relaxed">
        {t('step2.description')}
      </p>

      {/* Self-custody notice */}
      <div className="flex items-start gap-3 p-4 bg-hinomaru/10 border border-hinomaru/30 rounded-qs-lg">
        <Key className="w-5 h-5 text-hinomaru-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm">
          <strong className="text-hinomaru-400">
            {t('step2.selfCustody.title')}
          </strong>
          <p className="text-foreground-secondary mt-1">
            {t('step2.selfCustody.description')}
          </p>
        </div>
      </div>

      {/* Key generation visual */}
      <div className="text-center py-6">
        <div className="relative w-40 h-40 mx-auto mb-6">
          <div
            className={cn(
              'absolute inset-0 border-2 border-gold rounded-full',
              isGenerating && 'animate-spin'
            )}
            style={{ animationDuration: '8s' }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gold rounded-full" />
          </div>
          <div className="absolute inset-8 flex items-center justify-center text-5xl bg-hinomaru/10 rounded-full">
            🔐
          </div>
        </div>

        <p
          className={cn(
            'text-sm mb-2',
            keysGenerated ? 'text-success' : 'text-foreground-secondary'
          )}
        >
          {keysGenerated
            ? t('step2.status.complete')
            : isGenerating
            ? t('step2.status.generating')
            : t('step2.status.ready')}
        </p>

        <div className="w-48 h-1.5 bg-surface-secondary rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all duration-300"
            style={{ width: `${generationProgress}%` }}
            role="progressbar"
            aria-valuenow={generationProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <button
        onClick={() => openModal('dilithium')}
        className="text-sm text-gold hover:underline inline-flex items-center gap-1"
      >
        📖 {t('step2.learnMore')}
      </button>

      <Button
        variant="primary"
        fullWidth
        onClick={handleGenerateKeys}
        disabled={isGenerating || keysGenerated}
        isLoading={isGenerating}
      >
        {isGenerating ? t('step2.generatingButton') : t('step2.generateButton')}
      </Button>
    </div>
  );

  // Step 3: Backup
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">
        {t('progress.step', { current: 3, total: 4 })}
      </div>
      <h2 className="text-2xl font-bold">{t('step3.title')}</h2>
      <p className="text-foreground-secondary leading-relaxed">
        {t('step3.description')}
      </p>

      {/* Warning box */}
      <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning rounded-qs-lg">
        <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-semibold text-warning">
            {t('step3.warning.title')}
          </h4>
          <p className="text-sm text-foreground-secondary mt-1">
            {t('step3.warning.description')}
          </p>
        </div>
      </div>

      {/* Backup option */}
      <button
        onClick={handleDownloadBackup}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-qs-lg border transition-all',
          backupDownloaded
            ? 'border-success bg-success/10'
            : 'border-gold bg-gold/5 hover:bg-gold/10'
        )}
      >
        <div
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-qs text-2xl',
            backupDownloaded ? 'bg-success/20' : 'bg-gold/20'
          )}
        >
          <Download className={cn('w-6 h-6', backupDownloaded ? 'text-success' : 'text-gold')} />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold flex items-center gap-2">
            {t('step3.backup.title')}
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-semibold',
                backupDownloaded
                  ? 'bg-success text-background'
                  : 'bg-gold text-background'
              )}
            >
              {backupDownloaded
                ? t('step3.backup.downloaded')
                : t('step3.backup.recommended')}
            </span>
          </div>
          <div className="text-sm text-foreground-secondary">
            {backupDownloaded
              ? t('step3.backup.downloadedDesc')
              : t('step3.backup.description')}
          </div>
        </div>
      </button>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label
          className={cn(
            'flex items-start gap-3 p-4 rounded-qs-lg border cursor-pointer transition-all',
            checkboxes.downloaded
              ? 'border-success bg-success/10'
              : 'border-border bg-surface'
          )}
        >
          <input
            type="checkbox"
            checked={checkboxes.downloaded}
            onChange={() => handleCheckboxChange('downloaded')}
            className="w-5 h-5 mt-0.5 accent-hinomaru"
          />
          <span className="text-sm">{t('step3.checkboxes.downloaded')}</span>
        </label>

        <label
          className={cn(
            'flex items-start gap-3 p-4 rounded-qs-lg border cursor-pointer transition-all',
            checkboxes.saved
              ? 'border-success bg-success/10'
              : 'border-border bg-surface'
          )}
        >
          <input
            type="checkbox"
            checked={checkboxes.saved}
            onChange={() => handleCheckboxChange('saved')}
            className="w-5 h-5 mt-0.5 accent-hinomaru"
          />
          <span className="text-sm">{t('step3.checkboxes.saved')}</span>
        </label>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={handleContinueToReady}
        disabled={!checkboxes.downloaded || !checkboxes.saved}
      >
        {t('step3.continueButton')}
      </Button>
    </div>
  );

  // Step 4: Ready
  const renderStep4 = () => (
    <div className="text-center space-y-6 py-4">
      <div className="text-xs font-semibold tracking-widest uppercase text-gold mb-2">
        {t('progress.step', { current: 4, total: 4 })}
      </div>

      <div className="w-28 h-28 mx-auto flex items-center justify-center bg-success/10 border-2 border-success rounded-full animate-[success-pop_0.5s_ease-out]">
        <Check className="w-14 h-14 text-success" aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-bold">{t('step4.title')}</h2>
      <p className="text-foreground-secondary leading-relaxed">
        {t('step4.description')}
      </p>

      <div className="space-y-3 text-left">
        {(['keysGenerated', 'backupComplete', 'protectionActive'] as const).map(
          (feature) => (
            <div
              key={feature}
              className="flex items-center gap-3 p-3 bg-surface-secondary rounded-qs"
            >
              <div className="w-8 h-8 flex items-center justify-center bg-success/20 rounded-full">
                <Check className="w-4 h-4 text-success" aria-hidden="true" />
              </div>
              <span className="text-sm text-foreground-secondary">
                {t(`step4.features.${feature}`)}
              </span>
            </div>
          )
        )}
      </div>

      <Link href="/consumer/dashboard">
        <Button variant="primary" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
          {t('step4.dashboardButton')}
        </Button>
      </Link>

      <button
        onClick={() => openModal('tutorial')}
        className="text-sm text-gold hover:underline"
      >
        {t('step4.tutorialLink')}
      </button>
    </div>
  );

  // Wallet Help Modal
  const renderWalletHelpModal = () => (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 transition-opacity',
        modals.walletHelp ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      )}
      onClick={() => closeModal('walletHelp')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-help-title"
    >
      <div
        className="bg-surface border border-border rounded-qs-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 id="wallet-help-title" className="text-lg font-semibold">
            {t('modals.walletHelp.title')}
          </h3>
          <button
            onClick={() => closeModal('walletHelp')}
            className="text-foreground-tertiary hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm text-foreground-secondary">
          <p>{t('modals.walletHelp.intro')}</p>
          <h4 className="font-semibold text-foreground">
            {t('modals.walletHelp.metamaskTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('modals.walletHelp.metamaskSteps.step1')}</li>
            <li>{t('modals.walletHelp.metamaskSteps.step2')}</li>
            <li>{t('modals.walletHelp.metamaskSteps.step3')}</li>
            <li>{t('modals.walletHelp.metamaskSteps.step4')}</li>
          </ul>
          <h4 className="font-semibold text-foreground">
            {t('modals.walletHelp.warningTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('modals.walletHelp.warnings.warning1')}</li>
            <li>{t('modals.walletHelp.warnings.warning2')}</li>
            <li>{t('modals.walletHelp.warnings.warning3')}</li>
          </ul>
        </div>
        <div className="p-6 border-t border-border">
          <Button variant="primary" fullWidth onClick={() => closeModal('walletHelp')}>
            {t('modals.walletHelp.close')}
          </Button>
        </div>
      </div>
    </div>
  );

  // Dilithium Modal
  const renderDilithiumModal = () => (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 transition-opacity',
        modals.dilithium ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      )}
      onClick={() => closeModal('dilithium')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dilithium-title"
    >
      <div
        className="bg-surface border border-border rounded-qs-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 id="dilithium-title" className="text-lg font-semibold">
            {t('modals.dilithium.title')}
          </h3>
          <button
            onClick={() => closeModal('dilithium')}
            className="text-foreground-tertiary hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm text-foreground-secondary">
          <p>{t('modals.dilithium.intro')}</p>
          <h4 className="font-semibold text-foreground">
            {t('modals.dilithium.whyTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('modals.dilithium.why.reason1')}</li>
            <li>{t('modals.dilithium.why.reason2')}</li>
          </ul>
          <h4 className="font-semibold text-foreground">
            {t('modals.dilithium.featuresTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>🏛️ {t('modals.dilithium.features.nist')}</li>
            <li>🔐 {t('modals.dilithium.features.lattice')}</li>
            <li>⚡ {t('modals.dilithium.features.fast')}</li>
            <li>📦 {t('modals.dilithium.features.level')}</li>
          </ul>
          <h4 className="font-semibold text-foreground">
            {t('modals.dilithium.securityTitle')}
          </h4>
          <p>{t('modals.dilithium.securityDesc')}</p>
        </div>
        <div className="p-6 border-t border-border">
          <Button variant="primary" fullWidth onClick={() => closeModal('dilithium')}>
            {t('modals.dilithium.close')}
          </Button>
        </div>
      </div>
    </div>
  );

  // Tutorial Modal
  const renderTutorialModal = () => (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 transition-opacity',
        modals.tutorial ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      )}
      onClick={() => closeModal('tutorial')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div
        className="bg-surface border border-border rounded-qs-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 id="tutorial-title" className="text-lg font-semibold">
            {t('modals.tutorial.title')}
          </h3>
          <button
            onClick={() => closeModal('tutorial')}
            className="text-foreground-tertiary hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm text-foreground-secondary">
          <p>{t('modals.tutorial.intro')}</p>
          <h4 className="font-semibold text-foreground">
            {t('modals.tutorial.lockTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('modals.tutorial.lockSteps.step1')}</li>
            <li>{t('modals.tutorial.lockSteps.step2')}</li>
            <li>{t('modals.tutorial.lockSteps.step3')}</li>
          </ul>
          <h4 className="font-semibold text-foreground">
            {t('modals.tutorial.unlockTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('modals.tutorial.unlockSteps.step1')}</li>
            <li>{t('modals.tutorial.unlockSteps.step2')}</li>
          </ul>
          <h4 className="font-semibold text-foreground">
            {t('modals.tutorial.securityTitle')}
          </h4>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('modals.tutorial.securitySteps.step1')}</li>
            <li>{t('modals.tutorial.securitySteps.step2')}</li>
            <li>{t('modals.tutorial.securitySteps.step3')}</li>
          </ul>
        </div>
        <div className="p-6 border-t border-border">
          <Button variant="primary" fullWidth onClick={() => closeModal('tutorial')}>
            {t('modals.tutorial.close')}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-6 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer"
            className="w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-qs text-foreground-secondary hover:border-hinomaru hover:text-hinomaru-400 transition-colors"
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">{t('header.title')}</h1>
        </header>

        {/* Progress bar */}
        {renderProgressBar()}

        {/* Main content */}
        <main
          ref={mainRef}
          className="flex-1 bg-surface border border-border rounded-qs-xl p-8"
          role="main"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </main>
      </div>

      {/* Modals */}
      {renderWalletHelpModal()}
      {renderDilithiumModal()}
      {renderTutorialModal()}
    </div>
  );
}

export default Onboarding;
