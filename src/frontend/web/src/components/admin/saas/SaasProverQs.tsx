'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Cpu,
  Search,
  ChevronRight,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  Zap,
  Clock,
  Shield,
  TrendingUp,
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
const SAMPLE_QS_PROVERS = [
  {
    id: 'qs-prover-001',
    name: 'QS-Prover-Tokyo-01',
    region: 'asia-northeast1',
    status: 'active',
    type: 'dilithium',
    cpuUsage: 45,
    memoryUsage: 62,
    proofsGenerated: 125432,
    avgProofTime: '2.3s',
    uptime: '99.98%',
    lastHealthCheck: '30秒前',
  },
  {
    id: 'qs-prover-002',
    name: 'QS-Prover-Tokyo-02',
    region: 'asia-northeast1',
    status: 'active',
    type: 'stark',
    cpuUsage: 78,
    memoryUsage: 85,
    proofsGenerated: 98234,
    avgProofTime: '3.1s',
    uptime: '99.95%',
    lastHealthCheck: '15秒前',
  },
  {
    id: 'qs-prover-003',
    name: 'QS-Prover-Singapore-01',
    region: 'asia-southeast1',
    status: 'degraded',
    type: 'dilithium',
    cpuUsage: 92,
    memoryUsage: 94,
    proofsGenerated: 76543,
    avgProofTime: '4.5s',
    uptime: '98.5%',
    lastHealthCheck: '45秒前',
  },
  {
    id: 'qs-prover-004',
    name: 'QS-Prover-Frankfurt-01',
    region: 'europe-west3',
    status: 'active',
    type: 'stark',
    cpuUsage: 55,
    memoryUsage: 68,
    proofsGenerated: 112890,
    avgProofTime: '2.8s',
    uptime: '99.99%',
    lastHealthCheck: '20秒前',
  },
  {
    id: 'qs-prover-005',
    name: 'QS-Prover-US-East-01',
    region: 'us-east1',
    status: 'maintenance',
    type: 'dilithium',
    cpuUsage: 0,
    memoryUsage: 0,
    proofsGenerated: 89234,
    avgProofTime: '-',
    uptime: '99.90%',
    lastHealthCheck: '-',
  },
];

const DEFAULT_METRICS = {
  totalProvers: 5,
  activeProvers: 3,
  degradedProvers: 1,
  totalProofs: '502,333',
  avgProofTime: '2.9s',
};

export function SaasProverQs() {
  const t = useTranslations('admin.saasProverQs');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'degraded' | 'maintenance'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProver, setSelectedProver] = useState<typeof SAMPLE_QS_PROVERS[0] | null>(SAMPLE_QS_PROVERS[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_QS_PROVERS.length },
    { key: 'active', label: t('tabs.active'), count: SAMPLE_QS_PROVERS.filter(p => p.status === 'active').length },
    { key: 'degraded', label: t('tabs.degraded'), count: SAMPLE_QS_PROVERS.filter(p => p.status === 'degraded').length },
    { key: 'maintenance', label: t('tabs.maintenance'), count: SAMPLE_QS_PROVERS.filter(p => p.status === 'maintenance').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{t('status.degraded')}</Badge>;
      case 'maintenance':
        return <Badge variant="default">{t('status.maintenance')}</Badge>;
      case 'offline':
        return <Badge variant="danger">{t('status.offline')}</Badge>;
      default:
        return null;
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'bg-danger';
    if (usage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  const filteredProvers = SAMPLE_QS_PROVERS.filter((prover) => {
    const matchesSearch =
      prover.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prover.region.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && prover.status === activeTab;
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
              label={t('stats.totalProvers')}
              value={String(DEFAULT_METRICS.totalProvers)}
              icon={<Server className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeProvers')}
              value={String(DEFAULT_METRICS.activeProvers)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.degradedProvers')}
              value={String(DEFAULT_METRICS.degradedProvers)}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.totalProofs')}
              value={DEFAULT_METRICS.totalProofs}
              trend={{ value: '+15%', direction: 'up' }}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgProofTime')}
              value={DEFAULT_METRICS.avgProofTime}
              icon={<Zap className="h-5 w-5" />}
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
            {/* Prover List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('proverList.title')}</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                    <input
                      type="text"
                      placeholder={t('proverList.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredProvers.map((prover) => (
                      <div
                        key={prover.id}
                        onClick={() => setSelectedProver(prover)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedProver?.id === prover.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <Cpu className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{prover.name}</div>
                              <div className="text-xs text-foreground-tertiary">
                                {prover.region} • {prover.type.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(prover.status)}
                        </div>

                        {prover.status !== 'maintenance' && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-foreground-tertiary">CPU</span>
                                <span>{prover.cpuUsage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-background-secondary">
                                <div
                                  className={cn('h-2 rounded-full', getUsageColor(prover.cpuUsage))}
                                  style={{ width: `${prover.cpuUsage}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="mb-1 flex justify-between text-xs">
                                <span className="text-foreground-tertiary">Memory</span>
                                <span>{prover.memoryUsage}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-background-secondary">
                                <div
                                  className={cn('h-2 rounded-full', getUsageColor(prover.memoryUsage))}
                                  style={{ width: `${prover.memoryUsage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {prover.proofsGenerated.toLocaleString()} proofs
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {prover.lastHealthCheck}
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
                  {selectedProver ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold">{selectedProver.type.toUpperCase()}</Badge>
                        {getStatusBadge(selectedProver.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.name')}</div>
                        <div className="font-medium text-foreground">{selectedProver.name}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.region')}</div>
                        <div className="text-sm">{selectedProver.region}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.proofsGenerated')}</div>
                          <div className="text-lg font-bold text-foreground">
                            {selectedProver.proofsGenerated.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.avgProofTime')}</div>
                          <div className="text-lg font-bold text-foreground">{selectedProver.avgProofTime}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.uptime')}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-success">{selectedProver.uptime}</span>
                          <Badge variant="success" size="sm">{t('detail.healthy')}</Badge>
                        </div>
                      </div>

                      {selectedProver.status !== 'maintenance' && (
                        <div className="space-y-3 border-t border-surface-tertiary pt-4">
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-foreground-tertiary">{t('detail.cpuUsage')}</span>
                              <span className={cn(
                                selectedProver.cpuUsage >= 90 ? 'text-danger' :
                                selectedProver.cpuUsage >= 70 ? 'text-warning' : 'text-success'
                              )}>{selectedProver.cpuUsage}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(selectedProver.cpuUsage))}
                                style={{ width: `${selectedProver.cpuUsage}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-foreground-tertiary">{t('detail.memoryUsage')}</span>
                              <span className={cn(
                                selectedProver.memoryUsage >= 90 ? 'text-danger' :
                                selectedProver.memoryUsage >= 70 ? 'text-warning' : 'text-success'
                              )}>{selectedProver.memoryUsage}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-2 rounded-full', getUsageColor(selectedProver.memoryUsage))}
                                style={{ width: `${selectedProver.memoryUsage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Activity className="h-4 w-4" />}>
                          {t('detail.actions.viewLogs')}
                        </Button>
                        <Button size="sm" className="flex-1" leftIcon={<Server className="h-4 w-4" />}>
                          {t('detail.actions.manage')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Cpu className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectProver')}</p>
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
