'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Server,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { ExportButton, generateCSV } from '@/components/enterprise/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProvers } from '@/hooks/enterprise';

type ProverStatus = 'active' | 'standby' | 'offline';
type ProverType = 'dedicated' | 'shared';

interface Prover {
  id: string;
  name: string;
  status: ProverStatus;
  type: ProverType;
  region: string;
  lastActive: string;
  uptime: string;
  signatures24h: number;
  stakeAmount: string;
}

const DEFAULT_PROVERS: Prover[] = [
  {
    id: 'prv-001',
    name: 'Tokyo Primary',
    status: 'active',
    type: 'dedicated',
    region: 'ap-northeast-1',
    lastActive: '2 min ago',
    uptime: '99.99%',
    signatures24h: 12847,
    stakeAmount: '50,000 QST',
  },
  {
    id: 'prv-002',
    name: 'Tokyo Secondary',
    status: 'active',
    type: 'dedicated',
    region: 'ap-northeast-1',
    lastActive: '1 min ago',
    uptime: '99.98%',
    signatures24h: 11234,
    stakeAmount: '50,000 QST',
  },
  {
    id: 'prv-003',
    name: 'Singapore Node',
    status: 'active',
    type: 'shared',
    region: 'ap-southeast-1',
    lastActive: '5 min ago',
    uptime: '99.95%',
    signatures24h: 8956,
    stakeAmount: '25,000 QST',
  },
  {
    id: 'prv-004',
    name: 'Frankfurt Node',
    status: 'standby',
    type: 'shared',
    region: 'eu-central-1',
    lastActive: '15 min ago',
    uptime: '99.90%',
    signatures24h: 0,
    stakeAmount: '25,000 QST',
  },
  {
    id: 'prv-005',
    name: 'Virginia Node',
    status: 'offline',
    type: 'shared',
    region: 'us-east-1',
    lastActive: '2 hours ago',
    uptime: '98.50%',
    signatures24h: 0,
    stakeAmount: '25,000 QST',
  },
];

// Stats will be computed in component based on data

function StatusIcon({ status }: { status: ProverStatus }) {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-4 w-4 text-success" />;
    case 'standby':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'offline':
      return <XCircle className="h-4 w-4 text-danger" />;
  }
}

function StatusBadge({ status }: { status: ProverStatus }) {
  const t = useTranslations('enterprise.provers');

  const variants: Record<ProverStatus, string> = {
    active: 'bg-success/10 text-success border-success/30',
    standby: 'bg-warning/10 text-warning border-warning/30',
    offline: 'bg-danger/10 text-danger border-danger/30',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border', variants[status])}>
      <StatusIcon status={status} />
      {t(`status.${status}`)}
    </span>
  );
}

export function EnterpriseProvers() {
  const t = useTranslations('enterprise.provers');
  const tCommon = useTranslations('enterprise');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProverStatus | 'all'>('all');

  // Fetch provers using hook
  const { data: proversData } = useProvers();

  // Map API data or use fallback
  const provers: Prover[] = proversData?.provers?.map((p) => ({
    id: p.id,
    name: p.address.slice(0, 10) + '...',
    status: p.status === 'slashed' ? 'offline' : p.status as ProverStatus,
    type: 'shared' as ProverType,
    region: 'ap-northeast-1',
    lastActive: 'Recently',
    uptime: `${p.success_rate}%`,
    signatures24h: p.jobs_completed,
    stakeAmount: p.stake_amount,
  })) ?? DEFAULT_PROVERS;

  const filteredProvers = provers.filter((prover) => {
    const matchesSearch = prover.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prover.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || prover.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Compute stats from current data
  const stats = {
    total: provers.length,
    active: provers.filter((p) => p.status === 'active').length,
    standby: provers.filter((p) => p.status === 'standby').length,
    offline: provers.filter((p) => p.status === 'offline').length,
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Status', 'Type', 'Region', 'Uptime', 'Signatures (24h)', 'Stake'];
      const rows = filteredProvers.map((p) => [
        p.id,
        p.name,
        p.status,
        p.type,
        p.region,
        p.uptime,
        p.signatures24h.toString(),
        p.stakeAmount,
      ]);
      return generateCSV(headers, rows);
    }
    // PDF would be handled similarly
    return new Blob(['PDF export'], { type: 'application/pdf' });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('title')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 bg-background-secondary/50 border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg">
                  <Server className="h-5 w-5 text-foreground-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.totalProvers')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-success/5 border-success/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{stats.active}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.activeProvers')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-warning/5 border-warning/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-warning">{stats.standby}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.standby')}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-danger/5 border-danger/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-danger/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-danger">{stats.offline}</div>
                  <div className="text-xs text-foreground-secondary">{t('stats.offline')}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
                aria-label={t('search.placeholder')}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProverStatus | 'all')}
                className="px-3 py-2 bg-background-secondary border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-hinomaru/50"
                aria-label={t('filter')}
              >
                <option value="all">All Status</option>
                <option value="active">{t('status.active')}</option>
                <option value="standby">{t('status.standby')}</option>
                <option value="offline">{t('status.offline')}</option>
              </select>

              <ExportButton onExport={handleExport} filename="provers" />

              <Button size="sm" className="gap-2 min-h-[44px]">
                <Plus className="h-4 w-4" />
                {t('addProver')}
              </Button>
            </div>
          </div>

          {/* Provers Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-background-tertiary/50">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.prover')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.type')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('region')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('lastActive')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('sla')}
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('signatures24h')}
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProvers.map((prover) => (
                    <tr
                      key={prover.id}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-background-tertiary rounded-lg">
                            <Server className="h-4 w-4 text-foreground-secondary" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{prover.name}</div>
                            <div className="text-xs text-foreground-tertiary font-mono">{prover.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={prover.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={prover.type === 'dedicated' ? 'gold' : 'default'} className="text-xs">
                          {t(`type.${prover.type}`)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground-secondary">
                        {prover.region}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-foreground-secondary">
                          <Clock className="h-3.5 w-3.5" />
                          {prover.lastActive}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'text-sm font-medium',
                          parseFloat(prover.uptime) >= 99.9 ? 'text-success' : 'text-warning'
                        )}>
                          {prover.uptime}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Activity className="h-3.5 w-3.5 text-foreground-tertiary" />
                          <span className="font-medium">{prover.signatures24h.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/enterprise/provers/${prover.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1 min-h-[44px]">
                            {t('viewDetails')}
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProvers.length === 0 && (
              <div className="p-12 text-center">
                <Server className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
                <p className="text-foreground-secondary">{t('noProvers')}</p>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseProvers;
