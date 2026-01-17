'use client';

import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/consumer/Dashboard/Tooltip';

interface ObserverStatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: string;
  change?: string;
  changeBadge?: {
    text: string;
    variant: 'success' | 'warning' | 'danger' | 'default';
  };
  variant?: 'default' | 'highlight' | 'success' | 'warning';
  className?: string;
}

export function ObserverStatCard({
  label,
  value,
  unit,
  tooltip,
  change,
  changeBadge,
  variant = 'default',
  className,
}: ObserverStatCardProps) {
  const valueColorMap = {
    default: 'text-foreground',
    highlight: 'text-hinomaru',
    success: 'text-success',
    warning: 'text-warning',
  };

  const changeBadgeColorMap = {
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    default: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  };

  return (
    <Card
      variant="hoverGradient"
      padding="md"
      className={cn('relative overflow-hidden', className)}
    >
      <div className="mb-2 flex items-center gap-1">
        <span className="text-xs text-foreground-tertiary">{label}</span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="cursor-help inline-flex">
              <HelpCircle className="w-3.5 h-3.5 text-foreground-tertiary hover:text-foreground-secondary transition-colors" />
            </span>
          </Tooltip>
        )}
      </div>
      <div className={cn('text-[28px] font-bold', valueColorMap[variant])}>
        {value}
        {unit && (
          <span className="text-sm font-medium text-foreground-secondary ml-1">
            {unit}
          </span>
        )}
      </div>
      {(change || changeBadge) && (
        <div className="mt-2">
          {change && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-success/10 text-success inline-block">
              {change}
            </span>
          )}
          {changeBadge && (
            <span
              className={cn(
                'text-[11px] px-2 py-0.5 rounded-full inline-block',
                changeBadgeColorMap[changeBadge.variant]
              )}
            >
              {changeBadge.text}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
