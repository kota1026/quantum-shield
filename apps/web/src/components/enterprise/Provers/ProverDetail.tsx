'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Server,
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Pause,
  ArrowUpCircle,
  Trash2,
  MapPin,
  Shield,
  Cpu,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type ProverStatus = 'active' | 'standby' | 'offline';
type TabType = 'overview' | 'metrics' | 'logs' | 'maintenance';

interface ProverDetailProps {
  proverId: string;
}

// Demo prover data
const DEMO_PROVER = {
  id: 'prv-001',
  name: 'Tokyo Primary',
  status: 'active' as ProverStatus,
  type: 'dedicated',
  region: 'ap-northeast-1',
  version: '2.4.1',
  uptime: '99.99%',
  uptimeDays: '45 days, 12 hours',
  lastRestart: '2024-12-11 03:00:00 UTC',
  signatures24h: 12847,
  avgLatency: '45ms',
  successRate: '99.98%',
  queueDepth: 12,
  stakeAmount: '50,000 QST',
  ipAddress: '10.0.1.100',
  publicEndpoint: 'https://prv-001.qs.acme.co',
};

const DEMO_METRICS = [
  { time: '00:00', signatures: 520, latency: 42 },
  { time: '04:00', signatures: 380, latency: 45 },
  { time: '08:00', signatures: 890, latency: 48 },
  { time: '12:00', signatures: 1250, latency: 52 },
  { time: '16:00', signatures: 980, latency: 46 },
  { time: '20:00', signatures: 750, latency: 44 },
  { time: '24:00', signatures: 620, latency: 43 },
];

const DEMO_LOGS = [
  { timestamp: '2024-12-12 14:32:15', level: 'info', message: 'Signature batch processed successfully (256 signatures)' },
  { timestamp: '2024-12-12 14:30:00', level: 'info', message: 'Health check passed' },
  { timestamp: '2024-12-12 14:28:45', level: 'warn', message: 'Queue depth approaching threshold (85%)' },
  { timestamp: '2024-12-12 14:25:00', level: 'info', message: 'Signature batch processed successfully (312 signatures)' },
  { timestamp: '2024-12-12 14:20:00', level: 'info', message: 'Health check passed' },
];

function StatusIcon({ status }: { status: ProverStatus }) {
  switch (status) {
    case 'active':
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case 'standby':
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case 'offline':
      return <XCircle className="h-5 w-5 text-danger" />;
  }
}

export function ProverDetail({ proverId }: ProverDetailProps) {
  const t = useTranslations('enterprise.proverDetail');
  const tCommon = useTranslations('enterprise');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const prover = DEMO_PROVER; // In production, fetch by proverId

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: t('tabs.overview') },
    { id: 'metrics', label: t('tabs.metrics') },
    { id: 'logs', label: t('tabs.logs') },
    { id: 'maintenance', label: t('tabs.maintenance') },
  ];

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
          {/* Back link */}
          <Link
            href="/enterprise/provers"
            className="inline-flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToList')}
          </Link>

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="p-4 bg-background-secondary rounded-xl">
                <Server className="h-8 w-8 text-foreground-secondary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{prover.name}</h1>
                  <Badge variant={prover.type === 'dedicated' ? 'gold' : 'outline'}>
                    {prover.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-foreground-secondary">
                  <span className="font-mono">{prover.id}</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {prover.region}
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5" />
                    v{prover.version}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {t('actions.restart')}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Pause className="h-4 w-4" />
                {t('actions.pause')}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                {t('actions.update')}
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-danger hover:bg-danger/10">
                <Trash2 className="h-4 w-4" />
                {t('actions.delete')}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10 mb-6">
            <nav className="flex gap-1" aria-label="Prover detail tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium transition-colors relative',
                    activeTab === tab.id
                      ? 'text-hinomaru'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-hinomaru" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Status Card */}
              <Card className="p-6 col-span-1">
                <h3 className="text-sm font-semibold text-foreground-secondary mb-4">Status</h3>
                <div className="flex items-center gap-3 mb-4">
                  <StatusIcon status={prover.status} />
                  <span className="text-lg font-semibold capitalize">{prover.status}</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">{t('info.uptime')}</span>
                    <span className="font-medium text-success">{prover.uptime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">{t('info.lastRestart')}</span>
                    <span className="font-medium">{prover.uptimeDays}</span>
                  </div>
                </div>
              </Card>

              {/* Metrics Card */}
              <Card className="p-6 col-span-2">
                <h3 className="text-sm font-semibold text-foreground-secondary mb-4">{t('tabs.metrics')}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-background-tertiary/50 rounded-lg">
                    <div className="flex items-center gap-2 text-foreground-secondary text-xs mb-2">
                      <Activity className="h-3.5 w-3.5" />
                      {t('metrics.signatures24h')}
                    </div>
                    <div className="text-2xl font-bold">{prover.signatures24h.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-background-tertiary/50 rounded-lg">
                    <div className="flex items-center gap-2 text-foreground-secondary text-xs mb-2">
                      <Clock className="h-3.5 w-3.5" />
                      {t('metrics.avgLatency')}
                    </div>
                    <div className="text-2xl font-bold">{prover.avgLatency}</div>
                  </div>
                  <div className="p-4 bg-background-tertiary/50 rounded-lg">
                    <div className="flex items-center gap-2 text-foreground-secondary text-xs mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('metrics.successRate')}
                    </div>
                    <div className="text-2xl font-bold text-success">{prover.successRate}</div>
                  </div>
                  <div className="p-4 bg-background-tertiary/50 rounded-lg">
                    <div className="flex items-center gap-2 text-foreground-secondary text-xs mb-2">
                      <Shield className="h-3.5 w-3.5" />
                      {t('metrics.queueDepth')}
                    </div>
                    <div className="text-2xl font-bold">{prover.queueDepth}</div>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="p-6 col-span-3">
                <h3 className="text-sm font-semibold text-foreground-secondary mb-4">{t('tabs.overview')}</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                  <div>
                    <div className="text-foreground-tertiary mb-1">{t('info.id')}</div>
                    <div className="font-mono">{prover.id}</div>
                  </div>
                  <div>
                    <div className="text-foreground-tertiary mb-1">{t('info.name')}</div>
                    <div>{prover.name}</div>
                  </div>
                  <div>
                    <div className="text-foreground-tertiary mb-1">{t('info.region')}</div>
                    <div>{prover.region}</div>
                  </div>
                  <div>
                    <div className="text-foreground-tertiary mb-1">{t('info.version')}</div>
                    <div>v{prover.version}</div>
                  </div>
                  <div>
                    <div className="text-foreground-tertiary mb-1">Stake Amount</div>
                    <div className="text-gold font-medium">{prover.stakeAmount}</div>
                  </div>
                  <div>
                    <div className="text-foreground-tertiary mb-1">Internal IP</div>
                    <div className="font-mono">{prover.ipAddress}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-foreground-tertiary mb-1">Public Endpoint</div>
                    <div className="font-mono text-hinomaru">{prover.publicEndpoint}</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'metrics' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-6">Performance Metrics (24h)</h3>
              {/* Simplified metrics visualization */}
              <div className="h-64 flex items-end gap-2 border-b border-l border-white/10 p-4">
                {DEMO_METRICS.map((point, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-hinomaru/60 rounded-t"
                      style={{ height: `${(point.signatures / 1500) * 100}%` }}
                    />
                    <span className="text-xs text-foreground-tertiary">{point.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-foreground-secondary text-center">
                Signatures per 4-hour period
              </div>
            </Card>
          )}

          {activeTab === 'logs' && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold">Recent Logs</h3>
                <Button variant="outline" size="sm">
                  View All Logs
                </Button>
              </div>
              <div className="divide-y divide-white/5">
                {DEMO_LOGS.map((log, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-4">
                      <span className="text-xs text-foreground-tertiary font-mono whitespace-nowrap">
                        {log.timestamp}
                      </span>
                      <Badge
                        variant={log.level === 'warn' ? 'warning' : log.level === 'error' ? 'danger' : 'outline'}
                        className="text-xs"
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-foreground-secondary">{log.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'maintenance' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Maintenance History</h3>
                <Link href="/enterprise/provers/calendar">
                  <Button variant="outline" size="sm">
                    View Calendar
                  </Button>
                </Link>
              </div>
              <div className="text-center py-12 text-foreground-secondary">
                <Clock className="h-12 w-12 mx-auto mb-4 text-foreground-tertiary" />
                <p>No scheduled maintenance</p>
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProverDetail;
