'use client';

import { useState, useRef, useId, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();

  // Handle client-side mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 16; // Minimum distance from viewport edge
    const gap = 8; // Gap between trigger and tooltip

    // Use fixed positioning - no scroll offset needed
    let top: number;
    let left: number;

    // Calculate vertical position
    if (position === 'bottom' || (position === 'top' && triggerRect.top - tooltipRect.height - gap < padding)) {
      // Show below
      top = triggerRect.bottom + gap;
    } else {
      // Show above (default for 'top')
      top = triggerRect.top - tooltipRect.height - gap;
    }

    // Calculate horizontal position - center by default
    left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

    // Adjust if overflowing left
    if (left < padding) {
      left = padding;
    }
    // Adjust if overflowing right
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    // Handle left/right positions
    if (position === 'left') {
      left = triggerRect.left - tooltipRect.width - gap;
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    } else if (position === 'right') {
      left = triggerRect.right + gap;
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    }

    setTooltipStyle({ top, left });
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
    if (isVisible && mounted) {
      // Use requestAnimationFrame to ensure tooltip is rendered before measuring
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }
  }, [isVisible, mounted, calculatePosition]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!isVisible) return;

    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, calculatePosition]);

  const tooltipContent = (
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      aria-hidden={!isVisible}
      style={{
        ...tooltipStyle,
        maxWidth: 'min(480px, calc(100vw - 2rem))',
        width: 'max-content',
        position: 'fixed',
      }}
      className={cn(
        'z-[9999] px-4 py-2.5 text-sm leading-relaxed text-foreground bg-surface-tertiary border border-border rounded-lg shadow-lg transition-all duration-150 whitespace-normal text-left',
        isVisible
          ? 'opacity-100 visible'
          : 'opacity-0 invisible pointer-events-none'
      )}
    >
      {content}
    </div>
  );

  return (
    <>
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
      </span>
      {mounted && createPortal(tooltipContent, document.body)}
    </>
  );
}

export default Tooltip;
