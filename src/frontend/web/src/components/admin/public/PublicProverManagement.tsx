'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Wallet,
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
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, icon, status = 'success' }: StatCardProps) {
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
const SAMPLE_PROVERS = [
  {
    id: 'prover-001',
    operator: 'Alpha Node Labs',
    address: '0x7a3f...9c2d',
    status: 'active',
    stake: '50,000 QS',
    sla: 99.98,
    signatures24h: 1234,
    lastActive: '2分前',
  },
  {
    id: 'prover-002',
    operator: 'Beta Validators',
    address: '0x3b1c...f8a7',
    status: 'active',
    stake: '45,000 QS',
    sla: 99.95,
    signatures24h: 1189,
    lastActive: '5分前',
  },
  {
    id: 'prover-003',
    operator: 'Gamma Security',
    address: '0x9d2e...1f4b',
    status: 'slaWarning',
    stake: '40,000 QS',
    sla: 98.5,
    signatures24h: 892,
    lastActive: '12分前',
  },
  {
    id: 'prover-004',
    operator: 'Delta Network',
    address: '0x5e8f...2a3c',
    status: 'active',
    stake: '55,000 QS',
    sla: 99.92,
    signatures24h: 1456,
    lastActive: '1分前',
  },
  {
    id: 'prover-005',
    operator: 'Epsilon Infra',
    address: '0x1d4a...7b9e',
    status: 'pending',
    stake: '50,000 QS',
    sla: 0,
    signatures24h: 0,
    lastActive: '-',
  },
];

const SAMPLE_APPLICATIONS = [
  {
    id: 'app-001',
    operator: 'Zeta Validators',
    address: '0x8c5d...3e2f',
    stake: '50,000 QS',
    appliedAt: '2026-01-17 14:32',
    status: 'pending',
  },
  {
    id: 'app-002',
    operator: 'Eta Security',
    address: '0x2f7a...9d1c',
    stake: '60,000 QS',
    appliedAt: '2026-01-16 09:15',
    status: 'pending',
  },
  {
    id: 'app-003',
    operator: 'Theta Network',
    address: '0x4e9b...8a3d',
    stake: '55,000 QS',
    appliedAt: '2026-01-15 18:42',
    status: 'pending',
  },
];

export function PublicProverManagement() {
  const t = useTranslations('admin.publicProvers');
  const [activeTab, setActiveTab] = useState<'all' | 'applications' | 'performance' | 'slashing'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_PROVERS.length },
    { key: 'applications', label: t('tabs.applications'), count: SAMPLE_APPLICATIONS.length },
    { key: 'performance', label: t('tabs.performance') },
    { key: 'slashing', label: t('tabs.slashing') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'slaWarning':
        return <Badge variant="danger">{t('status.slaWarning')}</Badge>;
      case 'suspended':
        return <Badge variant="default">{t('status.suspended')}</Badge>;
      default:
        return null;
    }
  };

  const filteredProvers = SAMPLE_PROVERS.filter(
    (prover) =>
      prover.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prover.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
              <span className="text-foreground">Prover Management</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalProvers')}
              value="127"
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeProvers')}
              value="124"
              subValue="97.6%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalStake')}
              value="6.35M QS"
              icon={<Wallet className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgSla')}
              value="99.87%"
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.pendingApplications')}
              value="3"
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
                {tab.count !== undefined && (
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* All Provers Tab */}
          {activeTab === 'all' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Prover List</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                    Filter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('table.columns.proverId')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.operator')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.stake')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.sla')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.signatures')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.lastActive')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProvers.map((prover) => (
                        <tr
                          key={prover.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <span className="font-mono text-sm">{prover.id}</span>
                          </td>
                          <td className="py-4">
                            <div>
                              <div className="font-medium text-foreground">{prover.operator}</div>
                              <div className="font-mono text-xs text-foreground-tertiary">
                                {prover.address}
                              </div>
                            </div>
                          </td>
                          <td className="py-4">{getStatusBadge(prover.status)}</td>
                          <td className="py-4">
                            <span className="font-mono">{prover.stake}</span>
                          </td>
                          <td className="py-4">
                            <span
                              className={cn(
                                'font-mono',
                                prover.sla >= 99.5 && 'text-success',
                                prover.sla < 99.5 && prover.sla >= 98 && 'text-warning',
                                prover.sla < 98 && 'text-danger'
                              )}
                            >
                              {prover.sla > 0 ? `${prover.sla}%` : '-'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">
                              {prover.signatures24h > 0 ? prover.signatures24h.toLocaleString() : '-'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">
                              {prover.lastActive}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/public/provers/${prover.id}`}
                              className="text-gold hover:underline"
                            >
                              {t('applications.review')}
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

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('applications.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_APPLICATIONS.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                          <Shield className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{app.operator}</div>
                          <div className="font-mono text-xs text-foreground-tertiary">
                            {app.address}
                          </div>
                          <div className="mt-1 text-xs text-foreground-secondary">
                            Stake: {app.stake} | Applied: {app.appliedAt}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<XCircle className="h-4 w-4" />}
                        >
                          {t('applications.reject')}
                        </Button>
                        <Button size="sm" leftIcon={<CheckCircle className="h-4 w-4" />}>
                          {t('applications.approve')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <TrendingUp className="mx-auto h-12 w-12" />
                    <p className="mt-2">Performance charts will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slashing Tab */}
          {activeTab === 'slashing' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Slashing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <AlertTriangle className="mx-auto h-12 w-12" />
                    <p className="mt-2">No slashing events recorded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
