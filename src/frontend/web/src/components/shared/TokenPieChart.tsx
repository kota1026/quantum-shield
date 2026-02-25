'use client';

/**
 * TokenPieChart - Ecosystemページと同じ円アニメーション
 *
 * CSS conic-gradient pie chart using design system colors
 * 40% Community (hinomaru #BC002D), 20% Team (gold #C9A962), 20% Ecosystem (success #00C896),
 * 15% Treasury (info #3B82F6), 5% Liquidity (warning #F0A030)
 */
export function TokenPieChart() {
  return (
    <div className="relative w-40 h-40 flex-shrink-0">
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `conic-gradient(
            #BC002D 0deg 144deg,
            #C9A962 144deg 216deg,
            #00C896 216deg 288deg,
            #3B82F6 288deg 342deg,
            #F0A030 342deg 360deg
          )`,
        }}
      />
      {/* Center hole for donut effect */}
      <div className="absolute inset-4 bg-surface rounded-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold">1B</div>
          <div className="text-xs text-foreground-tertiary">QS</div>
        </div>
      </div>
    </div>
  );
}

export default TokenPieChart;
