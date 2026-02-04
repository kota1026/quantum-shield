'use client';

import { cn } from '@/lib/utils';

interface TokenHubVisualProps {
  className?: string;
}

/**
 * Custom visual for Token Hub landing page
 * Represents the veQS token locking concept with animated rings
 */
export function TokenHubVisual({ className }: TokenHubVisualProps) {
  return (
    <div
      className={cn('relative w-64 h-64 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Outer ring - represents lock period */}
      <div className="absolute inset-0 border-2 border-gold/30 rounded-full animate-[spin_30s_linear_infinite]">
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold rounded-full shadow-[0_0_10px_rgba(201,169,98,0.5)]" />
      </div>

      {/* Middle ring - represents veQS decay */}
      <div className="absolute inset-6 border-2 border-hinomaru/30 rounded-full animate-[spin_20s_linear_infinite_reverse]">
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-hinomaru rounded-full shadow-[0_0_10px_rgba(188,0,45,0.5)]" />
      </div>

      {/* Inner ring - represents QS token */}
      <div className="absolute inset-12 border border-gold/50 rounded-full animate-[spin_15s_linear_infinite]">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gold rounded-full" />
      </div>

      {/* Center core - veQS symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-hinomaru/20 border border-gold/50 flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl font-bold text-gold font-mono">veQS</span>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl -z-10" />
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute top-8 right-8 w-2 h-2 bg-gold/60 rounded-full animate-pulse" />
      <div className="absolute bottom-12 left-6 w-1.5 h-1.5 bg-hinomaru/60 rounded-full animate-pulse delay-300" />
      <div className="absolute top-1/3 left-4 w-1 h-1 bg-gold/40 rounded-full animate-pulse delay-500" />
      <div className="absolute bottom-1/4 right-10 w-1.5 h-1.5 bg-gold/50 rounded-full animate-pulse delay-700" />
    </div>
  );
}

export default TokenHubVisual;
