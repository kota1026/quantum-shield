'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type PaymentStatus = 'paid' | 'pending' | 'overdue';

interface Invoice {
  id: string;
  licenseeId: string;
  licensee: string;
  amount: number;
  period: string;
  dueDate: string;
  status: PaymentStatus;
  paidDate?: string;
}

interface RevenueData {
  month: string;
  revenue: number;
}

// Demo data
const INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    licenseeId: 'lic-001',
    licensee: 'Tokyo Financial Group',
    amount: 50000,
    period: '2026-01',
    dueDate: '2026-02-01',
    status: 'pending',
  },
  {
    id: 'inv-002',
    licenseeId: 'lic-002',
    licensee: 'Singapore Quantum Labs',
    amount: 15000,
    period: '2026-01',
    dueDate: '2026-02-01',
    status: 'pending',
  },
  {
    id: 'inv-003',
    licenseeId: 'lic-003',
    licensee: 'EU Crypto Holdings',
    amount: 75000,
    period: '2025-12',
    dueDate: '2026-01-01',
    status: 'overdue',
  },
  {
    id: 'inv-004',
    licenseeId: 'lic-001',
    licensee: 'Tokyo Financial Group',
    amount: 50000,
    period: '2025-12',
    dueDate: '2026-01-01',
    status: 'paid',
    paidDate: '2025-12-28',
  },
  {
    id: 'inv-005',
    licenseeId: 'lic-002',
    licensee: 'Singapore Quantum Labs',
    amount: 15000,
    period: '2025-12',
    dueDate: '2026-01-01',
    status: 'paid',
    paidDate: '2025-12-30',
  },
];

const REVENUE_DATA: RevenueData[] = [
  { month: '2025-07', revenue: 95000 },
  { month: '2025-08', revenue: 110000 },
  { month: '2025-09', revenue: 125000 },
  { month: '2025-10', revenue: 140000 },
  { month: '2025-11', revenue: 155000 },
  { month: '2025-12', revenue: 140000 },
];

function StatusBadge({ status }: { status: PaymentStatus }) {
  const t = useTranslations('admin.billing');

  const config = {
    paid: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
    pending: { color: 'bg-warning/10 text-warning', icon: Clock },
    overdue: { color: 'bg-danger/10 text-danger', icon: AlertTriangle },
  };

  const { color, icon: Icon } = config[status];

  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" />
      {t(`status.${status}`)}
    </Badge>
  );
}

export function AdminBilling() {
  const t = useTranslations('admin.billing');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'invoices'>('overview');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  const filteredInvoices = INVOICES.filter((invoice) => {
    return statusFilter === 'all' || invoice.status === statusFilter;
  });

  const stats = {
    monthlyRevenue: 140000,
    yearlyRevenue: 1450000,
    pendingPayments: INVOICES.filter((i) => i.status === 'pending').reduce(
      (sum, i) => sum + i.amount,
      0
    ),
    overduePayments: INVOICES.filter((i) => i.status === 'overdue').reduce(
      (sum, i) => sum + i.amount,
      0
    ),
  };

  const maxRevenue = Math.max(...REVENUE_DATA.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <DollarSign className="h-4 w-4" />
            {t('stats.monthlyRevenue')}
          </div>
          <div className="mt-1 text-2xl font-bold text-gold">
            ${stats.monthlyRevenue.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-success">
            <TrendingUp className="h-3 w-3" />
            +12% {t('stats.vsLastMonth')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <Calendar className="h-4 w-4" />
            {t('stats.yearlyRevenue')}
          </div>
          <div className="mt-1 text-2xl font-bold">
            ${stats.yearlyRevenue.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <Clock className="h-4 w-4" />
            {t('stats.pendingPayments')}
          </div>
          <div className="mt-1 text-2xl font-bold text-warning">
            ${stats.pendingPayments.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
            <AlertTriangle className="h-4 w-4" />
            {t('stats.overduePayments')}
          </div>
          <div className="mt-1 text-2xl font-bold text-danger">
            ${stats.overduePayments.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setSelectedTab('overview')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-colors',
            selectedTab === 'overview'
              ? 'border-gold text-gold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          <TrendingUp className="h-4 w-4" />
          {t('tabs.overview')}
        </button>
        <button
          onClick={() => setSelectedTab('invoices')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-colors',
            selectedTab === 'invoices'
              ? 'border-gold text-gold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          <FileText className="h-4 w-4" />
          {t('tabs.invoices')}
        </button>
      </div>

      {selectedTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                {t('revenueChart.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-48">
                {REVENUE_DATA.map((data) => (
                  <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gold/20 rounded-t-lg transition-all hover:bg-gold/30"
                      style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                    />
                    <div className="text-xs text-foreground-tertiary">
                      {data.month.split('-')[1]}月
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue by Licensee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('revenueByLicensee.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'EU Crypto Holdings', amount: 75000, percentage: 54 },
                  { name: 'Tokyo Financial Group', amount: 50000, percentage: 36 },
                  { name: 'Singapore Quantum Labs', amount: 15000, percentage: 10 },
                ].map((licensee) => (
                  <div key={licensee.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{licensee.name}</span>
                      <span className="font-mono">${licensee.amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface">
                      <div
                        className="h-full rounded-full bg-gold transition-all"
                        style={{ width: `${licensee.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('paymentMethods.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-foreground-tertiary" />
                    <div>
                      <div className="font-medium">{t('paymentMethods.bankTransfer')}</div>
                      <div className="text-sm text-foreground-tertiary">
                        {t('paymentMethods.bankTransferDesc')}
                      </div>
                    </div>
                  </div>
                  <Badge>60%</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-foreground-tertiary" />
                    <div>
                      <div className="font-medium">{t('paymentMethods.crypto')}</div>
                      <div className="text-sm text-foreground-tertiary">
                        {t('paymentMethods.cryptoDesc')}
                      </div>
                    </div>
                  </div>
                  <Badge>40%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'invoices' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gold" />
                {t('invoices.title')}
              </CardTitle>
              <div className="flex gap-2">
                {(['all', 'pending', 'overdue', 'paid'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      statusFilter === status
                        ? 'bg-gold text-background'
                        : 'bg-surface text-foreground-secondary hover:text-foreground'
                    )}
                  >
                    {t(`filters.${status}`)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" aria-label={t('invoices.tableAriaLabel')}>
                <thead>
                  <tr className="border-b border-border text-left text-sm text-foreground-tertiary">
                    <th className="pb-3 font-medium">{t('invoices.table.invoice')}</th>
                    <th className="pb-3 font-medium">{t('invoices.table.licensee')}</th>
                    <th className="pb-3 font-medium">{t('invoices.table.period')}</th>
                    <th className="pb-3 font-medium">{t('invoices.table.amount')}</th>
                    <th className="pb-3 font-medium">{t('invoices.table.dueDate')}</th>
                    <th className="pb-3 font-medium">{t('invoices.table.status')}</th>
                    <th className="pb-3 font-medium">{t('invoices.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="group hover:bg-surface/50">
                      <td className="py-4 font-mono text-sm">{invoice.id}</td>
                      <td className="py-4">
                        <Link
                          href={`/admin/licensees/${invoice.licenseeId}`}
                          className="flex items-center gap-2 text-gold hover:underline"
                        >
                          <Building2 className="h-4 w-4" />
                          {invoice.licensee}
                        </Link>
                      </td>
                      <td className="py-4 text-sm">{invoice.period}</td>
                      <td className="py-4 font-mono font-medium">
                        ${invoice.amount.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm">{invoice.dueDate}</td>
                      <td className="py-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="py-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button variant="outline" size="sm">
                              {t('invoices.sendReminder')}
                            </Button>
                          )}
                        </div>
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
  );
}

export default AdminBilling;
