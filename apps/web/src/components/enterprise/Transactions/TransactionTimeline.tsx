'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type TimelineStatus = 'complete' | 'pending' | 'current';

export interface TimelineEvent {
  id: string;
  titleKey: string;
  timestamp: string;
  status: TimelineStatus;
}

interface TransactionTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const DOT_STYLES: Record<TimelineStatus, string> = {
  complete: 'bg-success',
  current: 'bg-warning animate-pulse',
  pending: 'bg-muted-foreground',
};

export function TransactionTimeline({ events, className }: TransactionTimelineProps) {
  const t = useTranslations('enterprise.transactionDetail.timeline');

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby="timeline-title"
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h2 id="timeline-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <ol className="relative pl-8" aria-label={t('ariaLabel')}>
          {/* Timeline line */}
          <div
            className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-white/10"
            aria-hidden="true"
          />

          {events.map((event, index) => (
            <li
              key={event.id}
              className={cn(
                'relative',
                index < events.length - 1 && 'pb-6'
              )}
            >
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute -left-8 w-3 h-3 rounded-full border-2 border-background-secondary',
                  DOT_STYLES[event.status]
                )}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {t(`events.${event.titleKey}`)}
                </h3>
                <time className="text-xs font-mono text-muted-foreground">
                  {event.timestamp}
                </time>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
