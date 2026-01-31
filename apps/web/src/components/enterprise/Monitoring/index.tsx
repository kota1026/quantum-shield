'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Activity,
  Server,
  Eye,
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { KPIGrid } from '@/components/enterprise/Dashboard/KPIGrid';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  timestamp: string;
  acknowledged: boolean;
}

const DEMO_ALERTS: Alert[] = [
  {
    id: '1',
    title: 'High latency detected',
    description: 'API latency exceeded threshold (>100ms) for 5 minutes',
    severity: 'warning',
    timestamp: '5 min ago',
    acknowledged: false,
  },
  {
    id: '2',
    title: 'Prover node offline',
    description: 'Virginia Node (prv-005) has been offline for 2 hours',
    severity: 'critical',
    timestamp: '2 hours ago',
    acknowledged: true,
  },
  {
    id: '3',
    title: 'Queue depth increasing',
    description: 'Signature queue depth is at 85% capacity',
    severity: 'info',
    timestamp: '15 min ago',
    acknowledged: false,
  },
];

// Simple chart component for demonstration
function SimpleChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="h-32 flex items-end gap-1">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all"
          style={{
            height: `${((value - min) / range) * 100}%`,
            backgroundColor: color,
            opacity: 0.6 + (i / data.length) * 0.4,
          }}
        />
      ))}
    </div>
  );
}

export function EnterpriseMonitoring() {
  const t = useTranslations('enterprise.monitoring');
  const tCommon = useTranslations('enterprise');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [alerts, setAlerts] = useState(DEMO_ALERTS);

  const timeRanges: TimeRange[] = ['1h', '6h', '24h', '7d', '30d'];

  // Demo chart data
  const transactionData = [45, 52, 48, 61, 55, 67, 72, 68, 75, 80, 78, 85];
  const latencyData = [42, 45, 48, 52, 46, 44, 47, 45, 43, 41, 44, 45];
  const errorData = [0.1, 0.15, 0.12, 0.08, 0.1, 0.05, 0.08, 0.12, 0.1, 0.08, 0.05, 0.03];

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map((a) => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const resolveAlert = (id: string) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Time range selector */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t('subtitle')}</h2>
            <div className="flex items-center gap-1 p-1 bg-background-secondary rounded-lg">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    timeRange === range
                      ? 'bg-hinomaru text-white'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {t(`timeRange.${range}`)}
                </button>
              ))}
            </div>
          </div>

          {/* KPI Grid */}
          <KPIGrid className="mb-8" />

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground-secondary mb-4">
                {t('charts.transactions')}
              </h3>
              <SimpleChart data={transactionData} color="#BC002D" />
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-foreground-tertiary">Last {timeRange}</span>
                <div className="flex items-center gap-1 text-success">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12.4%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground-secondary mb-4">
                {t('charts.latency')}
              </h3>
              <SimpleChart data={latencyData} color="#C9A962" />
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-foreground-tertiary">Avg: 45ms</span>
                <div className="flex items-center gap-1 text-success">
                  <TrendingDown className="h-4 w-4" />
                  <span>-5ms</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-semibold text-foreground-secondary mb-4">
                {t('charts.errors')}
              </h3>
              <SimpleChart data={errorData} color="#00C896" />
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-foreground-tertiary">Error rate</span>
                <div className="flex items-center gap-1 text-success">
                  <TrendingDown className="h-4 w-4" />
                  <span>0.03%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Alerts Section */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-foreground-secondary" />
                <h3 className="font-semibold">{t('alerts.title')}</h3>
                {alerts.filter((a) => !a.acknowledged).length > 0 && (
                  <Badge variant="danger">
                    {alerts.filter((a) => !a.acknowledged).length}
                  </Badge>
                )}
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-foreground-secondary">{t('alerts.noAlerts')}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {alerts.map((alert) => {
                  const severityConfig = {
                    critical: { icon: XCircle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
                    warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
                    info: { icon: Activity, color: 'text-info', bg: 'bg-info/10', border: 'border-info/30' },
                  }[alert.severity];

                  const Icon = severityConfig.icon;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        'p-4 transition-colors',
                        alert.acknowledged ? 'opacity-60' : 'hover:bg-white/[0.02]'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn('p-2 rounded-lg', severityConfig.bg)}>
                          <Icon className={cn('h-5 w-5', severityConfig.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{alert.title}</span>
                            <Badge
                              variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'default'}
                              className="text-xs"
                            >
                              {alert.severity}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="default" className="text-xs">
                                Acknowledged
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground-secondary mb-2">
                            {alert.description}
                          </p>
                          <span className="text-xs text-foreground-tertiary">
                            {alert.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.acknowledged && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              {t('alerts.acknowledge')}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            {t('alerts.resolve')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseMonitoring;
