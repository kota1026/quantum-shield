'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  FileCode,
  ChevronRight,
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  Clock,
  Activity,
  Code,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger'
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
const SAMPLE_CONTRACTS = [
  {
    id: 'core-vault',
    name: 'QuantumVault',
    address: '0x1234...5678',
    network: 'Ethereum Mainnet',
    version: 'v2.1.0',
    status: 'active',
    tvl: '$45.2M',
    lastUpgrade: '2026-01-10',
    verified: true,
    audited: true,
    paused: false,
  },
  {
    id: 'prover-registry',
    name: 'ProverRegistry',
    address: '0x2345...6789',
    network: 'Ethereum Mainnet',
    version: 'v1.5.2',
    status: 'active',
    tvl: '$6.35M',
    lastUpgrade: '2025-12-15',
    verified: true,
    audited: true,
    paused: false,
  },
  {
    id: 'stake-manager',
    name: 'StakeManager',
    address: '0x3456...7890',
    network: 'Ethereum Mainnet',
    version: 'v1.3.0',
    status: 'active',
    tvl: '$12.8M',
    lastUpgrade: '2025-11-20',
    verified: true,
    audited: true,
    paused: false,
  },
  {
    id: 'governance',
    name: 'GovernanceToken',
    address: '0x4567...8901',
    network: 'Ethereum Mainnet',
    version: 'v1.0.0',
    status: 'active',
    tvl: '-',
    lastUpgrade: '2025-09-01',
    verified: true,
    audited: true,
    paused: false,
  },
  {
    id: 'timelock',
    name: 'TimelockController',
    address: '0x5678...9012',
    network: 'Ethereum Mainnet',
    version: 'v1.0.0',
    status: 'active',
    tvl: '-',
    lastUpgrade: '2025-09-01',
    verified: true,
    audited: true,
    paused: false,
  },
  {
    id: 'signature-verifier',
    name: 'DilithiumVerifier',
    address: '0x6789...0123',
    network: 'Ethereum Mainnet',
    version: 'v2.0.1',
    status: 'active',
    tvl: '-',
    lastUpgrade: '2026-01-05',
    verified: true,
    audited: true,
    paused: false,
  },
];

const SAMPLE_UPGRADES = [
  {
    id: 'upgrade-001',
    contract: 'QuantumVault',
    fromVersion: 'v2.0.0',
    toVersion: 'v2.1.0',
    status: 'executed',
    proposedAt: '2026-01-03',
    executedAt: '2026-01-10',
    proposer: '0x7890...1234',
  },
  {
    id: 'upgrade-002',
    contract: 'DilithiumVerifier',
    fromVersion: 'v2.0.0',
    toVersion: 'v2.0.1',
    status: 'executed',
    proposedAt: '2025-12-28',
    executedAt: '2026-01-05',
    proposer: '0x8901...2345',
  },
  {
    id: 'upgrade-003',
    contract: 'StakeManager',
    fromVersion: 'v1.3.0',
    toVersion: 'v1.4.0',
    status: 'pending',
    proposedAt: '2026-01-15',
    executedAt: null,
    proposer: '0x9012...3456',
  },
];

export function PublicProtocolContracts() {
  const t = useTranslations('admin.protocolContracts');
  const [activeTab, setActiveTab] = useState<'contracts' | 'upgrades' | 'audits'>('contracts');
  const [selectedContract, setSelectedContract] = useState<typeof SAMPLE_CONTRACTS[0] | null>(SAMPLE_CONTRACTS[0]);

  const tabs = [
    { key: 'contracts', label: t('tabs.contracts'), count: SAMPLE_CONTRACTS.length },
    { key: 'upgrades', label: t('tabs.upgrades'), count: SAMPLE_UPGRADES.length },
    { key: 'audits', label: t('tabs.audits') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'paused':
        return <Badge variant="warning">{t('status.paused')}</Badge>;
      case 'deprecated':
        return <Badge variant="danger">{t('status.deprecated')}</Badge>;
      case 'executed':
        return <Badge variant="success">{t('status.executed')}</Badge>;
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/public/protocol" className="hover:text-foreground">
                Protocol
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalContracts')}
              value={String(SAMPLE_CONTRACTS.length)}
              icon={<FileCode className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeContracts')}
              value={String(SAMPLE_CONTRACTS.filter((c) => c.status === 'active').length)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalTvl')}
              value="$64.35M"
              icon={<Shield className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.pendingUpgrades')}
              value={String(SAMPLE_UPGRADES.filter((u) => u.status === 'pending').length)}
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.lastAudit')}
              value="2026-01-10"
              icon={<Activity className="h-5 w-5" />}
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
                {tab.count !== undefined && (
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Contract List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('contractList.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {SAMPLE_CONTRACTS.map((contract) => (
                        <div
                          key={contract.id}
                          onClick={() => setSelectedContract(contract)}
                          className={cn(
                            'cursor-pointer rounded-lg border p-4 transition-all',
                            selectedContract?.id === contract.id
                              ? 'border-gold bg-gold/5'
                              : 'border-surface-tertiary hover:border-gold/50'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                                <Code className="h-5 w-5 text-gold" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{contract.name}</div>
                                <div className="flex items-center gap-2 font-mono text-xs text-foreground-tertiary">
                                  {contract.address}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(contract.address);
                                    }}
                                    className="hover:text-gold"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(contract.status)}
                              <Badge variant="default">{contract.version}</Badge>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                            <span>{contract.network}</span>
                            {contract.tvl !== '-' && (
                              <span className="font-mono text-foreground">TVL: {contract.tvl}</span>
                            )}
                            {contract.verified && (
                              <span className="flex items-center gap-1 text-success">
                                <CheckCircle className="h-3 w-3" />
                                {t('contractList.verified')}
                              </span>
                            )}
                            {contract.audited && (
                              <span className="flex items-center gap-1 text-success">
                                <Shield className="h-3 w-3" />
                                {t('contractList.audited')}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contract Detail */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedContract ? (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.name')}</div>
                          <div className="font-medium">{selectedContract.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.address')}</div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{selectedContract.address}</span>
                            <button
                              onClick={() => copyToClipboard(selectedContract.address)}
                              className="text-foreground-tertiary hover:text-gold"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <a
                              href={`https://etherscan.io/address/${selectedContract.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-foreground-tertiary hover:text-gold"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.network')}</div>
                          <div className="text-sm">{selectedContract.network}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.version')}</div>
                          <Badge variant="default">{selectedContract.version}</Badge>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.status')}</div>
                          <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                        </div>
                        {selectedContract.tvl !== '-' && (
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('detail.tvl')}</div>
                            <div className="font-mono text-xl font-bold text-gold">
                              {selectedContract.tvl}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.lastUpgrade')}</div>
                          <div className="text-sm">{selectedContract.lastUpgrade}</div>
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<Code className="h-4 w-4" />}>
                            {t('detail.actions.viewCode')}
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" leftIcon={<ExternalLink className="h-4 w-4" />}>
                            {t('detail.actions.explorer')}
                          </Button>
                        </div>
                        {selectedContract.status === 'active' && !selectedContract.paused && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-warning border-warning/50 hover:bg-warning/10"
                            leftIcon={<AlertTriangle className="h-4 w-4" />}
                          >
                            {t('detail.actions.emergencyPause')}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                        <div>
                          <FileCode className="mx-auto h-12 w-12" />
                          <p className="mt-2">{t('detail.selectContract')}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Upgrades Tab */}
          {activeTab === 'upgrades' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('upgrades.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('upgrades.columns.contract')}</th>
                        <th className="pb-3 font-medium">{t('upgrades.columns.version')}</th>
                        <th className="pb-3 font-medium">{t('upgrades.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('upgrades.columns.proposedAt')}</th>
                        <th className="pb-3 font-medium">{t('upgrades.columns.executedAt')}</th>
                        <th className="pb-3 font-medium">{t('upgrades.columns.proposer')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_UPGRADES.map((upgrade) => (
                        <tr
                          key={upgrade.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4 font-medium">{upgrade.contract}</td>
                          <td className="py-4">
                            <span className="font-mono text-foreground-tertiary">{upgrade.fromVersion}</span>
                            <span className="mx-2 text-foreground-tertiary">→</span>
                            <span className="font-mono text-gold">{upgrade.toVersion}</span>
                          </td>
                          <td className="py-4">{getStatusBadge(upgrade.status)}</td>
                          <td className="py-4 text-sm text-foreground-secondary">{upgrade.proposedAt}</td>
                          <td className="py-4 text-sm text-foreground-secondary">
                            {upgrade.executedAt || '-'}
                          </td>
                          <td className="py-4 font-mono text-xs text-foreground-tertiary">
                            {upgrade.proposer}
                          </td>
                          <td className="py-4">
                            {upgrade.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline">
                                  {t('upgrades.actions.review')}
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audits Tab */}
          {activeTab === 'audits' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('audits.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                        <Shield className="h-6 w-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Trail of Bits - Full Audit</div>
                        <div className="mt-1 text-sm text-foreground-secondary">
                          {t('audits.completedAt')}: 2026-01-10
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="success">{t('audits.passed')}</Badge>
                          <Badge variant="default">0 Critical</Badge>
                          <Badge variant="default">2 Medium (Fixed)</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                        {t('audits.viewReport')}
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                        <Shield className="h-6 w-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">OpenZeppelin - Security Review</div>
                        <div className="mt-1 text-sm text-foreground-secondary">
                          {t('audits.completedAt')}: 2025-11-15
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="success">{t('audits.passed')}</Badge>
                          <Badge variant="default">0 Critical</Badge>
                          <Badge variant="default">1 Low (Fixed)</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" leftIcon={<ExternalLink className="h-4 w-4" />}>
                        {t('audits.viewReport')}
                      </Button>
                    </div>
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
