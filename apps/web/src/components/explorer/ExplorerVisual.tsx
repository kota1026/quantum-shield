'use client';

import { cn } from '@/lib/utils';

interface ExplorerVisualProps {
  className?: string;
}

/**
 * Custom visual for Explorer landing page
 * Represents blockchain data exploration and transparency
 */
export function ExplorerVisual({ className }: ExplorerVisualProps) {
  return (
    <div
      className={cn('relative w-64 h-64 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Block chain representation */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Connected blocks */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-hinomaru/20 border border-hinomaru/50 rounded-lg animate-pulse" />
          <div className="w-4 h-0.5 bg-gold/50" />
          <div className="w-12 h-12 bg-gold/20 border border-gold/50 rounded-lg animate-pulse delay-200" />
          <div className="w-4 h-0.5 bg-gold/50" />
          <div className="w-12 h-12 bg-success/20 border border-success/50 rounded-lg animate-pulse delay-400" />
        </div>
      </div>

      {/* Orbiting data points */}
      <div className="absolute inset-0 border border-gold/20 rounded-full animate-[spin_20s_linear_infinite]">
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold rounded-full" />
      </div>

      <div className="absolute inset-8 border border-hinomaru/20 rounded-full animate-[spin_15s_linear_infinite_reverse]">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-hinomaru rounded-full" />
      </div>

      {/* Transaction indicators */}
      <div className="absolute top-6 right-10 text-[10px] font-mono text-gold/60">TX</div>
      <div className="absolute bottom-8 left-8 text-[10px] font-mono text-hinomaru/60">BLOCK</div>

      {/* Search icon in center */}
      <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
        <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}

export default ExplorerVisual;
