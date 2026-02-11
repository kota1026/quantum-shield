'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Server,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Plus,
  Activity,
  Zap,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from './Dashboard/EnterpriseSidebar';

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
const mockProvers = [
  {
    id: 'prover-001',
    name: 'Primary Node - Tokyo',
    region: 'ap-northeast-1',
    status: 'active',
    sla: 99.8,
    signatures24h: 1234,
    lastActive: '2分前',
    type: 'dedicated',
  },
  {
    id: 'prover-002',
    name: 'Secondary Node - Singapore',
    region: 'ap-southeast-1',
    status: 'active',
    sla: 99.5,
    signatures24h: 856,
    lastActive: '1分前',
    type: 'dedicated',
  },
  {
    id: 'prover-003',
    name: 'Backup Node - Frankfurt',
    region: 'eu-central-1',
    status: 'standby',
    sla: 99.9,
    signatures24h: 0,
    lastActive: '5分前',
    type: 'shared',
  },
];

export function EnterpriseProvers() {
  const t = useTranslations('enterprise.provers');
  const [activeTab, setActiveTab] = useState<'all' | 'dedicated' | 'shared'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockProvers.length },
    { key: 'dedicated', label: t('tabs.dedicated'), count: mockProvers.filter(p => p.type === 'dedicated').length },
    { key: 'shared', label: t('tabs.shared'), count: mockProvers.filter(p => p.type === 'shared').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'standby':
        return <Badge variant="warning">{t('status.standby')}</Badge>;
      case 'offline':
        return <Badge variant="danger">{t('status.offline')}</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'dedicated':
        return <Badge variant="gold">{t('type.dedicated')}</Badge>;
      case 'shared':
        return <Badge variant="default">{t('type.shared')}</Badge>;
      default:
        return null;
    }
  };

  const filteredProvers = mockProvers.filter((prover) => {
    const matchesSearch =
      prover.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prover.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === 'all' || prover.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseSidebar />

      <main className="ml-[260px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/enterprise/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                {t('addProver')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('stats.totalProvers')}
              value="3"
              icon={<Server className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeProvers')}
              value="2"
              subValue="66.7%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgSla')}
              value="99.7%"
              icon={<Shield className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.signatures24h')}
              value="2,090"
              icon={<Zap className="h-5 w-5" />}
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
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          {/* Provers List */}
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
                {filteredProvers.map((prover) => (
                  <div
                    key={prover.id}
                    className={cn(
                      'rounded-lg border p-4',
                      prover.status === 'active'
                        ? 'border-success/30 bg-success/5'
                        : 'border-surface-tertiary bg-background-secondary'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'flex h-12 w-12 items-center justify-center rounded-xl',
                          prover.status === 'active' ? 'bg-success/10' : 'bg-warning/10'
                        )}>
                          <Server className={cn(
                            'h-6 w-6',
                            prover.status === 'active' ? 'text-success' : 'text-warning'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{prover.name}</span>
                            {getTypeBadge(prover.type)}
                            {getStatusBadge(prover.status)}
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-foreground-tertiary">
                            <span>{t('region')}: {prover.region}</span>
                            <span>{t('lastActive')}: {prover.lastActive}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm text-foreground-tertiary">{t('sla')}</div>
                          <div className={cn(
                            'font-mono text-lg font-bold',
                            prover.sla >= 99.5 ? 'text-success' : 'text-warning'
                          )}>
                            {prover.sla}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-foreground-tertiary">{t('signatures24h')}</div>
                          <div className="font-mono text-lg font-bold text-foreground">
                            {prover.signatures24h.toLocaleString()}
                          </div>
                        </div>
                        <Link
                          href={`/enterprise/provers/${prover.id}`}
                          className="text-gold hover:underline"
                        >
                          {t('viewDetails')}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
