'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Building2,
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
  Users,
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
const mockOperatorProvers = [
  {
    id: 'op-prover-001',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    proverName: 'GFC-Prover-01',
    status: 'active',
    plan: 'Enterprise',
    dedicatedNodes: 3,
    proofsGenerated: 45632,
    avgProofTime: '2.1s',
    slaCompliance: 99.8,
    lastActivity: '1分前',
  },
  {
    id: 'op-prover-002',
    operatorId: 'op-001',
    operatorName: 'Global Finance Corp',
    proverName: 'GFC-Prover-02',
    status: 'active',
    plan: 'Enterprise',
    dedicatedNodes: 2,
    proofsGenerated: 38921,
    avgProofTime: '2.4s',
    slaCompliance: 99.5,
    lastActivity: '30秒前',
  },
  {
    id: 'op-prover-003',
    operatorId: 'op-002',
    operatorName: 'Asian Banking Group',
    proverName: 'ABG-Prover-Main',
    status: 'degraded',
    plan: 'Professional',
    dedicatedNodes: 2,
    proofsGenerated: 28456,
    avgProofTime: '3.8s',
    slaCompliance: 97.2,
    lastActivity: '2分前',
  },
  {
    id: 'op-prover-004',
    operatorId: 'op-003',
    operatorName: 'Nordic Crypto Exchange',
    proverName: 'NCE-Prover-01',
    status: 'active',
    plan: 'Professional',
    dedicatedNodes: 1,
    proofsGenerated: 15234,
    avgProofTime: '2.9s',
    slaCompliance: 99.1,
    lastActivity: '5分前',
  },
  {
    id: 'op-prover-005',
    operatorId: 'op-004',
    operatorName: 'Euro Securities Ltd',
    proverName: 'ESL-Prover-Primary',
    status: 'provisioning',
    plan: 'Enterprise',
    dedicatedNodes: 4,
    proofsGenerated: 0,
    avgProofTime: '-',
    slaCompliance: 0,
    lastActivity: '-',
  },
];

const mockMetrics = {
  totalOperatorProvers: 5,
  activeProvers: 3,
  totalDedicatedNodes: 12,
  avgSlaCompliance: '98.9%',
  totalProofs: '128,243',
};

export function SaasProverOperator() {
  const t = useTranslations('admin.saasProverOperator');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'degraded' | 'provisioning'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProver, setSelectedProver] = useState<typeof mockOperatorProvers[0] | null>(mockOperatorProvers[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockOperatorProvers.length },
    { key: 'active', label: t('tabs.active'), count: mockOperatorProvers.filter(p => p.status === 'active').length },
    { key: 'degraded', label: t('tabs.degraded'), count: mockOperatorProvers.filter(p => p.status === 'degraded').length },
    { key: 'provisioning', label: t('tabs.provisioning'), count: mockOperatorProvers.filter(p => p.status === 'provisioning').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{t('status.degraded')}</Badge>;
      case 'provisioning':
        return <Badge variant="gold">{t('status.provisioning')}</Badge>;
      case 'offline':
        return <Badge variant="danger">{t('status.offline')}</Badge>;
      default:
        return null;
    }
  };

  const getSlaColor = (sla: number) => {
    if (sla >= 99) return 'text-success';
    if (sla >= 95) return 'text-warning';
    return 'text-danger';
  };

  const filteredProvers = mockOperatorProvers.filter((prover) => {
    const matchesSearch =
      prover.proverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prover.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

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
              value={String(mockMetrics.totalOperatorProvers)}
              icon={<Server className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeProvers')}
              value={String(mockMetrics.activeProvers)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.dedicatedNodes')}
              value={String(mockMetrics.totalDedicatedNodes)}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgSlaCompliance')}
              value={mockMetrics.avgSlaCompliance}
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalProofs')}
              value={mockMetrics.totalProofs}
              trend={{ value: '+22%', direction: 'up' }}
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
                              <Server className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{prover.proverName}</div>
                              <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                                <Building2 className="h-3 w-3" />
                                {prover.operatorName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" size="sm">{prover.plan}</Badge>
                            {getStatusBadge(prover.status)}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('proverList.nodes')}</div>
                            <div className="font-medium">{prover.dedicatedNodes}</div>
                          </div>
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('proverList.proofs')}</div>
                            <div className="font-medium">{prover.proofsGenerated.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('proverList.avgTime')}</div>
                            <div className="font-medium">{prover.avgProofTime}</div>
                          </div>
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('proverList.sla')}</div>
                            <div className={cn('font-medium', getSlaColor(prover.slaCompliance))}>
                              {prover.slaCompliance > 0 ? `${prover.slaCompliance}%` : '-'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-1 text-xs text-foreground-tertiary">
                          <Clock className="h-3 w-3" />
                          {prover.lastActivity}
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
                        <Badge variant="gold">{selectedProver.plan}</Badge>
                        {getStatusBadge(selectedProver.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.proverName')}</div>
                        <div className="font-medium text-foreground">{selectedProver.proverName}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.operator')}</div>
                        <Link
                          href={`/admin/saas/operators/${selectedProver.operatorId}`}
                          className="text-sm text-gold hover:underline"
                        >
                          {selectedProver.operatorName}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.dedicatedNodes')}</div>
                          <div className="text-lg font-bold text-foreground">{selectedProver.dedicatedNodes}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.proofsGenerated')}</div>
                          <div className="text-lg font-bold text-foreground">
                            {selectedProver.proofsGenerated.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.avgProofTime')}</div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-gold" />
                          <span className="text-lg font-bold">{selectedProver.avgProofTime}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.slaCompliance')}</div>
                        <div className="flex items-center gap-3">
                          <span className={cn('text-2xl font-bold', getSlaColor(selectedProver.slaCompliance))}>
                            {selectedProver.slaCompliance > 0 ? `${selectedProver.slaCompliance}%` : '-'}
                          </span>
                          {selectedProver.slaCompliance >= 99 && (
                            <Badge variant="success" size="sm">{t('detail.slaExcellent')}</Badge>
                          )}
                          {selectedProver.slaCompliance >= 95 && selectedProver.slaCompliance < 99 && (
                            <Badge variant="warning" size="sm">{t('detail.slaBelowTarget')}</Badge>
                          )}
                        </div>
                        {selectedProver.slaCompliance > 0 && (
                          <div className="mt-2 h-2 rounded-full bg-background-secondary">
                            <div
                              className={cn(
                                'h-2 rounded-full',
                                selectedProver.slaCompliance >= 99 ? 'bg-success' :
                                selectedProver.slaCompliance >= 95 ? 'bg-warning' : 'bg-danger'
                              )}
                              style={{ width: `${selectedProver.slaCompliance}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="border-t border-surface-tertiary pt-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Activity className="h-4 w-4" />}>
                            {t('detail.actions.viewMetrics')}
                          </Button>
                          <Button size="sm" className="flex-1" leftIcon={<Server className="h-4 w-4" />}>
                            {t('detail.actions.scaleNodes')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Server className="mx-auto h-12 w-12" />
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
