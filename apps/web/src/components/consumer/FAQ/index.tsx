'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FAQItem } from './FAQItem';

interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
}

interface FAQSection {
  id: string;
  title: string;
  questions: FAQQuestion[];
}

export function FAQ() {
  const t = useTranslations('consumer.faq');

  // FAQ data
  const faqSections: FAQSection[] = [
    {
      id: 'basics',
      title: t('sections.basics'),
      questions: [
        {
          id: 'what-is-qs',
          question: t('questions.whatIsQs.question'),
          answer: t('questions.whatIsQs.answer'),
        },
        {
          id: 'why-quantum',
          question: t('questions.whyQuantum.question'),
          answer: t('questions.whyQuantum.answer'),
        },
      ],
    },
    {
      id: 'lock-unlock',
      title: t('sections.lockUnlock'),
      questions: [
        {
          id: 'what-is-lock',
          question: t('questions.whatIsLock.question'),
          answer: t('questions.whatIsLock.answer'),
        },
        {
          id: 'why-24h',
          question: t('questions.why24h.question'),
          answer: t('questions.why24h.answer'),
        },
        {
          id: 'what-is-emergency',
          question: t('questions.whatIsEmergency.question'),
          answer: t('questions.whatIsEmergency.answer'),
        },
      ],
    },
    {
      id: 'security',
      title: t('sections.security'),
      questions: [
        {
          id: 'lost-key',
          question: t('questions.lostKey.question'),
          answer: t('questions.lostKey.answer'),
        },
      ],
    },
  ];

  // Track open items
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Premium Background Effect */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
      >
        <div
          className={cn(
            'absolute -top-48 left-1/2 -translate-x-1/2',
            'w-[800px] h-[600px]',
            'bg-gradient-radial-hinomaru opacity-30'
          )}
        />
      </div>

      {/* Main Content */}
      <main role="main" className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/consumer/settings"
            className={cn(
              'w-11 h-11 flex items-center justify-center',
              'bg-surface border border-border rounded-qs',
              'text-foreground-secondary hover:border-hinomaru hover:text-hinomaru',
              'transition-all'
            )}
            aria-label={t('header.back')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {t('header.title')}
          </h1>
        </header>

        {/* FAQ Sections */}
        {faqSections.map((section) => (
          <div key={section.id} className="mb-6">
            {/* Section Label */}
            <span
              className={cn(
                'text-xs font-semibold tracking-wider uppercase text-gold',
                'flex items-center gap-2 mb-3'
              )}
            >
              <span className="w-4 h-px bg-gold" aria-hidden="true" />
              {section.title}
            </span>

            {/* FAQ List */}
            <div className="flex flex-col gap-3">
              {section.questions.map((item) => (
                <FAQItem
                  key={item.id}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Contact Support Section */}
        <div
          className={cn(
            'mt-10 p-6 rounded-qs-xl',
            'bg-surface border border-border-subtle',
            'text-center'
          )}
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-gold" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('contact.title')}
          </h3>
          <p className="text-sm text-foreground-secondary mb-4">
            {t('contact.description')}
          </p>
          <Link
            href="/consumer/contact"
            className={cn(
              'inline-flex items-center gap-2 px-6 py-3 min-h-[44px]',
              'bg-gold/10 border border-gold/30 rounded-qs-lg',
              'text-sm font-medium text-gold',
              'hover:bg-gold/20 hover:border-gold/50 transition-all'
            )}
          >
            <Mail className="w-4 h-4" />
            {t('contact.button')}
          </Link>
        </div>
      </main>
    </div>
  );
}

export default FAQ;
