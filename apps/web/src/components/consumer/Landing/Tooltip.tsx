'use client';

import { useState, useRef, useId } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showHelpIcon?: boolean;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
  showHelpIcon = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipId = useId();

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  return (
    <span
      className={cn('relative inline-flex items-center gap-1', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={tooltipId}
    >
      {children}
      {showHelpIcon && (
        <HelpCircle
          className="w-4 h-4 text-foreground-tertiary cursor-help"
          aria-hidden="true"
        />
      )}
      <span
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isVisible}
        style={{
          maxWidth: 'min(280px, calc(100vw - 2rem))',
        }}
        className={cn(
          'absolute z-50 px-3 py-2 text-sm text-foreground-secondary bg-surface-tertiary border border-border rounded-qs transition-all duration-150 whitespace-normal break-words',
          position === 'top' && 'bottom-full mb-2 left-1/2 -translate-x-1/2',
          position === 'bottom' && 'top-full mt-2 left-1/2 -translate-x-1/2',
          position === 'left' && 'right-full mr-2 top-1/2 -translate-y-1/2',
          position === 'right' && 'left-full ml-2 top-1/2 -translate-y-1/2',
          isVisible
            ? 'opacity-100 visible'
            : 'opacity-0 invisible pointer-events-none'
        )}
      >
        {content}
      </span>
    </span>
  );
}
