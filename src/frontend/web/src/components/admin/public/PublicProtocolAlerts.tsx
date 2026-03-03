'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Bell,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Search,
  Filter,
  Settings,
  Shield,
  Wallet,
  Activity,
  Clock,
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

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'security' | 'prover' | 'contract' | 'performance';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export function PublicProtocolAlerts() {
  const t = useTranslations('admin.protocolAlerts');
  const [activeTab, setActiveTab] = useState<'active' | 'acknowledged' | 'resolved' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const SAMPLE_ALERTS: Alert[] = [
    {
      id: 'alert-001',
      type: 'critical',
      category: 'security',
      title: t('alerts.suspiciousActivity'),
      description: t('alerts.suspiciousActivityDesc'),
      timestamp: '5分前',
      status: 'active',
    },
    {
      id: 'alert-002',
      type: 'warning',
      category: 'prover',
      title: t('alerts.proverSlaWarning'),
      description: t('alerts.proverSlaWarningDesc'),
      timestamp: '15分前',
      status: 'active',
    },
    {
      id: 'alert-003',
      type: 'warning',
      category: 'contract',
      title: t('alerts.gasSpike'),
      description: t('alerts.gasSpikeDesc'),
      timestamp: '1時間前',
      status: 'acknowledged',
    },
    {
      id: 'alert-004',
      type: 'info',
      category: 'performance',
      title: t('alerts.highTraffic'),
      description: t('alerts.highTrafficDesc'),
      timestamp: '2時間前',
      status: 'acknowledged',
    },
    {
      id: 'alert-005',
      type: 'critical',
      category: 'security',
      title: t('alerts.failedAuth'),
      description: t('alerts.failedAuthDesc'),
      timestamp: '1日前',
      status: 'resolved',
    },
  ];

  const tabs = [
    { key: 'active', label: t('tabs.active'), count: SAMPLE_ALERTS.filter(a => a.status === 'active').length },
    { key: 'acknowledged', label: t('tabs.acknowledged'), count: SAMPLE_ALERTS.filter(a => a.status === 'acknowledged').length },
    { key: 'resolved', label: t('tabs.resolved'), count: SAMPLE_ALERTS.filter(a => a.status === 'resolved').length },
    { key: 'all', label: t('tabs.all'), count: SAMPLE_ALERTS.length },
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-danger" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'prover':
        return <Activity className="h-4 w-4" />;
      case 'contract':
        return <Wallet className="h-4 w-4" />;
      case 'performance':
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge variant="danger">{t('type.critical')}</Badge>;
      case 'warning':
        return <Badge variant="warning">{t('type.warning')}</Badge>;
      case 'info':
        return <Badge variant="default">{t('type.info')}</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="danger">{t('status.active')}</Badge>;
      case 'acknowledged':
        return <Badge variant="warning">{t('status.acknowledged')}</Badge>;
      case 'resolved':
        return <Badge variant="success">{t('status.resolved')}</Badge>;
      default:
        return null;
    }
  };

  const filteredAlerts = SAMPLE_ALERTS.filter((alert) => {
    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || alert.status === activeTab;
    return matchesSearch && matchesTab;
  });

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
              <span className="text-foreground">{t('title')}</span>
            </nav>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
                {t('configureAlerts')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('stats.activeAlerts')}
              value={String(SAMPLE_ALERTS.filter(a => a.status === 'active').length)}
              icon={<Bell className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.criticalAlerts')}
              value={String(SAMPLE_ALERTS.filter(a => a.type === 'critical' && a.status === 'active').length)}
              icon={<AlertCircle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.acknowledgedAlerts')}
              value={String(SAMPLE_ALERTS.filter(a => a.status === 'acknowledged').length)}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.resolvedToday')}
              value={String(SAMPLE_ALERTS.filter(a => a.status === 'resolved').length)}
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
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          {/* Alerts List */}
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
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-lg border p-4 transition-all',
                      alert.type === 'critical' && alert.status === 'active'
                        ? 'border-danger/50 bg-danger/5'
                        : alert.type === 'warning' && alert.status === 'active'
                          ? 'border-warning/50 bg-warning/5'
                          : 'border-surface-tertiary bg-background-secondary'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          alert.type === 'critical' ? 'bg-danger/10' :
                          alert.type === 'warning' ? 'bg-warning/10' :
                          'bg-info/10'
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{alert.title}</span>
                            {getTypeBadge(alert.type)}
                            {getStatusBadge(alert.status)}
                          </div>
                          <p className="mt-1 text-sm text-foreground-secondary">{alert.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-foreground-tertiary">
                            <span className="flex items-center gap-1">
                              {getCategoryIcon(alert.category)}
                              {t(`category.${alert.category}`)}
                            </span>
                            <span>{alert.timestamp}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button variant="outline" size="sm">
                              {t('actions.acknowledge')}
                            </Button>
                            <Button size="sm">
                              {t('actions.resolve')}
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm">
                            {t('actions.resolve')}
                          </Button>
                        )}
                        {alert.status === 'resolved' && (
                          <Button variant="outline" size="sm">
                            {t('actions.viewDetails')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredAlerts.length === 0 && (
                  <div className="py-12 text-center text-foreground-tertiary">
                    <CheckCircle className="mx-auto h-12 w-12 text-success" />
                    <p className="mt-2">{t('noAlerts')}</p>
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
