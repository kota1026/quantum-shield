'use client';

export function HinomaryVisual() {
  return (
    <div
      className="relative w-[300px] h-[300px] mx-auto"
      role="img"
      aria-label="Quantum Shield Visual - Hinomaru with orbiting rings"
    >
      {/* Outer dashed orbit - increased visibility */}
      <div
        className="absolute -inset-[50px] border-2 border-dashed border-white/20 rounded-full animate-[spin_25s_linear_infinite_reverse]"
        aria-hidden="true"
      />

      {/* Inner gold orbit with orbital dot */}
      <div
        className="absolute -inset-[20px] border-2 border-gold/60 rounded-full animate-[spin_15s_linear_infinite]"
        aria-hidden="true"
      >
        {/* Orbital dot */}
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-gold shadow-glow-gold"
          aria-hidden="true"
        />
      </div>

      {/* White circle background */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10"
        aria-hidden="true"
      />

      {/* Red center (Hinomaru) */}
      <div
        className="absolute inset-[75px] rounded-full bg-gradient-to-br from-hinomaru-400 via-hinomaru to-hinomaru-700 shadow-[0_0_80px_rgba(188,0,45,0.4)] animate-[hinomaru-pulse_4s_ease-in-out_infinite]"
        aria-hidden="true"
      />

      {/* Keyframe animation for pulse defined in globals.css or here */}
      <style jsx>{`
        @keyframes hinomaru-pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 0 80px rgba(188, 0, 45, 0.4);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 0 100px rgba(188, 0, 45, 0.4);
          }
        }
      `}</style>
    </div>
  );
}
