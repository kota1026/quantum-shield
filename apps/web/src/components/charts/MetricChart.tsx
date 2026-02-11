'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartDataPoint } from '@/lib/api/admin/types';

export type MetricType =
  | 'count'        // Simple integer count
  | 'eth'          // ETH amount (value = ETH * 10000)
  | 'percentage';  // 0-100 percentage

interface MetricChartProps {
  data: ChartDataPoint[];
  height?: number;
  type?: MetricType;
  color?: string;
  label?: string;
  chartType?: 'area' | 'bar';
}

function formatValue(value: number, type: MetricType): string {
  switch (type) {
    case 'eth': {
      const ethValue = value / 10000;
      if (ethValue >= 1_000_000) {
        return `${(ethValue / 1_000_000).toFixed(1)}M ETH`;
      }
      if (ethValue >= 1_000) {
        return `${(ethValue / 1_000).toFixed(1)}K ETH`;
      }
      if (ethValue >= 1) {
        return `${ethValue.toFixed(2)} ETH`;
      }
      return `${ethValue.toFixed(4)} ETH`;
    }
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'count':
    default: {
      if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
      }
      if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      return value.toString();
    }
  }
}

function formatDate(dateStr: string): string {
  // Handle MM/DD format from backend
  if (dateStr.includes('/')) {
    return dateStr;
  }
  // Handle ISO date format
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

export function MetricChart({
  data,
  height = 200,
  type = 'count',
  color = '#BC002D',
  label = 'Value',
  chartType = 'area',
}: MetricChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      formattedDate: formatDate(point.date),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        No data available
      </div>
    );
  }

  const gradientId = `gradient-${label.replace(/\s/g, '-').toLowerCase()}`;

  if (chartType === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            tickFormatter={(v) => formatValue(v, type)}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(17, 17, 17, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
            labelStyle={{ color: '#ffffff', marginBottom: 4, fontWeight: 600, fontSize: 12 }}
            itemStyle={{ color: '#e5e5e5', fontSize: 12 }}
            formatter={(value) => [formatValue(Number(value), type), label]}
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
          />
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="formattedDate"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          tickFormatter={(v) => formatValue(v, type)}
          width={50}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(17, 17, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          }}
          labelStyle={{ color: '#ffffff', marginBottom: 4, fontWeight: 600, fontSize: 12 }}
          itemStyle={{ color: '#e5e5e5', fontSize: 12 }}
          formatter={(value) => [formatValue(Number(value), type), label]}
          cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
