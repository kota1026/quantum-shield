'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, Send, Mail, MessageSquare, CheckCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FormState = 'idle' | 'submitting' | 'success';

interface FormData {
  category: string;
  email: string;
  subject: string;
  message: string;
  walletAddress: string;
}

interface FormErrors {
  category?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export function Contact() {
  const t = useTranslations('consumer.contact');

  const [formState, setFormState] = useState<FormState>('idle');
  const [formData, setFormData] = useState<FormData>({
    category: '',
    email: '',
    subject: '',
    message: '',
    walletAddress: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [ticketId, setTicketId] = useState<string>('');

  const categories = [
    { value: 'general', label: t('form.category.options.general') },
    { value: 'technical', label: t('form.category.options.technical') },
    { value: 'account', label: t('form.category.options.account') },
    { value: 'security', label: t('form.category.options.security') },
    { value: 'feedback', label: t('form.category.options.feedback') },
    { value: 'other', label: t('form.category.options.other') },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category) {
      newErrors.category = t('validation.categoryRequired');
    }

    if (!formData.email) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    if (!formData.subject) {
      newErrors.subject = t('validation.subjectRequired');
    }

    if (!formData.message) {
      newErrors.message = t('validation.messageRequired');
    } else if (formData.message.length < 10) {
      newErrors.message = t('validation.messageTooShort');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setFormState('submitting');

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate mock ticket ID
    const mockTicketId = `QS-${Date.now().toString(36).toUpperCase()}`;
    setTicketId(mockTicketId);
    setFormState('success');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (formState === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <main role="main" className="max-w-lg mx-auto px-4 py-8">
          {/* Success State */}
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>

            <h1 className="text-2xl font-bold mb-3">{t('success.title')}</h1>
            <p className="text-sm text-foreground-secondary mb-6">
              {t('success.message')}
            </p>

            <div className="p-4 bg-surface rounded-qs mb-8">
              <p className="text-xs text-foreground-secondary mb-1">{t('success.ticketId')}</p>
              <p className="text-lg font-mono font-semibold text-gold">{ticketId}</p>
            </div>

            <div className="space-y-3">
              <Link href="/consumer/help" className="block">
                <Button variant="secondary" fullWidth>
                  {t('success.backToHelp')}
                </Button>
              </Link>
              <Link href="/consumer/dashboard" className="block">
                <Button variant="primary" fullWidth>
                  {t('success.backToDashboard')}
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/consumer/help"
            aria-label={t('header.back')}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2 hover:bg-surface rounded-qs transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">{t('header.title')}</h1>
        </div>
      </header>

      <main role="main" className="max-w-lg mx-auto px-4 py-6">
        {/* Intro */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">{t('intro.title')}</h2>
          <p className="text-sm text-foreground-secondary">
            {t('intro.description')}
          </p>
        </div>

        {/* FAQ Link */}
        <div className="p-4 bg-gold/10 border border-gold/30 rounded-qs mb-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold mb-1">{t('faq.title')}</h3>
              <p className="text-xs text-foreground-secondary mb-2">
                {t('faq.description')}
              </p>
              <Link
                href="/consumer/faq"
                className="text-xs text-gold hover:underline inline-flex items-center gap-1 min-h-[44px] py-2"
              >
                {t('faq.link')}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              {t('form.category.label')} <span className="text-hinomaru">*</span>
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-surface border rounded-qs text-sm',
                'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
                errors.category ? 'border-hinomaru' : 'border-border-subtle'
              )}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="">{t('form.category.placeholder')}</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p id="category-error" className="mt-1 text-xs text-hinomaru" role="alert">
                {errors.category}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {t('form.email.label')} <span className="text-hinomaru">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('form.email.placeholder')}
              className={cn(
                'w-full px-4 py-3 bg-surface border rounded-qs text-sm',
                'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
                errors.email ? 'border-hinomaru' : 'border-border-subtle'
              )}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : 'email-desc'}
            />
            <p id="email-desc" className="mt-1 text-xs text-foreground-secondary">
              {t('form.email.description')}
            </p>
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs text-hinomaru" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium mb-2">
              {t('form.subject.label')} <span className="text-hinomaru">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder={t('form.subject.placeholder')}
              className={cn(
                'w-full px-4 py-3 bg-surface border rounded-qs text-sm',
                'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
                errors.subject ? 'border-hinomaru' : 'border-border-subtle'
              )}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? 'subject-error' : undefined}
            />
            {errors.subject && (
              <p id="subject-error" className="mt-1 text-xs text-hinomaru" role="alert">
                {errors.subject}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              {t('form.message.label')} <span className="text-hinomaru">*</span>
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder={t('form.message.placeholder')}
              rows={5}
              className={cn(
                'w-full px-4 py-3 bg-surface border rounded-qs text-sm resize-none',
                'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold',
                errors.message ? 'border-hinomaru' : 'border-border-subtle'
              )}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'message-error' : undefined}
            />
            {errors.message && (
              <p id="message-error" className="mt-1 text-xs text-hinomaru" role="alert">
                {errors.message}
              </p>
            )}
          </div>

          {/* Wallet Address (Optional) */}
          <div>
            <label htmlFor="walletAddress" className="block text-sm font-medium mb-2">
              {t('form.walletAddress.label')}
            </label>
            <input
              type="text"
              id="walletAddress"
              value={formData.walletAddress}
              onChange={(e) => handleInputChange('walletAddress', e.target.value)}
              placeholder={t('form.walletAddress.placeholder')}
              className={cn(
                'w-full px-4 py-3 bg-surface border border-border-subtle rounded-qs text-sm font-mono',
                'focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold'
              )}
            />
            <p className="mt-1 text-xs text-foreground-secondary">
              {t('form.walletAddress.description')}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={formState === 'submitting'}
          >
            {formState === 'submitting' ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {t('form.submitting')}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t('form.submit')}
              </>
            )}
          </Button>
        </form>

        {/* Other Ways to Contact */}
        <div className="mt-10 pt-6 border-t border-border-subtle">
          <h3 className="text-sm font-semibold mb-4">{t('otherWays.title')}</h3>
          <div className="space-y-3">
            <a
              href="mailto:support@quantumshield.io"
              className="flex items-center gap-3 p-3 bg-surface rounded-qs hover:bg-surface-hover transition-colors"
            >
              <Mail className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-medium">{t('otherWays.email.title')}</p>
                <p className="text-xs text-foreground-secondary">{t('otherWays.email.value')}</p>
              </div>
            </a>
            <a
              href="https://discord.gg/quantumshield"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-surface rounded-qs hover:bg-surface-hover transition-colors"
            >
              <MessageSquare className="w-5 h-5 text-gold" />
              <div>
                <p className="text-sm font-medium">{t('otherWays.discord.title')}</p>
                <p className="text-xs text-foreground-secondary">{t('otherWays.discord.value')}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-foreground-secondary ml-auto" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
