'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        // Default
        default: 'bg-surface-secondary text-foreground-secondary',
        // Hinomaru (Primary)
        hinomaru: 'bg-hinomaru/20 text-hinomaru',
        // Gold (Secondary)
        gold: 'bg-gold/20 text-gold',
        // Status variants
        success: 'bg-success/20 text-success',
        warning: 'bg-warning/20 text-warning',
        danger: 'bg-danger/20 text-danger',
        info: 'bg-info/20 text-info',
        // Quantum Shield specific
        locked: 'bg-gold/20 text-gold',
        unlocking: 'bg-warning/20 text-warning',
        unlocked: 'bg-success/20 text-success',
        challenged: 'bg-danger/20 text-danger',
        emergency: 'bg-hinomaru/20 text-hinomaru',
        // Role badges
        prover: 'bg-info/20 text-info',
        delegate: 'bg-gold/20 text-gold',
        council: 'bg-hinomaru/20 text-hinomaru',
        // Outline variants
        'outline-default':
          'border border-border bg-transparent text-foreground-secondary',
        'outline-hinomaru':
          'border border-hinomaru bg-transparent text-hinomaru',
        'outline-gold': 'border border-gold bg-transparent text-gold',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional dot indicator before text */
  withDot?: boolean;
  /** Dot color (defaults to variant color) */
  dotColor?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, withDot, dotColor, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {withDot && (
          <span
            className={cn(
              'mr-1.5 h-1.5 w-1.5 rounded-full',
              dotColor || 'bg-current'
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Pre-defined status badges for Quantum Shield
const StatusBadge: React.FC<{
  status: 'locked' | 'unlocking' | 'unlocked' | 'challenged' | 'emergency';
  className?: string;
}> = ({ status, className }) => {
  const labels: Record<string, { ja: string; en: string }> = {
    locked: { ja: 'ロック中', en: 'Locked' },
    unlocking: { ja: 'アンロック中', en: 'Unlocking' },
    unlocked: { ja: 'アンロック済', en: 'Unlocked' },
    challenged: { ja: 'チャレンジ中', en: 'Challenged' },
    emergency: { ja: '緊急', en: 'Emergency' },
  };

  return (
    <Badge variant={status} withDot className={className}>
      {labels[status].ja}
    </Badge>
  );
};

export { Badge, badgeVariants, StatusBadge };
