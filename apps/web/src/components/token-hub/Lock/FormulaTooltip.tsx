'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormulaTooltip() {
  const t = useTranslations('token-hub.lock.preview');
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
    const tooltipWidth = 320;
    const tooltipHeight = 150;
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

    // Calculate horizontal position (right-aligned with trigger)
    let left = triggerRect.right - tooltipWidth;

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
    return { left: `${Math.max(12, Math.min(arrowLeft, 320 - 24))}px` };
  };

  const tooltipContent = isVisible && mounted && (
    <div
      role="tooltip"
      id="formula-tooltip"
      className={cn(
        'fixed z-[9999]',
        'bg-background-tertiary border border-gold rounded-lg',
        'p-4 shadow-xl',
        'pointer-events-none'
      )}
      style={{
        top: position.top,
        left: position.left,
        width: '320px',
      }}
    >
      <div className="text-xs font-semibold text-gold mb-2">
        {t('formulaTitle')}
      </div>
      <div className="font-mono text-sm text-foreground bg-background p-2 rounded mb-2">
        veQS = QS × (lock_period / 4_years)
      </div>
      <div className="text-[11px] text-foreground-tertiary leading-relaxed">
        {t('formulaDescription')}
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
        className="text-xs text-gold flex items-center gap-1 hover:underline focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
        aria-label={t('formulaAriaLabel')}
        aria-describedby="formula-tooltip"
      >
        <Info className="w-3 h-3" aria-hidden="true" />
        {t('formulaLabel')}
      </button>
      {mounted && typeof document !== 'undefined' && createPortal(tooltipContent, document.body)}
    </>
  );
}
