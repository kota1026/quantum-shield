'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, HelpCircle, Mail, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  const id = question.replace(/\s+/g, '-').toLowerCase().slice(0, 20);

  return (
    <div
      className={cn(
        'bg-card border border-border-subtle rounded-qs-lg',
        'transition-all hover-gradient-border'
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          'w-full px-5 py-4 min-h-[44px] flex justify-between items-center',
          'text-left transition-colors',
          'hover:bg-surface-secondary',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-hinomaru/30'
        )}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${id}`}
      >
        <span className="text-[15px] font-medium text-foreground pr-4">
          {question}
        </span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-foreground-tertiary flex-shrink-0',
            'transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={`faq-answer-${id}`}
        role="region"
        aria-labelledby={`faq-question-${id}`}
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="px-5 pb-4">
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function QSHubFAQ() {
  const t = useTranslations('qs-hub.faq');

  // FAQ data
  const faqSections: FAQSection[] = [
    {
      id: 'basics',
      title: t('sections.basics'),
      questions: [
        {
          id: 'what-is-veqs',
          question: t('questions.whatIsVeQS.question'),
          answer: t('questions.whatIsVeQS.answer'),
        },
        {
          id: 'why-lock',
          question: t('questions.whyLock.question'),
          answer: t('questions.whyLock.answer'),
        },
      ],
    },
    {
      id: 'staking',
      title: t('sections.staking'),
      questions: [
        {
          id: 'how-to-lock',
          question: t('questions.howToLock.question'),
          answer: t('questions.howToLock.answer'),
        },
        {
          id: 'lock-duration',
          question: t('questions.lockDuration.question'),
          answer: t('questions.lockDuration.answer'),
        },
        {
          id: 'early-unlock',
          question: t('questions.earlyUnlock.question'),
          answer: t('questions.earlyUnlock.answer'),
        },
      ],
    },
    {
      id: 'governance',
      title: t('sections.governance'),
      questions: [
        {
          id: 'how-to-vote',
          question: t('questions.howToVote.question'),
          answer: t('questions.howToVote.answer'),
        },
        {
          id: 'delegate',
          question: t('questions.delegate.question'),
          answer: t('questions.delegate.answer'),
        },
      ],
    },
    {
      id: 'rewards',
      title: t('sections.rewards'),
      questions: [
        {
          id: 'how-rewards',
          question: t('questions.howRewards.question'),
          answer: t('questions.howRewards.answer'),
        },
        {
          id: 'claim-rewards',
          question: t('questions.claimRewards.question'),
          answer: t('questions.claimRewards.answer'),
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
      <div className="relative z-10 max-w-[700px] mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/qs-hub/dashboard"
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

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-xs text-foreground-tertiary">
            {t('footer.copyright')}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default QSHubFAQ;
