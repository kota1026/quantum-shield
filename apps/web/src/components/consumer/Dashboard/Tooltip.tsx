'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'auto';
}

type HorizontalPosition = 'left' | 'center' | 'right';
type VerticalPosition = 'top' | 'bottom';

export function Tooltip({ content, children, className, position = 'auto' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [horizontalPos, setHorizontalPos] = useState<HorizontalPosition>('center');
  const [verticalPos, setVerticalPos] = useState<VerticalPosition>('top');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 340; // max-width of tooltip
    const margin = 16; // minimum margin from edge

    // Calculate horizontal position
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    const spaceOnLeft = triggerCenterX;
    const spaceOnRight = viewportWidth - triggerCenterX;

    if (spaceOnLeft < tooltipWidth / 2 + margin) {
      // Not enough space on the left, align to left
      setHorizontalPos('left');
    } else if (spaceOnRight < tooltipWidth / 2 + margin) {
      // Not enough space on the right, align to right
      setHorizontalPos('right');
    } else {
      // Enough space, center it
      setHorizontalPos('center');
    }

    // Calculate vertical position
    if (position === 'auto') {
      const spaceAbove = triggerRect.top;
      const tooltipHeight = 80; // approximate height

      if (spaceAbove < tooltipHeight + margin) {
        setVerticalPos('bottom');
      } else {
        setVerticalPos('top');
      }
    } else {
      setVerticalPos(position === 'bottom' ? 'bottom' : 'top');
    }
  }, [position]);

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    calculatePosition();
    setIsVisible(true);
  }, [calculatePosition]);

  const hideTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsVisible(false), 150);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Recalculate position when tooltip becomes visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  const getTooltipPositionClasses = () => {
    const classes: string[] = ['absolute z-50'];

    // Vertical positioning
    if (verticalPos === 'top') {
      classes.push('bottom-full mb-2');
    } else {
      classes.push('top-full mt-2');
    }

    // Horizontal positioning
    if (horizontalPos === 'left') {
      classes.push('left-0');
    } else if (horizontalPos === 'right') {
      classes.push('right-0');
    } else {
      classes.push('left-1/2 -translate-x-1/2');
    }

    return classes.join(' ');
  };

  const getArrowPositionClasses = () => {
    const classes: string[] = ['absolute border-4 border-transparent'];

    // Vertical positioning (arrow points opposite to tooltip position)
    if (verticalPos === 'top') {
      classes.push('top-full -mt-px border-t-border');
    } else {
      classes.push('bottom-full -mb-px border-b-border');
    }

    // Horizontal positioning
    if (horizontalPos === 'left') {
      classes.push('left-4');
    } else if (horizontalPos === 'right') {
      classes.push('right-4');
    } else {
      classes.push('left-1/2 -translate-x-1/2');
    }

    return classes.join(' ');
  };

  return (
    <span
      ref={triggerRef}
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
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            getTooltipPositionClasses(),
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
            className={getArrowPositionClasses()}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}
