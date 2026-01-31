'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HelpCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  tooltip?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'default';
  };
  highlight?: boolean;
  selected?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  tooltip,
  badge,
  highlight = false,
  selected = false,
  onClick,
  ariaLabel,
  className,
}: StatCardProps) {
  const badgeVariantMap = {
    success: 'success' as const,
    warning: 'warning' as const,
    default: 'default' as const,
  };

  return (
    <Card
      variant={onClick ? 'hoverGradient' : 'default'}
      padding="md"
      className={cn(className)}
      data-selected={selected}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel || `${label}: ${value}${unit || ''}`}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-foreground-tertiary flex items-center gap-1">
          {label}
          {tooltip && (
            <Tooltip content={tooltip}>
              <span
                className="cursor-help inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                <HelpCircle className="w-3.5 h-3.5 text-foreground-tertiary hover:text-foreground-secondary transition-colors" />
              </span>
            </Tooltip>
          )}
        </span>
        {badge && (
          <Badge variant={badgeVariantMap[badge.variant]} size="sm">
            {badge.text}
          </Badge>
        )}
      </div>
      <div
        className={cn(
          'text-2xl font-bold',
          highlight ? 'text-hinomaru' : 'text-foreground'
        )}
      >
        {value}
        {unit && (
          <span className="text-sm font-medium text-foreground-secondary ml-1">
            {unit}
          </span>
        )}
      </div>
    </Card>
  );
}
