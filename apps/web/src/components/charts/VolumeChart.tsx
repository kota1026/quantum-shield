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
            backgroundColor: 'rgba(17, 17, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
          labelStyle={{ color: '#ffffff', marginBottom: 8, fontWeight: 600 }}
          itemStyle={{ color: '#e5e5e5', padding: '2px 0' }}
          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: 20 }}
          payload={[
            { value: 'ロック', type: 'square', color: '#BC002D' },
            { value: 'アンロック', type: 'square', color: '#C9A962' },
          ]}
          formatter={(value: string) => (
            <span className="text-foreground-secondary text-sm">
              {value}
            </span>
          )}
        />
        <Bar
          dataKey="locks"
          name="ロック"
          fill="#BC002D"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="unlocks"
          name="アンロック"
          fill="#C9A962"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
