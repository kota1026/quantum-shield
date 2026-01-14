'use client';

import { useState, useRef } from 'react';
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

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className={cn('relative inline-flex items-center gap-1', className)}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {showHelpIcon && (
        <HelpCircle
          className="w-4 h-4 text-foreground-tertiary cursor-help"
          aria-hidden="true"
        />
      )}
      <span
        role="tooltip"
        className={cn(
          'absolute z-50 px-3 py-2 text-sm text-foreground-secondary bg-surface-tertiary border border-border rounded-qs max-w-xs transition-all duration-150',
          positionClasses[position],
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
