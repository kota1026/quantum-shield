'use client';

import { cn } from '@/lib/utils';

interface HinomaryVisualProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'h-32',
    core: 'w-20 h-20',
    inner: 'inset-[18px]',
    orbit1: 'w-28 h-28',
    orbit2: 'w-36 h-36',
  },
  md: {
    container: 'h-48',
    core: 'w-28 h-28',
    inner: 'inset-[25px]',
    orbit1: 'w-36 h-36',
    orbit2: 'w-44 h-44',
  },
  lg: {
    container: 'h-64',
    core: 'w-36 h-36',
    inner: 'inset-[32px]',
    orbit1: 'w-48 h-48',
    orbit2: 'w-56 h-56',
  },
};

export function HinomaryVisual({ size = 'md', className }: HinomaryVisualProps) {
  const sizes = sizeMap[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizes.container,
        className
      )}
      aria-hidden="true"
    >
      {/* Outer dashed orbit - increased visibility */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'rounded-full border-2 border-dashed border-white/20',
          'animate-[spin_20s_linear_infinite_reverse]',
          sizes.orbit2
        )}
      />

      {/* Inner gold orbit with orbital dot */}
      <div
        className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'rounded-full border-2 border-gold/60',
          'animate-[spin_12s_linear_infinite]',
          sizes.orbit1
        )}
      >
        {/* Orbital dot */}
        <div
          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-gold shadow-glow-gold"
        />
      </div>

      {/* Hinomaru core */}
      <div className={cn('relative', sizes.core)}>
        {/* White outer ring */}
        <div
          className={cn(
            'absolute inset-0',
            'bg-gradient-radial from-white/15 to-white/5',
            'rounded-full border border-white/10'
          )}
        />
        {/* Red center */}
        <div
          className={cn(
            'absolute rounded-full',
            'bg-gradient-to-br from-[#ff3050] via-hinomaru to-[#8a001a]',
            'shadow-glow-hinomaru',
            'animate-[pulse_4s_ease-in-out_infinite]',
            sizes.inner
          )}
        />
      </div>
    </div>
  );
}
