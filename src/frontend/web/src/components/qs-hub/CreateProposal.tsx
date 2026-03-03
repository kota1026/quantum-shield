'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/shared/Tooltip';

type Step = 'draft' | 'preview' | 'submit' | 'success';

const DEFAULT_USER = {
  veQS: 125000,
  requiredVeQS: 100000,
};

export function CreateProposal() {
  const t = useTranslations('qs-hub.vote.createProposal');
  const tCommon = useTranslations('qs-hub.common');
  const router = useRouter();

  const [step, setStep] = useState<Step>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    discussionLink: '',
  });

  const canSubmit = DEFAULT_USER.veQS >= DEFAULT_USER.requiredVeQS;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Background Effect */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className={cn(
            'absolute -top-24 left-1/2 -translate-x-1/2',
            'w-[800px] h-[500px]',
            'bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)]',
            'opacity-50'
          )}
        />
      </div>

      <main className="relative z-10 max-w-[800px] mx-auto px-4 sm:px-6 pt-6" role="main">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link
            href="/qs-hub/vote/proposals"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToProposals')}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-sm font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-wider">{tCommon('portalName')}</div>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-gold" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center gap-2 mb-8" role="navigation" aria-label={t('steps.ariaLabel')}>
          {['draft', 'preview', 'submit'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  step === s || (step === 'success' && index === 2)
                    ? 'bg-gold text-background'
                    : 'bg-surface text-foreground-tertiary'
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm',
                  step === s ? 'text-foreground' : 'text-foreground-tertiary'
                )}
              >
                {t(`steps.${s}`)}
              </span>
              {index < 2 && <div className="w-8 h-px bg-border mx-3" />}
            </div>
          ))}
        </div>

        {/* Requirement Check */}
        {!canSubmit && (
          <Card className="p-4 mb-6 border-warning/50 bg-warning/5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-warning">{t('requirements.notMet')}</p>
                <p className="text-sm text-foreground-secondary">
                  {t('requirements.description', {
                    required: DEFAULT_USER.requiredVeQS.toLocaleString(),
                    current: DEFAULT_USER.veQS.toLocaleString(),
                  })}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Form */}
        {step === 'draft' && (
          <Card className="p-6">
            <h2 className="font-semibold mb-6">{t('form.title')}</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.proposalTitle.label')}
                  <span className="text-danger ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('form.proposalTitle.placeholder')}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg',
                    'bg-surface border border-border',
                    'focus:border-gold focus:ring-1 focus:ring-gold',
                    'transition-colors'
                  )}
                  maxLength={100}
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  {formData.title.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.summary.label')}
                  <span className="text-danger ml-1">*</span>
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder={t('form.summary.placeholder')}
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg resize-none',
                    'bg-surface border border-border',
                    'focus:border-gold focus:ring-1 focus:ring-gold',
                    'transition-colors'
                  )}
                  maxLength={280}
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  {formData.summary.length}/280
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium">
                    {t('form.description.label')}
                    <span className="text-danger ml-1">*</span>
                  </label>
                  <Tooltip content={t('form.description.tooltip')}>
                    <Info className="w-4 h-4 text-foreground-tertiary" />
                  </Tooltip>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('form.description.placeholder')}
                  rows={10}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg resize-none font-mono text-sm',
                    'bg-surface border border-border',
                    'focus:border-gold focus:ring-1 focus:ring-gold',
                    'transition-colors'
                  )}
                />
                <p className="text-xs text-foreground-tertiary mt-1">
                  {t('form.description.markdownHint')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('form.discussionLink.label')}
                </label>
                <input
                  type="url"
                  value={formData.discussionLink}
                  onChange={(e) => setFormData({ ...formData, discussionLink: e.target.value })}
                  placeholder={t('form.discussionLink.placeholder')}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg',
                    'bg-surface border border-border',
                    'focus:border-gold focus:ring-1 focus:ring-gold',
                    'transition-colors'
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-border">
              <Button
                variant="primary"
                onClick={() => setStep('preview')}
                disabled={!formData.title || !formData.summary || !formData.description}
              >
                {t('form.previewButton')}
              </Button>
            </div>
          </Card>
        )}

        {step === 'preview' && (
          <Card className="p-6">
            <h2 className="font-semibold mb-6">{t('preview.title')}</h2>

            <div className="space-y-4 mb-6">
              <div>
                <span className="text-sm text-foreground-tertiary">{t('form.proposalTitle.label')}</span>
                <p className="font-medium mt-1">{formData.title}</p>
              </div>
              <div>
                <span className="text-sm text-foreground-tertiary">{t('form.summary.label')}</span>
                <p className="mt-1">{formData.summary}</p>
              </div>
              <div>
                <span className="text-sm text-foreground-tertiary">{t('form.description.label')}</span>
                <div className="mt-1 p-4 bg-surface rounded-lg whitespace-pre-wrap text-sm">
                  {formData.description}
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setStep('draft')}>
                {t('preview.editButton')}
              </Button>
              <Button variant="primary" onClick={() => setStep('submit')}>
                {t('preview.continueButton')}
              </Button>
            </div>
          </Card>
        )}

        {step === 'submit' && (
          <Card className="p-6">
            <h2 className="font-semibold mb-6">{t('submit.title')}</h2>

            <div className="p-4 bg-warning/5 border border-warning/30 rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">{t('submit.warning.title')}</p>
                  <p className="text-sm text-foreground-secondary mt-1">
                    {t('submit.warning.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">{t('submit.votingPeriod')}</span>
                <span>7 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">{t('submit.quorumRequired')}</span>
                <span>3,000,000 veQS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-secondary">{t('submit.yourVeQS')}</span>
                <span className="text-gold">{DEFAULT_USER.veQS.toLocaleString()} veQS</span>
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-6 border-t border-border">
              <Button variant="outline" onClick={() => setStep('preview')}>
                {t('submit.backButton')}
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('submit.submitting')}
                  </>
                ) : (
                  t('submit.submitButton')
                )}
              </Button>
            </div>
          </Card>
        )}

        {step === 'success' && (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('success.title')}</h2>
            <p className="text-foreground-secondary mb-6">{t('success.description')}</p>
            <div className="flex justify-center gap-3">
              <Link href="/qs-hub/vote/proposals">
                <Button variant="outline">{t('success.viewProposals')}</Button>
              </Link>
              <Link href="/qs-hub/dashboard">
                <Button variant="primary">{t('success.goToDashboard')}</Button>
              </Link>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

export default CreateProposal;
