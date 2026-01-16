'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface DelegateTooltipProps {
  label: string;
  className?: string;
}

export function DelegateTooltip({ label, className }: DelegateTooltipProps) {
  const t = useTranslations('token-hub.delegate');
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="text-xs text-foreground-tertiary">{label}</span>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={cn(
          'relative p-0.5 rounded-full',
          'text-foreground-tertiary hover:text-gold',
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'transition-colors'
        )}
        aria-label={t('tooltip.ariaLabel')}
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />

        {isOpen && (
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
              'w-72 p-4',
              'bg-background-secondary border border-gold/30 rounded-xl',
              'shadow-lg shadow-black/20'
            )}
          >
            <div className="text-sm font-semibold text-gold mb-2">
              {t('tooltip.title')}
            </div>
            <p className="text-xs text-foreground-secondary leading-relaxed">
              {t('tooltip.description')}
            </p>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-foreground-tertiary">
                {t('tooltip.note')}
              </p>
            </div>
            {/* Arrow */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-background-secondary border-r border-b border-gold/30"
              aria-hidden="true"
            />
          </div>
        )}
      </button>
    </span>
  );
}

export function ParticipationTooltip({ className }: { className?: string }) {
  const t = useTranslations('token-hub.delegate');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="text-[10px] text-foreground-tertiary uppercase tracking-wide">
        {t('list.participation')}
      </span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-0.5 rounded-full',
          'text-foreground-tertiary hover:text-gold',
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'transition-colors'
        )}
        aria-label={t('participationTooltip.ariaLabel')}
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-3 h-3" aria-hidden="true" />

        {isOpen && (
          <div
            role="tooltip"
            className={cn(
              'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
              'w-56 p-3',
              'bg-background-secondary border border-border rounded-lg',
              'shadow-lg shadow-black/20',
              'text-left'
            )}
          >
            <p className="text-xs text-foreground-secondary">
              {t('participationTooltip.description')}
            </p>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-background-secondary border-r border-b border-border"
              aria-hidden="true"
            />
          </div>
        )}
      </button>
    </span>
  );
}
