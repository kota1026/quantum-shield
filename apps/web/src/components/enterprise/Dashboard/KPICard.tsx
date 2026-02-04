'use client';

import { useTranslations } from 'next-intl';
import {
  Activity,
  Server,
  Eye,
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/shared/Tooltip';

export type KPIType = 'transactions' | 'provers' | 'observers' | 'uptime' | 'challenges' | 'latency';

interface KPICardProps {
  type: KPIType;
  value: string;
  unit?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  miniGraphData?: number[];
  className?: string;
}

const KPI_CONFIG: Record<KPIType, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  graphColor: string;
}> = {
  transactions: {
    icon: Activity,
    color: 'text-hinomaru',
    bgColor: 'bg-hinomaru/10',
    graphColor: '#BC002D',
  },
  provers: {
    icon: Server,
    color: 'text-success',
    bgColor: 'bg-success/10',
    graphColor: '#00C896',
  },
  observers: {
    icon: Eye,
    color: 'text-info',
    bgColor: 'bg-info/10',
    graphColor: '#3B82F6',
  },
  uptime: {
    icon: Shield,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    graphColor: '#C9A962',
  },
  challenges: {
    icon: AlertTriangle,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    graphColor: '#F0A030',
  },
  latency: {
    icon: Clock,
    color: 'text-foreground-secondary',
    bgColor: 'bg-white/5',
    graphColor: '#9898A0',
  },
};

// Mini sparkline graph component
function MiniGraph({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 32;
  const width = 80;
  const padding = 2;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((value - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    })
    .join(' ');

  // Create area fill
  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill={`${color}20`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function KPICard({
  type,
  value,
  unit,
  change,
  miniGraphData,
  className,
}: KPICardProps) {
  const t = useTranslations('enterprise.monitoring.metrics');
  const config = KPI_CONFIG[type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'p-4 bg-background-secondary/50 border-white/5 hover:border-white/10 transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} aria-hidden="true" />
        </div>
        {miniGraphData && miniGraphData.length > 0 && (
          <MiniGraph data={miniGraphData} color={config.graphColor} />
        )}
      </div>

      <div className="space-y-1">
        <Tooltip content={t(`${type}.description`)}>
          <h3 className="text-sm text-foreground-secondary cursor-help">
            {t(`${type}.title`)}
          </h3>
        </Tooltip>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm text-foreground-tertiary">{unit}</span>}
        </div>

        {change && (
          <div className="flex items-center gap-1">
            {change.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-danger" aria-hidden="true" />
            )}
            <span
              className={cn(
                'text-xs',
                change.isPositive ? 'text-success' : 'text-danger'
              )}
            >
              {change.value}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

export default KPICard;
