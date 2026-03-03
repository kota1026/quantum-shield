'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertTriangle,
  Download,
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
const SAMPLE_INVOICES = [
  {
    id: 'inv-2026-001',
    operator: 'Acme Exchange',
    plan: 'enterprise',
    amount: '$15,000',
    period: '2026/01',
    status: 'paid',
    paidAt: '2026-01-05',
  },
  {
    id: 'inv-2026-002',
    operator: 'Beta Financial',
    plan: 'business',
    amount: '$8,000',
    period: '2026/01',
    status: 'paid',
    paidAt: '2026-01-03',
  },
  {
    id: 'inv-2026-003',
    operator: 'Gamma Custody',
    plan: 'enterprise',
    amount: '$25,000',
    period: '2026/01',
    status: 'pending',
    paidAt: '-',
  },
  {
    id: 'inv-2026-004',
    operator: 'Delta Trading',
    plan: 'starter',
    amount: '$2,500',
    period: '2026/01',
    status: 'overdue',
    paidAt: '-',
  },
];

const SAMPLE_SUBSCRIPTIONS = [
  {
    id: 'sub-001',
    operator: 'Acme Exchange',
    plan: 'enterprise',
    mrr: '$15,000',
    startDate: '2024-01-15',
    renewalDate: '2027-01-15',
    status: 'active',
  },
  {
    id: 'sub-002',
    operator: 'Beta Financial',
    plan: 'business',
    mrr: '$8,000',
    startDate: '2024-08-20',
    renewalDate: '2026-08-20',
    status: 'active',
  },
  {
    id: 'sub-003',
    operator: 'Gamma Custody',
    plan: 'enterprise',
    mrr: '$25,000',
    startDate: '2025-03-10',
    renewalDate: '2027-03-10',
    status: 'active',
  },
  {
    id: 'sub-004',
    operator: 'Delta Trading',
    plan: 'starter',
    mrr: '$2,500',
    startDate: '2025-06-30',
    renewalDate: '2026-06-30',
    status: 'expiring',
  },
];

export function SaasBillingManagement() {
  const t = useTranslations('admin.saasBilling');
  const [activeTab, setActiveTab] = useState<'invoices' | 'subscriptions' | 'revenue' | 'reports'>('invoices');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'invoices', label: t('tabs.invoices'), count: SAMPLE_INVOICES.length },
    { key: 'subscriptions', label: t('tabs.subscriptions'), count: SAMPLE_SUBSCRIPTIONS.length },
    { key: 'revenue', label: t('tabs.revenue') },
    { key: 'reports', label: t('tabs.reports') },
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
      case 'paid':
        return <Badge variant="success">{t('status.paid')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'overdue':
        return <Badge variant="danger">{t('status.overdue')}</Badge>;
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'expiring':
        return <Badge variant="warning">{t('status.expiring')}</Badge>;
      case 'cancelled':
        return <Badge variant="default">{t('status.cancelled')}</Badge>;
      default:
        return null;
    }
  };

  const filteredInvoices = SAMPLE_INVOICES.filter(
    (inv) => inv.operator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubscriptions = SAMPLE_SUBSCRIPTIONS.filter(
    (sub) => sub.operator.toLowerCase().includes(searchQuery.toLowerCase())
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
              <span className="text-foreground">Billing Management</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<Download className="h-4 w-4" />}>
                Export Report
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.mrr')}
              value="$1.8M"
              subValue="+12% MoM"
              icon={<DollarSign className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.arr')}
              value="$21.6M"
              icon={<TrendingUp className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.pendingInvoices')}
              value="2"
              subValue="$27,500"
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.overdueInvoices')}
              value="1"
              subValue="$2,500"
              icon={<AlertTriangle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.collectionRate')}
              value="98.2%"
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
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

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('invoices.title')}</CardTitle>
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
                        <th className="pb-3 font-medium">{t('invoices.columns.invoiceId')}</th>
                        <th className="pb-3 font-medium">{t('invoices.columns.operator')}</th>
                        <th className="pb-3 font-medium">{t('invoices.columns.plan')}</th>
                        <th className="pb-3 font-medium">{t('invoices.columns.amount')}</th>
                        <th className="pb-3 font-medium">{t('invoices.columns.period')}</th>
                        <th className="pb-3 font-medium">{t('invoices.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('invoices.columns.paidAt')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <span className="font-mono text-sm">{inv.id}</span>
                          </td>
                          <td className="py-4">
                            <span className="font-medium text-foreground">{inv.operator}</span>
                          </td>
                          <td className="py-4">{getPlanBadge(inv.plan)}</td>
                          <td className="py-4">
                            <span className="font-mono font-medium">{inv.amount}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">{inv.period}</span>
                          </td>
                          <td className="py-4">{getStatusBadge(inv.status)}</td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">{inv.paidAt}</span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/saas/billing/${inv.id}`}
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

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('subscriptions.title')}</CardTitle>
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
                        <th className="pb-3 font-medium">{t('subscriptions.columns.operator')}</th>
                        <th className="pb-3 font-medium">{t('subscriptions.columns.plan')}</th>
                        <th className="pb-3 font-medium">{t('subscriptions.columns.mrr')}</th>
                        <th className="pb-3 font-medium">{t('subscriptions.columns.startDate')}</th>
                        <th className="pb-3 font-medium">{t('subscriptions.columns.renewalDate')}</th>
                        <th className="pb-3 font-medium">{t('subscriptions.columns.status')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubscriptions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <span className="font-medium text-foreground">{sub.operator}</span>
                          </td>
                          <td className="py-4">{getPlanBadge(sub.plan)}</td>
                          <td className="py-4">
                            <span className="font-mono font-medium">{sub.mrr}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">{sub.startDate}</span>
                          </td>
                          <td className="py-4">
                            <span className="text-sm text-foreground-secondary">{sub.renewalDate}</span>
                          </td>
                          <td className="py-4">{getStatusBadge(sub.status)}</td>
                          <td className="py-4">
                            <Link
                              href={`/admin/saas/subscriptions/${sub.id}`}
                              className="text-gold hover:underline"
                            >
                              Manage
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

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('revenue.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <TrendingUp className="mx-auto h-12 w-12" />
                    <p className="mt-2">Revenue analytics charts will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('reports.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                        <Receipt className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Monthly Revenue Report</div>
                        <div className="text-xs text-foreground-tertiary">
                          Generated: 2026-01-01
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                        <CreditCard className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Subscription Analytics</div>
                        <div className="text-xs text-foreground-tertiary">
                          Generated: 2026-01-01
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                      Download
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                        <AlertTriangle className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Overdue Invoices Report</div>
                        <div className="text-xs text-foreground-tertiary">
                          Generated: 2026-01-15
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                      Download
                    </Button>
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
