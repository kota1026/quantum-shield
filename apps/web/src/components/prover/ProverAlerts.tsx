'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  Plus,
  Wallet,
  DoorOpen,
  ChartBar,
  HelpCircle,
  CheckCircle2,
  Shield,
  Bell,
  X,
  Clock,
  Server,
  FileText,
  Building2,
  Headphones,
  Percent,
} from 'lucide-react';

// Prover type: public or enterprise
type ProverType = 'public' | 'enterprise';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, usePathname } from '@/i18n/navigation';
import { ProverSidebar } from './ProverSidebar';
import { cn } from '@/lib/utils';
import { useProverAlerts, useStakeData } from '@/hooks/prover';
import type { ProverAlert } from '@/lib/api/prover/mock';

// Fallback data (used when API is unavailable)
const FALLBACK_ALERTS = [
  {
    id: 1,
    type: 'critical' as const,
    title: 'signatureTimeout',
    timestamp: '2026-01-17 14:32:15',
    description: 'Signature timeout alert',
    requestId: 'REQ-2026-0001',
    remainingTime: 120,
    resolved: false,
  },
  {
    id: 2,
    type: 'warning' as const,
    title: 'systemResource',
    timestamp: '2026-01-17 13:45:00',
    description: 'System resource alert',
    server: 'prover-node-01',
    cpuUsage: 85,
    resolved: false,
  },
  {
    id: 3,
    type: 'info' as const,
    title: 'maintenance',
    timestamp: '2026-01-16 09:00:00',
    description: 'Maintenance completed',
    resolved: true,
  },
];
const FALLBACK_STAKE_DATA = {
  currentStake: 400000,
  unlockDate: '2026-07-17',
  daysRemaining: 180,
  totalRewards: 47520,
  annualRate: 15.2,
  totalSlashing: 0,
  riskLevel: 0,
  violations30d: 0,
  slaRate: 99.8,
  potentialSlashing: 0,
};

const mockSlashingTable = [
  { violations: 1, rate: 10, loss: 40000 },
  { violations: 2, rate: 40, loss: 160000 },
  { violations: 3, rate: 90, loss: 360000 },
  { violations: 4, rate: 100, loss: 'full' },
];

// Enterprise-specific stake data
const mockEnterpriseStakeData = {
  operatorName: 'ACME Corporation',
  plan: 'Enterprise Plus',
  stakeRequirement: {
    type: 'flexible', // 'flexible' | 'waived' | 'reduced'
    minimumRequired: 100000, // $100k vs $400k for public
    currentStake: 150000,
    operatorContribution: 50000, // Operator contributes part
    personalContribution: 100000,
  },
  slashingProtection: {
    enabled: true,
    coverageRate: 50, // 50% of slashing covered by operator
    maxCoverage: 50000, // Max $50k coverage
  },
  contractTerms: {
    unlockPeriod: 90, // 90 days vs 180 days for public
    earlyExitPenalty: 5, // 5% vs 10% for public
  },
};

type TabType = 'alerts' | 'stake';
type FilterType = 'all' | 'critical' | 'warning' | 'info';
type AlertItem = ProverAlert;

export function ProverAlerts() {
  const t = useTranslations('prover');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [alertFilter, setAlertFilter] = useState<FilterType>('all');
  const [showAddStakeModal, setShowAddStakeModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('0x742d...8bD34');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  // For demo: toggle between public and enterprise view
  const [proverType] = useState<ProverType>('enterprise');
  const [completedAction, setCompletedAction] = useState<'stake' | 'withdraw' | null>(null);

  // Fetch data using hooks
  const { data: alertsApi } = useProverAlerts();
  const { data: stakeDataApi } = useStakeData();

  // Use API data with fallback
  const alerts = alertsApi ?? FALLBACK_ALERTS;
  const stakeData = stakeDataApi ?? FALLBACK_STAKE_DATA;

  // Handle URL query params for tab switching
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'alerts' || tab === 'stake') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAlertAction = (alertTitle: string) => {
    // Navigate to queue for signature-related alerts
    if (alertTitle === 'signatureTimeout') {
      router.push('/prover/queue');
    } else if (alertTitle === 'systemResource') {
      // Show alert or navigate to system status
      alert(t('alerts.actions.checkingResources'));
    }
  };

  const handleViewDetails = (alert: AlertItem) => {
    setSelectedAlert(alert);
  };

  const handleAddStake = () => {
    const amount = parseFloat(stakeAmount);
    if (stakeAmount && !isNaN(amount) && amount >= 1000) {
      // Show processing state
      setIsProcessing(true);
      setShowAddStakeModal(false);

      // Simulate blockchain transaction
      setTimeout(() => {
        setIsProcessing(false);
        setIsComplete(true);
        setCompletedAction('stake');
        setStakeAmount('');
      }, 2000);
    }
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (withdrawAmount && !isNaN(amount) && amount > 0 && amount <= stakeData.totalRewards) {
      // Show processing state
      setIsProcessing(true);
      setShowWithdrawModal(false);

      // Simulate blockchain transaction
      setTimeout(() => {
        setIsProcessing(false);
        setIsComplete(true);
        setCompletedAction('withdraw');
        setWithdrawAmount('');
      }, 2000);
    }
  };

  const handleCloseComplete = () => {
    setIsComplete(false);
    setCompletedAction(null);
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (alertFilter === 'all') return true;
    return alert.type === alertFilter;
  });

  const alertCounts = {
    critical: alerts.filter((a) => a.type === 'critical' && !a.resolved).length,
    warning: alerts.filter((a) => a.type === 'warning' && !a.resolved).length,
    info: alerts.filter((a) => a.type === 'info' && !a.resolved).length,
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
      <ProverSidebar activePage="alerts" />

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
          {/* Page Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">{t('alerts.title')}</h1>
              <p className="text-foreground-secondary mt-1">{t('alerts.description')}</p>
            </div>
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
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px] ${
                activeTab === 'alerts' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {t('alerts.tab.alerts')}
              {alertCounts.critical + alertCounts.warning > 0 && (
                <Badge variant="danger" className="text-[11px] px-2 py-0.5">
                  {alertCounts.critical + alertCounts.warning}
                </Badge>
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'stake'}
              aria-controls="stake-panel"
              onClick={() => setActiveTab('stake')}
              className={`px-5 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 min-h-[44px] ${
                activeTab === 'stake' ? 'bg-gold text-background' : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              {t('alerts.tab.stake')}
            </button>
          </div>

          {/* Alerts Tab */}
          <div
            id="alerts-panel"
            role="tabpanel"
            aria-labelledby="alerts-tab"
            className={activeTab === 'alerts' ? '' : 'hidden'}
          >
            {/* What are alerts section */}
            <Card className="p-5 mb-6 bg-gradient-to-r from-info/5 to-transparent border-info/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-info" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('alerts.whatIsAlert.title')}</h3>
                  <p className="text-sm text-foreground-secondary">{t('alerts.whatIsAlert.description')}</p>
                </div>
              </div>
            </Card>

            {/* Alert Filters */}
            <div className="flex gap-3 mb-6" role="group" aria-label={t('alerts.filterLabel')}>
              <button
                onClick={() => setAlertFilter('all')}
                aria-pressed={alertFilter === 'all'}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
                  alertFilter === 'all'
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-surface-tertiary text-foreground-secondary hover:text-foreground hover:border-foreground-tertiary'
                }`}
              >
                {t('alerts.filter.all')}
              </button>
              <button
                onClick={() => setAlertFilter('critical')}
                aria-pressed={alertFilter === 'critical'}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
                  alertFilter === 'critical'
                    ? 'border-danger text-danger bg-danger/10'
                    : 'border-surface-tertiary text-foreground-secondary hover:text-foreground hover:border-foreground-tertiary'
                }`}
              >
                <AlertCircle className="inline-block h-4 w-4 mr-1" aria-hidden="true" />
                {t('alerts.filter.critical')} ({alertCounts.critical})
              </button>
              <button
                onClick={() => setAlertFilter('warning')}
                aria-pressed={alertFilter === 'warning'}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
                  alertFilter === 'warning'
                    ? 'border-warning text-warning bg-warning/10'
                    : 'border-surface-tertiary text-foreground-secondary hover:text-foreground hover:border-foreground-tertiary'
                }`}
              >
                <AlertTriangle className="inline-block h-4 w-4 mr-1" aria-hidden="true" />
                {t('alerts.filter.warning')} ({alertCounts.warning})
              </button>
              <button
                onClick={() => setAlertFilter('info')}
                aria-pressed={alertFilter === 'info'}
                className={`px-4 py-2.5 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
                  alertFilter === 'info'
                    ? 'border-info text-info bg-info/10'
                    : 'border-surface-tertiary text-foreground-secondary hover:text-foreground hover:border-foreground-tertiary'
                }`}
              >
                <Info className="inline-block h-4 w-4 mr-1" aria-hidden="true" />
                {t('alerts.filter.info')} ({alertCounts.info})
              </button>
            </div>

            {/* Alert List */}
            <div className="space-y-4" role="list" aria-label={t('alerts.listLabel')}>
              {filteredAlerts.length === 0 ? (
                <Card className="p-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-success" aria-hidden="true" />
                  <h3 className="text-lg font-semibold mb-2">{t('alerts.empty.title')}</h3>
                  <p className="text-foreground-secondary">{t('alerts.empty.description')}</p>
                </Card>
              ) : (
                filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    variant="hoverGradient"
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
                            {alert.resolved && (
                              <span className="text-success flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {t('alerts.resolved')}
                              </span>
                            )}
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
                      {!alert.resolved && (
                        <p className="text-sm text-gold mt-2">
                          💡 {t(`alerts.items.${alert.title}.hint`)}
                        </p>
                      )}
                    </div>

                    {!alert.resolved && (
                      <div className="flex gap-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAlertAction(alert.title)}
                        >
                          {t(`alerts.items.${alert.title}.action`)}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(alert)}
                        >
                          {t('alerts.viewDetails')}
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Stake Management Tab */}
          <div
            id="stake-panel"
            role="tabpanel"
            aria-labelledby="stake-tab"
            className={activeTab === 'stake' ? '' : 'hidden'}
          >
            {/* Enterprise Stake Benefits Card */}
            {proverType === 'enterprise' && (
              <Card className="p-6 mb-6 border-gold bg-gradient-to-br from-gold/10 to-transparent">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-gold" aria-hidden="true" />
                    <div>
                      <h2 className="font-semibold">{t('alerts.enterprise.stakeTitle')}</h2>
                      <div className="text-xs text-foreground-secondary">
                        {mockEnterpriseStakeData.operatorName} • {mockEnterpriseStakeData.plan}
                      </div>
                    </div>
                  </div>
                  <Badge variant="gold">{t('alerts.enterprise.reducedRequirements')}</Badge>
                </div>

                {/* Stake Breakdown */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="p-3 bg-background/50 rounded-lg">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.enterprise.minimumRequired')}</div>
                    <div className="text-lg font-bold text-success">
                      ${mockEnterpriseStakeData.stakeRequirement.minimumRequired.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-foreground-tertiary">{t('alerts.enterprise.vsPublic')}</div>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.enterprise.operatorContribution')}</div>
                    <div className="text-lg font-bold font-mono text-gold">
                      ${mockEnterpriseStakeData.stakeRequirement.operatorContribution.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-foreground-tertiary">{t('alerts.enterprise.partialCoverage')}</div>
                  </div>
                  <div className="p-3 bg-background/50 rounded-lg">
                    <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.enterprise.yourStake')}</div>
                    <div className="text-lg font-bold font-mono">
                      ${mockEnterpriseStakeData.stakeRequirement.personalContribution.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Enterprise Benefits */}
                <div className="space-y-3 pt-4 border-t border-gold/30">
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-success" aria-hidden="true" />
                      <span className="text-sm">{t('alerts.enterprise.slashingProtection')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-success">
                        {mockEnterpriseStakeData.slashingProtection.coverageRate}% {t('alerts.enterprise.coverage')}
                      </span>
                      <span className="text-xs text-foreground-tertiary">
                        ({t('alerts.enterprise.maxCoverage', { amount: mockEnterpriseStakeData.slashingProtection.maxCoverage.toLocaleString() })})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gold" aria-hidden="true" />
                      <span className="text-sm">{t('alerts.enterprise.unlockPeriod')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gold">
                        {mockEnterpriseStakeData.contractTerms.unlockPeriod} {t('alerts.enterprise.days')}
                      </span>
                      <span className="text-xs text-foreground-tertiary">({t('alerts.enterprise.vs180Days')})</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-hinomaru" aria-hidden="true" />
                      <span className="text-sm">{t('alerts.enterprise.earlyExitPenalty')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-success">
                        {mockEnterpriseStakeData.contractTerms.earlyExitPenalty}%
                      </span>
                      <span className="text-xs text-foreground-tertiary">({t('alerts.enterprise.vs10Percent')})</span>
                    </div>
                  </div>
                </div>

                {/* Support CTA */}
                <div className="mt-4 pt-4 border-t border-gold/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-foreground-secondary">
                    <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t('alerts.enterprise.stakeQuestions')}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('alerts.enterprise.contactSupport')}
                  </Button>
                </div>
              </Card>
            )}

            {/* What is staking section */}
            <Card className="p-5 mb-6 bg-gradient-to-r from-gold/5 to-transparent border-gold/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-gold" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{t('alerts.whatIsStaking.title')}</h3>
                  <p className="text-sm text-foreground-secondary">{t('alerts.whatIsStaking.description')}</p>
                </div>
              </div>
            </Card>

            {/* Stake Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card variant="hoverGradient" padding="md" className="border-gold bg-gradient-to-br from-gold/10 to-transparent">
                <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.currentStake')}</div>
                <div className="text-2xl font-bold font-mono text-gold">
                  {stakeData.currentStake.toLocaleString()} QS
                </div>
                <div className="text-xs text-success mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('alerts.stake.meetsMinimum')}
                </div>
              </Card>
              <Card variant="hoverGradient" padding="md">
                <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.unlockDate')}</div>
                <div className="text-2xl font-bold font-mono">{stakeData.unlockDate}</div>
                <div className="text-xs text-foreground-tertiary mt-1">
                  {t('alerts.stake.daysRemaining', { days: stakeData.daysRemaining })}
                </div>
              </Card>
              <Card variant="hoverGradient" padding="md">
                <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.totalRewards')}</div>
                <div className="text-2xl font-bold font-mono text-success">
                  {stakeData.totalRewards.toLocaleString()} QS
                </div>
                <div className="text-xs text-foreground-tertiary mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  {t('alerts.stake.annualRate', { rate: stakeData.annualRate })}
                </div>
              </Card>
              <Card variant="hoverGradient" padding="md">
                <div className="text-xs text-foreground-tertiary mb-2">{t('alerts.stake.totalSlashing')}</div>
                <div className="text-2xl font-bold font-mono text-success">{stakeData.totalSlashing} QS</div>
                <div className="text-xs text-success mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('alerts.stake.noViolations')}
                </div>
              </Card>
            </div>

            {/* Risk Meter */}
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <ChartBar className="h-5 w-5" aria-hidden="true" />
                {t('alerts.risk.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-6">{t('alerts.risk.description')}</p>

              {/* Risk Bar */}
              <div className="relative mb-4">
                <div
                  className="h-6 rounded-xl bg-gradient-to-r from-success via-warning to-danger"
                  role="progressbar"
                  aria-valuenow={stakeData.riskLevel}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('alerts.risk.level')}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-background border-[3px] border-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg"
                  style={{ left: `${stakeData.riskLevel}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {stakeData.riskLevel === 0 ? '0' : stakeData.riskLevel}
                </div>
              </div>
              <div className="flex justify-between text-xs text-foreground-tertiary mb-6">
                <span className="text-success">{t('alerts.risk.low')}</span>
                <span className="text-warning">{t('alerts.risk.medium')}</span>
                <span className="text-danger">{t('alerts.risk.high')}</span>
              </div>

              {/* Risk Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.risk.violations30d')}</div>
                  <div className="font-semibold text-success">{stakeData.violations30d}{t('alerts.risk.count')}</div>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.risk.slaRate')}</div>
                  <div className="font-semibold text-success">{stakeData.slaRate}%</div>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-xs text-foreground-tertiary mb-1">{t('alerts.risk.potentialSlashing')}</div>
                  <div className="font-semibold">{stakeData.potentialSlashing} QS</div>
                </div>
              </div>
            </Card>

            {/* Quadratic Slashing Warning */}
            <Card className="p-6 mb-6 border-hinomaru bg-gradient-to-br from-hinomaru/10 to-transparent">
              <h3 className="text-lg font-semibold mb-2 text-hinomaru flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                {t('alerts.slashing.title')}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">{t('alerts.slashing.userFriendlyDescription')}</p>

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
                        {row.loss === 'full' ? t('alerts.slashing.fullConfiscation') : `${row.loss.toLocaleString()} QS`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Stake Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-2">{t('alerts.actions.title')}</h3>
              <p className="text-sm text-foreground-secondary mb-6">{t('alerts.actions.description')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-5 bg-background rounded-xl border border-surface-tertiary hover:border-success transition-colors text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-success/20 rounded-xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-success" aria-hidden="true" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('alerts.actions.addStake.title')}</h4>
                  <p className="text-sm text-foreground-tertiary mb-4">{t('alerts.actions.addStake.description')}</p>
                  <Button
                    variant="success"
                    className="w-full"
                    onClick={() => setShowAddStakeModal(true)}
                  >
                    {t('alerts.actions.addStake.button')}
                  </Button>
                </div>

                <div className="p-5 bg-background rounded-xl border border-surface-tertiary hover:border-gold transition-colors text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gold/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-gold" aria-hidden="true" />
                  </div>
                  <h4 className="font-semibold mb-2">{t('alerts.actions.withdrawRewards.title')}</h4>
                  <p className="text-sm text-foreground-tertiary mb-4">{t('alerts.actions.withdrawRewards.description')}</p>
                  <Button
                    variant="outline"
                    className="w-full border-gold text-gold hover:bg-gold/10"
                    onClick={() => setShowWithdrawModal(true)}
                  >
                    {t('alerts.actions.withdrawRewards.button')}
                  </Button>
                </div>

                <div className="p-5 bg-background rounded-xl border border-surface-tertiary hover:border-danger transition-colors text-center">
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
        </div>
      </main>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAlert(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="alert-detail-title"
        >
          <div
            className="bg-background-secondary rounded-2xl w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={cn(
              'p-6 border-b',
              selectedAlert.type === 'critical' ? 'border-danger/30 bg-danger/5' :
              selectedAlert.type === 'warning' ? 'border-warning/30 bg-warning/5' :
              'border-info/30 bg-info/5'
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    selectedAlert.type === 'critical' ? 'bg-danger/20' :
                    selectedAlert.type === 'warning' ? 'bg-warning/20' :
                    'bg-info/20'
                  )}>
                    {selectedAlert.type === 'critical' && <AlertCircle className="h-6 w-6 text-danger" />}
                    {selectedAlert.type === 'warning' && <AlertTriangle className="h-6 w-6 text-warning" />}
                    {selectedAlert.type === 'info' && <Info className="h-6 w-6 text-info" />}
                  </div>
                  <div>
                    <h2 id="alert-detail-title" className="text-lg font-semibold">
                      {t(`alerts.items.${selectedAlert.title}.title`)}
                    </h2>
                    <Badge
                      variant={selectedAlert.resolved ? 'success' : selectedAlert.type === 'critical' ? 'danger' : selectedAlert.type === 'warning' ? 'warning' : 'info'}
                      className="text-[11px] mt-1"
                    >
                      {selectedAlert.resolved ? t('alerts.status.resolved') : t(`alerts.severity.${selectedAlert.type}`)}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-foreground-tertiary hover:text-foreground transition-colors p-1"
                  aria-label={t('queue.modal.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Timestamp */}
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                <span className="text-foreground-secondary">{selectedAlert.timestamp}</span>
              </div>

              {/* Request ID or Server */}
              {selectedAlert.requestId && (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                  <span className="text-foreground-secondary">{t('alerts.requestId')}: {selectedAlert.requestId}</span>
                </div>
              )}
              {selectedAlert.server && (
                <div className="flex items-center gap-3 text-sm">
                  <Server className="h-4 w-4 text-foreground-tertiary" aria-hidden="true" />
                  <span className="text-foreground-secondary">{t('alerts.server')}: {selectedAlert.server}</span>
                </div>
              )}

              {/* Description */}
              <div className="p-4 bg-background rounded-xl">
                <h3 className="text-sm font-medium mb-2">{t('alerts.modal.description')}</h3>
                <p className="text-sm text-foreground-secondary">
                  {t(`alerts.items.${selectedAlert.title}.description`)}
                </p>
                {selectedAlert.remainingTime && (
                  <p className="text-sm text-danger mt-2 font-medium">
                    {t('alerts.remainingTime')}: {selectedAlert.remainingTime}{t('alerts.seconds')}
                  </p>
                )}
                {selectedAlert.cpuUsage && (
                  <p className="text-sm text-warning mt-2 font-medium">
                    {t('alerts.cpuUsage')}: {selectedAlert.cpuUsage}%
                  </p>
                )}
              </div>

              {/* Hint */}
              {!selectedAlert.resolved && (
                <div className="p-4 bg-gold/10 border border-gold/30 rounded-xl">
                  <h3 className="text-sm font-medium text-gold mb-2">{t('alerts.modal.recommendedAction')}</h3>
                  <p className="text-sm text-foreground-secondary">
                    {t(`alerts.items.${selectedAlert.title}.hint`)}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-surface-tertiary flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedAlert(null)}
              >
                {t('queue.modal.close')}
              </Button>
              {!selectedAlert.resolved && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    handleAlertAction(selectedAlert.title);
                    setSelectedAlert(null);
                  }}
                >
                  {t(`alerts.items.${selectedAlert.title}.action`)}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessing && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="processing-title"
        >
          <div className="bg-background-secondary rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-gold border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 id="processing-title" className="text-xl font-semibold mb-2">
              {t('alerts.modal.processing.title')}
            </h2>
            <p className="text-sm text-foreground-secondary">
              {t('alerts.modal.processing.description')}
            </p>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {isComplete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={handleCloseComplete}
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-title"
        >
          <div
            className="bg-background-secondary rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 id="complete-title" className="text-xl font-semibold mb-2">
                {completedAction === 'stake'
                  ? t('alerts.modal.complete.stakeTitle')
                  : t('alerts.modal.complete.withdrawTitle')}
              </h2>
              <p className="text-sm text-foreground-secondary mb-6">
                {completedAction === 'stake'
                  ? t('alerts.modal.complete.stakeDescription')
                  : t('alerts.modal.complete.withdrawDescription')}
              </p>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCloseComplete}
              >
                {t('alerts.modal.complete.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Rewards Modal */}
      {showWithdrawModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowWithdrawModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-title"
        >
          <div
            className="bg-background-secondary rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-tertiary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-gold" />
                  </div>
                  <h2 id="withdraw-title" className="text-lg font-semibold">
                    {t('alerts.modal.withdraw.title')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-foreground-tertiary hover:text-foreground transition-colors p-1"
                  aria-label={t('queue.modal.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground-secondary">
                {t('alerts.modal.withdraw.description')}
              </p>

              {/* Available Balance */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('alerts.modal.withdraw.available')}</span>
                  <span className="font-semibold text-gold">{stakeData.totalRewards.toLocaleString()} QS</span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="withdraw-amount" className="block text-sm font-medium mb-2">
                  {t('alerts.modal.withdraw.amountLabel')}
                </label>
                <div className="relative">
                  <input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={stakeData.totalRewards.toString()}
                    className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-gold text-right pr-16 font-mono"
                    min="0"
                    max={stakeData.totalRewards}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-tertiary">QS</span>
                </div>
                <button
                  type="button"
                  className="text-sm text-gold hover:underline mt-1"
                  onClick={() => setWithdrawAmount(stakeData.totalRewards.toString())}
                >
                  {t('alerts.modal.withdraw.max')}
                </button>
              </div>

              {/* Destination Address */}
              <div>
                <label htmlFor="withdraw-address" className="block text-sm font-medium mb-2">
                  {t('alerts.modal.withdraw.addressLabel')}
                </label>
                <input
                  id="withdraw-address"
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-gold font-mono text-sm"
                />
              </div>

              {/* Fee notice */}
              <div className="p-3 bg-info/10 border border-info/30 rounded-lg text-sm text-foreground-secondary">
                {t('alerts.modal.withdraw.feeNotice')}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-surface-tertiary flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
              >
                {t('queue.modal.cancel')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleWithdraw}
                disabled={!withdrawAmount || isNaN(parseFloat(withdrawAmount)) || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > stakeData.totalRewards}
              >
                {t('alerts.modal.withdraw.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stake Modal */}
      {showAddStakeModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAddStakeModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-stake-title"
        >
          <div
            className="bg-background-secondary rounded-2xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-tertiary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
                    <Plus className="h-6 w-6 text-success" />
                  </div>
                  <h2 id="add-stake-title" className="text-lg font-semibold">
                    {t('alerts.modal.addStake.title')}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddStakeModal(false)}
                  className="text-foreground-tertiary hover:text-foreground transition-colors p-1"
                  aria-label={t('queue.modal.close')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-foreground-secondary">
                {t('alerts.modal.addStake.description')}
              </p>

              {/* Current Stake Info */}
              <div className="p-4 bg-background rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-foreground-secondary">{t('alerts.stake.currentStake')}</span>
                  <span className="font-semibold text-gold">{stakeData.currentStake.toLocaleString()} QS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground-secondary">{t('alerts.modal.addStake.minimum')}</span>
                  <span className="text-sm">1,000 QS</span>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="stake-amount" className="block text-sm font-medium mb-2">
                  {t('alerts.modal.addStake.amountLabel')}
                </label>
                <div className="relative">
                  <input
                    id="stake-amount"
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-4 py-3 bg-background border border-surface-tertiary rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right pr-16 font-mono"
                    min="1000"
                    step="1000"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-tertiary">QS</span>
                </div>
              </div>

              {/* Preview */}
              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{t('alerts.modal.addStake.newTotal')}</span>
                    <span className="font-semibold text-success">
                      {(stakeData.currentStake + parseFloat(stakeAmount)).toLocaleString()} QS
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-surface-tertiary flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowAddStakeModal(false);
                  setStakeAmount('');
                }}
              >
                {t('queue.modal.cancel')}
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleAddStake}
                disabled={!stakeAmount || isNaN(parseFloat(stakeAmount)) || parseFloat(stakeAmount) < 1000}
              >
                {t('alerts.modal.addStake.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
