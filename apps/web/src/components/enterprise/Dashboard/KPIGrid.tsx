'use client';

import { useTranslations } from 'next-intl';
import { KPICard, KPIType } from './KPICard';
import { cn } from '@/lib/utils';

interface KPIData {
  type: KPIType;
  value: string;
  unit?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  miniGraphData?: number[];
}

interface KPIGridProps {
  data?: KPIData[];
  className?: string;
}

// Default demo data
const DEFAULT_KPI_DATA: KPIData[] = [
  {
    type: 'transactions',
    value: '12,847',
    change: { value: '+12.4%', isPositive: true },
    miniGraphData: [10, 15, 12, 18, 14, 22, 19, 25, 23, 28],
  },
  {
    type: 'provers',
    value: '127',
    change: { value: '+3 nodes', isPositive: true },
    miniGraphData: [120, 122, 124, 125, 124, 126, 125, 127, 127, 127],
  },
  {
    type: 'observers',
    value: '48',
    change: { value: '0%', isPositive: true },
    miniGraphData: [45, 46, 47, 48, 48, 47, 48, 48, 48, 48],
  },
  {
    type: 'uptime',
    value: '99.99',
    unit: '%',
    change: { value: 'vs 99.95%', isPositive: true },
    miniGraphData: [99.95, 99.97, 99.98, 99.99, 99.99, 99.98, 99.99, 99.99, 99.99, 99.99],
  },
  {
    type: 'challenges',
    value: '3',
    change: { value: '-2 from yesterday', isPositive: true },
    miniGraphData: [8, 6, 5, 7, 4, 5, 3, 4, 3, 3],
  },
  {
    type: 'latency',
    value: '45',
    unit: 'ms',
    change: { value: '-5ms avg', isPositive: true },
    miniGraphData: [52, 50, 48, 47, 46, 48, 47, 45, 46, 45],
  },
];

export function KPIGrid({ data = DEFAULT_KPI_DATA, className }: KPIGridProps) {
  const t = useTranslations('enterprise.monitoring');

  return (
    <section
      className={cn('grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4', className)}
      aria-label={t('ariaLabel')}
    >
      {data.map((kpi) => (
        <KPICard
          key={kpi.type}
          type={kpi.type}
          value={kpi.value}
          unit={kpi.unit}
          change={kpi.change}
          miniGraphData={kpi.miniGraphData}
        />
      ))}
    </section>
  );
}

export default KPIGrid;
