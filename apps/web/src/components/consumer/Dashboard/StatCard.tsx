'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  badge?: {
    text: string;
    variant: 'success' | 'warning' | 'default';
  };
  highlight?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  badge,
  highlight = false,
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
      variant={onClick ? 'interactive' : 'default'}
      padding="md"
      className={cn(
        'cursor-pointer',
        className
      )}
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
        <span className="text-xs text-foreground-tertiary">{label}</span>
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
