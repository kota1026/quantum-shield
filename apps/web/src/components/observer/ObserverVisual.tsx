'use client';

import { cn } from '@/lib/utils';

interface ObserverVisualProps {
  className?: string;
}

/**
 * Custom visual for Observer landing page
 * Represents the fraud detection and monitoring concept
 */
export function ObserverVisual({ className }: ObserverVisualProps) {
  return (
    <div
      className={cn('relative w-64 h-64 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Radar-like scanning effect */}
      <div className="absolute inset-0 border-2 border-gold/20 rounded-full">
        <div className="absolute inset-4 border border-gold/10 rounded-full" />
        <div className="absolute inset-8 border border-gold/10 rounded-full" />
        <div className="absolute inset-12 border border-gold/10 rounded-full" />
      </div>

      {/* Scanning beam */}
      <div
        className="absolute inset-0 origin-center animate-[spin_4s_linear_infinite]"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(188, 0, 45, 0.3) 30deg, transparent 60deg)',
        }}
      />

      {/* Alert dots representing detected issues */}
      <div className="absolute top-8 right-12 w-3 h-3 bg-warning rounded-full animate-ping" />
      <div className="absolute bottom-16 left-10 w-2 h-2 bg-success rounded-full animate-pulse" />
      <div className="absolute top-1/3 left-8 w-2 h-2 bg-hinomaru rounded-full animate-ping delay-500" />

      {/* Center eye symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-hinomaru/20 to-gold/20 border border-gold/50 flex items-center justify-center backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-hinomaru/30 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-hinomaru animate-pulse" />
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-hinomaru/10 blur-xl -z-10" />
        </div>
      </div>
    </div>
  );
}

export default ObserverVisual;
