'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  RefreshCw,
  Building2,
  DollarSign,
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

interface Contract {
  id: string;
  companyName: string;
  plan: 'starter' | 'business' | 'enterprise';
  status: 'active' | 'expiring' | 'expired' | 'pending_renewal';
  startDate: string;
  endDate: string;
  contractValue: string;
  autoRenew: boolean;
  documents: string[];
}

export function SaasOperatorContracts() {
  const t = useTranslations('admin.operatorContracts');
  const [activeTab, setActiveTab] = useState<'active' | 'expiring' | 'pending_renewal' | 'expired' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const SAMPLE_CONTRACTS: Contract[] = [
    {
      id: 'contract-001',
      companyName: 'Global Finance Corp.',
      plan: 'enterprise',
      status: 'active',
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      contractValue: '$120,000/年',
      autoRenew: true,
      documents: ['MSA', 'SLA', 'DPA', 'NDA'],
    },
    {
      id: 'contract-002',
      companyName: 'Tech Innovations Ltd.',
      plan: 'business',
      status: 'expiring',
      startDate: '2025-02-01',
      endDate: '2026-01-31',
      contractValue: '$36,000/年',
      autoRenew: false,
      documents: ['MSA', 'SLA'],
    },
    {
      id: 'contract-003',
      companyName: 'Digital Assets Inc.',
      plan: 'enterprise',
      status: 'pending_renewal',
      startDate: '2024-03-15',
      endDate: '2025-03-14',
      contractValue: '$180,000/年',
      autoRenew: false,
      documents: ['MSA', 'SLA', 'DPA', 'NDA', 'SOW'],
    },
    {
      id: 'contract-004',
      companyName: 'Crypto Startup AG',
      plan: 'starter',
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2026-09-30',
      contractValue: '$9,600/年',
      autoRenew: true,
      documents: ['MSA', 'SLA'],
    },
    {
      id: 'contract-005',
      companyName: 'Legacy Finance Ltd.',
      plan: 'business',
      status: 'expired',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      contractValue: '$48,000/年',
      autoRenew: false,
      documents: ['MSA', 'SLA', 'DPA'],
    },
  ];

  const tabs = [
    { key: 'active', label: t('tabs.active'), count: SAMPLE_CONTRACTS.filter(c => c.status === 'active').length },
    { key: 'expiring', label: t('tabs.expiring'), count: SAMPLE_CONTRACTS.filter(c => c.status === 'expiring').length },
    { key: 'pending_renewal', label: t('tabs.pendingRenewal'), count: SAMPLE_CONTRACTS.filter(c => c.status === 'pending_renewal').length },
    { key: 'expired', label: t('tabs.expired'), count: SAMPLE_CONTRACTS.filter(c => c.status === 'expired').length },
    { key: 'all', label: t('tabs.all'), count: SAMPLE_CONTRACTS.length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'expiring':
        return <Badge variant="warning">{t('status.expiring')}</Badge>;
      case 'pending_renewal':
        return <Badge variant="gold">{t('status.pendingRenewal')}</Badge>;
      case 'expired':
        return <Badge variant="danger">{t('status.expired')}</Badge>;
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

  const filteredContracts = SAMPLE_CONTRACTS.filter((contract) => {
    const matchesSearch = contract.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || contract.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

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
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                {t('breadcrumb.operators')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </nav>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<FileText className="h-4 w-4" />}>
                {t('newContract')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalContracts')}
              value={String(SAMPLE_CONTRACTS.length)}
              icon={<FileText className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeContracts')}
              value={String(SAMPLE_CONTRACTS.filter(c => c.status === 'active').length)}
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.expiringContracts')}
              value={String(SAMPLE_CONTRACTS.filter(c => c.status === 'expiring').length)}
              subValue={t('stats.next30Days')}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.pendingRenewals')}
              value={String(SAMPLE_CONTRACTS.filter(c => c.status === 'pending_renewal').length)}
              icon={<RefreshCw className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.totalValue')}
              value="$393.6K"
              subValue={t('stats.annual')}
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

          {/* Contracts List */}
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
              <div className="space-y-4">
                {filteredContracts.map((contract) => {
                  const daysRemaining = getDaysRemaining(contract.endDate);

                  return (
                    <div
                      key={contract.id}
                      className={cn(
                        'rounded-lg border p-4 transition-all',
                        contract.status === 'expiring' && 'border-warning/50 bg-warning/5',
                        contract.status === 'expired' && 'border-danger/50 bg-danger/5',
                        contract.status === 'pending_renewal' && 'border-gold/50 bg-gold/5',
                        contract.status === 'active' && 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl',
                            contract.status === 'active' && 'bg-success/10',
                            contract.status === 'expiring' && 'bg-warning/10',
                            contract.status === 'pending_renewal' && 'bg-gold/10',
                            contract.status === 'expired' && 'bg-danger/10'
                          )}>
                            <Building2 className={cn(
                              'h-6 w-6',
                              contract.status === 'active' && 'text-success',
                              contract.status === 'expiring' && 'text-warning',
                              contract.status === 'pending_renewal' && 'text-gold',
                              contract.status === 'expired' && 'text-danger'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{contract.companyName}</span>
                              {getStatusBadge(contract.status)}
                              {getPlanBadge(contract.plan)}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-foreground-secondary">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {t('contractPeriod')}: {contract.startDate} ~ {contract.endDate}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {contract.contractValue}
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              {contract.documents.map((doc) => (
                                <Badge key={doc} variant="default" size="sm">
                                  {doc}
                                </Badge>
                              ))}
                            </div>
                            {contract.status === 'expiring' && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-warning">
                                <AlertTriangle className="h-3 w-3" />
                                {t('expiresIn', { days: daysRemaining })}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {contract.autoRenew && (
                            <Badge variant="success" size="sm">
                              <RefreshCw className="mr-1 h-3 w-3" />
                              {t('autoRenew')}
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                            {t('viewContract')}
                          </Button>
                          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                            {t('download')}
                          </Button>
                          {(contract.status === 'expiring' || contract.status === 'pending_renewal') && (
                            <Button size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
                              {t('renewContract')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredContracts.length === 0 && (
                  <div className="py-12 text-center text-foreground-tertiary">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('noContracts')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
