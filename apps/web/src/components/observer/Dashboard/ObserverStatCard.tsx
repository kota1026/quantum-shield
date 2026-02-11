'use client';

import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/consumer/Dashboard/Tooltip';
import { Link } from '@/i18n/navigation';

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
  href?: string;
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
  href,
}: ObserverStatCardProps) {
  const valueColorMap = {
    default: 'text-foreground',
    highlight: 'text-hinomaru',
    success: 'text-success',
    warning: 'text-warning',
  };

  const changeBadgeColorMap = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/15 text-danger',
    default: 'bg-foreground-secondary/15 text-foreground-secondary',
  };

  const cardContent = (
    <div className="flex flex-col h-full">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground-secondary">{label}</span>
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="cursor-help inline-flex">
              <HelpCircle className="w-4 h-4 text-foreground-secondary hover:text-foreground transition-colors" />
            </span>
          </Tooltip>
        )}
      </div>
      <div className={cn('text-[32px] font-bold tracking-tight', valueColorMap[variant])}>
        {value}
        {unit && (
          <span className="text-base font-semibold text-foreground-secondary ml-1.5">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-auto pt-3">
        {(change || changeBadge) ? (
          <>
            {change && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-success/15 text-success font-medium inline-block">
                {change}
              </span>
            )}
            {changeBadge && (
              <span
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium inline-block',
                  changeBadgeColorMap[changeBadge.variant]
                )}
              >
                {changeBadge.text}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full bg-transparent font-medium inline-block invisible">
            &nbsp;
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card
          variant="hoverGradient"
          padding="md"
          className={cn(
            'relative overflow-hidden cursor-pointer h-full',
            'hover:border-gold/50 transition-colors',
            className
          )}
        >
          {cardContent}
        </Card>
      </Link>
    );
  }

  return (
    <Card
      variant="hoverGradient"
      padding="md"
      className={cn('relative overflow-hidden h-full', className)}
    >
      {cardContent}
    </Card>
  );
}
