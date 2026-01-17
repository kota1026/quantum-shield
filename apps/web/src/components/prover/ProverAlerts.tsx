'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Coins,
  Bell,
  Lock,
  Swords,
  LogOut,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Plus,
  Wallet,
  DoorOpen,
  ChartBar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data
const mockAlerts = [
  {
    id: 1,
    type: 'critical' as const,
    title: 'signatureTimeout',
    timestamp: '2026/01/17 15:32',
    requestId: 'REQ-789012',
    description: 'signatureTimeoutDesc',
    remainingTime: 45,
    resolved: false,
  },
  {
    id: 2,
    type: 'warning' as const,
    title: 'systemResource',
    timestamp: '2026/01/17 14:15',
    server: 'prover-node-01',
    description: 'systemResourceDesc',
    cpuUsage: 82,
    resolved: false,
  },
  {
    id: 3,
    type: 'info' as const,
    title: 'maintenanceComplete',
    timestamp: '2026/01/16 03:00',
    description: 'maintenanceCompleteDesc',
    resolved: true,
  },
];

const mockStakeData = {
  currentStake: 400000,
  unlockDate: '2026/09/20',
  daysRemaining: 183,
  totalRewards: 47520,
  annualRate: 15.8,
  totalSlashing: 0,
  violations30d: 0,
  slaRate: 100,
  potentialSlashing: 0,
  riskLevel: 5,
};

const mockSlashingTable = [
  { violations: 1, rate: 10, loss: 40000 },
  { violations: 2, rate: 40, loss: 160000 },
  { violations: 3, rate: 90, loss: 360000 },
  { violations: 4, rate: 100, loss: 'full' },
];

type TabType = 'alerts' | 'stake';
type FilterType = 'all' | 'critical' | 'warning' | 'info';

export function ProverAlerts() {
  const t = useTranslations('prover');
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [alertFilter, setAlertFilter] = useState<FilterType>('all');

  const navItems = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/prover/dashboard' },
    { key: 'queue', icon: FileText, href: '/prover/queue', badge: 12 },
    { key: 'metrics', icon: BarChart3, href: '/prover/metrics' },
    { key: 'rewards', icon: Coins, href: '/prover/rewards' },
  ];

  const managementItems = [
    { key: 'alerts', icon: Bell, href: '/prover/alerts', badge: 2, badgeVariant: 'warning' as const, active: true },
    { key: 'stake', icon: Lock, href: '/prover/stake' },
    { key: 'challenges', icon: Swords, href: '/prover/challenges' },
  ];

  const filteredAlerts = mockAlerts.filter((alert) => {
    if (alertFilter === 'all') return true;
    return alert.type === alertFilter;
  });

  const alertCounts = {
    critical: mockAlerts.filter((a) => a.type === 'critical' && !a.resolved).length,
    warning: mockAlerts.filter((a) => a.type === 'warning' && !a.resolved).length,
    info: mockAlerts.filter((a) => a.type === 'info' && !a.resolved).length,
  };

  const getAlertIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-danger" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />;
      case 'info':
        return <Info className="h-5 w-5 text-info" aria-hidden="true" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-hinomaru focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside className="w-64 bg-background-secondary border-r border-surface-tertiary p-6 flex flex-col">
        <Link href="/prover/landing" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 relative flex items-center justify-center">
            <div
              className="absolute inset-0 border-[1.5px] border-gold rounded-full animate-spin"
              style={{ animationDuration: '25s' }}
            />
            <div className="w-5 h-5 bg-hinomaru rounded-full shadow-glow-hinomaru" />
          </div>
          <div>
            <div className="text-base font-semibold">Quantum Shield</div>
            <div className="text-[10px] text-gold tracking-[1px]">Prover Portal</div>
          </div>
        </Link>

        <nav className="flex-1" aria-label={t('dashboard.nav.operations')}>
          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2">
            {t('dashboard.nav.operations')}
          </div>
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground mb-1 transition-colors"
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant="danger" className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
            {t('dashboard.nav.management')}
          </div>
          {managementItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${
                item.active
                  ? 'bg-hinomaru/10 text-hinomaru-400'
                  : 'text-foreground-secondary hover:bg-surface hover:text-foreground'
              }`}
              aria-current={item.active ? 'page' : undefined}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {t(`dashboard.nav.${item.key}`)}
              {item.badge && (
                <Badge variant={item.badgeVariant || 'danger'} className="ml-auto text-[11px] px-2 py-0.5">
                  {item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-[1.5px] text-foreground-tertiary px-3 mb-2 mt-6">
            {t('dashboard.nav.account')}
          </div>
          <Link
            href="/prover/exit"
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            {t('dashboard.nav.exit')}
          </Link>
        </nav>

        {/* Prover Status */}
        <div className="mt-auto p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse" aria-hidden="true" />
            <div>
              <div className="text-sm font-semibold">Prover #047</div>
              <div className="text-[11px] text-gold">Tier 1 • Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t('alerts.title')}</h1>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex gap-1 mb-6 bg-background-secondary p-1 rounded-xl w-fit"
          role="tablist"
          aria-label={t('alerts.tabs')}
        >
          <button
            role="tab"
            aria-selected={activeTab === 'alerts'}
            aria-controls="alerts-panel"
            onClick={() => setActiveTab('alerts')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'alerts' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            🔔 {t('alerts.tab.alerts')}
            <Badge variant="danger" className="text-[11px] px-2 py-0.5">
              {alertCounts.critical + alertCounts.warning}
            </Badge>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'stake'}
            aria-controls="stake-panel"
            onClick={() => setActiveTab('stake')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'stake' ? 'bg-hinomaru text-white' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            💰 {t('alerts.tab.stake')}
          </button>
        </div>

        {/* Alerts Tab */}
        <div
          id="alerts-panel"
          role="tabpanel"
          aria-labelledby="alerts-tab"
          className={activeTab === 'alerts' ? '' : 'hidden'}
        >
          {/* Alert Filters */}
          <div className="flex gap-3 mb-6" role="group" aria-label={t('alerts.filterLabel')}>
            <button
              onClick={() => setAlertFilter('all')}
              aria-pressed={alertFilter === 'all'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                alertFilter === 'all'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-surface-tertiary text-foreground-secondary hover:text-foreground'
              }`}
            >
              {t('alerts.filter.all')}
            </button>
            <button
              onClick={() => setAlertFilter('critical')}
              aria-pressed={alertFilter === 'critical'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                alertFilter === 'critical'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-surface-tertiary text-foreground-secondary hover:text-foreground'
              }`}
            >
              {t('alerts.filter.critical')} ({alertCounts.critical})
            </button>
            <button
              onClick={() => setAlertFilter('warning')}
              aria-pressed={alertFilter === 'warning'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                alertFilter === 'warning'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-surface-tertiary text-foreground-secondary hover:text-foreground'
              }`}
            >
              {t('alerts.filter.warning')} ({alertCounts.warning})
            </button>
            <button
              onClick={() => setAlertFilter('info')}
              aria-pressed={alertFilter === 'info'}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                alertFilter === 'info'
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-surface-tertiary text-foreground-secondary hover:text-foreground'
              }`}
            >
              {t('alerts.filter.info')} ({alertCounts.info})
            </button>
          </div>

          {/* Alert List */}
          <div className="space-y-4" role="list" aria-label={t('alerts.listLabel')}>
            {filteredAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={`p-5 border-l-4 ${
                  alert.type === 'critical'
                    ? 'border-l-danger'
                    : alert.type === 'warning'
                      ? 'border-l-warning'
                      : 'border-l-info'
                } ${alert.resolved ? 'opacity-60' : ''}`}
                role="listitem"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        alert.type === 'critical'
                          ? 'bg-danger/20'
                          : alert.type === 'warning'
                            ? 'bg-warning/20'
                            : 'bg-info/20'
                      }`}
                    >
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{t(`alerts.items.${alert.title}.title`)}</h3>
                      <div className="flex gap-3 text-xs text-foreground-tertiary mt-1">
                        <span>{alert.timestamp}</span>
                        {alert.requestId && <span>{t('alerts.requestId')}: {alert.requestId}</span>}
                        {alert.server && <span>{t('alerts.server')}: {alert.server}</span>}
                        {alert.resolved && <span>{t('alerts.resolved')}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={alert.resolved ? 'success' : alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'}
                    className="text-[11px]"
                  >
                    {alert.resolved ? t('alerts.status.resolved') : t(`alerts.severity.${alert.type}`)}
                  </Badge>
                </div>

                <div className="p-4 bg-background rounded-lg mb-4">
                  <p className="text-sm text-foreground-secondary">
                    {t(`alerts.items.${alert.title}.description`)}
                    {alert.remainingTime && (
                      <strong className="text-danger ml-1">
                        {t('alerts.remainingTime')}: {alert.remainingTime}{t('alerts.seconds')}
                      </strong>
                    )}
                    {alert.cpuUsage && (
                      <strong className="text-warning ml-1">
                        {t('alerts.cpuUsage')}: {alert.cpuUsage}%
                      </strong>
                    )}
                  </p>
                </div>

                {!alert.resolved && (
                  <div className="flex gap-3">
                    <Button variant="primary" size="sm">
                      {t(`alerts.items.${alert.title}.action`)}
                    </Button>
                    <Button variant="outline" size="sm">
                      {t('alerts.viewDetails')}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Stake Management Tab */}
        <div
          id="stake-panel"
          role="tabpanel"
          aria-labelledby="stake-tab"
          className={activeTab === 'stake' ? '' : 'hidden'}
        >
          {/* Stake Overview */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="p-5 border-gold bg-gradient-to-br from-gold/10 to-transparent">
              <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.currentStake')}</div>
              <div className="text-2xl font-bold font-mono text-gold">
                ${mockStakeData.currentStake.toLocaleString()}
              </div>
              <div className="text-xs text-foreground-tertiary mt-1">{t('alerts.stake.meetsMinimum')}</div>
            </Card>
            <Card className="p-5">
              <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.unlockDate')}</div>
              <div className="text-2xl font-bold font-mono">{mockStakeData.unlockDate}</div>
              <div className="text-xs text-foreground-tertiary mt-1">
                {t('alerts.stake.daysRemaining', { days: mockStakeData.daysRemaining })}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.totalRewards')}</div>
              <div className="text-2xl font-bold font-mono text-success">
                ${mockStakeData.totalRewards.toLocaleString()}
              </div>
              <div className="text-xs text-foreground-tertiary mt-1">
                {t('alerts.stake.annualRate', { rate: mockStakeData.annualRate })}
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.totalSlashing')}</div>
              <div className="text-2xl font-bold font-mono">${mockStakeData.totalSlashing}</div>
              <div className="text-xs text-foreground-tertiary mt-1">{t('alerts.stake.noViolations')} ✓</div>
            </Card>
          </div>

          {/* Risk Meter */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <ChartBar className="h-5 w-5" aria-hidden="true" />
              {t('alerts.risk.title')}
            </h3>

            {/* Risk Bar */}
            <div className="relative mb-4">
              <div
                className="h-6 rounded-xl bg-gradient-to-r from-success via-warning to-danger"
                role="progressbar"
                aria-valuenow={mockStakeData.riskLevel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('alerts.risk.level')}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-background border-[3px] border-white rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ left: `${mockStakeData.riskLevel}%`, transform: 'translate(-50%, -50%)' }}
              >
                {mockStakeData.riskLevel === 0 ? '0' : mockStakeData.riskLevel}
              </div>
            </div>
            <div className="flex justify-between text-xs text-foreground-tertiary mb-6">
              <span>{t('alerts.risk.low')}</span>
              <span>{t('alerts.risk.medium')}</span>
              <span>{t('alerts.risk.high')}</span>
            </div>

            {/* Risk Details */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.risk.violations30d')}</div>
                <div className="font-semibold text-success">{mockStakeData.violations30d}{t('alerts.risk.count')}</div>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.risk.slaRate')}</div>
                <div className="font-semibold text-success">{mockStakeData.slaRate}%</div>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.risk.potentialSlashing')}</div>
                <div className="font-semibold">${mockStakeData.potentialSlashing}</div>
              </div>
            </div>
          </Card>

          {/* Quadratic Slashing Warning */}
          <Card className="p-6 mb-6 border-hinomaru bg-gradient-to-br from-hinomaru/10 to-transparent">
            <h3 className="text-lg font-semibold mb-4 text-hinomaru flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              {t('alerts.slashing.title')}
            </h3>
            <p className="text-sm text-foreground-secondary mb-4">{t('alerts.slashing.description')}</p>

            {/* Formula */}
            <div className="p-4 bg-background rounded-xl text-center mb-4">
              <div className="text-xl font-mono text-gold mb-1">{t('alerts.slashing.formula')}</div>
              <div className="text-sm text-foreground-tertiary">{t('alerts.slashing.formulaDesc')}</div>
            </div>

            {/* Slashing Table */}
            <table className="w-full" role="grid" aria-label={t('alerts.slashing.tableLabel')}>
              <thead>
                <tr className="border-b border-surface-tertiary">
                  <th className="pb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('alerts.slashing.violations')}
                  </th>
                  <th className="pb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('alerts.slashing.rate')}
                  </th>
                  <th className="pb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-foreground-tertiary">
                    {t('alerts.slashing.loss400k')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockSlashingTable.map((row) => (
                  <tr key={row.violations} className="border-b border-surface-tertiary">
                    <td className="py-3 text-center text-sm">
                      {row.violations >= 4 ? t('alerts.slashing.fourPlus') : `${row.violations}${t('alerts.slashing.times')}`}
                    </td>
                    <td className="py-3 text-center text-sm font-semibold text-danger">{row.rate}%</td>
                    <td className="py-3 text-center text-sm font-semibold text-danger">
                      {row.loss === 'full' ? t('alerts.slashing.fullConfiscation') : `$${row.loss.toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Stake Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">{t('alerts.actions.title')}</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-5 bg-background rounded-xl border border-surface-tertiary hover:border-gold transition-colors text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-success/20 rounded-xl flex items-center justify-center">
                  <Plus className="h-6 w-6 text-success" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('alerts.actions.addStake.title')}</h4>
                <p className="text-sm text-foreground-tertiary mb-4">{t('alerts.actions.addStake.description')}</p>
                <Button variant="success" className="w-full">
                  {t('alerts.actions.addStake.button')}
                </Button>
              </div>

              <div className="p-5 bg-background rounded-xl border border-surface-tertiary hover:border-gold transition-colors text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-gold/20 rounded-xl flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-gold" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('alerts.actions.withdrawRewards.title')}</h4>
                <p className="text-sm text-foreground-tertiary mb-4">{t('alerts.actions.withdrawRewards.description')}</p>
                <Button variant="outline" className="w-full border-gold text-gold hover:bg-gold/10">
                  {t('alerts.actions.withdrawRewards.button')}
                </Button>
              </div>

              <div className="p-5 bg-background rounded-xl border border-surface-tertiary hover:border-gold transition-colors text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-danger/20 rounded-xl flex items-center justify-center">
                  <DoorOpen className="h-6 w-6 text-danger" aria-hidden="true" />
                </div>
                <h4 className="font-semibold mb-2">{t('alerts.actions.exit.title')}</h4>
                <p className="text-sm text-foreground-tertiary mb-4">{t('alerts.actions.exit.description')}</p>
                <Link href="/prover/exit">
                  <Button variant="outline" className="w-full border-danger text-danger hover:bg-danger/10">
                    {t('alerts.actions.exit.button')}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
