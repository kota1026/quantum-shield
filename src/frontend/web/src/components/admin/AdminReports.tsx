'use client';

import { useTranslations } from 'next-intl';
import { Download, BarChart3, TrendingUp, LineChart, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type ReportType = 'daily' | 'weekly' | 'monthly' | 'revenue';

interface Report {
  type: ReportType;
  lastGenerated: string;
}

// Report card component
interface ReportCardProps {
  report: Report;
  onClick: () => void;
}

function ReportCard({ report, onClick }: ReportCardProps) {
  const t = useTranslations('admin.reports');

  const iconConfig = {
    daily: {
      icon: <BarChart3 className="h-6 w-6" aria-hidden="true" />,
      bgClass: 'bg-hinomaru/10 text-hinomaru',
    },
    weekly: {
      icon: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
      bgClass: 'bg-gold/10 text-gold',
    },
    monthly: {
      icon: <LineChart className="h-6 w-6" aria-hidden="true" />,
      bgClass: 'bg-success/10 text-success',
    },
    revenue: {
      icon: <DollarSign className="h-6 w-6" aria-hidden="true" />,
      bgClass: 'bg-[#4a90d9]/10 text-[#4a90d9]',
    },
  };

  const config = iconConfig[report.type];

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer rounded-xl border border-surface-tertiary bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      tabIndex={0}
      role="button"
      aria-label={`${t(`types.${report.type}.title`)}`}
    >
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
          config.bgClass
        )}
      >
        {config.icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {t(`types.${report.type}.title`)}
      </h3>
      <p className="mb-4 text-[13px] text-foreground-secondary">
        {t(`types.${report.type}.description`)}
      </p>
      <p className="font-mono text-[11px] text-foreground-tertiary">
        {t('lastGenerated')}: {report.lastGenerated}
      </p>
    </div>
  );
}

// Summary item component
interface SummaryItemProps {
  label: string;
  value: string;
  variant?: 'default' | 'success';
}

function SummaryItem({ label, value, variant = 'default' }: SummaryItemProps) {
  return (
    <div className="rounded-xl bg-background-secondary p-5 text-center">
      <div
        className={cn(
          'mb-1 font-mono text-[28px] font-bold',
          variant === 'success' ? 'text-success' : 'text-foreground'
        )}
      >
        {value}
      </div>
      <div className="text-xs text-foreground-tertiary">{label}</div>
    </div>
  );
}

export function AdminReports() {
  const t = useTranslations('admin.reports');

  // Mock data - in production would come from API
  const reports: Report[] = [
    { type: 'daily', lastGenerated: 'Today 00:00 UTC' },
    { type: 'weekly', lastGenerated: '2026-01-06' },
    { type: 'monthly', lastGenerated: '2025-12-31' },
    { type: 'revenue', lastGenerated: '2025-12-31' },
  ];

  const summary = {
    totalTx: '1,247',
    tvlChange: '+$12.4M',
    avgSla: '99.87%',
    incidents: '0',
  };

  const handleReportClick = (reportType: ReportType) => {
    // In production, would open report viewer
    console.log('Report clicked:', reportType);
  };

  const handleExport = () => {
    // In production, would open export dialog
    console.log('Export all clicked');
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-secondary bg-background-secondary px-5 py-2.5 text-sm text-foreground-secondary transition-colors hover:border-hinomaru hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {t('exportButton')}
          </button>
        </div>

        {/* Reports Grid */}
        <div
          className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          role="list"
          aria-label={t('title')}
        >
          {reports.map((report) => (
            <div key={report.type} role="listitem">
              <ReportCard
                report={report}
                onClick={() => handleReportClick(report.type)}
              />
            </div>
          ))}
        </div>

        {/* Today's Summary */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-tertiary px-5 py-4">
            <CardTitle className="text-base">{t('summary.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryItem label={t('summary.totalTx')} value={summary.totalTx} />
              <SummaryItem
                label={t('summary.tvlChange')}
                value={summary.tvlChange}
                variant="success"
              />
              <SummaryItem label={t('summary.avgSla')} value={summary.avgSla} />
              <SummaryItem label={t('summary.incidents')} value={summary.incidents} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
