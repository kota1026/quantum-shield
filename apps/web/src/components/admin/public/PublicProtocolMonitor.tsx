'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Activity,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  Database,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Stat card
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger',
          status === 'info' && 'bg-info/10 text-info'
        )}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const mockMetrics = [
  {
    name: 'Signature Throughput',
    value: '1,234',
    unit: 'sigs/min',
    change: '+5.2%',
    status: 'healthy',
  },
  {
    name: 'Average Latency',
    value: '45',
    unit: 'ms',
    change: '-2.1%',
    status: 'healthy',
  },
  {
    name: 'Success Rate',
    value: '99.98',
    unit: '%',
    change: '+0.01%',
    status: 'healthy',
  },
  {
    name: 'Active Provers',
    value: '124',
    unit: '',
    change: '+2',
    status: 'healthy',
  },
];

const mockAlerts = [
  {
    id: 'alert-001',
    type: 'warning',
    title: 'High Latency Detected',
    description: 'Prover prover-003 experiencing above-threshold latency',
    timestamp: '2026-01-18 10:32:15',
    status: 'active',
  },
  {
    id: 'alert-002',
    type: 'info',
    title: 'New Prover Joined',
    description: 'Prover prover-128 has been registered and is syncing',
    timestamp: '2026-01-18 09:45:00',
    status: 'resolved',
  },
  {
    id: 'alert-003',
    type: 'danger',
    title: 'SLA Violation',
    description: 'Prover prover-042 fell below 99% SLA for 30 minutes',
    timestamp: '2026-01-17 23:15:00',
    status: 'resolved',
  },
];

const mockNodes = [
  {
    id: 'node-001',
    region: 'Asia Pacific',
    provers: 45,
    avgLatency: '42ms',
    status: 'healthy',
  },
  {
    id: 'node-002',
    region: 'Europe',
    provers: 38,
    avgLatency: '48ms',
    status: 'healthy',
  },
  {
    id: 'node-003',
    region: 'North America',
    provers: 41,
    avgLatency: '45ms',
    status: 'healthy',
  },
];

export function PublicProtocolMonitor() {
  const t = useTranslations('admin.publicProtocol');
  const [activeTab, setActiveTab] = useState<'realtime' | 'alerts' | 'nodes'>('realtime');

  const tabs = [
    { key: 'realtime', label: t('tabs.realtime') },
    { key: 'alerts', label: t('tabs.alerts'), count: mockAlerts.filter(a => a.status === 'active').length },
    { key: 'nodes', label: t('tabs.nodes') },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-5 w-5 text-danger" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'info':
        return <Activity className="h-5 w-5 text-info" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="danger">{t('alertStatus.active')}</Badge>;
      case 'resolved':
        return <Badge variant="success">{t('alertStatus.resolved')}</Badge>;
      case 'healthy':
        return <Badge variant="success">{t('nodeStatus.healthy')}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{t('nodeStatus.degraded')}</Badge>;
      case 'offline':
        return <Badge variant="danger">{t('nodeStatus.offline')}</Badge>;
      default:
        return null;
    }
  };

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
              <span className="text-foreground">Protocol Monitor</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<RefreshCw className="h-4 w-4" />}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalSignatures')}
              value="12.5M"
              subValue="Today"
              icon={<Shield className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.throughput')}
              value="1,234/min"
              subValue="+5.2%"
              icon={<Zap className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.avgLatency')}
              value="45ms"
              icon={<Clock className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.successRate')}
              value="99.98%"
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.activeAlerts')}
              value="1"
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
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
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge size="sm" variant={activeTab === tab.key ? 'default' : 'danger'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Real-time Tab */}
          {activeTab === 'realtime' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('realtime.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {mockMetrics.map((metric) => (
                      <div
                        key={metric.name}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary p-4"
                      >
                        <div className="text-xs text-foreground-tertiary">{metric.name}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-foreground">{metric.value}</span>
                          <span className="text-sm text-foreground-secondary">{metric.unit}</span>
                        </div>
                        <div className={cn(
                          'mt-1 text-xs',
                          metric.change.startsWith('+') ? 'text-success' : 'text-danger'
                        )}>
                          {metric.change}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('realtime.chartTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                    <div className="text-center text-foreground-tertiary">
                      <TrendingUp className="mx-auto h-12 w-12" />
                      <p className="mt-2">Real-time protocol metrics chart will be displayed here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('alerts.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        'flex items-start justify-between rounded-lg border p-4',
                        alert.status === 'active'
                          ? 'border-warning/50 bg-warning/5'
                          : 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                        <div>
                          <div className="font-medium text-foreground">{alert.title}</div>
                          <div className="mt-1 text-sm text-foreground-secondary">
                            {alert.description}
                          </div>
                          <div className="mt-2 text-xs text-foreground-tertiary">
                            {alert.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(alert.status)}
                        {alert.status === 'active' && (
                          <Button variant="outline" size="sm">
                            {t('alerts.acknowledge')}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nodes Tab */}
          {activeTab === 'nodes' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('nodes.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('nodes.columns.region')}</th>
                        <th className="pb-3 font-medium">{t('nodes.columns.provers')}</th>
                        <th className="pb-3 font-medium">{t('nodes.columns.avgLatency')}</th>
                        <th className="pb-3 font-medium">{t('nodes.columns.status')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockNodes.map((node) => (
                        <tr
                          key={node.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                                <Database className="h-5 w-5 text-info" />
                              </div>
                              <span className="font-medium text-foreground">{node.region}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">{node.provers}</span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">{node.avgLatency}</span>
                          </td>
                          <td className="py-4">{getStatusBadge(node.status)}</td>
                          <td className="py-4">
                            <Link
                              href={`/admin/public/nodes/${node.id}`}
                              className="text-gold hover:underline"
                            >
                              {t('nodes.viewDetails')}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
