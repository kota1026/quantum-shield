'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Eye,
  FileWarning,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, trend, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-foreground">{value}</div>
            {trend && (
              <span className={cn(
                'flex items-center text-xs',
                trend.direction === 'up' ? 'text-danger' : 'text-success'
              )}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const SAMPLE_RISK_ALERTS = [
  {
    id: 'risk-001',
    userId: 'USR-12350',
    userEmail: 'chen@trade.cn',
    operatorName: 'Euro Securities Ltd',
    riskType: 'unusual_activity',
    severity: 'high',
    riskScore: 85,
    description: '通常の3倍以上の取引頻度を検出',
    detectedAt: '2026-01-18 14:32',
    status: 'open',
  },
  {
    id: 'risk-002',
    userId: 'USR-12347',
    userEmail: 'suzuki@finance.jp',
    operatorName: 'Global Finance Corp',
    riskType: 'suspicious_pattern',
    severity: 'critical',
    riskScore: 92,
    description: '複数のウォレットへの分散転送パターン',
    detectedAt: '2026-01-18 12:15',
    status: 'investigating',
  },
  {
    id: 'risk-003',
    userId: 'USR-12351',
    userEmail: 'park@exchange.kr',
    operatorName: 'Asian Banking Group',
    riskType: 'geo_anomaly',
    severity: 'medium',
    riskScore: 58,
    description: '登録地域と異なる場所からのアクセス',
    detectedAt: '2026-01-18 10:45',
    status: 'open',
  },
  {
    id: 'risk-004',
    userId: 'USR-12352',
    userEmail: 'wilson@bank.uk',
    operatorName: 'Nordic Crypto Exchange',
    riskType: 'velocity_breach',
    severity: 'high',
    riskScore: 76,
    description: '短時間での大量取引を検出',
    detectedAt: '2026-01-17 22:30',
    status: 'resolved',
  },
  {
    id: 'risk-005',
    userId: 'USR-12353',
    userEmail: 'garcia@fintech.es',
    operatorName: 'Global Finance Corp',
    riskType: 'sanction_match',
    severity: 'critical',
    riskScore: 98,
    description: '制裁リストとの部分一致を検出',
    detectedAt: '2026-01-17 18:00',
    status: 'escalated',
  },
];

const DEFAULT_METRICS = {
  totalAlerts: 156,
  criticalAlerts: 12,
  highAlerts: 34,
  openAlerts: 89,
  resolvedToday: 23,
};

export function SaasUserRisks() {
  const t = useTranslations('admin.saasUserRisks');
  const [activeTab, setActiveTab] = useState<'all' | 'critical' | 'high' | 'medium' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<typeof SAMPLE_RISK_ALERTS[0] | null>(SAMPLE_RISK_ALERTS[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_RISK_ALERTS.length },
    { key: 'critical', label: t('tabs.critical'), count: SAMPLE_RISK_ALERTS.filter(a => a.severity === 'critical').length },
    { key: 'high', label: t('tabs.high'), count: SAMPLE_RISK_ALERTS.filter(a => a.severity === 'high').length },
    { key: 'medium', label: t('tabs.medium'), count: SAMPLE_RISK_ALERTS.filter(a => a.severity === 'medium').length },
    { key: 'resolved', label: t('tabs.resolved'), count: SAMPLE_RISK_ALERTS.filter(a => a.status === 'resolved').length },
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger">{t('severity.critical')}</Badge>;
      case 'high':
        return <Badge variant="warning">{t('severity.high')}</Badge>;
      case 'medium':
        return <Badge variant="gold">{t('severity.medium')}</Badge>;
      case 'low':
        return <Badge variant="success">{t('severity.low')}</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning">{t('status.open')}</Badge>;
      case 'investigating':
        return <Badge variant="gold">{t('status.investigating')}</Badge>;
      case 'escalated':
        return <Badge variant="danger">{t('status.escalated')}</Badge>;
      case 'resolved':
        return <Badge variant="success">{t('status.resolved')}</Badge>;
      default:
        return null;
    }
  };

  const getRiskTypeLabel = (type: string) => {
    return t(`riskTypes.${type}`);
  };

  const filteredAlerts = SAMPLE_RISK_ALERTS.filter((alert) => {
    const matchesSearch =
      alert.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'resolved') return matchesSearch && alert.status === 'resolved';
    return matchesSearch && alert.severity === activeTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                SaaS
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/users" className="hover:text-foreground">
                {t('breadcrumb.users')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb.risks')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalAlerts')}
              value={String(DEFAULT_METRICS.totalAlerts)}
              trend={{ value: '+12%', direction: 'up' }}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.criticalAlerts')}
              value={String(DEFAULT_METRICS.criticalAlerts)}
              icon={<AlertOctagon className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.highAlerts')}
              value={String(DEFAULT_METRICS.highAlerts)}
              icon={<Shield className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.openAlerts')}
              value={String(DEFAULT_METRICS.openAlerts)}
              subValue={t('stats.needsReview')}
              icon={<Eye className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.resolvedToday')}
              value={String(DEFAULT_METRICS.resolvedToday)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Alert List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('alertList.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('alertList.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('alertList.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlert(alert)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedAlert?.id === alert.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50',
                          alert.severity === 'critical' && 'border-l-4 border-l-danger'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              alert.severity === 'critical' && 'bg-danger/10',
                              alert.severity === 'high' && 'bg-warning/10',
                              alert.severity === 'medium' && 'bg-gold/10'
                            )}>
                              <AlertTriangle className={cn(
                                'h-5 w-5',
                                alert.severity === 'critical' && 'text-danger',
                                alert.severity === 'high' && 'text-warning',
                                alert.severity === 'medium' && 'text-gold'
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{alert.userEmail}</span>
                                {getSeverityBadge(alert.severity)}
                              </div>
                              <div className="text-xs text-foreground-tertiary">
                                {alert.operatorName} • {getRiskTypeLabel(alert.riskType)}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(alert.status)}
                        </div>
                        <p className="mt-2 text-sm text-foreground-secondary">{alert.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {alert.detectedAt}
                          </span>
                          <span className="font-mono">
                            {t('alertList.riskScore')}: {alert.riskScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedAlert ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {getSeverityBadge(selectedAlert.severity)}
                        {getStatusBadge(selectedAlert.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.user')}</div>
                        <Link
                          href={`/admin/saas/users/${selectedAlert.userId}`}
                          className="font-medium text-gold hover:underline"
                        >
                          {selectedAlert.userEmail}
                        </Link>
                        <div className="font-mono text-xs text-foreground-tertiary">{selectedAlert.userId}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.operator')}</div>
                        <div className="text-sm">{selectedAlert.operatorName}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.riskType')}</div>
                        <Badge variant="gold">{getRiskTypeLabel(selectedAlert.riskType)}</Badge>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.riskScore')}</div>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'text-2xl font-bold',
                            selectedAlert.riskScore >= 80 ? 'text-danger' :
                            selectedAlert.riskScore >= 50 ? 'text-warning' : 'text-success'
                          )}>
                            {selectedAlert.riskScore}
                          </div>
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn(
                                  'h-2 rounded-full',
                                  selectedAlert.riskScore >= 80 ? 'bg-danger' :
                                  selectedAlert.riskScore >= 50 ? 'bg-warning' : 'bg-success'
                                )}
                                style={{ width: `${selectedAlert.riskScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.description')}</div>
                        <div className="mt-1 rounded-lg bg-background-secondary p-3 text-sm">
                          {selectedAlert.description}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.detectedAt')}</div>
                        <div className="text-sm">{selectedAlert.detectedAt}</div>
                      </div>

                      <div className="border-t border-surface-tertiary pt-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Eye className="h-4 w-4" />}>
                            {t('detail.actions.investigate')}
                          </Button>
                          <Button size="sm" className="flex-1" leftIcon={<FileWarning className="h-4 w-4" />}>
                            {t('detail.actions.escalate')}
                          </Button>
                        </div>
                        {selectedAlert.status !== 'resolved' && (
                          <Button variant="outline" className="mt-2 w-full" leftIcon={<CheckCircle className="h-4 w-4" />}>
                            {t('detail.actions.resolve')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Shield className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectAlert')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
