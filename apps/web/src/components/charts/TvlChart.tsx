'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDataPoint } from '@/lib/api/admin/types';

interface TvlChartProps {
  data: ChartDataPoint[];
  height?: number;
}

function formatTvl(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export function TvlChart({ data, height = 300 }: TvlChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      formattedDate: formatDate(point.date),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-foreground-tertiary">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#BC002D" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#BC002D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--foreground-tertiary))', fontSize: 12 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--foreground-tertiary))', fontSize: 12 }}
          tickFormatter={formatTvl}
          width={60}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(17, 17, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
          labelStyle={{ color: '#ffffff', marginBottom: 8, fontWeight: 600 }}
          itemStyle={{ color: '#e5e5e5' }}
          formatter={(value) => [formatTvl(Number(value)), 'TVL']}
          cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#BC002D"
          strokeWidth={2}
          fill="url(#tvlGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
