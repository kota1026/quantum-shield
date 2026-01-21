'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  FileText,
  BarChart3,
  Coins,
  Lock,
  AlertTriangle,
  TrendingUp,
  Clock,
  Unlock,
  AlertCircle,
  ChevronRight,
  Shield,
  Activity,
  BookOpen,
  HelpCircle,
  Zap,
  CheckCircle2,
  ArrowUpRight,
  Vote,
  Wallet,
  Building2,
  FileCheck,
  Calendar,
  Headphones,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { ProverSidebar } from './ProverSidebar';

// Prover type: public or enterprise
type ProverType = 'public' | 'enterprise';

// Mock data
const mockStats = {
  pendingSignatures: 12,
  urgentCount: 4,
  todaysProcessed: 847,
  avgProcessed: 720,
  processedChange: 18,
  responseTime: 28.2,
  responseTimeChange: 2.1,
  slaMaxTime: 30,
  uptime: 99.97,
  slaMinUptime: 99.9,
};

const mockQueueItems = [
  {
    id: 'req-001',
    type: 'unlock',
    address: '0x7a3f...9c2d',
    route: 'L1→L3',
    amount: '5.25',
    time: '2m 34s',
    urgent: true,
  },
  {
    id: 'req-002',
    type: 'unlock',
    address: '0x8b2c...1e5a',
    route: 'L1→L3',
    amount: '12.00',
    time: '4m 12s',
    urgent: true,
  },
  {
    id: 'req-003',
    type: 'emergency',
    address: '0x3d9f...7c4b',
    route: 'Emergency',
    amount: '2.50',
    time: '8m 45s',
    urgent: true,
  },
];

const mockRewards = {
  claimable: 4.82,
  pending: 1.24,
  thisMonth: 12.45,
  allTime: 156.8,
};

const mockStake = {
  amount: 150.0,
  usdValue: 412500,
  status: 'safe',
  challenges: 0,
};

// Mock enterprise contract data
const mockEnterpriseContract = {
  operatorName: 'ACME Corporation',
  contractId: 'ENT-2026-001234',
  plan: 'Enterprise Plus',
  startDate: '2025-06-01',
  endDate: '2026-05-31',
  sla: '99.99%',
  guaranteedRevenue: 24.0, // ETH per month
  supportLevel: '24/7 Premium',
  infrastructureManaged: true,
  contactPerson: '山田 太郎',
  contactEmail: 'yamada@acme.co.jp',
};

export function ProverDashboard() {
  const t = useTranslations('prover');
  const router = useRouter();

  // For demo: toggle between public and enterprise view
  // In production, this would come from user context/API
  const [proverType] = useState<ProverType>('enterprise');

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

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
      <ProverSidebar activePage="dashboard" />

      {/* Main Content */}
      <main id="main-content" className="flex-1 p-8 overflow-y-auto">
        {/* Premium Background Effect */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div
            className={cn(
              'absolute -top-24 left-1/2 -translate-x-1/2',
              'w-[800px] h-[500px]',
              'bg-[radial-gradient(ellipse,rgba(201,169,98,0.08),transparent_60%)]',
              'opacity-50'
            )}
          />
        </div>

        <div className="relative z-10">
          {/* Alert Banner */}
          {mockStats.responseTime > 25 && (
            <div
              className="flex items-center gap-3 p-4 bg-warning/10 border border-warning rounded-xl mb-6"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-warning">{t('dashboard.alert.slaWarning')}</div>
                <div className="text-xs text-foreground-secondary">
                  {t('dashboard.alert.responseTime', { current: '28.2', threshold: '30' })}
                </div>
              </div>
              <Button variant="warning" size="sm" asChild>
                <Link href="/prover/alerts">{t('dashboard.alert.viewAlerts')}</Link>
              </Button>
            </div>
          )}

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
            <p className="text-foreground-secondary">{t('dashboard.welcomeMessage')}</p>
          </div>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8" aria-label="Quick stats">
            {/* Pending Signatures */}
            <Card
              variant="hoverGradient"
              padding="md"
              className="group cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('/prover/queue')}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/prover/queue')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-foreground-tertiary">{t('dashboard.stats.pendingSignatures')}</span>
                {mockStats.urgentCount > 0 && (
                  <Badge variant="danger" className="text-[10px]">
                    {mockStats.urgentCount} urgent
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold font-mono text-hinomaru-400">{mockStats.pendingSignatures}</div>
              <div className="text-xs text-foreground-tertiary mt-1">
                {t('dashboard.stats.urgent', { count: mockStats.urgentCount })}
              </div>
            </Card>

            {/* Today's Processed */}
            <Card
              variant="hoverGradient"
              padding="md"
              className="group cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('/prover/metrics')}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/prover/metrics')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-foreground-tertiary">{t('dashboard.stats.todaysProcessed')}</span>
                <Badge variant="success" className="text-[10px]">
                  <TrendingUp className="h-3 w-3 mr-0.5" aria-hidden="true" />+{mockStats.processedChange}%
                </Badge>
              </div>
              <div className="text-3xl font-bold font-mono">{mockStats.todaysProcessed}</div>
              <div className="text-xs text-foreground-tertiary mt-1">
                {t('dashboard.stats.avgPerDay', { avg: mockStats.avgProcessed })}
              </div>
            </Card>

            {/* Claimable Rewards */}
            <Card
              variant="hoverGradient"
              padding="md"
              className="group cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('/prover/metrics')}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/prover/metrics')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-foreground-tertiary">{t('dashboard.rewards.claimable')}</span>
              </div>
              <div className="text-3xl font-bold font-mono text-success">{mockRewards.claimable} ETH</div>
              <div className="text-xs text-foreground-tertiary mt-1">≈ $13,250 USD</div>
            </Card>

            {/* Uptime */}
            <Card
              variant="hoverGradient"
              padding="md"
              className="group cursor-pointer"
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate('/prover/metrics')}
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('/prover/metrics')}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-foreground-tertiary">{t('dashboard.stats.uptime')}</span>
                <Badge variant="success" className="text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" aria-hidden="true" />
                  SLA OK
                </Badge>
              </div>
              <div className="text-3xl font-bold font-mono">{mockStats.uptime}%</div>
              <div className="text-xs text-foreground-tertiary mt-1">
                {t('dashboard.stats.slaMin', { min: mockStats.slaMinUptime })}
              </div>
            </Card>
          </section>

          {/* Quick Actions Section */}
          <section className="mb-8" aria-label="Quick actions">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-gold" aria-hidden="true" />
                {t('dashboard.quickActions.title')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Process Queue */}
              <Link
                href="/prover/queue"
                className={cn(
                  'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                  'hover:border-hinomaru hover:bg-hinomaru/5 transition-all duration-200',
                  'focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-hinomaru/10 flex items-center justify-center flex-shrink-0 group-hover:bg-hinomaru/20 transition-colors">
                  <FileText className="w-6 h-6 text-hinomaru" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1">{t('dashboard.quickActions.processQueue.title')}</div>
                  <p className="text-sm text-foreground-tertiary line-clamp-2">
                    {t('dashboard.quickActions.processQueue.description', { count: mockStats.pendingSignatures })}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-foreground-tertiary group-hover:text-hinomaru transition-colors flex-shrink-0 mt-2"
                  aria-hidden="true"
                />
              </Link>

              {/* Claim Rewards */}
              <Link
                href="/prover/metrics"
                className={cn(
                  'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                  'hover:border-success hover:bg-success/5 transition-all duration-200',
                  'focus-visible:ring-2 focus-visible:ring-success focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0 group-hover:bg-success/20 transition-colors">
                  <Coins className="w-6 h-6 text-success" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1">{t('dashboard.quickActions.claimRewards.title')}</div>
                  <p className="text-sm text-foreground-tertiary line-clamp-2">
                    {t('dashboard.quickActions.claimRewards.description', { amount: mockRewards.claimable })}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-foreground-tertiary group-hover:text-success transition-colors flex-shrink-0 mt-2"
                  aria-hidden="true"
                />
              </Link>

              {/* View Performance */}
              <Link
                href="/prover/metrics"
                className={cn(
                  'group flex items-start gap-4 p-4 bg-background-secondary border border-border rounded-xl',
                  'hover:border-gold hover:bg-gold/5 transition-all duration-200',
                  'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                  <BarChart3 className="w-6 h-6 text-gold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1">{t('dashboard.quickActions.viewMetrics.title')}</div>
                  <p className="text-sm text-foreground-tertiary line-clamp-2">
                    {t('dashboard.quickActions.viewMetrics.description')}
                  </p>
                </div>
                <ChevronRight
                  className="w-5 h-5 text-foreground-tertiary group-hover:text-gold transition-colors flex-shrink-0 mt-2"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </section>

          {/* Main Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Signature Queue Preview */}
              <Card padding="none" className="overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-border">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-hinomaru" aria-hidden="true" />
                    {t('dashboard.queue.title')}
                  </h2>
                  <Link
                    href="/prover/queue"
                    className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
                  >
                    {t('dashboard.viewAll')}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="p-6">
                  <ul className="divide-y divide-border" role="list">
                    {mockQueueItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavigate('/prover/queue')}
                          className="flex items-center gap-4 py-4 w-full text-left hover:bg-background-secondary -mx-6 px-6 transition-colors"
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              item.type === 'emergency' ? 'bg-warning/10' : 'bg-hinomaru/10'
                            )}
                          >
                            {item.type === 'emergency' ? (
                              <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
                            ) : (
                              <Unlock className="h-5 w-5 text-hinomaru" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">
                              {item.type === 'emergency'
                                ? t('dashboard.queue.emergencyUnlock')
                                : t('dashboard.queue.unlockRequest')}
                            </div>
                            <div className="text-xs text-foreground-tertiary font-mono">
                              {item.address} • {item.amount} ETH
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={cn(
                                'text-xs font-mono flex items-center gap-1',
                                item.urgent ? 'text-warning' : 'text-foreground-tertiary'
                              )}
                            >
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {item.time}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <Button variant="primary" className="w-full mt-4" asChild>
                    <Link href="/prover/queue">{t('dashboard.actions.processQueue')}</Link>
                  </Button>
                </div>
              </Card>

              {/* Performance Overview */}
              <Card padding="none" className="overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-border">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-gold" aria-hidden="true" />
                    {t('dashboard.performance.title')}
                  </h2>
                  <Link
                    href="/prover/metrics"
                    className="text-sm text-foreground-tertiary hover:text-gold transition-colors flex items-center gap-1"
                  >
                    {t('dashboard.details')}
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-background-secondary rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-2">{t('dashboard.performance.responseTime')}</div>
                      <div className="text-2xl font-bold font-mono">
                        {mockStats.responseTime}
                        <span className="text-sm text-foreground-secondary ml-1">s</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            mockStats.responseTime > 28 ? 'bg-warning' : 'bg-success'
                          )}
                          style={{ width: `${(mockStats.responseTime / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-background-secondary rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-2">{t('dashboard.performance.successRate')}</div>
                      <div className="text-2xl font-bold font-mono text-success">
                        99.8<span className="text-sm text-foreground-secondary ml-1">%</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: '99.8%' }} />
                      </div>
                    </div>
                    <div className="p-4 bg-background-secondary rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-2">{t('dashboard.performance.uptime')}</div>
                      <div className="text-2xl font-bold font-mono text-success">
                        {mockStats.uptime}<span className="text-sm text-foreground-secondary ml-1">%</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: `${mockStats.uptime}%` }} />
                      </div>
                    </div>
                    <div className="p-4 bg-background-secondary rounded-lg">
                      <div className="text-xs text-foreground-tertiary mb-2">{t('dashboard.performance.hsmHealth')}</div>
                      <div className="text-2xl font-bold font-mono text-success flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Healthy
                      </div>
                      <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-success" style={{ width: '100%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Enterprise Contract Info Card - Only shown for enterprise provers */}
              {proverType === 'enterprise' && (
                <Card padding="none" className="overflow-hidden border-gold">
                  <div className="p-6 bg-gradient-to-br from-gold/10 to-transparent">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-gold" aria-hidden="true" />
                        <span className="text-sm font-semibold">{t('dashboard.enterprise.contract.title')}</span>
                      </div>
                      <Badge variant="gold" className="text-[10px]">
                        {mockEnterpriseContract.plan}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {/* Operator Info */}
                      <div className="flex items-center gap-3 pb-4 border-b border-surface-tertiary">
                        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{mockEnterpriseContract.operatorName}</div>
                          <div className="text-xs text-foreground-tertiary font-mono">{mockEnterpriseContract.contractId}</div>
                        </div>
                      </div>

                      {/* Contract Details */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-background/50 rounded-lg">
                          <div className="text-[10px] text-foreground-tertiary mb-1">{t('dashboard.enterprise.contract.sla')}</div>
                          <div className="text-sm font-bold text-success">{mockEnterpriseContract.sla}</div>
                        </div>
                        <div className="p-3 bg-background/50 rounded-lg">
                          <div className="text-[10px] text-foreground-tertiary mb-1">{t('dashboard.enterprise.contract.guaranteedRevenue')}</div>
                          <div className="text-sm font-bold text-gold">{mockEnterpriseContract.guaranteedRevenue} ETH/mo</div>
                        </div>
                      </div>

                      {/* Contract Period */}
                      <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{mockEnterpriseContract.startDate} 〜 {mockEnterpriseContract.endDate}</span>
                      </div>

                      {/* Support & Infrastructure */}
                      <div className="space-y-2 pt-3 border-t border-surface-tertiary">
                        <div className="flex items-center gap-2 text-xs">
                          <Headphones className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                          <span className="text-foreground-secondary">{t('dashboard.enterprise.contract.support')}:</span>
                          <span className="font-semibold text-gold">{mockEnterpriseContract.supportLevel}</span>
                        </div>
                        {mockEnterpriseContract.infrastructureManaged && (
                          <div className="flex items-center gap-2 text-xs">
                            <Server className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                            <span className="text-success font-semibold">{t('dashboard.enterprise.contract.managedInfra')}</span>
                          </div>
                        )}
                      </div>

                      {/* Contact Person */}
                      <div className="flex items-center justify-between pt-3 border-t border-surface-tertiary">
                        <div className="text-xs text-foreground-tertiary">
                          {t('dashboard.enterprise.contract.contact')}: {mockEnterpriseContract.contactPerson}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href="/enterprise/support">{t('dashboard.enterprise.contract.contactSupport')}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Stake Info Card */}
              <Card padding="none" className="overflow-hidden border-gold">
                <div className="p-6 bg-gradient-to-br from-gold/5 to-transparent">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="h-5 w-5 text-gold" aria-hidden="true" />
                    <span className="text-sm font-semibold">{t('dashboard.stake.title')}</span>
                  </div>
                  <div className="text-3xl font-bold font-mono mb-1">{mockStake.amount.toFixed(2)} ETH</div>
                  <div className="text-sm text-foreground-tertiary mb-4">≈ ${mockStake.usdValue.toLocaleString()} USD</div>
                  <div className="flex items-center gap-2 pt-3 border-t border-surface-tertiary">
                    <div className="w-2 h-2 bg-success rounded-full" aria-hidden="true" />
                    <span className="text-xs text-success">
                      {t('dashboard.stake.noRisk', { challenges: mockStake.challenges })}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Rewards Card */}
              <Card padding="none" className="overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-border">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Coins className="w-5 h-5 text-success" aria-hidden="true" />
                    {t('dashboard.rewards.title')}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-br from-background-secondary to-success/5 border border-success rounded-xl p-6 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-foreground-secondary">{t('dashboard.rewards.claimable')}</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-success mb-1">{mockRewards.claimable} ETH</div>
                    <div className="text-xs text-foreground-tertiary">≈ $13,250 USD</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-background-secondary rounded-lg">
                      <div className="text-[11px] text-foreground-tertiary mb-1">{t('dashboard.rewards.thisMonth')}</div>
                      <div className="text-base font-bold font-mono">{mockRewards.thisMonth} ETH</div>
                    </div>
                    <div className="p-3 bg-background-secondary rounded-lg">
                      <div className="text-[11px] text-foreground-tertiary mb-1">{t('dashboard.rewards.allTime')}</div>
                      <div className="text-base font-bold font-mono">{mockRewards.allTime} ETH</div>
                    </div>
                  </div>
                  <Button variant="success" className="w-full" asChild>
                    <Link href="/prover/metrics">
                      {t('dashboard.rewards.claimAmount', { amount: mockRewards.claimable })}
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* Ecosystem Links */}
              <Card padding="none" className="overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <ArrowUpRight className="w-5 h-5 text-gold" aria-hidden="true" />
                    {t('dashboard.ecosystem.title')}
                  </h3>
                  <p className="text-xs text-foreground-tertiary mb-4">{t('dashboard.ecosystem.description')}</p>
                  <div className="space-y-3">
                    <Link
                      href="/token-hub/dashboard"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-hinomaru/5 to-transparent border border-hinomaru/30 rounded-lg hover:border-hinomaru transition-colors"
                    >
                      <div className="w-8 h-8 bg-hinomaru/10 rounded-lg flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-hinomaru" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{t('dashboard.ecosystem.tokenHub')}</span>
                        <p className="text-xs text-foreground-tertiary">{t('dashboard.ecosystem.tokenHubDesc')}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/governance/landing"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-gold/5 to-transparent border border-gold/30 rounded-lg hover:border-gold transition-colors"
                    >
                      <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
                        <Vote className="w-4 h-4 text-gold" aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium">{t('dashboard.ecosystem.governance')}</span>
                        <p className="text-xs text-foreground-tertiary">{t('dashboard.ecosystem.governanceDesc')}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Help Section */}
              <Card padding="none" className="overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-foreground-tertiary" aria-hidden="true" />
                    {t('dashboard.help.title')}
                  </h3>
                  <div className="space-y-3">
                    <Link
                      href="/prover/requirements"
                      className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg hover:bg-surface transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
                      <span className="text-sm">{t('dashboard.help.requirements')}</span>
                      <ChevronRight className="w-4 h-4 text-foreground-tertiary ml-auto" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/prover/terms"
                      className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg hover:bg-surface transition-colors"
                    >
                      <Shield className="w-4 h-4 text-foreground-tertiary" aria-hidden="true" />
                      <span className="text-sm">{t('dashboard.help.terms')}</span>
                      <ChevronRight className="w-4 h-4 text-foreground-tertiary ml-auto" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
