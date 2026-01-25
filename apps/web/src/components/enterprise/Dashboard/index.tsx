'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  AlertTriangle,
  FileWarning,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { EnterpriseTopBar } from './EnterpriseTopBar';
import { EnterpriseStatCard } from './EnterpriseStatCard';
import { KPIGrid } from './KPIGrid';
import { RecentTransactionsTable, EnterpriseTransaction } from './RecentTransactionsTable';
import { RecentActivityList, ActivityItem } from './RecentActivityList';
import { SystemStatusList, SystemStatus } from './SystemStatusList';
import { EnvironmentSelector, EnvironmentBadge, useEnvironment } from '@/components/enterprise/shared';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Action items interface
interface ActionItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  link: string;
  linkText: string;
  count?: number;
}

// Demo data - In production, this would come from API

const DEMO_TRANSACTIONS: EnterpriseTransaction[] = [
  { id: '1', hash: '0x7a3f...9c2d', type: 'lock', amount: '5.00 ETH', status: 'complete', time: '2 min ago' },
  { id: '2', hash: '0x3b2e...1f4a', type: 'unlock', amount: '2.50 ETH', status: 'pending', time: '15 min ago' },
  { id: '3', hash: '0x9d1c...8e5b', type: 'lock', amount: '10.00 ETH', status: 'complete', time: '32 min ago' },
  { id: '4', hash: '0x5e7d...2a9f', type: 'emergency', amount: '1.25 ETH', status: 'pending', time: '1 hr ago' },
  { id: '5', hash: '0x2f4a...6c3e', type: 'lock', amount: '15.00 ETH', status: 'complete', time: '2 hr ago' },
];

const DEMO_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'lock', title: 'New lock transaction', meta: '5.00 ETH • 2 min ago' },
  { id: '2', type: 'user', title: 'User invited: tanaka@acme.co', meta: 'Admin • 15 min ago' },
  { id: '3', type: 'api', title: 'API key created', meta: 'Production • 1 hr ago' },
  { id: '4', type: 'unlock', title: 'Unlock completed', meta: '2.50 ETH • 3 hr ago' },
];

const DEMO_SYSTEMS: SystemStatus[] = [
  { id: '1', name: 'API Gateway', status: 'online', value: 'Operational' },
  { id: '2', name: 'Prover Network', status: 'online', value: '127 nodes' },
  { id: '3', name: 'Ethereum RPC', status: 'online', value: 'Operational' },
  { id: '4', name: 'Webhooks', status: 'online', value: '99.9% uptime' },
];

// Demo action items requiring attention
const DEMO_ACTION_ITEMS: ActionItem[] = [
  {
    id: '1',
    type: 'critical',
    title: 'actionItems.kycPending.title',
    description: 'actionItems.kycPending.description',
    link: '/enterprise/users-stats',
    linkText: 'actionItems.kycPending.action',
    count: 3,
  },
  {
    id: '2',
    type: 'warning',
    title: 'actionItems.emergencyUnlock.title',
    description: 'actionItems.emergencyUnlock.description',
    link: '/enterprise/emergency',
    linkText: 'actionItems.emergencyUnlock.action',
    count: 1,
  },
  {
    id: '3',
    type: 'info',
    title: 'actionItems.approvalPending.title',
    description: 'actionItems.approvalPending.description',
    link: '/enterprise/audit-log',
    linkText: 'actionItems.approvalPending.action',
    count: 5,
  },
];

export function EnterpriseDashboard() {
  const t = useTranslations('enterprise.dashboard');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <EnterpriseSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[260px]">
        {/* Top Bar */}
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={t('demoUser.name')}
          userInitial={t('demoUser.initial')}
        />

        {/* Page Content */}
        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Environment Badge for non-production */}
          <div className="mb-4">
            <EnvironmentBadge />
          </div>

          {/* 6 KPI Grid */}
          <KPIGrid className="mb-8" />

          {/* Action Items Section */}
          {DEMO_ACTION_ITEMS.length > 0 && (
            <section className="mb-8" aria-label={t('actionItems.ariaLabel')}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                {t('actionItems.title')}
                <Badge variant="warning" className="ml-2">
                  {DEMO_ACTION_ITEMS.length}
                </Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEMO_ACTION_ITEMS.map((item) => {
                  const getIcon = () => {
                    switch (item.type) {
                      case 'critical':
                        return <AlertCircle className="h-5 w-5 text-danger" aria-hidden="true" />;
                      case 'warning':
                        return <FileWarning className="h-5 w-5 text-warning" aria-hidden="true" />;
                      default:
                        return <Clock className="h-5 w-5 text-gold" aria-hidden="true" />;
                    }
                  };

                  const getBorderColor = () => {
                    switch (item.type) {
                      case 'critical':
                        return 'border-danger/50 bg-danger/5';
                      case 'warning':
                        return 'border-warning/50 bg-warning/5';
                      default:
                        return 'border-gold/50 bg-gold/5';
                    }
                  };

                  return (
                    <Card
                      key={item.id}
                      className={cn('p-4 transition-all hover:shadow-md', getBorderColor())}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate">{t(item.title)}</h3>
                            {item.count && (
                              <Badge
                                variant={item.type === 'critical' ? 'danger' : item.type === 'warning' ? 'warning' : 'gold'}
                                className="text-[10px]"
                              >
                                {item.count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground-secondary mb-3 line-clamp-2">
                            {t(item.description)}
                          </p>
                          <Link href={item.link}>
                            <Button variant="outline" size="sm" className="w-full justify-between group">
                              <span>{t(item.linkText)}</span>
                              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8">
            {/* Left Column - Transactions */}
            <RecentTransactionsTable transactions={DEMO_TRANSACTIONS} />

            {/* Right Column */}
            <div className="flex flex-col gap-8">
              <RecentActivityList activities={DEMO_ACTIVITIES} />
              <SystemStatusList systems={DEMO_SYSTEMS} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EnterpriseDashboard;

// Re-export components
export { EnterpriseSidebar } from './EnterpriseSidebar';
export { EnterpriseTopBar } from './EnterpriseTopBar';
export { EnterpriseStatCard } from './EnterpriseStatCard';
export { KPIGrid } from './KPIGrid';
export { KPICard } from './KPICard';
export { RecentTransactionsTable } from './RecentTransactionsTable';
export { RecentActivityList } from './RecentActivityList';
export { SystemStatusList } from './SystemStatusList';
