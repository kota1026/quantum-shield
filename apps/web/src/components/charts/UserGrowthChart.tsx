'use client';

import { useMemo } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDataPoint } from '@/lib/api/admin/types';

interface UserGrowthChartProps {
  data: ChartDataPoint[];
  height?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

function formatUsers(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toString();
}

export function UserGrowthChart({ data, height = 300 }: UserGrowthChartProps) {
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
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          tickFormatter={formatUsers}
          width={50}
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
          formatter={(value) => [formatUsers(Number(value)), 'ユーザー数']}
          cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#00C896"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#00C896' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
