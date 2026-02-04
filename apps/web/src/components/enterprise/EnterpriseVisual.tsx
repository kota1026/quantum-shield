'use client';

import { cn } from '@/lib/utils';

interface EnterpriseVisualProps {
  className?: string;
}

/**
 * Custom visual for Enterprise landing page
 * Represents enterprise security and institutional-grade protection
 */
export function EnterpriseVisual({ className }: EnterpriseVisualProps) {
  return (
    <div
      className={cn('relative w-64 h-64 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Shield outline */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 100 120" className="w-48 h-56">
          {/* Outer shield */}
          <path
            d="M50 5 L90 25 L90 60 Q90 95 50 115 Q10 95 10 60 L10 25 Z"
            fill="none"
            stroke="rgba(201, 169, 98, 0.3)"
            strokeWidth="1"
          />
          {/* Inner shield */}
          <path
            d="M50 15 L80 30 L80 55 Q80 85 50 100 Q20 85 20 55 L20 30 Z"
            fill="rgba(201, 169, 98, 0.1)"
            stroke="rgba(201, 169, 98, 0.5)"
            strokeWidth="1"
          />
          {/* Center building icon */}
          <rect x="38" y="45" width="24" height="30" fill="rgba(188, 0, 45, 0.2)" stroke="rgba(188, 0, 45, 0.5)" strokeWidth="1" />
          <rect x="42" y="50" width="6" height="6" fill="rgba(188, 0, 45, 0.4)" />
          <rect x="52" y="50" width="6" height="6" fill="rgba(188, 0, 45, 0.4)" />
          <rect x="42" y="60" width="6" height="6" fill="rgba(188, 0, 45, 0.4)" />
          <rect x="52" y="60" width="6" height="6" fill="rgba(188, 0, 45, 0.4)" />
          <rect x="46" y="68" width="8" height="7" fill="rgba(201, 169, 98, 0.6)" />
        </svg>
      </div>

      {/* Rotating security ring */}
      <div className="absolute inset-4 border border-gold/20 rounded-full animate-[spin_30s_linear_infinite]">
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gold rounded-full" />
      </div>

      {/* Status indicators */}
      <div className="absolute top-4 right-4 w-3 h-3 bg-success rounded-full animate-pulse" />
      <div className="absolute bottom-4 left-4 w-3 h-3 bg-success rounded-full animate-pulse delay-300" />
    </div>
  );
}

export default EnterpriseVisual;
