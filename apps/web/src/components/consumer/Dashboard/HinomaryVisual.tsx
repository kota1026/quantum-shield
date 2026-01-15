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
    dotOrbit1: '56px',
    dotOrbit2: '72px',
    dotOrbit3: '88px',
  },
  md: {
    container: 'h-72',
    core: 'w-32 h-32',
    inner: 'inset-[28px]',
    orbit1: 'w-44 h-44',
    orbit2: 'w-56 h-56',
    orbit3: 'w-[272px] h-[272px]',
    dotOrbit1: '88px',
    dotOrbit2: '112px',
    dotOrbit3: '136px',
  },
  lg: {
    container: 'h-80',
    core: 'w-40 h-40',
    inner: 'inset-[35px]',
    orbit1: 'w-[220px] h-[220px]',
    orbit2: 'w-[280px] h-[280px]',
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
          sizes.orbit3
        )}
        style={{
          animation: 'orbit-spin 30s linear infinite',
        }}
      />

      {/* Orbit 2 (middle) - dashed white, 20s reverse spin */}
      <div
        className={cn(
          'absolute rounded-full border border-dashed border-white/[0.08]',
          sizes.orbit2
        )}
        style={{
          animation: 'orbit-spin 20s linear infinite reverse',
        }}
      />

      {/* Orbit 1 (inner) - gold, 12s spin */}
      <div
        className={cn(
          'absolute rounded-full border border-gold/40',
          sizes.orbit1
        )}
        style={{
          animation: 'orbit-spin 12s linear infinite',
        }}
      />

      {/* Orbital dots - each on independent orbit animation */}
      {/* Gold dot - orbit at radius dotOrbit1, 12s */}
      <div
        className="absolute w-2 h-2 rounded-full bg-gold"
        style={{
          boxShadow: '0 0 12px #C9A962',
          animation: 'orbit-gold 12s linear infinite',
          '--orbit-radius': sizes.dotOrbit1,
        } as React.CSSProperties}
      />

      {/* Red dot - orbit at radius dotOrbit2, 18s, starts at 120deg */}
      <div
        className="absolute w-2 h-2 rounded-full bg-hinomaru"
        style={{
          boxShadow: '0 0 12px rgba(188, 0, 45, 0.4)',
          animation: 'orbit-red 18s linear infinite',
          '--orbit-radius': sizes.dotOrbit2,
        } as React.CSSProperties}
      />

      {/* White dot - orbit at radius dotOrbit3, 24s, starts at 240deg */}
      <div
        className="absolute w-2 h-2 rounded-full bg-white"
        style={{
          boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
          animation: 'orbit-white 24s linear infinite',
          '--orbit-radius': sizes.dotOrbit3,
        } as React.CSSProperties}
      />

      {/* Hinomaru core */}
      <div className={cn('absolute', sizes.core)}>
        {/* White outer ring (白地) */}
        <div
          className="absolute inset-0 rounded-full border border-white/10"
          style={{
            background: 'radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.02) 100%)'
          }}
        />
        {/* Red center (日の丸) */}
        <div
          className={cn(
            'absolute rounded-full',
            sizes.inner
          )}
          style={{
            background: 'radial-gradient(circle at 35% 35%, #ff3050 0%, #BC002D 50%, #8a001a 100%)',
            boxShadow: '0 0 60px rgba(188, 0, 45, 0.4), 0 0 100px rgba(188, 0, 45, 0.2)',
            animation: 'hinomaru-pulse 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Scoped CSS for animations */}
      <style jsx>{`
        @keyframes orbit-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes orbit-gold {
          from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
          to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
        }

        @keyframes orbit-red {
          from { transform: rotate(120deg) translateX(var(--orbit-radius)) rotate(-120deg); }
          to { transform: rotate(480deg) translateX(var(--orbit-radius)) rotate(-480deg); }
        }

        @keyframes orbit-white {
          from { transform: rotate(240deg) translateX(var(--orbit-radius)) rotate(-240deg); }
          to { transform: rotate(600deg) translateX(var(--orbit-radius)) rotate(-600deg); }
        }

        @keyframes hinomaru-pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 60px rgba(188, 0, 45, 0.4), 0 0 100px rgba(188, 0, 45, 0.2);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 80px rgba(188, 0, 45, 0.4), 0 0 120px rgba(188, 0, 45, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
