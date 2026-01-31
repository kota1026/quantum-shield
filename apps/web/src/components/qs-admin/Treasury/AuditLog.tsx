'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  Download,
  ArrowLeft,
  FileText,
  User,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Eye,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuditLogStats, useAuditLogs } from '@/hooks/admin/useTreasury';
import {
  MOCK_AUDIT_LOG_STATS,
  MOCK_AUDIT_LOGS,
  type AuditLogStats,
  type AuditLogEntry,
} from '@/lib/api/admin/mock';

// Fallback data
const FALLBACK_STATS = MOCK_AUDIT_LOG_STATS;
const FALLBACK_LOGS = MOCK_AUDIT_LOGS;

const SEVERITY_COLORS = {
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  critical: 'bg-danger/10 text-danger',
};

const SEVERITY_ICONS = {
  info: CheckCircle,
  warning: AlertTriangle,
  critical: Shield,
};

const ACTION_LABELS: Record<string, string> = {
  transfer_initiated: 'Transfer Initiated',
  transfer_approved: 'Transfer Approved',
  transfer_rejected: 'Transfer Rejected',
  signer_added: 'Signer Added',
  signer_removed: 'Signer Removed',
  threshold_changed: 'Threshold Changed',
  budget_updated: 'Budget Updated',
  wallet_created: 'Wallet Created',
  login_failed: 'Login Failed',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  highlight?: boolean;
}

function StatCard({ title, value, icon: Icon, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'border-danger' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className={cn('text-2xl font-bold mt-2', highlight && 'text-danger')}>{value}</p>
          </div>
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', highlight ? 'bg-danger/10' : 'bg-hinomaru/10')}>
            <Icon className={cn('h-6 w-6', highlight ? 'text-danger' : 'text-hinomaru')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function AuditLogSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-14 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function AuditLogError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-danger mb-4" />
      <p className="text-foreground-secondary mb-4">{error.message || t('error')}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {t('retry')}
      </Button>
    </div>
  );
}

// Map API log to component format
function mapApiLog(data: unknown): AuditLogEntry {
  if (!data || typeof data !== 'object') return FALLBACK_LOGS[0];
  const d = data as Record<string, unknown>;
  return {
    id: (d.id as string) || '',
    action: (d.action as string) || '',
    actor: (d.actor as string) || '',
    target: (d.target as string) || '',
    details: (d.details as string) || '',
    severity: (d.severity as string) || 'info',
    timestamp: (d.timestamp as string) || '',
    ip: (d.ip as string) || '',
  };
}

export function AuditLog() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Fetch data with hooks
  const statsQuery = useAuditLogStats();
  const logsQuery = useAuditLogs();

  // Map API data or use fallback
  const stats: AuditLogStats = statsQuery.data ?? FALLBACK_STATS;
  const apiLogs = logsQuery.data?.logs;
  const logs: AuditLogEntry[] = apiLogs
    ? apiLogs.map(mapApiLog)
    : FALLBACK_LOGS;

  // Show skeleton only on initial load
  if (statsQuery.isLoading && !statsQuery.data && logsQuery.isLoading && !logsQuery.data) {
    return <AuditLogSkeleton />;
  }

  // Show error state
  if ((statsQuery.error || logsQuery.error) && !statsQuery.data && !logsQuery.data) {
    return <AuditLogError error={(statsQuery.error || logsQuery.error) as Error} onRetry={() => { statsQuery.refetch(); logsQuery.refetch(); }} />;
  }

  const severityFilters = [
    { key: 'all', label: t('audit.severity.all') },
    { key: 'critical', label: t('audit.severity.critical') },
    { key: 'warning', label: t('audit.severity.warning') },
    { key: 'info', label: t('audit.severity.info') },
  ];

  const filteredLogs = logs.filter(log => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchQuery && !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.actor.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.details.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/treasury">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('audit.title')}</h1>
            <p className="text-foreground-secondary">{t('audit.subtitle')}</p>
          </div>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          {tCommon('export')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('audit.totalLogs')} value={stats.totalLogs.toLocaleString()} icon={FileText} />
        <StatCard title={t('audit.thisWeek')} value={stats.logsThisWeek} icon={Clock} />
        <StatCard title={t('audit.criticalEvents')} value={stats.criticalEvents} icon={AlertTriangle} highlight />
        <StatCard title={t('audit.pendingReview')} value={stats.pendingReviews} icon={Eye} />
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('audit.auditTrail')}</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {severityFilters.map((filter) => (
              <button key={filter.key} onClick={() => setSeverityFilter(filter.key)} className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', severityFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.id')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.timestamp')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.action')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.actor')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.details')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.severity')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.ip')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('audit.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const SeverityIcon = SEVERITY_ICONS[log.severity as keyof typeof SEVERITY_ICONS];
                  return (
                    <tr key={log.id} className={cn('border-b border-border hover:bg-surface transition-colors', log.severity === 'critical' && 'bg-danger/5')}>
                      <td className="py-3 px-4"><code className="text-sm font-mono text-foreground-secondary">{log.id}</code></td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{t(`audit.actions.${log.action}`) || log.action}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-foreground-tertiary" />
                          <span className="text-sm">{log.actor}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary max-w-xs truncate">{log.details}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', SEVERITY_COLORS[log.severity as keyof typeof SEVERITY_COLORS])}>
                          <SeverityIcon className="h-3 w-3 mr-1" />
                          {t(`audit.severity.${log.severity}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4"><code className="text-xs font-mono text-foreground-tertiary">{log.ip}</code></td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('audit.empty')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
