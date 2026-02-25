'use client';

import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

export function SettingsSection({
  title,
  children,
  variant = 'default',
  className,
}: SettingsSectionProps) {
  const isDanger = variant === 'danger';

  return (
    <section className={cn('mb-8', className)} aria-labelledby={`section-${title}`}>
      <div
        className={cn(
          'flex items-center gap-2 mb-4',
          'text-xs font-semibold tracking-wider uppercase'
        )}
      >
        <div
          className={cn(
            'w-4 h-px',
            isDanger ? 'bg-danger' : 'bg-gold'
          )}
          aria-hidden="true"
        />
        <span
          id={`section-${title}`}
          className={isDanger ? 'text-danger' : 'text-gold'}
        >
          {title}
        </span>
      </div>

      <div
        className={cn(
          'bg-surface border rounded-qs-xl',
          isDanger ? 'border-danger/20' : 'border-border hover-gradient-border'
        )}
      >
        {children}
      </div>
    </section>
  );
}

export default SettingsSection;
