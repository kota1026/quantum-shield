'use client';

import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Quote {
  quote: string;
  author: string;
  title: string;
  source: string;
  sourceUrl?: string;
}

interface ExpertQuotesProps {
  /** Section label (e.g., "EXPERT INSIGHTS") */
  sectionLabel: string;
  /** Section title */
  title: string;
  /** Section subtitle */
  subtitle?: string;
  /** Array of quotes to display */
  quotes: Quote[];
  /** Custom class name */
  className?: string;
}

/**
 * Shared Expert Quotes / Social Proof section
 * Displays testimonials from experts with proper citations
 *
 * Usage:
 * <ExpertQuotes
 *   sectionLabel="EXPERT INSIGHTS"
 *   title="What Experts Say"
 *   quotes={[{ quote: "...", author: "...", title: "...", source: "..." }]}
 * />
 */
export function ExpertQuotes({
  sectionLabel,
  title,
  subtitle,
  quotes,
  className,
}: ExpertQuotesProps) {
  return (
    <section className={cn('py-20 bg-surface-secondary/30', className)}>
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-3 text-xs font-semibold tracking-widest uppercase text-gold mb-4">
          <span className="w-6 h-px bg-gold" aria-hidden="true" />
          {sectionLabel}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
        {subtitle && (
          <p className="text-foreground-secondary mb-12">{subtitle}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quotes.map((quote, index) => (
            <ExpertQuoteCard key={index} {...quote} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ExpertQuoteCardProps extends Quote {}

function ExpertQuoteCard({
  quote,
  author,
  title,
  source,
  sourceUrl,
}: ExpertQuoteCardProps) {
  return (
    <article className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-all duration-300">
      <blockquote className="text-sm text-foreground-secondary leading-relaxed mb-4 italic">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="border-t border-border pt-4">
        <div className="font-semibold text-foreground">{author}</div>
        <div className="text-xs text-foreground-tertiary">{title}</div>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gold mt-1 inline-flex items-center gap-1 hover:underline"
          >
            {source}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
          </a>
        ) : (
          <div className="text-xs text-gold mt-1">{source}</div>
        )}
      </div>
    </article>
  );
}

export default ExpertQuotes;
