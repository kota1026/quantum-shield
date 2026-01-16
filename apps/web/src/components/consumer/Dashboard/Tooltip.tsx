'use client';

import { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(false), 150);
  };

  return (
    <span
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children || (
        <button
          type="button"
          className="ml-1 text-foreground-tertiary hover:text-foreground-secondary transition-colors"
          aria-label="More information"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
      {isVisible && (
        <span
          role="tooltip"
          className={cn(
            'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
            'px-4 py-2.5',
            'text-sm leading-relaxed text-foreground bg-surface-secondary',
            'border border-border rounded-qs shadow-lg',
            'whitespace-normal text-left'
          )}
          style={{ width: 'max-content', maxWidth: 'min(340px, calc(100vw - 2rem))' }}
        >
          {content}
          {/* Arrow */}
          <span
            className={cn(
              'absolute top-full left-1/2 -translate-x-1/2 -mt-px',
              'border-4 border-transparent border-t-border'
            )}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
