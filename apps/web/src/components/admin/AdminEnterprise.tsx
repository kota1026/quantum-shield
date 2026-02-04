'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type TierType = 'platinum' | 'gold' | 'silver';
type StatusType = 'active' | 'renewalPending' | 'inactive';
type TabType = 'all' | 'platinum' | 'gold' | 'pending';

interface Enterprise {
  id: string;
  initial: string;
  name: string;
  type: string;
  tier: TierType;
  tvl: string;
  status: StatusType;
  contractRenewal: string;
  renewalWarning?: boolean;
}

// Stat mini card component
interface StatMiniProps {
  label: string;
  value: string;
  isGold?: boolean;
}

function StatMini({ label, value, isGold }: StatMiniProps) {
  return (
    <div className="rounded-xl border border-surface-tertiary bg-background-secondary p-4">
      <div className="mb-1 text-xs text-foreground-tertiary">{label}</div>
      <div className={cn('font-mono text-2xl font-bold', isGold && 'text-gold')}>{value}</div>
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

// Company logo component
interface CompanyLogoProps {
  initial: string;
}

function CompanyLogo({ initial }: CompanyLogoProps) {
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-base font-semibold text-gold"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

// Tier badge component
interface TierBadgeProps {
  tier: TierType;
}

function TierBadge({ tier }: TierBadgeProps) {
  const t = useTranslations('admin.enterprise.tier');

  const tierConfig = {
    platinum: {
      label: t('platinum'),
      className: 'bg-gradient-to-br from-[#e5e4e2] to-[#b4b4b4] text-[#333]',
    },
    gold: {
      label: t('gold'),
      className: 'bg-gold/10 text-gold',
    },
    silver: {
      label: t('silver'),
      className: 'bg-background-tertiary text-foreground-secondary',
    },
  };

  const config = tierConfig[tier];

  return (
    <span className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium', config.className)}>
      {config.label}
    </span>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: StatusType;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('admin.enterprise.status');

  const statusConfig = {
    active: {
      label: t('active'),
      className: 'bg-success/10 text-success',
    },
    renewalPending: {
      label: t('renewalPending'),
      className: 'bg-warning/10 text-warning',
    },
    inactive: {
      label: t('inactive'),
      className: 'bg-foreground-tertiary/10 text-foreground-tertiary',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium', config.className)}>
      {config.label}
    </span>
  );
}

// Enterprise row component
interface EnterpriseRowProps {
  enterprise: Enterprise;
  onClick: () => void;
}

function EnterpriseRow({ enterprise, onClick }: EnterpriseRowProps) {
  return (
    <tr
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-b border-surface-tertiary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      tabIndex={0}
      role="button"
      aria-label={`${enterprise.name}, ${enterprise.tier}, TVL ${enterprise.tvl}`}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <CompanyLogo initial={enterprise.initial} />
          <div>
            <div className="font-medium">{enterprise.name}</div>
            <div className="text-xs text-foreground-tertiary">{enterprise.type}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <TierBadge tier={enterprise.tier} />
      </td>
      <td className="px-4 py-4">
        <span className="font-mono font-semibold">{enterprise.tvl}</span>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={enterprise.status} />
      </td>
      <td className="px-4 py-4">
        <span
          className={cn(
            'font-mono text-sm',
            enterprise.renewalWarning ? 'text-warning' : 'text-foreground-tertiary'
          )}
        >
          {enterprise.contractRenewal}
        </span>
      </td>
    </tr>
  );
}

export function AdminEnterprise() {
  const t = useTranslations('admin.enterprise');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Mock data - in production would come from API
  const enterprises: Enterprise[] = [
    {
      id: '1',
      initial: '三',
      name: '三菱UFJデジタル',
      type: 'Financial Institution',
      tier: 'platinum',
      tvl: '$234,500,000',
      status: 'active',
      contractRenewal: '2027-03-31',
    },
    {
      id: '2',
      initial: 'S',
      name: 'SBI Digital Asset',
      type: 'Crypto Exchange',
      tier: 'platinum',
      tvl: '$189,200,000',
      status: 'active',
      contractRenewal: '2026-12-31',
    },
    {
      id: '3',
      initial: '野',
      name: '野村デジタル・アセット',
      type: 'Investment Bank',
      tier: 'gold',
      tvl: '$156,800,000',
      status: 'active',
      contractRenewal: '2026-09-30',
    },
    {
      id: '4',
      initial: '楽',
      name: '楽天ウォレット',
      type: 'Crypto Exchange',
      tier: 'gold',
      tvl: '$98,400,000',
      status: 'active',
      contractRenewal: '2026-06-30',
    },
    {
      id: '5',
      initial: 'D',
      name: 'DMM Crypto',
      type: 'Crypto Exchange',
      tier: 'silver',
      tvl: '$45,200,000',
      status: 'renewalPending',
      contractRenewal: '2026-01-31',
      renewalWarning: true,
    },
  ];

  // Filter enterprises based on active tab
  const filteredEnterprises = enterprises.filter((enterprise) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'platinum') return enterprise.tier === 'platinum';
    if (activeTab === 'gold') return enterprise.tier === 'gold';
    if (activeTab === 'pending') return enterprise.status === 'renewalPending';
    return true;
  });

  const handleEnterpriseClick = (enterpriseId: string) => {
    // In production, would open detail modal
    console.log('Enterprise clicked:', enterpriseId);
  };

  const handleAddEnterprise = () => {
    // In production, would open add enterprise modal
    console.log('Add enterprise clicked');
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleAddEnterprise}
            className="rounded-lg bg-hinomaru px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-hinomaru/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hinomaru focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            + {t('addButton')}
          </button>
        </div>

        {/* Stats Row */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatMini label={t('stats.totalEnterprises.label')} value="24" />
          <StatMini label={t('stats.enterpriseTvl.label')} value="$847M" isGold />
          <StatMini label={t('stats.activeContracts.label')} value="18" />
          <StatMini label={t('stats.monthlyRevenue.label')} value="$423K" isGold />
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
            label={t('tabs.platinum')}
            isActive={activeTab === 'platinum'}
            onClick={() => setActiveTab('platinum')}
          />
          <TabItem
            label={t('tabs.gold')}
            isActive={activeTab === 'gold'}
            onClick={() => setActiveTab('gold')}
          />
          <TabItem
            label={t('tabs.pending')}
            isActive={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          />
        </div>

        {/* Enterprise List Table */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-tertiary px-5 py-4">
            <CardTitle className="text-base">{t('card.title')}</CardTitle>
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
                      {t('table.columns.company')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.tier')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.tvl')}
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
                      {t('table.columns.contractRenewal')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnterprises.length > 0 ? (
                    filteredEnterprises.map((enterprise) => (
                      <EnterpriseRow
                        key={enterprise.id}
                        enterprise={enterprise}
                        onClick={() => handleEnterpriseClick(enterprise.id)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
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
