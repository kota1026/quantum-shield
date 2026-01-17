'use client';

import { cn } from '@/lib/utils';

export type StatusLevel = 'operational' | 'warning' | 'offline';

interface StatusBadgeProps {
  status: StatusLevel;
  label: string;
  className?: string;
}

const STATUS_STYLES: Record<StatusLevel, { bg: string; text: string; dot: string }> = {
  operational: {
    bg: 'bg-success/10',
    text: 'text-success',
    dot: 'bg-success',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    dot: 'bg-warning',
  },
  offline: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    dot: 'bg-destructive',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold',
        styles.bg,
        styles.text,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full animate-pulse',
          styles.dot
        )}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
