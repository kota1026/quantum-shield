'use client';

import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Mail,
  Phone,
  Globe,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Step indicator
interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
            index < currentStep
              ? 'bg-success text-white'
              : index === currentStep
                ? 'bg-gold text-background'
                : 'bg-background-secondary text-foreground-tertiary'
          )}>
            {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div className={cn(
              'mx-2 h-0.5 w-12',
              index < currentStep ? 'bg-success' : 'bg-surface-tertiary'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// Form field component
interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}

function FormField({ label, required, children, error }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function EnterpriseApplication() {
  const t = useTranslations('enterprise.application');
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });

  const steps = [
    t('steps.company'),
    t('steps.plan'),
    t('steps.kyb'),
    t('steps.contract'),
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // 次の画面（プラン選択）に遷移
    router.push('/enterprise/apply/plan');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-foreground-tertiary">
          <Link href="/enterprise/landing" className="hover:text-foreground">
            Enterprise
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{t('title')}</span>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-2 text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={0} steps={steps} />

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('steps.company')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Information */}
            <FormField label={t('fields.companyName')} required>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder={t('placeholders.companyName')}
              />
            </FormField>
            <FormField label={t('fields.industry')} required>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
              >
                <option value="">{t('placeholders.selectIndustry')}</option>
                <option value="financial">{t('industries.financial')}</option>
                <option value="exchange">{t('industries.exchange')}</option>
                <option value="custody">{t('industries.custody')}</option>
                <option value="defi">{t('industries.defi')}</option>
                <option value="other">{t('industries.other')}</option>
              </select>
            </FormField>
            <FormField label={t('fields.companySize')} required>
              <select
                value={formData.companySize}
                onChange={(e) => handleInputChange('companySize', e.target.value)}
                className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
              >
                <option value="">{t('placeholders.selectSize')}</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-1000">201-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </FormField>
            <FormField label={t('fields.website')}>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  placeholder="https://"
                />
              </div>
            </FormField>

            {/* Contact Information */}
            <div className="border-t border-surface-tertiary pt-6">
              <h4 className="mb-4 text-base font-medium text-foreground">{t('steps.contact')}</h4>
            </div>
            <FormField label={t('fields.contactName')} required>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
                className="w-full rounded-lg border border-surface-tertiary bg-background-secondary px-4 py-2 text-sm focus:border-gold focus:outline-none"
                placeholder={t('placeholders.contactName')}
              />
            </FormField>
            <FormField label={t('fields.contactEmail')} required>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  placeholder={t('placeholders.contactEmail')}
                />
              </div>
            </FormField>
            <FormField label={t('fields.contactPhone')}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className="w-full rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  placeholder={t('placeholders.contactPhone')}
                />
              </div>
            </FormField>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" asChild>
                <Link href="/enterprise/landing">{t('navigation.back')}</Link>
              </Button>
              <Button onClick={handleNext} rightIcon={<ArrowRight className="h-4 w-4" />}>
                {t('navigation.next')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
