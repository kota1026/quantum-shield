'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-qs text-sm font-medium transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary - Hinomaru Red gradient
        primary:
          'bg-gradient-hinomaru text-white shadow-qs hover:shadow-qs-hover hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-hinomaru',
        // Secondary - Gold outline
        secondary:
          'border border-gold text-gold bg-transparent hover:bg-gold/10 hover:shadow-qs-gold focus-visible:ring-gold',
        // Outline - Default border
        outline:
          'border border-border bg-transparent hover:bg-surface-secondary hover:border-foreground-tertiary focus-visible:ring-foreground-tertiary',
        // Ghost - No border
        ghost:
          'bg-transparent hover:bg-surface-secondary focus-visible:ring-foreground-tertiary',
        // Danger - Red for destructive actions
        danger:
          'bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger',
        // Warning - Orange/amber for emergency actions
        warning:
          'bg-warning text-background hover:bg-warning/90 hover:shadow-lg hover:shadow-warning/20 focus-visible:ring-warning',
        // Success - Green for positive actions
        success:
          'bg-success text-white hover:bg-success/90 focus-visible:ring-success',
        // Link - Text only
        link: 'text-hinomaru underline-offset-4 hover:underline focus-visible:ring-hinomaru',
        // Gold - Gold solid background
        gold: 'bg-gold text-background hover:bg-gold/90 hover:shadow-qs-gold focus-visible:ring-gold',
      },
      size: {
        sm: 'h-11 px-4 text-xs',
        md: 'h-11 px-6 text-sm',
        lg: 'h-13 px-8 text-base',
        icon: 'h-11 w-11',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref
  ) => {
    // When asChild is true, only pass the child element directly to Slot
    // Slot expects a single React element child
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          ref={ref as React.Ref<HTMLElement>}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
