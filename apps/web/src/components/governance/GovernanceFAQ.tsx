'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ChevronDown, HelpCircle, Vote, Coins, Shield, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left',
          'hover:bg-background-secondary transition-colors',
          isOpen && 'bg-background-secondary'
        )}
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4">{question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-foreground-tertiary flex-shrink-0 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-foreground-secondary leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export function GovernanceFAQ() {
  const t = useTranslations('governance.faq');
  const [openItems, setOpenItems] = useState<string[]>(['basics-1']);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const categories = [
    {
      id: 'basics',
      icon: <HelpCircle className="w-5 h-5" />,
      title: t('categories.basics.title'),
      items: [
        { id: 'basics-1', question: t('categories.basics.q1.question'), answer: t('categories.basics.q1.answer') },
        { id: 'basics-2', question: t('categories.basics.q2.question'), answer: t('categories.basics.q2.answer') },
        { id: 'basics-3', question: t('categories.basics.q3.question'), answer: t('categories.basics.q3.answer') },
      ],
    },
    {
      id: 'voting',
      icon: <Vote className="w-5 h-5" />,
      title: t('categories.voting.title'),
      items: [
        { id: 'voting-1', question: t('categories.voting.q1.question'), answer: t('categories.voting.q1.answer') },
        { id: 'voting-2', question: t('categories.voting.q2.question'), answer: t('categories.voting.q2.answer') },
        { id: 'voting-3', question: t('categories.voting.q3.question'), answer: t('categories.voting.q3.answer') },
      ],
    },
    {
      id: 'veqs',
      icon: <Coins className="w-5 h-5" />,
      title: t('categories.veqs.title'),
      items: [
        { id: 'veqs-1', question: t('categories.veqs.q1.question'), answer: t('categories.veqs.q1.answer') },
        { id: 'veqs-2', question: t('categories.veqs.q2.question'), answer: t('categories.veqs.q2.answer') },
      ],
    },
    {
      id: 'council',
      icon: <Shield className="w-5 h-5" />,
      title: t('categories.council.title'),
      items: [
        { id: 'council-1', question: t('categories.council.q1.question'), answer: t('categories.council.q1.answer') },
        { id: 'council-2', question: t('categories.council.q2.question'), answer: t('categories.council.q2.answer') },
      ],
    },
    {
      id: 'delegation',
      icon: <Users className="w-5 h-5" />,
      title: t('categories.delegation.title'),
      items: [
        { id: 'delegation-1', question: t('categories.delegation.q1.question'), answer: t('categories.delegation.q1.answer') },
        { id: 'delegation-2', question: t('categories.delegation.q2.question'), answer: t('categories.delegation.q2.answer') },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse,rgba(201,169,98,0.12),transparent_60%)] opacity-50" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/governance/landing"
            className={cn(
              'inline-flex items-center gap-2 text-sm text-foreground-secondary',
              'hover:text-gold transition-colors mb-4'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToGovernance')}
          </Link>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </header>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {categories.map((category) => (
            <section key={category.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                  {category.icon}
                </div>
                <h2 className="text-lg font-semibold">{category.title}</h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item) => (
                  <FAQItem
                    key={item.id}
                    question={item.question}
                    answer={item.answer}
                    isOpen={openItems.includes(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact CTA */}
        <section className="mt-12 text-center bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-xl font-semibold mb-2">{t('contact.title')}</h2>
          <p className="text-foreground-secondary mb-4">{t('contact.description')}</p>
          <Link
            href="/consumer/contact"
            className="inline-flex items-center gap-2 text-gold hover:underline"
          >
            {t('contact.link')}
          </Link>
        </section>
      </main>
    </div>
  );
}

export default GovernanceFAQ;
