'use client';

import { useTranslations } from 'next-intl';
import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Key,
  Lock,
  Download,
  Check,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  X,
} from 'lucide-react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip } from '../Landing/Tooltip';

type OnboardingStep = 1 | 2 | 3 | 4;
type ModalType = 'walletHelp' | 'dilithium' | 'tutorial' | null;

export function Onboarding() {
  const t = useTranslations('consumer.onboarding');
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [checkDownloaded, setCheckDownloaded] = useState(false);
  const [checkSaved, setCheckSaved] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // RainbowKit wallet connection
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();

  const mainRef = useRef<HTMLElement>(null);

  // Progress to next step
  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
  }, []);

  // Watch for wallet connection and proceed to step 2
  useEffect(() => {
    if (isConnected && currentStep === 1) {
      goToStep(2);
    }
  }, [isConnected, currentStep, goToStep]);

  // Handle wallet selection - open RainbowKit modal
  const handleWalletSelect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  // Handle key generation
  const handleGenerateKeys = useCallback(() => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setGenerationComplete(true);
          setTimeout(() => {
            goToStep(3);
          }, 1500);
          return 100;
        }
        return next;
      });
    }, 200);
  }, [goToStep]);

  // Handle backup download
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
    setCheckDownloaded(true);
  }, []);

  // Handle continue to step 4
  const handleContinueToReady = useCallback(() => {
    goToStep(4);
  }, [goToStep]);

  // Determine if continue button should be enabled
  const canContinue = checkDownloaded && checkSaved;

  return (
    <div className="relative min-h-screen">
      {/* Skip Link */}
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-hinomaru focus:text-white focus:rounded-qs"
      >
        Skip to main content
      </a>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial-hinomaru opacity-50" />
      </div>

      {/* Main Content */}
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="relative z-10 outline-none min-h-screen flex flex-col"
        role="main"
        aria-label="Onboarding"
      >
        <div className="container mx-auto max-w-[500px] px-6 py-6 flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center gap-4 mb-8">
            <Link
              href="/consumer"
              className="w-10 h-10 flex items-center justify-center bg-surface border border-border rounded-qs hover:border-hinomaru hover:text-hinomaru-400 transition-colors focus:outline-none focus:ring-2 focus:ring-hinomaru focus:ring-offset-2 focus:ring-offset-background"
              aria-label={t('header.backAriaLabel')}
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
            <h1 className="text-xl font-semibold">{t('header.title')}</h1>
          </header>

          {/* Progress Bar */}
          <div
            className="flex gap-2 mb-10"
            role="progressbar"
            aria-label={t('progress.ariaLabel')}
            aria-valuenow={currentStep}
            aria-valuemin={1}
            aria-valuemax={4}
          >
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  'flex-1 h-1 rounded-full transition-colors duration-300',
                  step <= currentStep
                    ? 'bg-gradient-to-r from-hinomaru to-gold'
                    : 'bg-elevated'
                )}
                aria-hidden="true"
              />
            ))}
          </div>

          {/* Onboarding Card */}
          <div className="card flex-1 flex flex-col">
            {/* Step 1: Wallet Connection */}
            {currentStep === 1 && (
              <Step1WalletConnect
                t={t}
                onWalletSelect={handleWalletSelect}
                onHelpClick={() => setActiveModal('walletHelp')}
              />
            )}

            {/* Step 2: Key Generation */}
            {currentStep === 2 && (
              <Step2KeyGeneration
                t={t}
                isGenerating={isGenerating}
                generationProgress={generationProgress}
                generationComplete={generationComplete}
                onGenerate={handleGenerateKeys}
                onDilithiumHelp={() => setActiveModal('dilithium')}
              />
            )}

            {/* Step 3: Backup */}
            {currentStep === 3 && (
              <Step3Backup
                t={t}
                backupDownloaded={backupDownloaded}
                checkDownloaded={checkDownloaded}
                checkSaved={checkSaved}
                onDownload={handleDownloadBackup}
                onCheckDownloaded={setCheckDownloaded}
                onCheckSaved={setCheckSaved}
                canContinue={canContinue}
                onContinue={handleContinueToReady}
              />
            )}

            {/* Step 4: Ready */}
            {currentStep === 4 && (
              <Step4Ready
                t={t}
                onTutorialClick={() => setActiveModal('tutorial')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal
        isOpen={activeModal === 'walletHelp'}
        onClose={() => setActiveModal(null)}
        title={t('modals.walletHelp.title')}
      >
        <WalletHelpModalContent t={t} onClose={() => setActiveModal(null)} />
      </Modal>

      <Modal
        isOpen={activeModal === 'dilithium'}
        onClose={() => setActiveModal(null)}
        title={t('modals.dilithium.title')}
      >
        <DilithiumModalContent t={t} onClose={() => setActiveModal(null)} />
      </Modal>

      <Modal
        isOpen={activeModal === 'tutorial'}
        onClose={() => setActiveModal(null)}
        title={t('modals.tutorial.title')}
      >
        <TutorialModalContent t={t} onClose={() => setActiveModal(null)} />
      </Modal>
    </div>
  );
}

// Step 1: Wallet Connection
interface Step1Props {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  onWalletSelect: () => void;
  onHelpClick: () => void;
}

function Step1WalletConnect({ t, onWalletSelect, onHelpClick }: Step1Props) {
  return (
    <div className="flex-1 flex flex-col">
      <span className="text-xs font-semibold tracking-widest text-gold mb-2">
        {t('step1.indicator')}
      </span>
      <h2 className="text-2xl font-bold mb-3">{t('step1.title')}</h2>
      <p className="text-sm text-foreground-secondary leading-relaxed mb-8">
        {t('step1.description')}
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <WalletOption
          icon="🦊"
          name={t('step1.wallets.metamask.name')}
          description={t('step1.wallets.metamask.description')}
          onClick={onWalletSelect}
        />
        <WalletOption
          icon="🔗"
          name={t('step1.wallets.walletconnect.name')}
          description={t('step1.wallets.walletconnect.description')}
          onClick={onWalletSelect}
        />
        <WalletOption
          icon="💠"
          name={t('step1.wallets.coinbase.name')}
          description={t('step1.wallets.coinbase.description')}
          onClick={onWalletSelect}
        />
      </div>

      <div className="mt-auto text-center">
        <button
          onClick={onHelpClick}
          className="text-sm text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-card rounded"
          type="button"
        >
          {t('step1.helpLink')}
        </button>
      </div>
    </div>
  );
}

// Wallet Option Component
interface WalletOptionProps {
  icon: string;
  name: string;
  description: string;
  onClick: () => void;
}

function WalletOption({ icon, name, description, onClick }: WalletOptionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-surface border border-border rounded-qs-lg hover:border-hinomaru hover:bg-hinomaru/5 transition-colors focus:outline-none focus:ring-2 focus:ring-hinomaru focus:ring-offset-2 focus:ring-offset-card group"
      type="button"
    >
      <div
        className="w-11 h-11 flex items-center justify-center bg-elevated rounded-qs text-2xl"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-sm">{name}</div>
        <div className="text-xs text-foreground-secondary">{description}</div>
      </div>
      <ChevronRight
        className="w-5 h-5 text-foreground-tertiary group-hover:text-hinomaru-400 transition-colors"
        aria-hidden="true"
      />
    </button>
  );
}

// Step 2: Key Generation
interface Step2Props {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  isGenerating: boolean;
  generationProgress: number;
  generationComplete: boolean;
  onGenerate: () => void;
  onDilithiumHelp: () => void;
}

function Step2KeyGeneration({
  t,
  isGenerating,
  generationProgress,
  generationComplete,
  onGenerate,
  onDilithiumHelp,
}: Step2Props) {
  const getStatusText = () => {
    if (generationComplete) return t('step2.keyGeneration.complete');
    if (isGenerating) return t('step2.keyGeneration.generating');
    return t('step2.keyGeneration.idle');
  };

  return (
    <div className="flex-1 flex flex-col">
      <span className="text-xs font-semibold tracking-widest text-gold mb-2">
        {t('step2.indicator')}
      </span>
      <h2 className="text-2xl font-bold mb-3">
        <Tooltip content={t('step2.dilithiumTooltip')} showHelpIcon>
          <span className="border-b border-dashed border-foreground-tertiary cursor-help">
            {t('step2.title')}
          </span>
        </Tooltip>
      </h2>
      <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
        {t('step2.description')}
      </p>

      {/* Self-Custody Notice */}
      <div className="p-4 bg-hinomaru/10 border border-hinomaru/30 rounded-qs-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-hinomaru-400 flex-shrink-0" aria-hidden="true" />
          <strong className="text-sm text-hinomaru-400">{t('step2.selfCustodyNotice.title')}</strong>
        </div>
        <p className="text-xs text-foreground-secondary mb-3">
          {t('step2.selfCustodyNotice.description')}
        </p>
        <div className="text-xs text-foreground-secondary mb-2">
          <strong className="text-foreground">{t('step2.selfCustodyNotice.whyTitle')}</strong>
        </div>
        <ul className="text-xs text-foreground-secondary space-y-1 mb-3 pl-4">
          {(t.raw('step2.selfCustodyNotice.whyPoints') as string[]).map((point, index) => (
            <li key={index} className="list-disc">{point}</li>
          ))}
        </ul>
        <div className="flex items-start gap-2 p-2 bg-warning/10 rounded-qs">
          <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs text-warning">{t('step2.selfCustodyNotice.warning')}</span>
        </div>
      </div>

      {/* Key Visual */}
      <div className="text-center py-5">
        <div className="relative w-40 h-40 mx-auto mb-8">
          <div
            className="absolute inset-0 border-2 border-gold rounded-full animate-[spin_8s_linear_infinite]"
            aria-hidden="true"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gold rounded-full" />
          </div>
          <div className="absolute inset-[30px] flex items-center justify-center bg-hinomaru/10 rounded-full">
            <Lock className="w-12 h-12 text-hinomaru-400" aria-hidden="true" />
          </div>
        </div>

        <p
          className={cn(
            'text-sm mb-2 transition-colors',
            generationComplete ? 'text-success' : 'text-foreground-secondary'
          )}
          role="status"
          aria-live="polite"
        >
          {getStatusText()}
        </p>

        <div className="w-[200px] h-1.5 bg-elevated rounded-full mx-auto overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all duration-300"
            style={{ width: `${generationProgress}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      <button
        onClick={onDilithiumHelp}
        className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline mb-6 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-card rounded"
        type="button"
      >
        <BookOpen className="w-4 h-4" aria-hidden="true" />
        {t('step2.dilithiumHelpLink')}
      </button>

      <Button
        variant="primary"
        size="lg"
        onClick={onGenerate}
        disabled={isGenerating || generationComplete}
        className="w-full"
      >
        {isGenerating ? t('step2.generatingButton') : t('step2.generateButton')}
      </Button>
    </div>
  );
}

// Step 3: Backup
interface Step3Props {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  backupDownloaded: boolean;
  checkDownloaded: boolean;
  checkSaved: boolean;
  onDownload: () => void;
  onCheckDownloaded: (value: boolean) => void;
  onCheckSaved: (value: boolean) => void;
  canContinue: boolean;
  onContinue: () => void;
}

function Step3Backup({
  t,
  backupDownloaded,
  checkDownloaded,
  checkSaved,
  onDownload,
  onCheckDownloaded,
  onCheckSaved,
  canContinue,
  onContinue,
}: Step3Props) {
  return (
    <div className="flex-1 flex flex-col">
      <span className="text-xs font-semibold tracking-widest text-gold mb-2">
        {t('step3.indicator')}
      </span>
      <h2 className="text-2xl font-bold mb-3">{t('step3.title')}</h2>
      <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
        {t('step3.description')}
      </p>

      {/* Warning Box */}
      <div
        className="flex items-start gap-3 p-4 bg-warning/10 border border-warning rounded-qs-lg mb-6"
        role="alert"
      >
        <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold text-warning mb-1">
            {t('step3.warning.title')}
          </h3>
          <p className="text-xs text-foreground-secondary leading-relaxed">
            {t('step3.warning.description')}
          </p>
        </div>
      </div>

      {/* Download Option */}
      <button
        onClick={onDownload}
        className={cn(
          'flex items-center gap-4 p-4 border rounded-qs-lg mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card',
          backupDownloaded
            ? 'bg-success/10 border-success focus:ring-success'
            : 'bg-surface border-gold hover:border-gold/80 focus:ring-gold'
        )}
        type="button"
      >
        <div
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-qs',
            backupDownloaded ? 'bg-success/10' : 'bg-gold/10'
          )}
          aria-hidden="true"
        >
          <Download
            className={cn('w-6 h-6', backupDownloaded ? 'text-success' : 'text-gold')}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm flex items-center gap-2">
            {t('step3.backupOption.name')}
            <span
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                backupDownloaded
                  ? 'bg-success text-background'
                  : 'bg-gold text-background'
              )}
            >
              {backupDownloaded
                ? t('step3.backupOption.completed')
                : t('step3.backupOption.recommended')}
            </span>
          </div>
          <div className="text-xs text-foreground-secondary">
            {backupDownloaded
              ? t('step3.backupOption.downloadedDescription')
              : t('step3.backupOption.description')}
          </div>
        </div>
      </button>

      {/* Checklist */}
      <div className="flex flex-col gap-3 mb-6">
        <CheckboxItem
          id="check-downloaded"
          checked={checkDownloaded}
          onChange={onCheckDownloaded}
          label={t('step3.checklist.downloaded')}
        />
        <CheckboxItem
          id="check-saved"
          checked={checkSaved}
          onChange={onCheckSaved}
          label={t('step3.checklist.saved')}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full"
      >
        {t('step3.continueButton')}
      </Button>
    </div>
  );
}

// Checkbox Item
interface CheckboxItemProps {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}

function CheckboxItem({ id, checked, onChange, label }: CheckboxItemProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-start gap-3 p-4 bg-surface border rounded-qs-lg cursor-pointer transition-colors',
        checked ? 'border-success bg-success/5' : 'border-border hover:border-foreground-tertiary'
      )}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 mt-0.5 accent-hinomaru cursor-pointer flex-shrink-0"
      />
      <span
        className={cn(
          'text-xs leading-relaxed',
          checked ? 'text-foreground' : 'text-foreground-secondary'
        )}
      >
        {label}
      </span>
    </label>
  );
}

// Step 4: Ready
interface Step4Props {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  onTutorialClick: () => void;
}

function Step4Ready({ t, onTutorialClick }: Step4Props) {
  return (
    <div className="flex-1 flex flex-col">
      <span className="text-xs font-semibold tracking-widest text-gold mb-2">
        {t('step4.indicator')}
      </span>

      <div className="text-center py-5">
        {/* Success Icon */}
        <div className="w-[120px] h-[120px] mx-auto mb-8 flex items-center justify-center bg-success/10 border-2 border-success rounded-full animate-[scale-in_0.5s_ease-out]">
          <Check className="w-14 h-14 text-success" aria-hidden="true" />
        </div>

        <h2 className="text-[28px] font-bold mb-3">{t('step4.title')}</h2>
        <p className="text-sm text-foreground-secondary leading-relaxed mb-8">
          {t('step4.description')}
        </p>

        {/* Features List */}
        <div className="flex flex-col gap-3 mb-8 text-left">
          <FeatureItem text={t('step4.features.keysGenerated')} />
          <FeatureItem text={t('step4.features.backupComplete')} />
          <FeatureItem text={t('step4.features.protectionActive')} />
        </div>

        <Link href="/consumer/dashboard" className="block">
          <Button variant="primary" size="lg" className="w-full">
            {t('step4.ctaButton')} →
          </Button>
        </Link>

        <button
          onClick={onTutorialClick}
          className="mt-4 text-sm text-gold hover:underline focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-card rounded"
          type="button"
        >
          {t('step4.tutorialLink')}
        </button>
      </div>
    </div>
  );
}

// Feature Item
function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface rounded-qs">
      <div className="w-8 h-8 flex items-center justify-center bg-success/10 rounded-full">
        <Check className="w-4 h-4 text-success" aria-hidden="true" />
      </div>
      <span className="text-sm text-foreground-secondary">{text}</span>
    </div>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-card border border-border rounded-qs-xl max-w-[500px] w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h3 id="modal-title" className="text-lg font-semibold">
            {title}
          </h3>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-hinomaru rounded"
            aria-label="Close modal"
            type="button"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Wallet Help Modal Content
function WalletHelpModalContent({
  t,
  onClose,
}: {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  onClose: () => void;
}) {
  return (
    <>
      <div className="p-6">
        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
          {t('modals.walletHelp.intro')}
        </p>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.walletHelp.metamaskTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              {t('modals.walletHelp.metamaskSteps.step1')}
            </a>
          </li>
          <li>{t('modals.walletHelp.metamaskSteps.step2')}</li>
          <li>{t('modals.walletHelp.metamaskSteps.step3')}</li>
          <li>{t('modals.walletHelp.metamaskSteps.step4')}</li>
        </ul>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.walletHelp.warningTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>{t('modals.walletHelp.warnings.warning1')}</li>
          <li>{t('modals.walletHelp.warnings.warning2')}</li>
          <li>{t('modals.walletHelp.warnings.warning3')}</li>
        </ul>
      </div>
      <div className="p-4 border-t border-border">
        <Button variant="primary" size="md" onClick={onClose} className="w-full">
          {t('modals.walletHelp.closeButton')}
        </Button>
      </div>
    </>
  );
}

// Dilithium Modal Content
function DilithiumModalContent({
  t,
  onClose,
}: {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  onClose: () => void;
}) {
  return (
    <>
      <div className="p-6">
        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
          <strong>{t('modals.dilithium.intro')}</strong>
        </p>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.dilithium.whyTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>{t('modals.dilithium.whyReasons.reason1')}</li>
          <li>{t('modals.dilithium.whyReasons.reason2')}</li>
        </ul>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.dilithium.featuresTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>🏛️ <strong>{t('modals.dilithium.features.nist')}</strong></li>
          <li>🔐 <strong>{t('modals.dilithium.features.lattice')}</strong></li>
          <li>⚡ <strong>{t('modals.dilithium.features.fast')}</strong></li>
          <li>📦 <strong>{t('modals.dilithium.features.level')}</strong></li>
        </ul>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.dilithium.securityTitle')}
        </h4>
        <p className="text-sm text-foreground-secondary leading-relaxed">
          {t('modals.dilithium.securityDescription')}
        </p>
      </div>
      <div className="p-4 border-t border-border">
        <Button variant="primary" size="md" onClick={onClose} className="w-full">
          {t('modals.dilithium.closeButton')}
        </Button>
      </div>
    </>
  );
}

// Tutorial Modal Content
function TutorialModalContent({
  t,
  onClose,
}: {
  t: ReturnType<typeof useTranslations<'consumer.onboarding'>>;
  onClose: () => void;
}) {
  return (
    <>
      <div className="p-6">
        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
          {t('modals.tutorial.intro')}
        </p>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.tutorial.lockTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>{t('modals.tutorial.lockSteps.step1')}</li>
          <li>{t('modals.tutorial.lockSteps.step2')}</li>
          <li>{t('modals.tutorial.lockSteps.step3')}</li>
        </ul>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.tutorial.unlockTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>{t('modals.tutorial.unlockSteps.normal')}</li>
          <li>{t('modals.tutorial.unlockSteps.emergency')}</li>
        </ul>

        <h4 className="text-sm font-semibold mb-2 mt-4">
          {t('modals.tutorial.securityTitle')}
        </h4>
        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground-secondary">
          <li>{t('modals.tutorial.securityTips.tip1')}</li>
          <li>{t('modals.tutorial.securityTips.tip2')}</li>
          <li>{t('modals.tutorial.securityTips.tip3')}</li>
        </ul>
      </div>
      <div className="p-4 border-t border-border">
        <Button variant="primary" size="md" onClick={onClose} className="w-full">
          {t('modals.tutorial.closeButton')}
        </Button>
      </div>
    </>
  );
}

export default Onboarding;
