'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface VotingPowerTooltipProps {
  label: string;
}

export function VotingPowerTooltip({ label }: VotingPowerTooltipProps) {
  const t = useTranslations('token-hub.dashboard.votingPowerTooltip');
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
        aria-describedby="voting-power-tooltip"
      >
        ?
      </button>

      {/* Tooltip */}
      <div
        id="voting-power-tooltip"
        role="tooltip"
        className={cn(
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
          'bg-background-tertiary border border-border rounded-lg',
          'p-4 min-w-[260px]',
          'transition-all duration-200',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
      >
        <div className="text-xs font-semibold text-gold mb-2">
          {t('title')}
        </div>
        <div className="text-[11px] text-foreground-secondary leading-relaxed">
          {t('description')}
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
