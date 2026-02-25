'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export interface AuditTrail {
  organization: string;
  apiKey: string;
  ipAddress: string;
  userAgent: string;
}

interface AuditTrailCardProps {
  audit: AuditTrail;
  className?: string;
}

export function AuditTrailCard({ audit, className }: AuditTrailCardProps) {
  const t = useTranslations('enterprise.transactionDetail.audit');

  const rows = [
    { label: t('organization'), value: audit.organization },
    { label: t('apiKey'), value: audit.apiKey, mono: true },
    { label: t('ipAddress'), value: audit.ipAddress, mono: true },
    { label: t('userAgent'), value: audit.userAgent, small: true },
  ];

  return (
    <section
      className={cn(
        'bg-background-secondary border border-white/5 rounded-xl overflow-hidden',
        className
      )}
      aria-labelledby="audit-title"
    >
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <h2 id="audit-title" className="text-base font-semibold text-foreground">
          {t('title')}
        </h2>
      </div>

      {/* Card Body */}
      <div className="p-6">
        <dl className="space-y-0">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={cn(
                'flex items-center justify-between py-4',
                index < rows.length - 1 && 'border-b border-white/5'
              )}
            >
              <dt className="text-sm text-muted-foreground">{row.label}</dt>
              <dd
                className={cn(
                  'text-sm font-medium',
                  row.mono && 'font-mono',
                  row.small && 'text-xs'
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
