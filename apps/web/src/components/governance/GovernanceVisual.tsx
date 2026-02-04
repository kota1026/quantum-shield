'use client';

import { cn } from '@/lib/utils';

interface GovernanceVisualProps {
  className?: string;
}

/**
 * Custom visual for Governance landing page
 * Represents the democratic voting concept with balanced scales and voting elements
 */
export function GovernanceVisual({ className }: GovernanceVisualProps) {
  return (
    <div
      className={cn('relative w-72 h-72 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Outer ring - represents community */}
      <div className="absolute inset-0 border-2 border-gold/20 rounded-full">
        {/* Voting dots around the circle */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              top: `${50 - 48 * Math.cos((angle * Math.PI) / 180)}%`,
              left: `${50 + 48 * Math.sin((angle * Math.PI) / 180)}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: i % 2 === 0 ? 'rgba(201, 169, 98, 0.6)' : 'rgba(188, 0, 45, 0.6)',
            }}
          />
        ))}
      </div>

      {/* Middle ring - animated */}
      <div className="absolute inset-8 border border-hinomaru/30 rounded-full animate-[spin_40s_linear_infinite]">
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-hinomaru rounded-full shadow-[0_0_10px_rgba(188,0,45,0.5)]" />
      </div>

      {/* Inner balance scale representation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Central pillar */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-1 h-16 bg-gradient-to-t from-gold/50 to-gold/20" />

          {/* Balance beam */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-24 w-24 h-0.5 bg-gold/60 transform -rotate-2" />

          {/* Left pan - Yes votes */}
          <div className="absolute -left-8 bottom-20 w-10 h-6 rounded-b-full border border-hinomaru/50 bg-hinomaru/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-hinomaru">YES</span>
          </div>

          {/* Right pan - No votes */}
          <div className="absolute -right-8 bottom-22 w-10 h-6 rounded-b-full border border-gold/50 bg-gold/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gold">NO</span>
          </div>

          {/* Center symbol */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-hinomaru/20 to-gold/20 border border-gold/50 flex items-center justify-center backdrop-blur-sm">
            <span className="text-2xl font-bold text-gold font-mono">veQS</span>
          </div>

          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl -z-10" />
        </div>
      </div>

      {/* Floating particles representing votes */}
      <div className="absolute top-12 right-16 w-2 h-2 bg-hinomaru/50 rounded-full animate-pulse" />
      <div className="absolute bottom-16 left-12 w-2 h-2 bg-gold/50 rounded-full animate-pulse delay-200" />
      <div className="absolute top-1/3 left-8 w-1.5 h-1.5 bg-hinomaru/40 rounded-full animate-pulse delay-400" />
      <div className="absolute bottom-1/3 right-8 w-1.5 h-1.5 bg-gold/40 rounded-full animate-pulse delay-600" />
    </div>
  );
}

export default GovernanceVisual;
