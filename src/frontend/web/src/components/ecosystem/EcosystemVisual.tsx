'use client';

import { cn } from '@/lib/utils';

interface EcosystemVisualProps {
  className?: string;
}

/**
 * Custom visual for Ecosystem landing page
 * Represents the interconnected Quantum Shield ecosystem
 */
export function EcosystemVisual({ className }: EcosystemVisualProps) {
  return (
    <div
      className={cn('relative w-72 h-72 mx-auto', className)}
      aria-hidden="true"
    >
      {/* Central QS logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-hinomaru to-hinomaru/80 flex items-center justify-center shadow-[0_0_40px_rgba(188,0,45,0.4)]">
          <span className="text-white font-bold text-xl font-mono">QS</span>
        </div>
      </div>

      {/* Orbital paths */}
      <div className="absolute inset-6 border border-gold/20 rounded-full" />
      <div className="absolute inset-0 border border-gold/10 rounded-full" />

      {/* Ecosystem nodes - positioned around the center */}
      {[
        { angle: 0, label: 'Consumer', color: 'hinomaru' },
        { angle: 60, label: 'Token', color: 'gold' },
        { angle: 120, label: 'Gov', color: 'success' },
        { angle: 180, label: 'Prover', color: 'hinomaru' },
        { angle: 240, label: 'Observer', color: 'gold' },
        { angle: 300, label: 'Explorer', color: 'success' },
      ].map((node, i) => {
        const radius = 120;
        const x = 50 + radius * Math.cos((node.angle - 90) * Math.PI / 180) / 2.4;
        const y = 50 + radius * Math.sin((node.angle - 90) * Math.PI / 180) / 2.4;
        return (
          <div
            key={i}
            className="absolute w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              background: node.color === 'hinomaru' ? 'rgba(188, 0, 45, 0.15)'
                : node.color === 'gold' ? 'rgba(201, 169, 98, 0.15)'
                : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${node.color === 'hinomaru' ? 'rgba(188, 0, 45, 0.4)'
                : node.color === 'gold' ? 'rgba(201, 169, 98, 0.4)'
                : 'rgba(34, 197, 94, 0.4)'}`,
            }}
          >
            <span className="text-[9px] font-medium text-foreground-secondary">{node.label}</span>
          </div>
        );
      })}

      {/* Connecting lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const radius = 25;
          const x = 50 + radius * Math.cos((angle - 90) * Math.PI / 180);
          const y = 50 + radius * Math.sin((angle - 90) * Math.PI / 180);
          return (
            <line
              key={i}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="rgba(201, 169, 98, 0.2)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          );
        })}
      </svg>

      {/* Animated pulse on connections */}
      <div className="absolute inset-0 animate-[ping_3s_ease-in-out_infinite]">
        <div className="absolute inset-[45%] rounded-full bg-gold/10" />
      </div>
    </div>
  );
}

export default EcosystemVisual;
