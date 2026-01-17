'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface VolumeChartProps {
  className?: string;
}

export function VolumeChart({ className }: VolumeChartProps) {
  const t = useTranslations('enterprise.volume.chart');

  // Chart grid labels
  const yAxisLabels = ['$5M', '$4M', '$3M', '$2M', '$1M', '$0'];
  const xAxisLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby="volume-chart-title"
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h2 id="volume-chart-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
      </div>

      {/* Card Body - Chart */}
      <div className="p-6">
        <div
          className="relative h-[250px] bg-background rounded-lg"
          role="img"
          aria-label={t('ariaLabel')}
        >
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between text-xs text-muted-foreground">
            {yAxisLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute left-12 right-0 top-0 bottom-8">
            {/* Grid lines */}
            <div className="h-full flex flex-col justify-between">
              {yAxisLabels.map((_, index) => (
                <div
                  key={index}
                  className="border-b border-white/5 h-0"
                  aria-hidden="true"
                />
              ))}
            </div>

            {/* Placeholder bar chart - in production would use recharts or similar */}
            <div className="absolute inset-0 flex items-end justify-around px-4 pb-1">
              {[65, 45, 80, 55, 90, 70, 85].map((height, index) => (
                <div
                  key={index}
                  className="w-8 bg-gold/60 rounded-t"
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between text-xs text-muted-foreground px-2">
            {xAxisLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
