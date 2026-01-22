'use client';

import { useState, useRef, useId } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  /** Tooltip content text */
  content: string;
  /** Element that triggers the tooltip */
  children: React.ReactNode;
  /** Position of the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Custom class name */
  className?: string;
  /** Show a help icon next to the children */
  showHelpIcon?: boolean;
}

/**
 * Shared Tooltip component for explaining technical terms
 * Accessible with keyboard navigation and proper ARIA attributes
 *
 * Usage:
 * <Tooltip content="Explanation text">
 *   <span>Technical term</span>
 * </Tooltip>
 *
 * <Tooltip content="Explanation" showHelpIcon>
 *   <span>Term with help icon</span>
 * </Tooltip>
 */
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

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
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
          maxWidth: 'min(400px, calc(100vw - 2rem))',
          width: 'max-content',
        }}
        className={cn(
          'absolute z-50 px-4 py-2.5 text-sm leading-relaxed text-foreground bg-surface-tertiary border border-border rounded-lg shadow-lg transition-all duration-150 whitespace-normal text-left',
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

export default Tooltip;
