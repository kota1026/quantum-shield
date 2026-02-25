'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
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
          'w-full px-5 py-4 flex justify-between items-center',
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

export default FAQItem;
