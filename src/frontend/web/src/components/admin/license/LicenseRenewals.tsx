'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Mail,
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
const mockRenewals = [
  {
    id: 'renewal-001',
    companyId: 'company-001',
    companyName: 'Global Finance Corp',
    currentPlan: 'Enterprise',
    licenseEnd: '2026-02-15',
    daysRemaining: 28,
    renewalStatus: 'pending',
    proposedPlan: 'Enterprise',
    contactEmail: 'legal@globalfinance.com',
    lastContact: '2026-01-10',
    notes: 'Interested in multi-year discount',
  },
  {
    id: 'renewal-002',
    companyId: 'company-002',
    companyName: 'Asian Banking Group',
    currentPlan: 'Enterprise',
    licenseEnd: '2026-03-01',
    daysRemaining: 42,
    renewalStatus: 'negotiating',
    proposedPlan: 'Enterprise Plus',
    contactEmail: 'procurement@abg.asia',
    lastContact: '2026-01-15',
    notes: 'Discussing upgrade options',
  },
  {
    id: 'renewal-003',
    companyId: 'company-003',
    companyName: 'Euro Securities Ltd',
    currentPlan: 'Professional',
    licenseEnd: '2026-01-31',
    daysRemaining: 13,
    renewalStatus: 'urgent',
    proposedPlan: 'Professional',
    contactEmail: 'it@eurosec.eu',
    lastContact: '2026-01-05',
    notes: 'Needs contract approval from board',
  },
  {
    id: 'renewal-004',
    companyId: 'company-004',
    companyName: 'Nordic Crypto Exchange',
    currentPlan: 'Professional',
    licenseEnd: '2026-04-15',
    daysRemaining: 87,
    renewalStatus: 'scheduled',
    proposedPlan: 'Enterprise',
    contactEmail: 'ops@nordiccrypto.no',
    lastContact: null,
    notes: 'First contact scheduled for Feb',
  },
  {
    id: 'renewal-005',
    companyId: 'company-005',
    companyName: 'South American Fintech',
    currentPlan: 'Enterprise',
    licenseEnd: '2026-02-28',
    daysRemaining: 41,
    renewalStatus: 'confirmed',
    proposedPlan: 'Enterprise',
    contactEmail: 'cto@safintech.br',
    lastContact: '2026-01-12',
    notes: 'Renewal confirmed, awaiting signature',
  },
];

const mockMetrics = {
  upcomingRenewals: 5,
  urgentRenewals: 1,
  confirmedRenewals: 1,
  renewalRate: 94,
  totalValue: '¥125,000,000',
};

export function LicenseRenewals() {
  const t = useTranslations('admin.licenseRenewals');
  const [activeTab, setActiveTab] = useState<'all' | 'urgent' | 'negotiating' | 'confirmed'>('all');
  const [selectedRenewal, setSelectedRenewal] = useState<typeof mockRenewals[0] | null>(mockRenewals[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockRenewals.length },
    { key: 'urgent', label: t('tabs.urgent'), count: mockRenewals.filter(r => r.renewalStatus === 'urgent').length },
    { key: 'negotiating', label: t('tabs.negotiating'), count: mockRenewals.filter(r => r.renewalStatus === 'negotiating').length },
    { key: 'confirmed', label: t('tabs.confirmed'), count: mockRenewals.filter(r => r.renewalStatus === 'confirmed').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">{t('status.confirmed')}</Badge>;
      case 'negotiating':
        return <Badge variant="gold">{t('status.negotiating')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'urgent':
        return <Badge variant="danger">{t('status.urgent')}</Badge>;
      case 'scheduled':
        return <Badge variant="default">{t('status.scheduled')}</Badge>;
      default:
        return null;
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days <= 14) return 'text-danger';
    if (days <= 30) return 'text-warning';
    return 'text-success';
  };

  const filteredRenewals = mockRenewals.filter((renewal) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'urgent') return renewal.renewalStatus === 'urgent';
    if (activeTab === 'negotiating') return renewal.renewalStatus === 'negotiating';
    if (activeTab === 'confirmed') return renewal.renewalStatus === 'confirmed';
    return true;
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
              <Link href="/admin/license/companies" className="hover:text-foreground">
                License
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
              label={t('stats.upcomingRenewals')}
              value={String(mockMetrics.upcomingRenewals)}
              subValue={t('stats.next90Days')}
              icon={<Calendar className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.urgentRenewals')}
              value={String(mockMetrics.urgentRenewals)}
              subValue={t('stats.within14Days')}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.confirmedRenewals')}
              value={String(mockMetrics.confirmedRenewals)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.renewalRate')}
              value={`${mockMetrics.renewalRate}%`}
              icon={<RefreshCw className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalValue')}
              value={mockMetrics.totalValue}
              icon={<FileText className="h-5 w-5" />}
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
            {/* Renewals List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('renewalList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredRenewals.map((renewal) => (
                      <div
                        key={renewal.id}
                        onClick={() => setSelectedRenewal(renewal)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedRenewal?.id === renewal.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <Building2 className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{renewal.companyName}</div>
                              <div className="text-xs text-foreground-tertiary">
                                {renewal.currentPlan} License
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(renewal.renewalStatus)}
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-foreground-tertiary" />
                            <span>{renewal.licenseEnd}</span>
                          </div>
                          <div className={cn('flex items-center gap-1 font-medium', getDaysRemainingColor(renewal.daysRemaining))}>
                            <Clock className="h-4 w-4" />
                            <span>{t('renewalList.daysRemaining', { days: renewal.daysRemaining })}</span>
                          </div>
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
                  {selectedRenewal ? (
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.company')}</div>
                        <Link
                          href={`/admin/license/companies/${selectedRenewal.companyId}`}
                          className="font-medium text-gold hover:underline"
                        >
                          {selectedRenewal.companyName}
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.currentPlan')}</div>
                          <Badge variant="default">{selectedRenewal.currentPlan}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.proposedPlan')}</div>
                          <Badge variant="gold">{selectedRenewal.proposedPlan}</Badge>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.licenseEnd')}</div>
                        <div className="text-sm">{selectedRenewal.licenseEnd}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.daysRemaining')}</div>
                        <div className={cn('text-lg font-bold', getDaysRemainingColor(selectedRenewal.daysRemaining))}>
                          {selectedRenewal.daysRemaining} {t('detail.days')}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.status')}</div>
                        <div className="mt-1">{getStatusBadge(selectedRenewal.renewalStatus)}</div>
                      </div>

                      <div className="border-t border-surface-tertiary pt-4">
                        <div className="text-xs text-foreground-tertiary">{t('detail.contact')}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-foreground-tertiary" />
                          <a
                            href={`mailto:${selectedRenewal.contactEmail}`}
                            className="text-sm text-gold hover:underline"
                          >
                            {selectedRenewal.contactEmail}
                          </a>
                        </div>
                      </div>

                      {selectedRenewal.lastContact && (
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.lastContact')}</div>
                          <div className="text-sm">{selectedRenewal.lastContact}</div>
                        </div>
                      )}

                      {selectedRenewal.notes && (
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.notes')}</div>
                          <div className="mt-1 rounded-lg bg-background-secondary p-3 text-sm">
                            {selectedRenewal.notes}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" size="sm" className="flex-1" leftIcon={<Mail className="h-4 w-4" />}>
                          {t('detail.actions.sendReminder')}
                        </Button>
                        <Button size="sm" className="flex-1" leftIcon={<FileText className="h-4 w-4" />}>
                          {t('detail.actions.generateQuote')}
                        </Button>
                      </div>

                      {selectedRenewal.renewalStatus === 'confirmed' && (
                        <Button className="w-full" leftIcon={<CheckCircle className="h-4 w-4" />}>
                          {t('detail.actions.processRenewal')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <RefreshCw className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectRenewal')}</p>
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
