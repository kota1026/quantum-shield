'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Plus,
  Settings,
  Rocket,
  Users,
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ProposalType = 'parameter' | 'upgrade' | 'council';

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  label: string;
}

function StepIndicator({ step, currentStep, label }: StepIndicatorProps) {
  const isDone = step < currentStep;
  const isActive = step === currentStep;
  const isPending = step > currentStep;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center font-bold text-base transition-all',
          isDone && 'bg-success text-white',
          isActive && 'bg-hinomaru text-white',
          isPending && 'bg-background-secondary border-2 border-border text-foreground-tertiary'
        )}
      >
        {isDone ? <Check className="w-5 h-5" /> : step}
      </div>
      <span
        className={cn(
          'text-xs',
          isActive ? 'text-foreground font-medium' : 'text-foreground-tertiary'
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface StepConnectorProps {
  isDone: boolean;
}

function StepConnector({ isDone }: StepConnectorProps) {
  return (
    <div
      className={cn(
        'w-16 md:w-20 h-0.5 mt-5',
        isDone ? 'bg-success' : 'bg-border'
      )}
    />
  );
}

interface TypeCardProps {
  type: ProposalType;
  icon: React.ReactNode;
  name: string;
  description: string;
  quorum: string;
  isSelected: boolean;
  onClick: () => void;
}

function TypeCard({ type, icon, name, description, quorum, isSelected, onClick }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-background-secondary border-2 rounded-xl p-6 text-center cursor-pointer transition-all',
        isSelected
          ? 'border-hinomaru bg-hinomaru/10'
          : 'border-border hover:border-gold'
      )}
      aria-pressed={isSelected}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold mb-2">{name}</h3>
      <p className="text-xs text-foreground-tertiary mb-4">{description}</p>
      <span className="text-[11px] px-2 py-1 bg-gold/10 text-gold rounded-full">
        {quorum}
      </span>
    </button>
  );
}

interface SuccessScreenProps {
  proposalId: number;
  t: ReturnType<typeof useTranslations>;
}

function SuccessScreen({ proposalId, t }: SuccessScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="text-center p-8">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>
        <h2 className="text-2xl font-bold mb-2">{t('success.title')}</h2>
        <p className="text-foreground-secondary mb-8">{t('success.subtitle')}</p>
        <div className="bg-card border border-border rounded-2xl p-6 text-left max-w-sm mx-auto mb-8">
          <div className="flex justify-between py-2">
            <span className="text-foreground-tertiary text-sm">{t('success.proposalId')}</span>
            <span className="font-semibold text-sm text-gold">QIP-{proposalId}</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Button asChild variant="primary">
            <Link href={`/governance/proposals/${proposalId}`}>{t('success.viewProposal')}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/governance/proposals">{t('success.backToProposals')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function CreateProposal() {
  const t = useTranslations('governance.createProposal');
  const tFooter = useTranslations('governance.landing.footer');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ProposalType | null>(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [forumLink, setForumLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [newProposalId] = useState(48);

  const minVeqs = 10000;
  const userVeqs = 125000;
  const hasSufficientVeqs = userVeqs >= minVeqs;

  const quorumMap: Record<ProposalType, { percent: number; veqs: number }> = {
    parameter: { percent: 4, veqs: 500000 },
    upgrade: { percent: 8, veqs: 1000000 },
    council: { percent: 15, veqs: 1875000 },
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setShowSuccess(true);
  };

  const canProceedStep1 = selectedType !== null && hasSufficientVeqs;
  const canProceedStep2 = title.trim().length > 0 && summary.trim().length > 0;

  return (
    <main className="min-h-screen bg-background" role="main" aria-label={t('ariaLabel')}>
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gold/5 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            <Plus className="w-8 h-8 text-hinomaru" aria-hidden="true" />
            {t('pageTitle')}
          </h1>
          <p className="text-foreground-secondary">{t('pageSubtitle')}</p>
        </header>

        {/* Stepper */}
        <div className="flex justify-center items-center gap-0 mb-12">
          <StepIndicator step={1} currentStep={currentStep} label={t('stepper.type')} />
          <StepConnector isDone={currentStep > 1} />
          <StepIndicator step={2} currentStep={currentStep} label={t('stepper.details')} />
          <StepConnector isDone={currentStep > 2} />
          <StepIndicator step={3} currentStep={currentStep} label={t('stepper.preview')} />
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 md:p-8">
          {/* Step 1: Type Selection */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t('step1.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <TypeCard
                  type="parameter"
                  icon={<Settings className="w-9 h-9 mx-auto text-gold" />}
                  name={t('step1.types.parameter.name')}
                  description={t('step1.types.parameter.description')}
                  quorum={t('step1.types.parameter.quorum')}
                  isSelected={selectedType === 'parameter'}
                  onClick={() => setSelectedType('parameter')}
                />
                <TypeCard
                  type="upgrade"
                  icon={<Rocket className="w-9 h-9 mx-auto text-hinomaru" />}
                  name={t('step1.types.upgrade.name')}
                  description={t('step1.types.upgrade.description')}
                  quorum={t('step1.types.upgrade.quorum')}
                  isSelected={selectedType === 'upgrade'}
                  onClick={() => setSelectedType('upgrade')}
                />
                <TypeCard
                  type="council"
                  icon={<Users className="w-9 h-9 mx-auto text-success" />}
                  name={t('step1.types.council.name')}
                  description={t('step1.types.council.description')}
                  quorum={t('step1.types.council.quorum')}
                  isSelected={selectedType === 'council'}
                  onClick={() => setSelectedType('council')}
                />
              </div>

              {/* Requirement Box */}
              <div className="bg-warning/10 border border-warning rounded-xl p-4 flex gap-4 mb-8">
                <Lock className="w-6 h-6 text-warning flex-shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold mb-1">{t('step1.requirement.title')}</h3>
                  <p className="text-sm text-foreground-secondary mb-2">
                    {t('step1.requirement.description', { minVeqs: minVeqs.toLocaleString() })}
                  </p>
                  <p className="text-sm">
                    {t('step1.requirement.yourBalance')}:{' '}
                    <span className={cn('font-semibold', hasSufficientVeqs ? 'text-success' : 'text-danger')}>
                      {userVeqs.toLocaleString()} veQS{' '}
                      {hasSufficientVeqs ? (
                        <Check className="inline w-4 h-4" />
                      ) : null}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button asChild variant="outline">
                  <Link href="/governance/landing">{t('step1.cancel')}</Link>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceedStep1}
                  className="gap-2"
                >
                  {t('step1.next')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t('step2.title')}</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" htmlFor="proposal-title">
                  {t('step2.titleLabel')} *
                </label>
                <input
                  id="proposal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('step2.titlePlaceholder')}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-hinomaru"
                />
                <p className="text-right text-xs text-foreground-tertiary mt-1">
                  {title.length}/100
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" htmlFor="proposal-summary">
                  {t('step2.summaryLabel')} *
                </label>
                <textarea
                  id="proposal-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={t('step2.summaryPlaceholder')}
                  maxLength={5000}
                  rows={8}
                  className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-hinomaru resize-y"
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  {t('step2.summaryHint')}
                </p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium mb-2" htmlFor="forum-link">
                  {t('step2.forumLinkLabel')}
                </label>
                <input
                  id="forum-link"
                  type="url"
                  value={forumLink}
                  onChange={(e) => setForumLink(e.target.value)}
                  placeholder={t('step2.forumLinkPlaceholder')}
                  className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-hinomaru"
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  {t('step2.forumLinkHint')}
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  {t('step2.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                  className="gap-2"
                >
                  {t('step2.next')}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && selectedType && (
            <div>
              <h2 className="text-xl font-semibold mb-6">{t('step3.title')}</h2>

              {/* Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-[11px] text-foreground-tertiary mb-1">
                    {t('step3.summary.proposalType')}
                  </p>
                  <p className="text-sm font-semibold">{t(`step1.types.${selectedType}.name`)}</p>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-[11px] text-foreground-tertiary mb-1">
                    {t('step3.summary.requiredQuorum')}
                  </p>
                  <p className="text-sm font-semibold text-gold">
                    {quorumMap[selectedType].percent}% ({quorumMap[selectedType].veqs.toLocaleString()} veQS)
                  </p>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-[11px] text-foreground-tertiary mb-1">
                    {t('step3.summary.votingPeriod')}
                  </p>
                  <p className="text-sm font-semibold">{t('step3.summary.votingPeriodValue')}</p>
                </div>
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-[11px] text-foreground-tertiary mb-1">
                    {t('step3.summary.timeLock')}
                  </p>
                  <p className="text-sm font-semibold">{t('step3.summary.timeLockValue')}</p>
                </div>
              </div>

              {/* Preview Title */}
              <div className="mb-6">
                <p className="text-xs text-foreground-tertiary mb-1">{t('step3.previewTitle')}</p>
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-base">{title || 'Untitled Proposal'}</p>
                </div>
              </div>

              {/* Preview Description */}
              <div className="mb-8">
                <p className="text-xs text-foreground-tertiary mb-1">{t('step3.previewDescription')}</p>
                <div className="bg-background-secondary rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {summary || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-danger/10 border border-danger rounded-xl p-4 mb-8">
                <h3 className="font-semibold text-danger mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('step3.warning.title')}
                </h3>
                <p className="text-sm text-foreground-secondary">{t('step3.warning.text')}</p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  {t('step3.back')}
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  {t('step3.submit')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-foreground-muted">{tFooter('disclaimer')}</p>
          </div>
        </footer>
      </div>

      {/* Success Screen */}
      {showSuccess && <SuccessScreen proposalId={newProposalId} t={t} />}
    </main>
  );
}
