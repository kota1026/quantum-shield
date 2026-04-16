'use client';

import { cn } from '@/lib/utils';

interface HinomaryLogoProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'w-10 h-10',
    outer: 'inset-0',
    inner: 'w-5 h-5',
    dot: 'w-1 h-1 -top-0.5',
  },
  md: {
    container: 'w-14 h-14',
    outer: 'inset-0',
    inner: 'w-7 h-7',
    dot: 'w-1.5 h-1.5 -top-0.5',
  },
  lg: {
    container: 'w-20 h-20',
    outer: 'inset-0',
    inner: 'w-10 h-10',
    dot: 'w-2 h-2 -top-1',
  },
};

export function HinomaryLogo({
  size = 'md',
  animate = true,
  className,
}: HinomaryLogoProps) {
  const sizes = sizeMap[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizes.container,
        className
      )}
      role="img"
      aria-label="Quantum Shield Logo"
    >
      {/* Outer gold ring with rotating animation */}
      <div
        className={cn(
          'absolute border-[1.5px] border-gold rounded-full',
          sizes.outer,
          animate && 'animate-[spin_20s_linear_infinite]'
        )}
        aria-hidden="true"
      >
        {/* Gold dot marker on ring */}
        <div
          className={cn(
            'absolute bg-gold rounded-full left-1/2 -translate-x-1/2',
            sizes.dot
          )}
        />
      </div>

      {/* Inner red circle (Hinomaru) */}
      <div
        className={cn(
          'bg-hinomaru rounded-full shadow-glow-hinomaru',
          sizes.inner,
          animate && 'animate-pulse-slow'
        )}
        aria-hidden="true"
      />
    </div>
  );
}
