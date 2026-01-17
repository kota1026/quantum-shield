'use client';

import * as React from 'react';
<<<<<<< HEAD
import { cn } from '@/lib/utils';

// Context for TooltipProvider/TooltipTrigger/TooltipContent pattern
interface TooltipContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  side: 'top' | 'bottom' | 'left' | 'right';
  setSide: (side: 'top' | 'bottom' | 'left' | 'right') => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a TooltipProvider');
  }
  return context;
}

// TooltipProvider - provides context for all tooltips
interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

// Root Tooltip component - wraps trigger and content
interface TooltipProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ children, defaultOpen = false, open, onOpenChange }: TooltipProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const [side, setSide] = React.useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const triggerRef = React.useRef<HTMLElement>(null);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = React.useCallback((value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  }, [onOpenChange]);

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen, triggerRef, side, setSide }}>
      {children}
    </TooltipContext.Provider>
  );
}

// TooltipTrigger - the element that triggers the tooltip
interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function TooltipTrigger({ children, asChild, className }: TooltipTriggerProps) {
  const { setIsOpen, triggerRef } = useTooltipContext();

  const handleMouseEnter = () => setIsOpen(true);
  const handleMouseLeave = () => setIsOpen(false);
  const handleFocus = () => setIsOpen(true);
  const handleBlur = () => setIsOpen(false);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref: triggerRef as any,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      className: cn((children.props as { className?: string }).className, className),
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <span
      ref={triggerRef as React.RefObject<HTMLSpanElement>}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('inline-block', className)}
    >
      {children}
    </span>
  );
}

// TooltipContent - the actual tooltip content
interface TooltipContentProps {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  className?: string;
}

export function TooltipContent({ children, side = 'top', sideOffset = 8, className }: TooltipContentProps) {
  const { isOpen, triggerRef } = useTooltipContext();
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen || !triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;

    switch (side) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        y = triggerRect.top - contentRect.height - sideOffset;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
        y = triggerRect.bottom + sideOffset;
        break;
      case 'left':
        x = triggerRect.left - contentRect.width - sideOffset;
        y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + sideOffset;
        y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, window.innerWidth - contentRect.width - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - contentRect.height - 8));

    setPosition({ x, y });
  }, [isOpen, triggerRef, side, sideOffset]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      role="tooltip"
      className={cn(
        'fixed z-50 max-w-xs px-3 py-2 text-xs rounded-lg',
        'bg-surface border border-border shadow-lg',
        'text-foreground-secondary',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {children}
    </div>
  );
}

// Simple Tooltip component (combines all of the above for convenience)
// Use this when you want a simple tooltip with just a content string
interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function SimpleTooltip({ content, children, side = 'top', className }: SimpleTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;

    switch (side) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    // Keep tooltip within viewport
    x = Math.max(8, Math.min(x, window.innerWidth - tooltipRect.width - 8));
    y = Math.max(8, Math.min(y, window.innerHeight - tooltipRect.height - 8));

    setPosition({ x, y });
  }, [side]);

  React.useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible, updatePosition]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-block"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={cn(
            'fixed z-50 max-w-xs px-3 py-2 text-xs rounded-lg',
            'bg-surface border border-border shadow-lg',
            'text-foreground-secondary',
            'animate-in fade-in-0 zoom-in-95 duration-150',
            className
          )}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}
=======
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-md bg-surface-secondary border border-border px-3 py-1.5 text-sm text-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
>>>>>>> origin/claude/phase6-system06-explorer
