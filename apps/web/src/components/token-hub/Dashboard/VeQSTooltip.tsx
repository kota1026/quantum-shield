'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VeQSTooltipProps {
  label: string;
}

export function VeQSTooltip({ label }: VeQSTooltipProps) {
  const t = useTranslations('token-hub.dashboard.veqsTooltip');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1">
      <span className="text-xs text-foreground-tertiary">{label}</span>
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className={cn(
          'w-4 h-4 rounded-full',
          'bg-gold/10 border border-gold',
          'flex items-center justify-center',
          'text-[10px] text-gold',
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background'
        )}
        aria-label={t('ariaLabel')}
        aria-describedby="veqs-tooltip"
      >
        ?
      </button>

      {/* Tooltip */}
      <div
        id="veqs-tooltip"
        role="tooltip"
        className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
          'bg-background-tertiary border border-border rounded-lg',
          'p-4 min-w-[280px]',
          'transition-all duration-200',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
      >
        <div className="text-xs font-semibold text-gold mb-2">
          {t('title')}
        </div>
        <div className="font-mono text-sm text-foreground bg-background p-2 rounded mb-2">
          {t('formula')}
        </div>
        <div className="text-[11px] text-foreground-tertiary leading-relaxed whitespace-pre-line">
          {t('example')}
        </div>
        {/* Arrow */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-background-tertiary border-r border-b border-border rotate-45 -mt-1"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
