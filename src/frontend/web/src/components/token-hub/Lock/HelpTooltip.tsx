'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  id: string;
  content: React.ReactNode;
  ariaLabel: string;
}

export function HelpTooltip({ id, content, ariaLabel }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const tooltipWidth = 280;
    const tooltipHeight = 100;
    const margin = 12;
    const arrowHeight = 8;

    // Determine vertical placement
    const spaceAbove = triggerRect.top;
    const newPlacement = spaceAbove > tooltipHeight + margin ? 'top' : 'bottom';
    setPlacement(newPlacement);

    // Calculate vertical position
    let top: number;
    if (newPlacement === 'top') {
      top = triggerRect.top - tooltipHeight - arrowHeight;
    } else {
      top = triggerRect.bottom + arrowHeight;
    }

    // Calculate horizontal position (centered on trigger, clamped to viewport)
    const triggerCenterX = triggerRect.left + triggerRect.width / 2;
    let left = triggerCenterX - tooltipWidth / 2;

    // Clamp to viewport
    if (left < margin) {
      left = margin;
    } else if (left + tooltipWidth > viewportWidth - margin) {
      left = viewportWidth - tooltipWidth - margin;
    }

    setPosition({ top: Math.max(margin, top), left });
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
    return { left: `${Math.max(12, Math.min(arrowLeft, 280 - 24))}px` };
  };

  const tooltipContent = isVisible && mounted && (
    <div
      role="tooltip"
      id={id}
      className={cn(
        'fixed z-[9999]',
        'bg-background-tertiary border border-border rounded-lg',
        'p-3 shadow-xl',
        'pointer-events-none'
      )}
      style={{
        top: position.top,
        left: position.left,
        width: '280px',
      }}
    >
      <div className="text-xs text-foreground-secondary leading-relaxed">
        {content}
      </div>
      {/* Arrow */}
      <span
        className={cn(
          'absolute border-[6px] border-transparent',
          placement === 'top'
            ? 'top-full -mt-px border-t-background-tertiary'
            : 'bottom-full -mb-px border-b-background-tertiary'
        )}
        style={getArrowStyle()}
        aria-hidden="true"
      />
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={cn(
          'w-4 h-4 rounded-full',
          'bg-gold/10 border border-gold',
          'flex items-center justify-center',
          'text-[10px] text-gold',
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background'
        )}
        aria-label={ariaLabel}
        aria-describedby={id}
      >
        ?
      </button>
      {mounted && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}
