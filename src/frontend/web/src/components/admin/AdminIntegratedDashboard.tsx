'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Globe,
  Building2,
  FileText,
  Shield,
  Users,
  Eye,
  Wallet,
  CreditCard,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from './AdminSidebarV2';

// Live indicator component
function LiveIndicator({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs text-success"
      role="status"
      aria-live="polite"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
      {label}
    </div>
  );
}

// Stat card for overview
interface OverviewStatProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  colorClass: string;
}

function OverviewStat({ label, value, change, changeType, icon, colorClass }: OverviewStatProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-surface-tertiary bg-card p-4">
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colorClass)}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-foreground-tertiary">{label}</div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {change && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            changeType === 'up' && 'text-success',
            changeType === 'down' && 'text-danger',
            changeType === 'neutral' && 'text-foreground-secondary'
          )}>
            {changeType === 'up' && <ArrowUp className="h-3 w-3" />}
            {changeType === 'down' && <ArrowDown className="h-3 w-3" />}
            {change}
          </div>
        )}
      </div>
    </div>
  );
}

// Section stat card
interface SectionStatProps {
  label: string;
  value: string;
  subValue?: string;
}

function SectionStat({ label, value, subValue }: SectionStatProps) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-foreground-tertiary">{label}</div>
      {subValue && <div className="mt-1 text-[10px] text-foreground-secondary">{subValue}</div>}
    </div>
  );
}

// Alert item
interface AlertItemProps {
  type: 'proverApplication' | 'saasApplication' | 'slaWarning' | 'paymentOverdue' | 'securityAlert';
  title: string;
  time: string;
  source: 'public' | 'saas' | 'license';
}

function AlertItem({ type, title, time, source }: AlertItemProps) {
  const sourceColors = {
    public: 'bg-success/10 text-success',
    saas: 'bg-info/10 text-info',
    license: 'bg-warning/10 text-warning',
  };

  const sourceLabels = {
    public: 'Public',
    saas: 'SaaS',
    license: 'License',
  };

  return (
    <div className="flex items-start gap-3 rounded-lg bg-background-secondary p-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          <Badge size="sm" className={sourceColors[source]}>{sourceLabels[source]}</Badge>
        </div>
        <div className="text-xs text-foreground-tertiary">{time}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-foreground-tertiary" />
    </div>
  );
}

// Activity item
interface ActivityItemProps {
  text: string;
  time: string;
  source: 'public' | 'saas' | 'license';
}

function ActivityItem({ text, time, source }: ActivityItemProps) {
  const sourceColors = {
    public: 'bg-success',
    saas: 'bg-info',
    license: 'bg-warning',
  };

  return (
    <div className="flex gap-3 border-b border-surface-tertiary pb-3 last:border-0 last:pb-0">
      <span className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', sourceColors[source])} />
      <div className="flex-1">
        <div className="text-sm text-foreground">{text}</div>
        <div className="text-xs text-foreground-tertiary">{time}</div>
      </div>
    </div>
  );
}

export function AdminIntegratedDashboard() {
  const t = useTranslations('admin.integratedDashboard');
  const [activeTab, setActiveTab] = useState<'overview' | 'public' | 'saas' | 'license'>('overview');

  // Mock data
  const overviewStats = {
    totalTvl: { value: '$1.24B', change: '+8.5%', changeType: 'up' as const },
    totalUsers: { value: '45,892', change: '+1,234', changeType: 'up' as const },
    totalProvers: { value: '142', change: '+5', changeType: 'up' as const },
    monthlyRevenue: { value: '$2.4M', change: '+12%', changeType: 'up' as const },
  };

  const publicStats = {
    tvl: '$847.2M',
    users: '32,456',
    provers: '127',
    observers: '89',
    pendingProposals: '3',
  };

  const saasStats = {
    operators: '12',
    endUsers: '13,436',
    mrr: '$1.8M',
    pendingApplications: '2',
    activeTickets: '8',
  };

  const licenseStats = {
    companies: '3',
    activeProjects: '2',
    totalRevenue: '$4.2M',
  };

  const alerts = [
    { type: 'proverApplication' as const, title: 'New Prover Application: Node-Alpha-42', time: '5分前', source: 'public' as const },
    { type: 'saasApplication' as const, title: 'SaaS Application: Acme Corp', time: '15分前', source: 'saas' as const },
    { type: 'slaWarning' as const, title: 'Prover SLA Warning: Node-Beta-12', time: '32分前', source: 'public' as const },
    { type: 'paymentOverdue' as const, title: 'Payment Overdue: XYZ Exchange', time: '2時間前', source: 'saas' as const },
  ];

  const activities = [
    { text: 'New Lock: 125 ETH from 0x7a3f...9c2d', time: '2分前', source: 'public' as const },
    { text: 'Operator joined: Acme Corp (Business Plan)', time: '1時間前', source: 'saas' as const },
    { text: 'License renewed: MegaBank Inc.', time: '3時間前', source: 'license' as const },
    { text: 'Prover #42 signed unlock request', time: '4時間前', source: 'public' as const },
    { text: 'Support ticket resolved: #1234', time: '5時間前', source: 'saas' as const },
  ];

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'public', label: t('tabs.public') },
    { key: 'saas', label: t('tabs.saas') },
    { key: 'license', label: t('tabs.license') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
              <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <LiveIndicator label={t('liveIndicator')} />
              <Button variant="danger" leftIcon={<AlertTriangle className="h-4 w-4" />} asChild>
                <Link href="/admin/emergency">{t('emergencyButton')}</Link>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex-1 rounded-md px-4 py-2 min-h-[44px] text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Overview Stats */}
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <OverviewStat
                  label={t('overview.totalTvl')}
                  value={overviewStats.totalTvl.value}
                  change={overviewStats.totalTvl.change}
                  changeType={overviewStats.totalTvl.changeType}
                  icon={<Wallet className="h-6 w-6 text-gold" />}
                  colorClass="bg-gold/10"
                />
                <OverviewStat
                  label={t('overview.totalUsers')}
                  value={overviewStats.totalUsers.value}
                  change={overviewStats.totalUsers.change}
                  changeType={overviewStats.totalUsers.changeType}
                  icon={<Users className="h-6 w-6 text-info" />}
                  colorClass="bg-info/10"
                />
                <OverviewStat
                  label={t('overview.totalProvers')}
                  value={overviewStats.totalProvers.value}
                  change={overviewStats.totalProvers.change}
                  changeType={overviewStats.totalProvers.changeType}
                  icon={<Shield className="h-6 w-6 text-success" />}
                  colorClass="bg-success/10"
                />
                <OverviewStat
                  label={t('overview.monthlyRevenue')}
                  value={overviewStats.monthlyRevenue.value}
                  change={overviewStats.monthlyRevenue.change}
                  changeType={overviewStats.monthlyRevenue.changeType}
                  icon={<TrendingUp className="h-6 w-6 text-hinomaru" />}
                  colorClass="bg-hinomaru/10"
                />
              </div>

              {/* Three Section Cards */}
              <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Public Section */}
                <Card className="border-l-4 border-l-success">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Globe className="h-4 w-4 text-success" />
                        {t('publicStats.title')}
                      </CardTitle>
                      <Link href="/admin/public/protocol" className="text-xs text-gold hover:underline">
                        {t('alerts.viewAll')} →
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <SectionStat label={t('publicStats.tvl')} value={publicStats.tvl} />
                      <SectionStat label={t('publicStats.users')} value={publicStats.users} />
                      <SectionStat label={t('publicStats.provers')} value={publicStats.provers} />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-surface-tertiary pt-4">
                      <span className="text-xs text-foreground-tertiary">{t('publicStats.pendingProposals')}</span>
                      <Badge variant="warning">{publicStats.pendingProposals}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* SaaS Section */}
                <Card className="border-l-4 border-l-info">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building2 className="h-4 w-4 text-info" />
                        {t('saasStats.title')}
                      </CardTitle>
                      <Link href="/admin/saas/operators" className="text-xs text-gold hover:underline">
                        {t('alerts.viewAll')} →
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <SectionStat label={t('saasStats.operators')} value={saasStats.operators} />
                      <SectionStat label={t('saasStats.endUsers')} value={saasStats.endUsers} />
                      <SectionStat label={t('saasStats.mrr')} value={saasStats.mrr} />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-surface-tertiary pt-4">
                      <span className="text-xs text-foreground-tertiary">{t('saasStats.pendingApplications')}</span>
                      <Badge variant="warning">{saasStats.pendingApplications}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* License Section */}
                <Card className="border-l-4 border-l-warning">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-warning" />
                        {t('licenseStats.title')}
                      </CardTitle>
                      <Link href="/admin/license/companies" className="text-xs text-gold hover:underline">
                        {t('alerts.viewAll')} →
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <SectionStat label={t('licenseStats.companies')} value={licenseStats.companies} />
                      <SectionStat label={t('licenseStats.activeProjects')} value={licenseStats.activeProjects} />
                      <SectionStat label={t('licenseStats.totalRevenue')} value={licenseStats.totalRevenue} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Alerts and Activity */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Alerts */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t('alerts.title')}</CardTitle>
                    <Badge variant="danger">{alerts.length}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {alerts.map((alert, index) => (
                        <AlertItem key={index} {...alert} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('recentActivity.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activities.map((activity, index) => (
                        <ActivityItem key={index} {...activity} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Public Tab */}
          {activeTab === 'public' && (
            <div className="rounded-xl border border-surface-tertiary bg-card p-8 text-center">
              <Globe className="mx-auto h-12 w-12 text-success" />
              <h3 className="mt-4 text-lg font-semibold">{t('publicTab.title')}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                {t('publicTab.description')}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button asChild className="min-h-[44px]">
                  <Link href="/admin/public/provers">{t('publicTab.proverManagement')}</Link>
                </Button>
                <Button variant="outline" asChild className="min-h-[44px]">
                  <Link href="/admin/public/protocol">{t('publicTab.protocolMonitoring')}</Link>
                </Button>
              </div>
            </div>
          )}

          {/* SaaS Tab */}
          {activeTab === 'saas' && (
            <div className="rounded-xl border border-surface-tertiary bg-card p-8 text-center">
              <Building2 className="mx-auto h-12 w-12 text-info" />
              <h3 className="mt-4 text-lg font-semibold">{t('saasTab.title')}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                {t('saasTab.description')}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button asChild className="min-h-[44px]">
                  <Link href="/admin/saas/operators">{t('saasTab.operatorManagement')}</Link>
                </Button>
                <Button variant="outline" asChild className="min-h-[44px]">
                  <Link href="/admin/saas/billing">{t('saasTab.billingManagement')}</Link>
                </Button>
              </div>
            </div>
          )}

          {/* License Tab */}
          {activeTab === 'license' && (
            <div className="rounded-xl border border-surface-tertiary bg-card p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-warning" />
              <h3 className="mt-4 text-lg font-semibold">{t('licenseTab.title')}</h3>
              <p className="mt-2 text-sm text-foreground-secondary">
                {t('licenseTab.description')}
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Button asChild className="min-h-[44px]">
                  <Link href="/admin/license/companies">{t('licenseTab.licensedCompanies')}</Link>
                </Button>
                <Button variant="outline" asChild className="min-h-[44px]">
                  <Link href="/admin/license/projects">{t('licenseTab.projects')}</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
