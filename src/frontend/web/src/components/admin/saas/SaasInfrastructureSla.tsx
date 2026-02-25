'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Server,
  Activity,
  AlertOctagon,
  Target,
  FileText,
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
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}>
                <TrendingUp className={cn('h-3 w-3', trend.direction === 'down' && 'rotate-180')} />
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
const mockInfraSla = {
  services: [
    {
      id: 'sla-infra-001',
      serviceName: 'Prover API',
      slaTarget: 99.99,
      currentSla: 99.995,
      status: 'exceeding',
      uptimeThisMonth: 99.995,
      incidents: 0,
      mttr: '-',
      lastIncident: null,
    },
    {
      id: 'sla-infra-002',
      serviceName: 'Signature Service',
      slaTarget: 99.99,
      currentSla: 99.98,
      status: 'meeting',
      uptimeThisMonth: 99.98,
      incidents: 1,
      mttr: '8m',
      lastIncident: '2026-01-10',
    },
    {
      id: 'sla-infra-003',
      serviceName: 'Queue Service',
      slaTarget: 99.9,
      currentSla: 99.5,
      status: 'at_risk',
      uptimeThisMonth: 99.5,
      incidents: 3,
      mttr: '25m',
      lastIncident: '2026-01-17',
    },
    {
      id: 'sla-infra-004',
      serviceName: 'Database Cluster',
      slaTarget: 99.999,
      currentSla: 99.999,
      status: 'meeting',
      uptimeThisMonth: 99.999,
      incidents: 0,
      mttr: '-',
      lastIncident: null,
    },
    {
      id: 'sla-infra-005',
      serviceName: 'Cache Layer',
      slaTarget: 99.9,
      currentSla: 100,
      status: 'exceeding',
      uptimeThisMonth: 100,
      incidents: 0,
      mttr: '-',
      lastIncident: null,
    },
  ],
  incidentHistory: [
    {
      id: 'inc-001',
      service: 'Queue Service',
      severity: 'minor',
      duration: '15m',
      description: 'キュー処理の遅延が発生',
      timestamp: '2026-01-17 14:30',
      resolved: true,
    },
    {
      id: 'inc-002',
      service: 'Queue Service',
      severity: 'major',
      duration: '45m',
      description: 'メッセージキューのバックログ増加',
      timestamp: '2026-01-15 09:15',
      resolved: true,
    },
    {
      id: 'inc-003',
      service: 'Signature Service',
      severity: 'minor',
      duration: '8m',
      description: '署名検証のレイテンシ上昇',
      timestamp: '2026-01-10 22:45',
      resolved: true,
    },
    {
      id: 'inc-004',
      service: 'Queue Service',
      severity: 'minor',
      duration: '12m',
      description: 'コンシューマー接続の一時的な中断',
      timestamp: '2026-01-08 16:20',
      resolved: true,
    },
  ],
};

const mockMetrics = {
  overallSla: 99.89,
  servicesMeetingSla: 4,
  servicesAtRisk: 1,
  totalIncidents: 4,
  avgMttr: '22m',
};

export function SaasInfrastructureSla() {
  const t = useTranslations('admin.saasInfraSla');
  const [selectedService, setSelectedService] = useState<typeof mockInfraSla.services[0] | null>(mockInfraSla.services[0]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'exceeding':
        return <Badge variant="success">{t('status.exceeding')}</Badge>;
      case 'meeting':
        return <Badge variant="success">{t('status.meeting')}</Badge>;
      case 'at_risk':
        return <Badge variant="warning">{t('status.atRisk')}</Badge>;
      case 'breach':
        return <Badge variant="danger">{t('status.breach')}</Badge>;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="danger">{t('severity.critical')}</Badge>;
      case 'major':
        return <Badge variant="warning">{t('severity.major')}</Badge>;
      case 'minor':
        return <Badge variant="default">{t('severity.minor')}</Badge>;
      default:
        return null;
    }
  };

  const getSlaColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return 'text-success';
    if (ratio >= 0.999) return 'text-warning';
    return 'text-danger';
  };

  const getSlaBarColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return 'bg-success';
    if (ratio >= 0.999) return 'bg-warning';
    return 'bg-danger';
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
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                SaaS
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/infrastructure" className="hover:text-foreground">
                {t('breadcrumb.infrastructure')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb.sla')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.overallSla')}
              value={`${mockMetrics.overallSla}%`}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.meetingSla')}
              value={String(mockMetrics.servicesMeetingSla)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.atRisk')}
              value={String(mockMetrics.servicesAtRisk)}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.incidents')}
              value={String(mockMetrics.totalIncidents)}
              subValue={t('stats.thisMonth')}
              icon={<AlertOctagon className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.avgMttr')}
              value={mockMetrics.avgMttr}
              icon={<Clock className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Service SLA List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('serviceList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockInfraSla.services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedService?.id === service.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <Server className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{service.serviceName}</div>
                              <div className="text-xs text-foreground-tertiary">
                                {t('serviceList.target')}: {service.slaTarget}%
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(service.status)}
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-foreground-tertiary">{t('serviceList.currentSla')}</span>
                            <span className={getSlaColor(service.currentSla, service.slaTarget)}>
                              {service.currentSla}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-2 rounded-full', getSlaBarColor(service.currentSla, service.slaTarget))}
                              style={{ width: `${Math.min((service.currentSla / service.slaTarget) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span>{t('serviceList.incidents')}: {service.incidents}</span>
                          <span>MTTR: {service.mttr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Incident History */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">{t('incidentHistory.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockInfraSla.incidentHistory.map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full',
                            incident.severity === 'critical' ? 'bg-danger/10' :
                            incident.severity === 'major' ? 'bg-warning/10' : 'bg-foreground-tertiary/10'
                          )}>
                            <AlertTriangle className={cn(
                              'h-4 w-4',
                              incident.severity === 'critical' ? 'text-danger' :
                              incident.severity === 'major' ? 'text-warning' : 'text-foreground-tertiary'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{incident.service}</span>
                              {getSeverityBadge(incident.severity)}
                            </div>
                            <div className="text-xs text-foreground-tertiary">{incident.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{incident.duration}</div>
                          <div className="text-xs text-foreground-tertiary">{incident.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Service Detail Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedService ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(selectedService.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.serviceName')}</div>
                        <div className="font-medium text-foreground">{selectedService.serviceName}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.slaTarget')}</div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-gold" />
                            <span className="text-lg font-bold">{selectedService.slaTarget}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.currentSla')}</div>
                          <div className={cn('text-lg font-bold', getSlaColor(selectedService.currentSla, selectedService.slaTarget))}>
                            {selectedService.currentSla}%
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.uptimeThisMonth')}</div>
                        <div className="mt-1">
                          <div className="h-3 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-3 rounded-full', getSlaBarColor(selectedService.uptimeThisMonth, selectedService.slaTarget))}
                              style={{ width: `${selectedService.uptimeThisMonth}%` }}
                            />
                          </div>
                          <div className="mt-1 text-right text-xs text-foreground-tertiary">
                            {selectedService.uptimeThisMonth}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-surface-tertiary pt-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.incidents')}</div>
                          <div className={cn(
                            'text-lg font-bold',
                            selectedService.incidents === 0 ? 'text-success' : 'text-warning'
                          )}>
                            {selectedService.incidents}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.mttr')}</div>
                          <div className="text-lg font-bold">{selectedService.mttr}</div>
                        </div>
                      </div>

                      {selectedService.lastIncident && (
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.lastIncident')}</div>
                          <div className="text-sm">{selectedService.lastIncident}</div>
                        </div>
                      )}

                      <div className="border-t border-surface-tertiary pt-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Activity className="h-4 w-4" />}>
                            {t('detail.actions.viewHistory')}
                          </Button>
                          <Button size="sm" className="flex-1" leftIcon={<FileText className="h-4 w-4" />}>
                            {t('detail.actions.generateReport')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Shield className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectService')}</p>
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
