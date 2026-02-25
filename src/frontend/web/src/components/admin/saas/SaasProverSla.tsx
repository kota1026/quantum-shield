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
  Building2,
  FileText,
  AlertOctagon,
  Target,
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
const mockSlaData = [
  {
    id: 'sla-001',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    plan: 'Enterprise',
    slaTarget: 99.9,
    currentSla: 99.85,
    status: 'meeting',
    uptimeThisMonth: 99.92,
    incidents: 1,
    latencyTarget: '3s',
    currentLatency: '2.1s',
    lastIncident: '2026-01-05',
    creditEligible: false,
  },
  {
    id: 'sla-002',
    operatorId: 'op-002',
    operatorName: 'Asian Banking Group',
    plan: 'Professional',
    slaTarget: 99.5,
    currentSla: 97.2,
    status: 'breach',
    uptimeThisMonth: 97.2,
    incidents: 5,
    latencyTarget: '5s',
    currentLatency: '4.5s',
    lastIncident: '2026-01-17',
    creditEligible: true,
  },
  {
    id: 'sla-003',
    operatorId: 'op-003',
    operatorName: 'Nordic Crypto Exchange',
    plan: 'Professional',
    slaTarget: 99.5,
    currentSla: 99.6,
    status: 'meeting',
    uptimeThisMonth: 99.65,
    incidents: 2,
    latencyTarget: '5s',
    currentLatency: '2.9s',
    lastIncident: '2026-01-10',
    creditEligible: false,
  },
  {
    id: 'sla-004',
    operatorId: 'op-004',
    operatorName: 'Euro Securities Ltd',
    plan: 'Enterprise',
    slaTarget: 99.9,
    currentSla: 98.5,
    status: 'at_risk',
    uptimeThisMonth: 98.5,
    incidents: 3,
    latencyTarget: '3s',
    currentLatency: '3.2s',
    lastIncident: '2026-01-16',
    creditEligible: false,
  },
  {
    id: 'sla-005',
    operatorId: 'op-005',
    operatorName: 'South American Fintech',
    plan: 'Enterprise',
    slaTarget: 99.9,
    currentSla: 99.95,
    status: 'exceeding',
    uptimeThisMonth: 99.98,
    incidents: 0,
    latencyTarget: '3s',
    currentLatency: '1.8s',
    lastIncident: null,
    creditEligible: false,
  },
];

const mockMetrics = {
  avgSlaCompliance: 98.9,
  operatorsMeetingSla: 4,
  operatorsAtRisk: 1,
  operatorsInBreach: 1,
  totalIncidents: 11,
};

export function SaasProverSla() {
  const t = useTranslations('admin.saasProverSla');
  const [activeTab, setActiveTab] = useState<'all' | 'meeting' | 'at_risk' | 'breach'>('all');
  const [selectedSla, setSelectedSla] = useState<typeof mockSlaData[0] | null>(mockSlaData[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockSlaData.length },
    { key: 'meeting', label: t('tabs.meeting'), count: mockSlaData.filter(s => s.status === 'meeting' || s.status === 'exceeding').length },
    { key: 'at_risk', label: t('tabs.atRisk'), count: mockSlaData.filter(s => s.status === 'at_risk').length },
    { key: 'breach', label: t('tabs.breach'), count: mockSlaData.filter(s => s.status === 'breach').length },
  ];

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

  const getSlaColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return 'text-success';
    if (ratio >= 0.99) return 'text-warning';
    return 'text-danger';
  };

  const getSlaBarColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return 'bg-success';
    if (ratio >= 0.99) return 'bg-warning';
    return 'bg-danger';
  };

  const filteredSlaData = mockSlaData.filter((sla) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'meeting') return sla.status === 'meeting' || sla.status === 'exceeding';
    return sla.status === activeTab;
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
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.avgCompliance')}
              value={`${mockMetrics.avgSlaCompliance}%`}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.meetingSla')}
              value={String(mockMetrics.operatorsMeetingSla)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.atRisk')}
              value={String(mockMetrics.operatorsAtRisk)}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.inBreach')}
              value={String(mockMetrics.operatorsInBreach)}
              icon={<AlertOctagon className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.totalIncidents')}
              value={String(mockMetrics.totalIncidents)}
              subValue={t('stats.thisMonth')}
              icon={<Clock className="h-5 w-5" />}
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
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* SLA List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('slaList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredSlaData.map((sla) => (
                      <div
                        key={sla.id}
                        onClick={() => setSelectedSla(sla)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedSla?.id === sla.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50',
                          sla.status === 'breach' && 'border-l-4 border-l-danger'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <Building2 className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{sla.operatorName}</div>
                              <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                                <Badge variant="default" size="sm">{sla.plan}</Badge>
                                <span>{t('slaList.target')}: {sla.slaTarget}%</span>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(sla.status)}
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-foreground-tertiary">{t('slaList.currentSla')}</span>
                            <span className={getSlaColor(sla.currentSla, sla.slaTarget)}>
                              {sla.currentSla}% / {sla.slaTarget}%
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-2 rounded-full', getSlaBarColor(sla.currentSla, sla.slaTarget))}
                              style={{ width: `${Math.min((sla.currentSla / sla.slaTarget) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span>{t('slaList.incidents')}: {sla.incidents}</span>
                          <span>{t('slaList.latency')}: {sla.currentLatency}</span>
                          {sla.creditEligible && (
                            <Badge variant="danger" size="sm">{t('slaList.creditEligible')}</Badge>
                          )}
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
                  {selectedSla ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold">{selectedSla.plan}</Badge>
                        {getStatusBadge(selectedSla.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.operator')}</div>
                        <Link
                          href={`/admin/saas/operators/${selectedSla.operatorId}`}
                          className="font-medium text-gold hover:underline"
                        >
                          {selectedSla.operatorName}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.slaTarget')}</div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-gold" />
                            <span className="text-lg font-bold">{selectedSla.slaTarget}%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.currentSla')}</div>
                          <div className={cn('text-lg font-bold', getSlaColor(selectedSla.currentSla, selectedSla.slaTarget))}>
                            {selectedSla.currentSla}%
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.uptimeThisMonth')}</div>
                        <div className="mt-1">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>{selectedSla.uptimeThisMonth}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-2 rounded-full', getSlaBarColor(selectedSla.uptimeThisMonth, selectedSla.slaTarget))}
                              style={{ width: `${selectedSla.uptimeThisMonth}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.latencyTarget')}</div>
                          <div className="text-sm">{selectedSla.latencyTarget}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.currentLatency')}</div>
                          <div className={cn(
                            'text-sm font-medium',
                            parseFloat(selectedSla.currentLatency) <= parseFloat(selectedSla.latencyTarget)
                              ? 'text-success' : 'text-danger'
                          )}>
                            {selectedSla.currentLatency}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.incidents')}</div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-lg font-bold',
                            selectedSla.incidents === 0 ? 'text-success' :
                            selectedSla.incidents <= 2 ? 'text-warning' : 'text-danger'
                          )}>
                            {selectedSla.incidents}
                          </span>
                          <span className="text-xs text-foreground-tertiary">{t('detail.thisMonth')}</span>
                        </div>
                      </div>

                      {selectedSla.lastIncident && (
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.lastIncident')}</div>
                          <div className="text-sm">{selectedSla.lastIncident}</div>
                        </div>
                      )}

                      {selectedSla.creditEligible && (
                        <div className="rounded-lg bg-danger/10 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-danger">
                            <AlertOctagon className="h-4 w-4" />
                            {t('detail.creditNotice')}
                          </div>
                          <p className="mt-1 text-xs text-foreground-secondary">
                            {t('detail.creditDescription')}
                          </p>
                        </div>
                      )}

                      <div className="border-t border-surface-tertiary pt-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Clock className="h-4 w-4" />}>
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
                        <p className="mt-2">{t('detail.selectSla')}</p>
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
