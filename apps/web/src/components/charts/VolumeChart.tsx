'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { VolumeDataPoint } from '@/lib/api/admin/types';

interface VolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export function VolumeChart({ data, height = 300 }: VolumeChartProps) {
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
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
          width={40}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background-elevated))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground-secondary))', marginBottom: 4 }}
        />
        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value: string) => (
            <span className="text-foreground-secondary text-sm">
              {value === 'locks' ? 'ロック' : 'アンロック'}
            </span>
          )}
        />
        <Bar
          dataKey="locks"
          name="locks"
          fill="hsl(var(--hinomaru))"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="unlocks"
          name="unlocks"
          fill="hsl(var(--gold))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
