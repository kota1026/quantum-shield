'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  AlertTriangle,
  ArrowUp,
  Shield,
  Radio,
  BarChart3,
  ClipboardList,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  Zap,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Status indicator component
function StatusDot({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full',
        status === 'healthy' && 'bg-success',
        status === 'warning' && 'bg-warning',
        status === 'error' && 'bg-danger'
      )}
      role="status"
      aria-label={status}
    />
  );
}

// Live indicator component
function LiveIndicator({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs text-success"
      role="status"
      aria-live="polite"
      title="Data refreshes automatically"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
      {label}
    </div>
  );
}

// Stat card component
interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  status?: 'healthy' | 'warning' | 'critical';
}

function StatCard({ label, value, change, changeType = 'neutral', status = 'healthy' }: StatCardProps) {
  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-5',
        'border-surface-tertiary'
      )}
      aria-label={`${label}: ${value}${change ? `, ${change}` : ''}`}
    >
      {/* Top gradient border */}
      <div
        className={cn(
          'absolute left-0 right-0 top-0 h-[3px]',
          status === 'healthy' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'critical' && 'bg-danger'
        )}
        aria-hidden="true"
      />
      <div className="text-xs text-foreground-tertiary">{label}</div>
      <div
        className={cn(
          'mt-2 font-mono text-3xl font-bold',
          status === 'healthy' && 'text-foreground',
          status === 'warning' && 'text-warning',
          status === 'critical' && 'text-danger'
        )}
        aria-live="polite"
      >
        {value}
      </div>
      {change && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs',
            changeType === 'up' && 'text-success',
            changeType === 'down' && 'text-danger',
            changeType === 'neutral' && 'text-foreground-secondary'
          )}
        >
          {changeType === 'up' && <ArrowUp className="h-3 w-3" aria-hidden="true" />}
          {change}
        </div>
      )}
    </article>
  );
}

// System status item component
interface SystemItemProps {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  metrics: { label: string; value: string }[];
}

function SystemItem({ name, status, metrics }: SystemItemProps) {
  const statusLabels = {
    healthy: 'Operational',
    warning: 'Warning',
    error: 'Error',
  };

  return (
    <article className="rounded-lg bg-background-secondary p-4" aria-label={`${name}: ${statusLabels[status]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground">{name}</span>
        <StatusDot status={status} />
      </div>
      <div className="flex gap-4">
        {metrics.map((metric) => (
          <span key={metric.label} className="text-[11px] text-foreground-tertiary">
            {metric.label}:{' '}
            <span className="font-mono text-foreground">{metric.value}</span>
          </span>
        ))}
      </div>
    </article>
  );
}

// Alert item component
interface AlertItemProps {
  icon: 'warning' | 'info';
  title: string;
  time: string;
  severity?: 'high' | 'medium' | 'low';
  onClick?: () => void;
}

function AlertItem({ icon, title, time, severity, onClick }: AlertItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-lg bg-background-secondary p-3 text-left transition-colors hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      type="button"
      aria-label={`${title}, ${time}${severity ? `, ${severity} priority` : ''}`}
    >
      <div
        className={cn(
          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
          icon === 'warning' && 'bg-warning/10 text-warning',
          icon === 'info' && 'bg-info/10 text-info'
        )}
      >
        {icon === 'warning' ? (
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Info className="h-4 w-4" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">
          {title}
        </div>
        <div className="font-mono text-[11px] text-foreground-tertiary">{time}</div>
      </div>
      {severity && (
        <Badge
          variant={severity === 'high' ? 'warning' : 'default'}
          size="sm"
        >
          {severity === 'high' ? 'High' : severity}
        </Badge>
      )}
    </button>
  );
}

// Activity item component
interface ActivityItemProps {
  type: 'lock' | 'unlock' | 'prover' | 'system';
  text: string;
  time: string;
}

function ActivityItem({ type, text, time }: ActivityItemProps) {
  const typeLabels = {
    lock: 'Lock transaction',
    unlock: 'Unlock transaction',
    prover: 'Prover activity',
    system: 'System event',
  };

  return (
    <article className="flex gap-3 border-b border-surface-tertiary pb-3 last:border-0 last:pb-0" aria-label={`${typeLabels[type]}: ${text}`}>
      <span
        className={cn(
          'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
          type === 'lock' && 'bg-hinomaru',
          type === 'unlock' && 'bg-gold',
          type === 'prover' && 'bg-info',
          type === 'system' && 'bg-success'
        )}
        aria-hidden="true"
      />
      <div className="flex-1">
        <div className="text-[13px] text-foreground">{text}</div>
        <time className="font-mono text-[11px] text-foreground-tertiary">{time}</time>
      </div>
    </article>
  );
}

// Quick action component
interface QuickActionProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function QuickAction({ href, icon, label }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg border border-surface-tertiary bg-background-secondary p-4 text-center transition-all hover:border-hinomaru hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={label}
    >
      <div className="text-2xl" aria-hidden="true">{icon}</div>
      <span className="text-xs text-foreground-secondary">{label}</span>
    </Link>
  );
}

export function AdminDashboard() {
  const t = useTranslations('admin.dashboard');

  // Mock data - in production, this would come from API
  const stats = {
    tvl: { value: '$847.2M', change: '12.4%', status: 'healthy' as const },
    provers: { value: '127/127', change: '100%', status: 'healthy' as const },
    pendingUnlocks: { value: '23', change: '3', status: 'warning' as const },
    alerts: { value: '5', change: '2', status: 'healthy' as const },
  };

  const systems = [
    {
      name: t('systemStatus.systems.l3Network.name'),
      status: 'healthy' as const,
      metrics: [
        { label: t('systemStatus.systems.l3Network.block'), value: '1,234,567' },
        { label: t('systemStatus.systems.l3Network.tps'), value: '245' },
      ],
    },
    {
      name: t('systemStatus.systems.proverNetwork.name'),
      status: 'healthy' as const,
      metrics: [
        { label: t('systemStatus.systems.proverNetwork.online'), value: '127' },
        { label: t('systemStatus.systems.proverNetwork.queue'), value: '12' },
      ],
    },
    {
      name: t('systemStatus.systems.l1Vault.name'),
      status: 'healthy' as const,
      metrics: [
        { label: t('systemStatus.systems.l1Vault.sync'), value: '100%' },
        { label: t('systemStatus.systems.l1Vault.gas'), value: '45 gwei' },
      ],
    },
    {
      name: t('systemStatus.systems.observerNetwork.name'),
      status: 'healthy' as const,
      metrics: [
        { label: t('systemStatus.systems.observerNetwork.active'), value: '89' },
        { label: t('systemStatus.systems.observerNetwork.challenges'), value: '0' },
      ],
    },
    {
      name: t('systemStatus.systems.apiGateway.name'),
      status: 'healthy' as const,
      metrics: [
        { label: t('systemStatus.systems.apiGateway.latency'), value: '45ms' },
        { label: t('systemStatus.systems.apiGateway.rps'), value: '1.2k' },
      ],
    },
    {
      name: t('systemStatus.systems.securityMonitors.name'),
      status: 'healthy' as const,
      metrics: [
        { label: t('systemStatus.systems.securityMonitors.scans'), value: 'OK' },
        { label: t('systemStatus.systems.securityMonitors.threats'), value: '0' },
      ],
    },
  ];

  const activities = [
    { type: 'lock' as const, text: 'Lock: 15.5 ETH from 0x7a3f...9c2d', time: '2 minutes ago' },
    { type: 'prover' as const, text: 'Prover #42 signed Unlock request', time: '5 minutes ago' },
    { type: 'unlock' as const, text: 'Unlock completed: 8.2 ETH to 0x3b1c...f8a7', time: '12 minutes ago' },
    { type: 'system' as const, text: 'New Prover application submitted', time: '24 minutes ago' },
    { type: 'lock' as const, text: 'Lock: 42.0 ETH from 0x9d2e...1f4b', time: '35 minutes ago' },
  ];

  const alerts = [
    { icon: 'warning' as const, title: t('alerts.items.proverSlaWarning'), time: '10 min ago', severity: 'high' as const },
    { icon: 'warning' as const, title: `${t('alerts.items.largeUnlockRequest')}: 500 ETH`, time: '25 min ago', severity: 'high' as const },
    { icon: 'info' as const, title: t('alerts.items.newProverApplication'), time: '1 hour ago' },
    { icon: 'info' as const, title: t('alerts.items.gasPriceSpike'), time: '2 hours ago' },
    { icon: 'info' as const, title: t('alerts.items.scheduledMaintenance'), time: '3 hours ago' },
  ];

  const quickActions = [
    { href: '/admin/provers', icon: <Shield className="h-6 w-6 text-foreground-secondary" />, label: t('quickActions.reviewProvers') },
    { href: '/admin/tx-monitor', icon: <Radio className="h-6 w-6 text-foreground-secondary" />, label: t('quickActions.txMonitor') },
    { href: '/admin/reports', icon: <BarChart3 className="h-6 w-6 text-foreground-secondary" />, label: t('quickActions.dailyReport') },
    { href: '/admin/audit', icon: <ClipboardList className="h-6 w-6 text-foreground-secondary" />, label: t('quickActions.auditLog') },
  ];

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <LiveIndicator label={t('liveIndicator')} />
            <Button
              variant="danger"
              leftIcon={<AlertTriangle className="h-4 w-4" />}
              asChild
            >
              <Link href="/admin/emergency">{t('emergencyButton')}</Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('stats.tvl.label')}
            value={stats.tvl.value}
            change={`+${stats.tvl.change} ${t('stats.tvl.change')}`}
            changeType="up"
            status={stats.tvl.status}
          />
          <StatCard
            label={t('stats.provers.label')}
            value={stats.provers.value}
            change={`${stats.provers.change} ${t('stats.provers.healthy')}`}
            changeType="up"
            status={stats.provers.status}
          />
          <StatCard
            label={t('stats.pendingUnlocks.label')}
            value={stats.pendingUnlocks.value}
            change={`${stats.pendingUnlocks.change} ${t('stats.pendingUnlocks.attention')}`}
            changeType="neutral"
            status={stats.pendingUnlocks.status}
          />
          <StatCard
            label={t('stats.alerts.label')}
            value={stats.alerts.value}
            change={`${stats.alerts.change} ${t('stats.alerts.highPriority')}`}
            changeType="neutral"
            status={stats.alerts.status}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - System Status & Activity */}
          <div className="space-y-6 lg:col-span-2">
            {/* System Status */}
            <Card padding="none">
              <CardHeader className="flex flex-row items-center justify-between border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('systemStatus.title')}</CardTitle>
                <Badge variant="success">{t('systemStatus.allOperational')}</Badge>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {systems.map((system) => (
                    <SystemItem
                      key={system.name}
                      name={system.name}
                      status={system.status}
                      metrics={system.metrics}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card padding="none">
              <CardHeader className="border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('recentActivity.title')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-3">
                  {activities.map((activity, index) => (
                    <ActivityItem
                      key={index}
                      type={activity.type}
                      text={activity.text}
                      time={activity.time}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* Active Alerts */}
            <Card padding="none">
              <CardHeader className="flex flex-row items-center justify-between border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('alerts.title')}</CardTitle>
                <Badge variant="danger">5</Badge>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <AlertItem
                      key={index}
                      icon={alert.icon}
                      title={alert.title}
                      time={alert.time}
                      severity={alert.severity}
                      onClick={() => {
                        // Alert detail modal would open here
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card padding="none">
              <CardHeader className="border-b border-surface-tertiary px-5 py-4">
                <CardTitle className="text-base">{t('quickActions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <QuickAction
                      key={action.href}
                      href={action.href}
                      icon={action.icon}
                      label={action.label}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
