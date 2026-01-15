'use client';

import { cn } from '@/lib/utils';

interface HinomaryVisualProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Size configuration matching design-concept-5-japan-premium.html
 * Design concept: core=160px, orbit1=220px, orbit2=280px, orbit3=340px, container=320px
 */
const sizeMap = {
  sm: {
    container: 'h-40',
    core: 'w-20 h-20',
    inner: 'inset-[18px]',
    orbit1: 'w-28 h-28',
    orbit2: 'w-36 h-36',
    orbit3: 'w-44 h-44',
    dotOrbit1: '56px',   // orbit1 radius / 2
    dotOrbit2: '72px',   // orbit2 radius / 2
    dotOrbit3: '88px',   // orbit3 radius / 2
  },
  md: {
    container: 'h-72',
    core: 'w-32 h-32',
    inner: 'inset-[28px]',
    orbit1: 'w-44 h-44',
    orbit2: 'w-56 h-56',
    orbit3: 'w-68 h-68',
    dotOrbit1: '88px',
    dotOrbit2: '112px',
    dotOrbit3: '136px',
  },
  lg: {
    container: 'h-80',
    core: 'w-40 h-40',
    inner: 'inset-[35px]',
    orbit1: 'w-56 h-56',
    orbit2: 'w-72 h-72',
    orbit3: 'w-[340px] h-[340px]',
    dotOrbit1: '110px',
    dotOrbit2: '140px',
    dotOrbit3: '170px',
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
      {/* Orbit 3 (outermost) - hinomaru red, 30s spin */}
      <div
        className={cn(
          'absolute rounded-full border border-hinomaru/15',
          'animate-[spin_30s_linear_infinite]',
          sizes.orbit3
        )}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Orbit 2 (middle) - dashed white, 20s reverse spin */}
      <div
        className={cn(
          'absolute rounded-full border border-dashed border-white/8',
          'animate-[spin_20s_linear_infinite_reverse]',
          sizes.orbit2
        )}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Orbit 1 (inner) - gold, 12s spin */}
      <div
        className={cn(
          'absolute rounded-full border border-gold opacity-40',
          'animate-[spin_12s_linear_infinite]',
          sizes.orbit1
        )}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Orbital dots - each on independent orbit animation */}
      {/* Gold dot - orbit at radius dotOrbit1, 12s */}
      <div
        className="absolute w-2 h-2 rounded-full bg-gold shadow-[0_0_12px_var(--tw-shadow-color)] shadow-gold animate-[orbit-gold_12s_linear_infinite]"
        style={{
          top: '50%',
          left: '50%',
          '--orbit-radius': sizes.dotOrbit1,
        } as React.CSSProperties}
      />

      {/* Red dot - orbit at radius dotOrbit2, 18s, starts at 120deg */}
      <div
        className="absolute w-2 h-2 rounded-full bg-hinomaru shadow-[0_0_12px_rgba(188,0,45,0.4)] animate-[orbit-red_18s_linear_infinite]"
        style={{
          top: '50%',
          left: '50%',
          '--orbit-radius': sizes.dotOrbit2,
        } as React.CSSProperties}
      />

      {/* White dot - orbit at radius dotOrbit3, 24s, starts at 240deg */}
      <div
        className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-[orbit-white_24s_linear_infinite]"
        style={{
          top: '50%',
          left: '50%',
          '--orbit-radius': sizes.dotOrbit3,
        } as React.CSSProperties}
      />

      {/* Hinomaru core */}
      <div
        className={cn('absolute', sizes.core)}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* White outer ring (白地) */}
        <div
          className={cn(
            'absolute inset-0',
            'rounded-full border border-white/10'
          )}
          style={{
            background: 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)'
          }}
        />
        {/* Red center (日の丸) */}
        <div
          className={cn(
            'absolute rounded-full',
            'shadow-glow-hinomaru',
            'animate-[hinomaru-pulse_4s_ease-in-out_infinite]',
            sizes.inner
          )}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ff3050 0%, #BC002D 50%, #8a001a 100%)',
            boxShadow: '0 0 60px rgba(188, 0, 45, 0.4), 0 0 100px rgba(188, 0, 45, 0.2)'
          }}
        />
      </div>
    </div>
  );
}
