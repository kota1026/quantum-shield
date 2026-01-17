'use client';

import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

export type ServiceStatus = 'online' | 'warning' | 'offline';

export interface ServiceItem {
  id: string;
  name: string;
  status: ServiceStatus;
  value: string;
}

interface StatusServiceCardProps {
  title: string;
  services: ServiceItem[];
  emptyMessage?: string;
  className?: string;
}

const STATUS_COLORS: Record<ServiceStatus, string> = {
  online: 'bg-success shadow-[0_0_8px_rgba(0,200,150,0.6)]',
  warning: 'bg-warning',
  offline: 'bg-destructive',
};

export function StatusServiceCard({
  title,
  services,
  emptyMessage,
  className,
}: StatusServiceCardProps) {
  const isEmpty = services.length === 0 && emptyMessage;

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby={`status-${title.toLowerCase().replace(/\s+/g, '-')}-title`}
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h2
          id={`status-${title.toLowerCase().replace(/\s+/g, '-')}-title`}
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
      </div>

      {/* Card Body */}
      <div className="p-6">
        {isEmpty ? (
          <div className="text-center py-8">
            <CheckCircle
              className="w-10 h-10 mx-auto mb-3 text-success"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="space-y-0" aria-label={title}>
            {services.map((service, index) => (
              <li
                key={service.id}
                className={cn(
                  'flex items-center justify-between py-4',
                  index < services.length - 1 && 'border-b border-white/5'
                )}
              >
                <span className="text-sm text-foreground">{service.name}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span
                    className={cn(
                      'w-2.5 h-2.5 rounded-full',
                      STATUS_COLORS[service.status]
                    )}
                    aria-hidden="true"
                  />
                  <span>{service.value}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
