'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_ALERTS = [
  { id: 1, level: 'warning', source: 'Prover Network', message: 'Prover node #12 response time degraded', timestamp: '2024-01-27 14:30', status: 'active', actionLink: '/qs-admin/prover/list/PRV-012', actionLabel: 'Prover詳細を確認' },
  { id: 2, level: 'info', source: 'System', message: 'System maintenance scheduled for tonight', timestamp: '2024-01-27 10:00', status: 'acknowledged', actionLink: '/qs-admin/system/maintenance', actionLabel: 'メンテナンス管理' },
  { id: 3, level: 'critical', source: 'API Server', message: 'High memory usage detected', timestamp: '2024-01-27 09:15', status: 'resolved', actionLink: '/qs-admin/system/logs', actionLabel: 'システムログ確認' },
  { id: 4, level: 'warning', source: 'Database', message: 'Slow query detected', timestamp: '2024-01-26 22:30', status: 'resolved', actionLink: '/qs-admin/system/logs', actionLabel: 'システムログ確認' },
  { id: 5, level: 'info', source: 'Observer Network', message: 'New observer joined the network', timestamp: '2024-01-26 18:00', status: 'acknowledged', actionLink: '/qs-admin/observer/list', actionLabel: 'Observer一覧' },
  { id: 6, level: 'critical', source: 'Blockchain RPC', message: 'RPC endpoint timeout', timestamp: '2024-01-26 15:45', status: 'resolved', actionLink: '/qs-admin/system/logs', actionLabel: 'システムログ確認' },
];

const LEVEL_COLORS = {
  critical: 'bg-danger/10 text-danger border-danger/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
};

const LEVEL_ICONS = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
};

const STATUS_COLORS = {
  active: 'bg-danger/10 text-danger',
  acknowledged: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
};

export function AlertsList() {
  const t = useTranslations('qsAdmin.system');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'active', label: t('status.active') },
    { key: 'acknowledged', label: t('status.acknowledged') },
    { key: 'resolved', label: t('status.resolved') },
  ];

  const filteredAlerts = DEFAULT_ALERTS.filter(alert => {
    if (statusFilter !== 'all' && alert.status !== statusFilter) return false;
    if (searchQuery && !alert.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !alert.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/system">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('alertsTitle')}</h1>
            <p className="text-foreground-secondary">{t('alertsSubtitle')}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('alertsTitle')} ({filteredAlerts.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4 border-b border-border">
            {statusFilters.map((filter) => (
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const LevelIcon = LEVEL_ICONS[alert.level as keyof typeof LEVEL_ICONS];
              return (
                <div
                  key={alert.id}
                  className={cn('p-4 rounded-lg border', LEVEL_COLORS[alert.level as keyof typeof LEVEL_COLORS])}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <LevelIcon className="h-5 w-5 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{alert.source}</span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_COLORS[alert.status as keyof typeof STATUS_COLORS])}>
                            {t(`status.${alert.status}`)}
                          </span>
                        </div>
                        <p className="mt-1">{alert.message}</p>
                        <p className="text-xs text-foreground-tertiary mt-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {alert.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.status === 'active' && (
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acknowledge
                        </Button>
                      )}
                      <Link href={alert.actionLink}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          {alert.actionLabel}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
