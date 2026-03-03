'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Wallet,
  CreditCard,
  Plus,
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
const SAMPLE_OPERATORS = [
  {
    id: 'op-001',
    company: 'Acme Exchange',
    plan: 'enterprise',
    status: 'active',
    endUsers: 5234,
    tvl: '$45.2M',
    mrr: '$15,000',
    contractEnd: '2027-01-15',
  },
  {
    id: 'op-002',
    company: 'Beta Financial',
    plan: 'business',
    status: 'active',
    endUsers: 2156,
    tvl: '$23.8M',
    mrr: '$8,000',
    contractEnd: '2026-08-20',
  },
  {
    id: 'op-003',
    company: 'Gamma Custody',
    plan: 'enterprise',
    status: 'active',
    endUsers: 8421,
    tvl: '$78.5M',
    mrr: '$25,000',
    contractEnd: '2027-03-10',
  },
  {
    id: 'op-004',
    company: 'Delta Trading',
    plan: 'starter',
    status: 'active',
    endUsers: 892,
    tvl: '$5.2M',
    mrr: '$2,500',
    contractEnd: '2026-06-30',
  },
  {
    id: 'op-005',
    company: 'Epsilon Bank',
    plan: 'enterprise',
    status: 'pending',
    endUsers: 0,
    tvl: '$0',
    mrr: '$0',
    contractEnd: '-',
  },
];

const SAMPLE_APPLICATIONS = [
  {
    id: 'app-001',
    company: 'Zeta Holdings',
    contactEmail: 'contact@zeta.com',
    plan: 'business',
    expectedUsers: '1,000-5,000',
    appliedAt: '2026-01-17 10:32',
    status: 'pending',
  },
  {
    id: 'app-002',
    company: 'Eta Securities',
    contactEmail: 'info@eta-sec.com',
    plan: 'enterprise',
    expectedUsers: '10,000+',
    appliedAt: '2026-01-16 14:15',
    status: 'pending',
  },
];

export function SaasOperatorManagement() {
  const t = useTranslations('admin.saasOperators');
  const [activeTab, setActiveTab] = useState<'all' | 'applications' | 'contracts'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_OPERATORS.length },
    { key: 'applications', label: t('tabs.applications'), count: SAMPLE_APPLICATIONS.length },
    { key: 'contracts', label: t('tabs.contracts') },
  ];

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return <Badge variant="success">{t('plans.enterprise')}</Badge>;
      case 'business':
        return <Badge variant="warning">{t('plans.business')}</Badge>;
      case 'starter':
        return <Badge variant="default">{t('plans.starter')}</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'suspended':
        return <Badge variant="danger">{t('status.suspended')}</Badge>;
      case 'churned':
        return <Badge variant="default">{t('status.churned')}</Badge>;
      default:
        return null;
    }
  };

  const filteredOperators = SAMPLE_OPERATORS.filter(
    (op) => op.company.toLowerCase().includes(searchQuery.toLowerCase())
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
              <span className="text-foreground">Operator Management</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                Add Operator
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalOperators')}
              value="12"
              icon={<Building2 className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeOperators')}
              value="10"
              subValue="83.3%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.pendingApplications')}
              value="2"
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.mrr')}
              value="$1.8M"
              subValue="+12% MoM"
              icon={<CreditCard className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalEndUsers')}
              value="13,436"
              icon={<Users className="h-5 w-5" />}
              status="info"
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

          {/* All Operators Tab */}
          {activeTab === 'all' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Operator List</CardTitle>
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
                        <th className="pb-3 font-medium">{t('table.columns.company')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.plan')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.endUsers')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.tvl')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.mrr')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.contractEnd')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOperators.map((op) => (
                        <tr
                          key={op.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                                <Building2 className="h-5 w-5 text-info" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{op.company}</div>
                                <div className="font-mono text-xs text-foreground-tertiary">
                                  {op.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">{getPlanBadge(op.plan)}</td>
                          <td className="py-4">{getStatusBadge(op.status)}</td>
                          <td className="py-4">
                            <span className="font-mono">
                              {op.endUsers > 0 ? op.endUsers.toLocaleString() : '-'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">{op.tvl}</span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">{op.mrr}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">
                              {op.contractEnd}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/saas/operators/${op.id}`}
                              className="text-gold hover:underline"
                            >
                              View
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                          <Building2 className="h-6 w-6 text-info" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{app.company}</div>
                          <div className="text-xs text-foreground-tertiary">
                            {app.contactEmail}
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-foreground-secondary">
                            <span>Plan: {app.plan}</span>
                            <span>Users: {app.expectedUsers}</span>
                            <span>Applied: {app.appliedAt}</span>
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

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contract Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <CreditCard className="mx-auto h-12 w-12" />
                    <p className="mt-2">Contract management features will be displayed here</p>
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
