'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Shield,
  Clock,
  Zap,
  Lock,
  Building,
  Globe,
  Mail,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FormData {
  // Step 1: Basic Info
  organizationName: string;
  country: string;
  website: string;
  contactEmail: string;
  validatorExperience: string;
  // Step 2: Technical
  hsmProvider: string;
  infrastructureLocation: string;
  hsmConfirmed: boolean;
  uptimeConfirmed: boolean;
  responseTimeConfirmed: boolean;
  multisigConfirmed: boolean;
  // Step 3: Legal & KYB
  businessRegistrationNumber: string;
  documentUploaded: boolean;
  agreeTerms: boolean;
  agreeKyb: boolean;
  agreeStake: boolean;
}

const initialFormData: FormData = {
  organizationName: '',
  country: '',
  website: '',
  contactEmail: '',
  validatorExperience: '',
  hsmProvider: '',
  infrastructureLocation: '',
  hsmConfirmed: false,
  uptimeConfirmed: false,
  responseTimeConfirmed: false,
  multisigConfirmed: false,
  businessRegistrationNumber: '',
  documentUploaded: false,
  agreeTerms: false,
  agreeKyb: false,
  agreeStake: false,
};

export function ProverApplication() {
  const t = useTranslations('prover');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationId] = useState(
    `PRV-2026-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
  );

  const steps = [
    { number: 1, label: t('application.steps.basicInfo') },
    { number: 2, label: t('application.steps.technical') },
    { number: 3, label: t('application.steps.legal') },
    { number: 4, label: t('application.steps.review') },
  ];

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation functions for each step
  const isStep1Valid = () => {
    return (
      formData.organizationName.trim() !== '' &&
      formData.country !== '' &&
      formData.contactEmail.trim() !== '' &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)
    );
  };

  const isStep2Valid = () => {
    return (
      formData.hsmConfirmed &&
      formData.uptimeConfirmed &&
      formData.responseTimeConfirmed &&
      formData.multisigConfirmed
    );
  };

  const isStep3Valid = () => {
    return (
      formData.businessRegistrationNumber.trim() !== '' &&
      formData.agreeTerms &&
      formData.agreeKyb &&
      formData.agreeStake
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid();
      case 2:
        return isStep2Valid();
      case 3:
        return isStep3Valid();
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const countries = [
    { value: '', label: t('application.form.selectCountry') },
    { value: 'JP', label: t('application.form.countries.japan') },
    { value: 'US', label: t('application.form.countries.usa') },
    { value: 'SG', label: t('application.form.countries.singapore') },
    { value: 'CH', label: t('application.form.countries.switzerland') },
    { value: 'OTHER', label: t('application.form.countries.other') },
  ];

  const experienceLevels = [
    { value: '', label: t('application.form.selectExperience') },
    { value: 'none', label: t('application.form.experience.none') },
    { value: '1-2', label: t('application.form.experience.years1to2') },
    { value: '3-5', label: t('application.form.experience.years3to5') },
    { value: '5+', label: t('application.form.experience.years5plus') },
  ];

  const hsmProviders = [
    { value: '', label: t('application.form.selectHsm') },
    { value: 'thales', label: 'Thales Luna' },
    { value: 'aws', label: 'AWS CloudHSM' },
    { value: 'azure', label: 'Azure Dedicated HSM' },
    { value: 'other', label: t('application.form.other') },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex justify-between items-center py-5 px-8" role="banner">
          <Link href="/prover/landing" className="flex items-center gap-3">
            <div className="w-11 h-11 relative flex items-center justify-center">
              <div
                className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
                style={{ animationDuration: '25s' }}
              />
              <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
            </div>
            <div>
              <div className="text-lg font-semibold">Quantum Shield</div>
              <div className="text-[10px] text-gold tracking-[1.5px]">
                Prover Portal
              </div>
            </div>
          </Link>
        </header>

        <div className="max-w-2xl mx-auto px-8 py-16">
          <Card className="text-center p-12">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-success" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold mb-4">
              {t('application.submitted.title')}
            </h1>
            <p className="text-foreground-secondary mb-8">
              {t('application.submitted.description')}
            </p>
            <div className="inline-block px-6 py-3 bg-background-secondary rounded-lg font-mono text-lg mb-8">
              {t('application.submitted.applicationId')}: #{applicationId}
            </div>
            <div className="flex gap-4 justify-center">
              <Button variant="primary" asChild>
                <Link href="/prover/application-status">
                  {t('application.submitted.checkStatus')}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/prover/landing">
                  {t('application.submitted.backToHome')}
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#application-form"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to application form
      </a>

      {/* Header */}
      <header className="flex justify-between items-center py-5 px-8" role="banner">
        <Link href="/prover/landing" className="flex items-center gap-3">
          <div className="w-11 h-11 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-[22px] h-[22px] bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-lg font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1.5px]">
              Prover Portal
            </div>
          </div>
        </Link>
        <Link
          href="/prover/landing"
          className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('application.backToOverview')}
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-8">
        {/* Progress Steps */}
        <nav
          className="py-10"
          role="navigation"
          aria-label="Application progress"
        >
          <ol className="flex justify-between relative">
            <div
              className="absolute top-5 left-0 right-0 h-0.5 bg-surface-tertiary"
              aria-hidden="true"
            />
            {steps.map((step) => (
              <li key={step.number} className="relative z-10 flex flex-col items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step.number < currentStep
                      ? 'bg-success text-white'
                      : step.number === currentStep
                        ? 'bg-hinomaru text-white'
                        : 'bg-background-secondary border border-surface-tertiary text-foreground-tertiary'
                  }`}
                  aria-current={step.number === currentStep ? 'step' : undefined}
                >
                  {step.number < currentStep ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-xs text-center ${
                    step.number === currentStep
                      ? 'text-foreground font-medium'
                      : 'text-foreground-tertiary'
                  }`}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form Section */}
        <main id="application-form" className="pb-16">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step1.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step1.description')}
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="org-name" className="text-sm text-foreground-secondary">
                    {t('application.form.organizationName')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <input
                    id="org-name"
                    type="text"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder={t('application.form.organizationNamePlaceholder')}
                    value={formData.organizationName}
                    onChange={(e) => updateFormData('organizationName', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="country" className="text-sm text-foreground-secondary">
                      {t('application.form.country')}{' '}
                      <span className="text-hinomaru">*</span>
                    </label>
                    <select
                      id="country"
                      className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20 appearance-none"
                      value={formData.country}
                      onChange={(e) => updateFormData('country', e.target.value)}
                      required
                    >
                      {countries.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="website" className="text-sm text-foreground-secondary">
                      {t('application.form.website')}
                    </label>
                    <input
                      id="website"
                      type="url"
                      className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => updateFormData('website', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm text-foreground-secondary">
                    {t('application.form.contactEmail')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder="contact@example.com"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="experience" className="text-sm text-foreground-secondary">
                    {t('application.form.validatorExperience')}
                  </label>
                  <select
                    id="experience"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20 appearance-none"
                    value={formData.validatorExperience}
                    onChange={(e) => updateFormData('validatorExperience', e.target.value)}
                  >
                    {experienceLevels.map((exp) => (
                      <option key={exp.value} value={exp.value}>
                        {exp.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep1Valid()}
                  aria-disabled={!isStep1Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 2: Technical */}
          {currentStep === 2 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step2.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step2.description')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    key: 'hsmConfirmed',
                    icon: Shield,
                    title: t('application.step2.requirements.hsm.title'),
                    desc: t('application.step2.requirements.hsm.description'),
                  },
                  {
                    key: 'uptimeConfirmed',
                    icon: Clock,
                    title: t('application.step2.requirements.uptime.title'),
                    desc: t('application.step2.requirements.uptime.description'),
                  },
                  {
                    key: 'responseTimeConfirmed',
                    icon: Zap,
                    title: t('application.step2.requirements.responseTime.title'),
                    desc: t('application.step2.requirements.responseTime.description'),
                  },
                  {
                    key: 'multisigConfirmed',
                    icon: Lock,
                    title: t('application.step2.requirements.multisig.title'),
                    desc: t('application.step2.requirements.multisig.description'),
                  },
                ].map((req) => (
                  <label
                    key={req.key}
                    className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg cursor-pointer hover:bg-surface transition-colors"
                  >
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru"
                      checked={formData[req.key as keyof FormData] as boolean}
                      onChange={(e) =>
                        updateFormData(req.key as keyof FormData, e.target.checked)
                      }
                    />
                    <req.icon
                      className={`h-6 w-6 ${
                        formData[req.key as keyof FormData]
                          ? 'text-success'
                          : 'text-foreground-tertiary'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{req.title}</div>
                      <div className="text-sm text-foreground-secondary">{req.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="hsm-provider" className="text-sm text-foreground-secondary">
                    {t('application.form.hsmProvider')}
                  </label>
                  <select
                    id="hsm-provider"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20 appearance-none"
                    value={formData.hsmProvider}
                    onChange={(e) => updateFormData('hsmProvider', e.target.value)}
                  >
                    {hsmProviders.map((hsm) => (
                      <option key={hsm.value} value={hsm.value}>
                        {hsm.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="infrastructure" className="text-sm text-foreground-secondary">
                    {t('application.form.infrastructureLocation')}
                  </label>
                  <input
                    id="infrastructure"
                    type="text"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder={t('application.form.infrastructurePlaceholder')}
                    value={formData.infrastructureLocation}
                    onChange={(e) => updateFormData('infrastructureLocation', e.target.value)}
                  />
                </div>
              </div>

              {!isStep2Valid() && (
                <p className="text-sm text-hinomaru mt-4" role="alert">
                  {t('application.step2.validationMessage')}
                </p>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep2Valid()}
                  aria-disabled={!isStep2Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 3: Legal & KYB */}
          {currentStep === 3 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step3.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step3.description')}
              </p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="reg-number" className="text-sm text-foreground-secondary">
                    {t('application.form.businessRegistrationNumber')}{' '}
                    <span className="text-hinomaru">*</span>
                  </label>
                  <input
                    id="reg-number"
                    type="text"
                    className="w-full px-4 py-3 bg-background-secondary border border-surface-tertiary rounded-lg text-foreground focus:outline-none focus:border-hinomaru focus:ring-2 focus:ring-hinomaru/20"
                    placeholder={t('application.form.registrationNumberPlaceholder')}
                    value={formData.businessRegistrationNumber}
                    onChange={(e) =>
                      updateFormData('businessRegistrationNumber', e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-foreground-secondary">
                    {t('application.form.uploadDocument')}
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-background-secondary border border-dashed border-surface-tertiary rounded-lg">
                    <Upload className="h-6 w-6 text-foreground-tertiary" aria-hidden="true" />
                    <div className="flex-1">
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        accept=".pdf,.jpg,.png"
                        onChange={() => updateFormData('documentUploaded', true)}
                      />
                      <label
                        htmlFor="document-upload"
                        className="text-hinomaru cursor-pointer hover:underline"
                      >
                        {t('application.form.chooseFile')}
                      </label>
                      <p className="text-xs text-foreground-tertiary mt-1">
                        {t('application.form.fileFormats')}
                      </p>
                    </div>
                    {formData.documentUploaded && (
                      <Check className="h-5 w-5 text-success" aria-hidden="true" />
                    )}
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                      checked={formData.agreeTerms}
                      onChange={(e) => updateFormData('agreeTerms', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-foreground-secondary">
                      {t('application.form.agreeTerms')}{' '}
                      <Link href="/prover/terms" className="text-gold underline">
                        {t('application.form.proverTerms')}
                      </Link>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                      checked={formData.agreeKyb}
                      onChange={(e) => updateFormData('agreeKyb', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-foreground-secondary">
                      {t('application.form.agreeKyb')}
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded accent-hinomaru mt-0.5"
                      checked={formData.agreeStake}
                      onChange={(e) => updateFormData('agreeStake', e.target.checked)}
                      required
                    />
                    <span className="text-sm text-foreground-secondary">
                      {t('application.form.agreeStake')}{' '}
                      <Link
                        href="/prover/requirements#risk"
                        className="text-gold underline"
                      >
                        {t('application.form.quadraticSlashing')}
                      </Link>
                    </span>
                  </label>
                </div>
              </div>

              {!isStep3Valid() && (
                <p className="text-sm text-hinomaru mt-4" role="alert">
                  {t('application.step3.validationMessage')}
                </p>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={nextStep}
                  disabled={!isStep3Valid()}
                  aria-disabled={!isStep3Valid()}
                >
                  {t('application.continue')}
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card className="p-10">
              <h1 className="text-2xl font-bold mb-2">
                {t('application.step4.title')}
              </h1>
              <p className="text-foreground-secondary mb-8">
                {t('application.step4.description')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  {
                    label: t('application.review.organization'),
                    value: formData.organizationName || '-',
                    icon: Building,
                  },
                  {
                    label: t('application.review.country'),
                    value:
                      countries.find((c) => c.value === formData.country)?.label ||
                      '-',
                    icon: Globe,
                  },
                  {
                    label: t('application.review.contactEmail'),
                    value: formData.contactEmail || '-',
                    icon: Mail,
                  },
                  {
                    label: t('application.review.hsmProvider'),
                    value:
                      hsmProviders.find((h) => h.value === formData.hsmProvider)
                        ?.label || '-',
                    icon: Shield,
                  },
                  {
                    label: t('application.review.infrastructure'),
                    value: formData.infrastructureLocation || '-',
                    icon: Globe,
                  },
                  {
                    label: t('application.review.stakeCommitment'),
                    value: '$400,000+',
                    icon: FileText,
                    highlight: true,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-3 border-b border-surface-tertiary"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className="h-4 w-4 text-foreground-tertiary"
                        aria-hidden="true"
                      />
                      <span className="text-foreground-secondary">{item.label}</span>
                    </div>
                    <span
                      className={`font-semibold ${item.highlight ? 'text-gold' : ''}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-hinomaru/10 border border-hinomaru rounded-lg p-4 mb-8">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-hinomaru flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-semibold text-hinomaru-400">
                      {t('application.review.important')}:
                    </span>{' '}
                    <span className="text-foreground-secondary">
                      {t('application.review.reviewNote')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('application.back')}
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  {t('application.submit')}
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
