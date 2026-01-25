'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Eye,
  Search,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Globe,
  Activity,
  Bell,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { ExportButton, generateCSV } from '@/components/enterprise/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ObserverStatus = 'active' | 'warning' | 'offline';

interface Observer {
  id: string;
  name: string;
  status: ObserverStatus;
  region: string;
  lastSeen: string;
  blocksObserved: number;
  alertsRaised: number;
}

const DEMO_OBSERVERS: Observer[] = [
  {
    id: 'obs-001',
    name: 'Tokyo Observer Alpha',
    status: 'active',
    region: 'tokyo',
    lastSeen: '30 sec ago',
    blocksObserved: 1234567,
    alertsRaised: 3,
  },
  {
    id: 'obs-002',
    name: 'Tokyo Observer Beta',
    status: 'active',
    region: 'tokyo',
    lastSeen: '45 sec ago',
    blocksObserved: 1234560,
    alertsRaised: 1,
  },
  {
    id: 'obs-003',
    name: 'Singapore Observer',
    status: 'warning',
    region: 'singapore',
    lastSeen: '2 min ago',
    blocksObserved: 1234500,
    alertsRaised: 8,
  },
  {
    id: 'obs-004',
    name: 'Frankfurt Observer',
    status: 'active',
    region: 'frankfurt',
    lastSeen: '1 min ago',
    blocksObserved: 1234550,
    alertsRaised: 2,
  },
  {
    id: 'obs-005',
    name: 'Virginia Observer',
    status: 'offline',
    region: 'virginia',
    lastSeen: '15 min ago',
    blocksObserved: 1234000,
    alertsRaised: 0,
  },
];

const STATS = {
  total: DEMO_OBSERVERS.length,
  active: DEMO_OBSERVERS.filter((o) => o.status === 'active').length,
  warning: DEMO_OBSERVERS.filter((o) => o.status === 'warning').length,
  offline: DEMO_OBSERVERS.filter((o) => o.status === 'offline').length,
};

function StatusIcon({ status }: { status: ObserverStatus }) {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'offline':
      return <XCircle className="h-4 w-4 text-danger" />;
  }
}

function StatusBadge({ status }: { status: ObserverStatus }) {
  const t = useTranslations('enterprise.observers');

  const variants: Record<ObserverStatus, string> = {
    active: 'bg-success/10 text-success border-success/30',
    warning: 'bg-warning/10 text-warning border-warning/30',
    offline: 'bg-danger/10 text-danger border-danger/30',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', variants[status])}>
      <StatusIcon status={status} />
      {t(`statuses.${status}`)}
    </span>
  );
}

export function EnterpriseObservers() {
  const t = useTranslations('enterprise.observers');
  const tCommon = useTranslations('enterprise');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ObserverStatus | 'all'>('all');

  const filteredObservers = DEMO_OBSERVERS.filter((observer) => {
    const matchesSearch = observer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      observer.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || observer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Status', 'Region', 'Last Seen', 'Blocks Observed', 'Alerts'];
      const rows = filteredObservers.map((o) => [
        o.id,
        o.name,
        o.status,
        o.region,
        o.lastSeen,
        o.blocksObserved.toString(),
        o.alertsRaised.toString(),
      ]);
      return generateCSV(headers, rows);
    }
    return new Blob(['PDF export'], { type: 'application/pdf' });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-background-secondary/50 border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Eye className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{STATS.total}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.total')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-success/5 border-success/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{STATS.active}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.active')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-warning/5 border-warning/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{STATS.warning}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.warning')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-danger/5 border-danger/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-danger">{STATS.offline}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.offline')}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search observers..."
                className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ObserverStatus | 'all')}
                className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">{t('statuses.active')}</option>
                <option value="warning">{t('statuses.warning')}</option>
                <option value="offline">{t('statuses.offline')}</option>
              </select>
              <ExportButton onExport={handleExport} filename="observers" />
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('addObserver')}
              </Button>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-background-tertiary/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.name')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.region')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.lastSeen')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.blocksObserved')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.alertsRaised')}
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredObservers.map((observer) => (
                    <tr
                      key={observer.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background-tertiary rounded-lg">
                            <Eye className="h-4 w-4 text-foreground-secondary" />
                          </div>
                          <div>
                            <div className="font-medium">{observer.name}</div>
                            <div className="text-xs text-foreground-tertiary font-mono">{observer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={observer.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Globe className="h-3.5 w-3.5 text-foreground-tertiary" />
                          {t(`regions.${observer.region}`)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <Clock className="h-3.5 w-3.5" />
                          {observer.lastSeen}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Activity className="h-3.5 w-3.5 text-foreground-tertiary" />
                          {observer.blocksObserved.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Bell className={cn('h-3.5 w-3.5', observer.alertsRaised > 5 ? 'text-warning' : 'text-foreground-tertiary')} />
                          <span className={observer.alertsRaised > 5 ? 'text-warning font-medium' : ''}>
                            {observer.alertsRaised}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="gap-1">
                          {t('viewDetails')}
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredObservers.length === 0 && (
              <div className="p-12 text-center">
                <Eye className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
                <p className="text-foreground-secondary">No observers found</p>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseObservers;
