'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 320;
    const tooltipHeight = 80;
    const margin = 12;
    const arrowHeight = 8;

    // Determine vertical placement
    const spaceAbove = triggerRect.top;
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const newPlacement = spaceAbove > tooltipHeight + margin ? 'top' : 'bottom';
    setPlacement(newPlacement);

    // Calculate vertical position
    let top: number;
    if (newPlacement === 'top') {
      top = triggerRect.top - tooltipHeight - arrowHeight;
    } else {
      top = triggerRect.bottom + arrowHeight;
    }

    // Determine horizontal alignment and position
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    let left: number;
    let newAlignment: 'left' | 'center' | 'right';

    if (triggerCenterX < tooltipWidth / 2 + margin) {
      // Near left edge - align left
      left = margin;
      newAlignment = 'left';
    } else if (triggerCenterX > viewportWidth - tooltipWidth / 2 - margin) {
      // Near right edge - align right
      left = viewportWidth - tooltipWidth - margin;
      newAlignment = 'right';
    } else {
      // Center
      left = triggerCenterX - tooltipWidth / 2;
      newAlignment = 'center';
    }

    setAlignment(newAlignment);
    setPosition({ top: Math.max(margin, top), left: Math.max(margin, left) });
  }, []);

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    calculatePosition();
    setIsVisible(true);
  }, [calculatePosition]);

  const hideTooltip = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsVisible(false), 100);
  }, []);

  // Calculate arrow position relative to trigger
  const getArrowStyle = () => {
    if (!triggerRef.current) return {};
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const arrowLeft = triggerRect.left + triggerRect.width / 2 - position.left - 6;
    return { left: `${Math.max(12, Math.min(arrowLeft, 320 - 24))}px` };
  };

  const tooltipContent = isVisible && mounted && (
    <div
      role="tooltip"
      className={cn(
        'fixed z-[9999] px-4 py-2.5',
        'text-sm leading-relaxed text-foreground bg-surface-secondary',
        'border border-border rounded-qs shadow-xl',
        'whitespace-normal text-left',
        'pointer-events-none'
      )}
      style={{
        top: position.top,
        left: position.left,
        width: 'max-content',
        maxWidth: '320px',
      }}
    >
      {content}
      {/* Arrow */}
      <span
        className={cn(
          'absolute border-[6px] border-transparent',
          placement === 'top'
            ? 'top-full -mt-px border-t-surface-secondary'
            : 'bottom-full -mb-px border-b-surface-secondary'
        )}
        style={getArrowStyle()}
        aria-hidden="true"
      />
    </div>
  );

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
      {mounted && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </span>
  );
}
