'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface TVLChartProps {
  className?: string;
}

export function TVLChart({ className }: TVLChartProps) {
  const t = useTranslations('enterprise.tvl.chart');

  // In production, this would use a charting library like recharts or visx
  const gridLabels = ['$150M', '$100M', '$50M', '$0'];

  return (
    <div
      className={cn(
        'bg-card border border-white/5 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div
          className="h-[300px] bg-background-secondary rounded-lg relative overflow-hidden"
          role="img"
          aria-label={t('ariaLabel')}
        >
          {/* Grid Lines */}
          <div className="absolute inset-y-5 left-10 right-10 flex flex-col justify-between">
            {gridLabels.map((label, index) => (
              <div key={label} className="relative h-px bg-white/5">
                <span className="absolute -left-10 -top-2 text-[10px] font-mono text-foreground-tertiary">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Chart SVG */}
          <div className="absolute bottom-[50px] left-10 right-10 h-[200px]">
            <svg
              viewBox="0 0 800 200"
              preserveAspectRatio="none"
              className="w-full h-full"
            >
              <defs>
                <linearGradient id="tvlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#bc002d" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#bc002d" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Area Fill */}
              <path
                d="M0,180 C50,170 100,150 150,140 C200,130 250,120 300,100 C350,80 400,70 450,65 C500,60 550,55 600,50 C650,45 700,40 750,35 L800,30 L800,200 L0,200 Z"
                fill="url(#tvlGradient)"
              />
              {/* Line */}
              <path
                d="M0,180 C50,170 100,150 150,140 C200,130 250,120 300,100 C350,80 400,70 450,65 C500,60 550,55 600,50 C650,45 700,40 750,35 L800,30"
                fill="none"
                stroke="#bc002d"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
