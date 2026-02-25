'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lock, Unlock, AlertTriangle, Check, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type TxType = 'lock' | 'unlock' | 'emergency';
type TxStatus = 'completed' | 'pending' | 'timelock';
type TabType = 'all' | 'locks' | 'unlocks' | 'challenges' | 'anomalies';

interface Transaction {
  txHash: string;
  type: TxType;
  from: string;
  amount: string;
  status: TxStatus;
  statusDetail?: string;
  time: string;
}

// Live indicator component
function LiveIndicator({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-2 w-2 animate-pulse rounded-full bg-success"
        aria-hidden="true"
      />
      <span className="text-xs font-medium text-success">{label}</span>
    </div>
  );
}

// Tab component
interface TabItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabItem({ label, isActive, onClick }: TabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'rounded-lg px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? 'bg-background-tertiary text-foreground'
          : 'text-foreground-secondary hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

// Stat mini card component
interface StatMiniProps {
  label: string;
  value: string;
  variant?: 'default' | 'success';
}

function StatMini({ label, value, variant = 'default' }: StatMiniProps) {
  return (
    <div className="rounded-xl border border-surface-tertiary bg-card p-4">
      <div className="mb-1 text-xs text-foreground-tertiary">{label}</div>
      <div
        className={cn(
          'font-mono text-2xl font-bold',
          variant === 'success' ? 'text-success' : 'text-foreground'
        )}
      >
        {value}
      </div>
    </div>
  );
}

// TX type badge component
interface TxTypeBadgeProps {
  type: TxType;
}

function TxTypeBadge({ type }: TxTypeBadgeProps) {
  const t = useTranslations('admin.txMonitor.txType');

  const typeConfig = {
    lock: {
      label: t('lock'),
      bgClass: 'bg-hinomaru/10',
      textClass: 'text-hinomaru',
      icon: <Lock className="h-3 w-3" aria-hidden="true" />,
    },
    unlock: {
      label: t('unlock'),
      bgClass: 'bg-gold/10',
      textClass: 'text-gold',
      icon: <Unlock className="h-3 w-3" aria-hidden="true" />,
    },
    emergency: {
      label: t('emergency'),
      bgClass: 'bg-warning/10',
      textClass: 'text-warning',
      icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    },
  };

  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: TxStatus;
  detail?: string;
}

function StatusBadge({ status, detail }: StatusBadgeProps) {
  const t = useTranslations('admin.txMonitor.status');

  const statusConfig = {
    completed: {
      label: t('completed'),
      bgClass: 'bg-success/10',
      textClass: 'text-success',
      icon: <Check className="h-3 w-3" aria-hidden="true" />,
    },
    pending: {
      label: detail || t('pending'),
      bgClass: 'bg-warning/10',
      textClass: 'text-warning',
      icon: <Clock className="h-3 w-3" aria-hidden="true" />,
    },
    timelock: {
      label: detail || t('timelock'),
      bgClass: 'bg-[#4a90d9]/10',
      textClass: 'text-[#4a90d9]',
      icon: <Clock className="h-3 w-3" aria-hidden="true" />,
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// Transaction row component
interface TxRowProps {
  tx: Transaction;
  onClick: () => void;
}

function TxRow({ tx, onClick }: TxRowProps) {
  return (
    <tr
      onClick={onClick}
      className="cursor-pointer border-b border-surface-tertiary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      tabIndex={0}
      role="button"
      aria-label={`Transaction ${tx.txHash}, ${tx.type}, ${tx.amount}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <td className="px-4 py-4">
        <span className="font-mono text-[13px] text-gold">{tx.txHash}</span>
      </td>
      <td className="px-4 py-4">
        <TxTypeBadge type={tx.type} />
      </td>
      <td className="px-4 py-4">
        <span className="font-mono text-sm">{tx.from}</span>
      </td>
      <td className="px-4 py-4">
        <span className="font-mono font-semibold">{tx.amount}</span>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={tx.status} detail={tx.statusDetail} />
      </td>
      <td className="px-4 py-4">
        <span className="font-mono text-xs text-foreground-tertiary">{tx.time}</span>
      </td>
    </tr>
  );
}

export function AdminTxMonitor() {
  const t = useTranslations('admin.txMonitor');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Mock data - in production would come from API
  const stats = {
    totalTxs: '1,247',
    locks: '892',
    unlocks: '312',
    emergency: '43',
    challenges: '0',
  };

  const transactions: Transaction[] = [
    {
      txHash: '0x7a3f...9c2d',
      type: 'lock',
      from: '0x3b1c...f8a7',
      amount: '15.50 ETH',
      status: 'completed',
      time: '2 min ago',
    },
    {
      txHash: '0x9d2e...1f4b',
      type: 'unlock',
      from: '0x8e5d...2c3a',
      amount: '8.20 ETH',
      status: 'timelock',
      statusDetail: '23:41:02',
      time: '5 min ago',
    },
    {
      txHash: '0x4f6a...7b8c',
      type: 'emergency',
      from: '0x1a2b...3c4d',
      amount: '25.00 ETH',
      status: 'pending',
      statusDetail: '6d 14:22',
      time: '1 hour ago',
    },
    {
      txHash: '0x2c3d...4e5f',
      type: 'lock',
      from: '0x5f6g...7h8i',
      amount: '42.00 ETH',
      status: 'completed',
      time: '2 hours ago',
    },
    {
      txHash: '0x6g7h...8i9j',
      type: 'unlock',
      from: '0x9j0k...1l2m',
      amount: '5.75 ETH',
      status: 'completed',
      time: '3 hours ago',
    },
  ];

  const handleTxClick = (txHash: string) => {
    // In production, would open detail modal or navigate
    console.log('Transaction clicked:', txHash);
  };

  // Filter transactions based on active tab
  const filteredTransactions = transactions.filter((tx) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'locks') return tx.type === 'lock';
    if (activeTab === 'unlocks') return tx.type === 'unlock';
    if (activeTab === 'challenges') return false; // No challenges in mock data
    if (activeTab === 'anomalies') return tx.type === 'emergency';
    return true;
  });

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <LiveIndicator label={t('liveIndicator')} />
        </div>

        {/* Tabs */}
        <div
          className="mb-6 flex gap-1 rounded-lg bg-background-secondary p-1"
          role="tablist"
          aria-label={t('title')}
          style={{ width: 'fit-content' }}
        >
          <TabItem
            label={t('tabs.all')}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabItem
            label={t('tabs.locks')}
            isActive={activeTab === 'locks'}
            onClick={() => setActiveTab('locks')}
          />
          <TabItem
            label={t('tabs.unlocks')}
            isActive={activeTab === 'unlocks'}
            onClick={() => setActiveTab('unlocks')}
          />
          <TabItem
            label={t('tabs.challenges')}
            isActive={activeTab === 'challenges'}
            onClick={() => setActiveTab('challenges')}
          />
          <TabItem
            label={t('tabs.anomalies')}
            isActive={activeTab === 'anomalies'}
            onClick={() => setActiveTab('anomalies')}
          />
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatMini label={t('stats.totalTxs.label')} value={stats.totalTxs} />
          <StatMini label={t('stats.locks.label')} value={stats.locks} />
          <StatMini label={t('stats.unlocks.label')} value={stats.unlocks} />
          <StatMini label={t('stats.emergency.label')} value={stats.emergency} />
          <StatMini
            label={t('stats.challenges.label')}
            value={stats.challenges}
            variant="success"
          />
        </div>

        {/* Transactions Table */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-tertiary px-5 py-4">
            <CardTitle className="text-base">{t('table.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-background-secondary">
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.txHash')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.type')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.from')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.amount')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.status')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.time')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <TxRow
                        key={tx.txHash}
                        tx={tx}
                        onClick={() => handleTxClick(tx.txHash)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm text-foreground-secondary"
                      >
                        {t('table.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
