'use client';

import { cn } from '@/lib/utils';

interface ProverVisualProps {
  className?: string;
}

/**
 * Custom visual for Prover landing page
 * Represents the proof generation and verification concept
 */
export function ProverVisual({ className }: ProverVisualProps) {
  return (
    <div
      className={cn('relative w-64 h-64 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Outer hexagon - represents network */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,2 93,25 93,75 50,98 7,75 7,25"
            fill="none"
            stroke="rgba(201, 169, 98, 0.3)"
            strokeWidth="0.5"
            className="animate-pulse"
          />
          {/* Node points */}
          {[
            [50, 2],
            [93, 25],
            [93, 75],
            [50, 98],
            [7, 75],
            [7, 25],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="3"
              fill={i % 2 === 0 ? 'rgba(188, 0, 45, 0.8)' : 'rgba(201, 169, 98, 0.8)'}
              className="animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </svg>
      </div>

      {/* Inner rotating ring */}
      <div className="absolute inset-8 border-2 border-hinomaru/30 rounded-full animate-[spin_20s_linear_infinite]">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-hinomaru rounded-full shadow-[0_0_15px_rgba(188,0,45,0.6)]" />
      </div>

      {/* Center proof symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-hinomaru/20 to-gold/20 border border-gold/50 flex items-center justify-center backdrop-blur-sm transform rotate-45">
            <div className="transform -rotate-45">
              <div className="text-xs text-gold font-mono mb-1">STARK</div>
              <div className="text-2xl font-bold text-gold font-mono">π</div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-lg bg-gold/10 blur-xl -z-10" />
        </div>
      </div>

      {/* Data flow lines */}
      <div className="absolute top-1/2 left-0 w-8 h-px bg-gradient-to-r from-transparent to-hinomaru/50 animate-pulse" />
      <div className="absolute top-1/2 right-0 w-8 h-px bg-gradient-to-l from-transparent to-gold/50 animate-pulse delay-300" />

      {/* Floating particles */}
      <div className="absolute top-10 right-12 w-2 h-2 bg-hinomaru/50 rounded-full animate-ping" />
      <div className="absolute bottom-14 left-10 w-2 h-2 bg-gold/50 rounded-full animate-ping delay-500" />
    </div>
  );
}

export default ProverVisual;
