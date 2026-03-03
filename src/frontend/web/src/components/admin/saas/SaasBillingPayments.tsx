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
  Clock,
  AlertTriangle,
  Download,
  Eye,
  DollarSign,
  Building2,
  Calendar,
  Send,
  XCircle,
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
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'info' }: StatCardProps) {
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

interface Payment {
  id: string;
  invoiceId: string;
  companyName: string;
  plan: 'starter' | 'business' | 'enterprise';
  amount: string;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  dueDate: string;
  paidDate?: string;
  paymentMethod: string;
}

export function SaasBillingPayments() {
  const t = useTranslations('admin.billingPayments');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'overdue' | 'paid' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const SAMPLE_PAYMENTS: Payment[] = [
    {
      id: 'pay-001',
      invoiceId: 'INV-2026-001',
      companyName: 'Global Finance Corp.',
      plan: 'enterprise',
      amount: '$10,000',
      status: 'paid',
      dueDate: '2026-01-15',
      paidDate: '2026-01-12',
      paymentMethod: 'Wire Transfer',
    },
    {
      id: 'pay-002',
      invoiceId: 'INV-2026-002',
      companyName: 'Tech Innovations Ltd.',
      plan: 'business',
      amount: '$3,000',
      status: 'pending',
      dueDate: '2026-01-20',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'pay-003',
      invoiceId: 'INV-2026-003',
      companyName: 'Digital Assets Inc.',
      plan: 'enterprise',
      amount: '$15,000',
      status: 'overdue',
      dueDate: '2026-01-10',
      paymentMethod: 'Wire Transfer',
    },
    {
      id: 'pay-004',
      invoiceId: 'INV-2026-004',
      companyName: 'Crypto Startup AG',
      plan: 'starter',
      amount: '$800',
      status: 'paid',
      dueDate: '2026-01-18',
      paidDate: '2026-01-17',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'pay-005',
      invoiceId: 'INV-2026-005',
      companyName: 'Alpha Trading Co.',
      plan: 'business',
      amount: '$3,000',
      status: 'failed',
      dueDate: '2026-01-14',
      paymentMethod: 'Credit Card',
    },
    {
      id: 'pay-006',
      invoiceId: 'INV-2026-006',
      companyName: 'Beta Holdings Ltd.',
      plan: 'enterprise',
      amount: '$12,000',
      status: 'pending',
      dueDate: '2026-01-25',
      paymentMethod: 'Wire Transfer',
    },
  ];

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: SAMPLE_PAYMENTS.length },
    { key: 'pending', label: t('tabs.pending'), count: SAMPLE_PAYMENTS.filter(p => p.status === 'pending').length },
    { key: 'overdue', label: t('tabs.overdue'), count: SAMPLE_PAYMENTS.filter(p => p.status === 'overdue').length },
    { key: 'paid', label: t('tabs.paid'), count: SAMPLE_PAYMENTS.filter(p => p.status === 'paid').length },
    { key: 'failed', label: t('tabs.failed'), count: SAMPLE_PAYMENTS.filter(p => p.status === 'failed').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">{t('status.paid')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'overdue':
        return <Badge variant="danger">{t('status.overdue')}</Badge>;
      case 'failed':
        return <Badge variant="danger">{t('status.failed')}</Badge>;
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'starter':
        return <Badge variant="default">Starter</Badge>;
      case 'business':
        return <Badge variant="gold">Business</Badge>;
      case 'enterprise':
        return <Badge variant="success">Enterprise</Badge>;
      default:
        return null;
    }
  };

  const filteredPayments = SAMPLE_PAYMENTS.filter((payment) => {
    const matchesSearch =
      payment.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || payment.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPaid = SAMPLE_PAYMENTS.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);
  const totalPending = SAMPLE_PAYMENTS.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);
  const totalOverdue = SAMPLE_PAYMENTS.filter(p => p.status === 'overdue').reduce((sum, p) => sum + parseFloat(p.amount.replace(/[$,]/g, '')), 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-foreground-tertiary" aria-label="Breadcrumb">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/saas/billing" className="hover:text-foreground">
                {t('breadcrumb.billing')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </nav>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                {t('exportReport')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalPayments')}
              value={String(SAMPLE_PAYMENTS.length)}
              icon={<CreditCard className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.collectedThisMonth')}
              value={`$${totalPaid.toLocaleString()}`}
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.pendingPayments')}
              value={`$${totalPending.toLocaleString()}`}
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.overdueAmount')}
              value={`$${totalOverdue.toLocaleString()}`}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.collectionRate')}
              value="94.2%"
              icon={<DollarSign className="h-5 w-5" />}
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
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          {/* Payments List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('listTitle')}</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                  {t('filter')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.invoiceId')}</th>
                      <th className="pb-3 font-medium">{t('table.company')}</th>
                      <th className="pb-3 font-medium">{t('table.plan')}</th>
                      <th className="pb-3 font-medium">{t('table.amount')}</th>
                      <th className="pb-3 font-medium">{t('table.dueDate')}</th>
                      <th className="pb-3 font-medium">{t('table.status')}</th>
                      <th className="pb-3 font-medium">{t('table.paymentMethod')}</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className={cn(
                          'border-b border-surface-tertiary/50',
                          payment.status === 'overdue' && 'bg-danger/5',
                          payment.status === 'failed' && 'bg-danger/5'
                        )}
                      >
                        <td className="py-4">
                          <span className="font-mono text-sm">{payment.invoiceId}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-secondary">
                              <Building2 className="h-4 w-4 text-foreground-tertiary" />
                            </div>
                            <span className="font-medium">{payment.companyName}</span>
                          </div>
                        </td>
                        <td className="py-4">{getPlanBadge(payment.plan)}</td>
                        <td className="py-4">
                          <span className="font-mono font-medium">{payment.amount}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-foreground-tertiary" />
                            {payment.dueDate}
                          </div>
                          {payment.paidDate && (
                            <div className="mt-1 text-xs text-success">
                              {t('paidOn', { date: payment.paidDate })}
                            </div>
                          )}
                        </td>
                        <td className="py-4">{getStatusBadge(payment.status)}</td>
                        <td className="py-4">
                          <span className="text-sm text-foreground-secondary">{payment.paymentMethod}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === 'overdue' && (
                              <Button variant="outline" size="sm" leftIcon={<Send className="h-4 w-4" />}>
                                {t('sendReminder')}
                              </Button>
                            )}
                            {payment.status === 'failed' && (
                              <Button size="sm" leftIcon={<CreditCard className="h-4 w-4" />}>
                                {t('retry')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredPayments.length === 0 && (
                <div className="py-12 text-center text-foreground-tertiary">
                  <CreditCard className="mx-auto h-12 w-12" />
                  <p className="mt-2">{t('noPayments')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
