'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Activity,
  Clock,
  ExternalLink,
  Copy,
  Ban,
  RefreshCcw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface PublicProverDetailProps {
  proverId: string;
}

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

export function PublicProverDetail({ proverId }: PublicProverDetailProps) {
  const t = useTranslations('admin.proverDetail');
  const [activeTab, setActiveTab] = useState<'overview' | 'signatures' | 'slashing' | 'settings'>('overview');

  // Mock data
  const prover = {
    id: proverId,
    operator: 'Alpha Node Labs',
    address: '0x7a3f5e8c9d2b1a4f6e3c7d8a9b0c1d2e3f4a5b6c7d8e9f0a',
    status: 'active',
    stake: '50,000 QS',
    sla: 99.98,
    signatures24h: 1234,
    signaturesTotal: 456789,
    lastActive: '2分前',
    registeredAt: '2025-06-15',
    region: 'ap-northeast-1',
    version: 'v2.1.0',
    uptime: '99.99%',
    avgResponseTime: '45ms',
  };

  const recentSignatures = [
    { id: 'sig-001', txHash: '0xabc...123', type: 'Lock', timestamp: '2分前', status: 'success' },
    { id: 'sig-002', txHash: '0xdef...456', type: 'Unlock', timestamp: '5分前', status: 'success' },
    { id: 'sig-003', txHash: '0xghi...789', type: 'Lock', timestamp: '12分前', status: 'success' },
    { id: 'sig-004', txHash: '0xjkl...012', type: 'Lock', timestamp: '18分前', status: 'success' },
    { id: 'sig-005', txHash: '0xmno...345', type: 'Unlock', timestamp: '25分前', status: 'success' },
  ];

  const slashingHistory = [
    { id: 'slash-001', reason: 'SLA Violation', amount: '500 QS', date: '2025-11-20', status: 'executed' },
  ];

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'signatures', label: t('tabs.signatures') },
    { key: 'slashing', label: t('tabs.slashing') },
    { key: 'settings', label: t('tabs.settings') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'suspended':
        return <Badge variant="danger">{t('status.suspended')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      default:
        return null;
    }
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
              <Link href="/admin/public/provers" className="hover:text-foreground">
                {t('breadcrumb.provers')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{proverId}</span>
            </nav>
            <div className="mt-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold/10">
                  <Shield className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-foreground">{prover.operator}</h1>
                    {getStatusBadge(prover.status)}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-foreground-tertiary">
                    <span className="font-mono">{prover.address.slice(0, 20)}...{prover.address.slice(-8)}</span>
                    <button className="text-gold hover:text-gold/80">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a href="#" className="text-gold hover:text-gold/80">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" leftIcon={<RefreshCcw className="h-4 w-4" />}>
                  {t('actions.forceSync')}
                </Button>
                <Button variant="outline" className="border-danger text-danger hover:bg-danger hover:text-white" leftIcon={<Ban className="h-4 w-4" />}>
                  {t('actions.suspend')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.stake')}
              value={prover.stake}
              icon={<Wallet className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.sla')}
              value={`${prover.sla}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.signatures24h')}
              value={prover.signatures24h.toLocaleString()}
              icon={<Activity className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.uptime')}
              value={prover.uptime}
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.avgResponseTime')}
              value={prover.avgResponseTime}
              icon={<Clock className="h-5 w-5" />}
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
                  'rounded-md px-4 py-2 text-sm font-medium transition-all',
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.info')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.proverId')}</dt>
                      <dd className="font-mono text-foreground">{prover.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.region')}</dt>
                      <dd className="text-foreground">{prover.region}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.version')}</dt>
                      <dd className="text-foreground">{prover.version}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.registeredAt')}</dt>
                      <dd className="text-foreground">{prover.registeredAt}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.lastActive')}</dt>
                      <dd className="text-foreground">{prover.lastActive}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-foreground-tertiary">{t('overview.totalSignatures')}</dt>
                      <dd className="font-mono text-foreground">{prover.signaturesTotal.toLocaleString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.recentSignatures')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentSignatures.map((sig) => (
                      <div key={sig.id} className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <div>
                            <div className="font-mono text-sm text-foreground">{sig.txHash}</div>
                            <div className="text-xs text-foreground-tertiary">{sig.type}</div>
                          </div>
                        </div>
                        <span className="text-xs text-foreground-tertiary">{sig.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Signatures Tab */}
          {activeTab === 'signatures' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('signatures.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <Activity className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('signatures.placeholder')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Slashing Tab */}
          {activeTab === 'slashing' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('slashing.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {slashingHistory.length > 0 ? (
                  <div className="space-y-3">
                    {slashingHistory.map((slash) => (
                      <div key={slash.id} className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/5 p-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-danger" />
                          <div>
                            <div className="font-medium text-foreground">{slash.reason}</div>
                            <div className="text-xs text-foreground-tertiary">{slash.date}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-medium text-danger">-{slash.amount}</div>
                          <Badge variant="danger" size="sm">{slash.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                    <div className="text-center text-foreground-tertiary">
                      <CheckCircle className="mx-auto h-12 w-12 text-success" />
                      <p className="mt-2">{t('slashing.noEvents')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('settings.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4">
                    <div>
                      <div className="font-medium text-foreground">{t('settings.forceSlash')}</div>
                      <div className="text-sm text-foreground-tertiary">{t('settings.forceSlashDesc')}</div>
                    </div>
                    <Button variant="outline" className="border-danger text-danger hover:bg-danger hover:text-white">
                      {t('settings.executeSlash')}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary p-4">
                    <div>
                      <div className="font-medium text-foreground">{t('settings.removeProver')}</div>
                      <div className="text-sm text-foreground-tertiary">{t('settings.removeProverDesc')}</div>
                    </div>
                    <Button variant="outline" className="border-danger text-danger hover:bg-danger hover:text-white">
                      {t('settings.remove')}
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
