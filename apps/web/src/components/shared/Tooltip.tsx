'use client';

import { useState, useRef, useId, useEffect, useCallback } from 'react';
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
 * Automatically adjusts position to prevent viewport overflow
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
  const [adjustedPosition, setAdjustedPosition] = useState<{
    horizontal: 'center' | 'left' | 'right';
    vertical: 'top' | 'bottom';
  }>({ horizontal: 'center', vertical: position === 'bottom' ? 'bottom' : 'top' });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16; // Minimum distance from viewport edge

    let horizontal: 'center' | 'left' | 'right' = 'center';
    let vertical: 'top' | 'bottom' = position === 'bottom' ? 'bottom' : 'top';

    // Check horizontal overflow
    const centerX = triggerRect.left + triggerRect.width / 2;
    const tooltipHalfWidth = tooltipRect.width / 2;

    if (centerX - tooltipHalfWidth < padding) {
      // Too close to left edge - align left
      horizontal = 'left';
    } else if (centerX + tooltipHalfWidth > viewportWidth - padding) {
      // Too close to right edge - align right
      horizontal = 'right';
    }

    // Check vertical overflow for top/bottom positions
    if (position === 'top' || position === 'bottom') {
      if (position === 'top' && triggerRect.top - tooltipRect.height - 8 < padding) {
        vertical = 'bottom';
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + 8 > viewportHeight - padding) {
        vertical = 'top';
      }
    }

    setAdjustedPosition({ horizontal, vertical });
  }, [position]);

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

  // Recalculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      // Use requestAnimationFrame to ensure tooltip is rendered before measuring
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isVisible, calculatePosition]);

  // Get position classes based on adjusted position
  const getPositionClasses = () => {
    if (position === 'left') {
      return 'right-full mr-2 top-1/2 -translate-y-1/2';
    }
    if (position === 'right') {
      return 'left-full ml-2 top-1/2 -translate-y-1/2';
    }

    // For top/bottom positions
    const verticalClass = adjustedPosition.vertical === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

    const horizontalClass = {
      center: 'left-1/2 -translate-x-1/2',
      left: 'left-0',
      right: 'right-0',
    }[adjustedPosition.horizontal];

    return `${verticalClass} ${horizontalClass}`;
  };

  return (
    <span
      ref={triggerRef}
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
        ref={tooltipRef}
        id={tooltipId}
        role="tooltip"
        aria-hidden={!isVisible}
        style={{
          maxWidth: 'min(480px, calc(100vw - 2rem))',
          width: 'max-content',
        }}
        className={cn(
          'absolute z-50 px-4 py-2.5 text-sm leading-relaxed text-foreground bg-surface-tertiary border border-border rounded-lg shadow-lg transition-all duration-150 whitespace-normal text-left',
          getPositionClasses(),
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
