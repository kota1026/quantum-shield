'use client';

import { useTranslations } from 'next-intl';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { StatusBadge, StatusLevel } from './StatusBadge';
import { StatusServiceCard, ServiceItem } from './StatusServiceCard';

// Demo data - In production, this would come from API
const DEMO_OVERALL_STATUS: StatusLevel = 'operational';

const DEMO_CORE_SERVICES: ServiceItem[] = [
  { id: '1', name: 'API Gateway', status: 'online', value: 'Operational' },
  { id: '2', name: 'Smart Contract', status: 'online', value: 'Operational' },
  { id: '3', name: 'Database', status: 'online', value: 'Operational' },
  { id: '4', name: 'Cache Layer', status: 'online', value: 'Operational' },
];

const DEMO_EXTERNAL_CONNECTIONS: ServiceItem[] = [
  { id: '1', name: 'Ethereum Mainnet', status: 'online', value: 'Connected' },
  { id: '2', name: 'Prover Network', status: 'online', value: '127 nodes' },
  { id: '3', name: 'Webhooks', status: 'online', value: '99.9% uptime' },
  { id: '4', name: 'Price Oracle', status: 'online', value: 'Updated 2s ago' },
];

const DEMO_PERFORMANCE: ServiceItem[] = [
  { id: '1', name: 'API Latency', status: 'online', value: '45ms avg' },
  { id: '2', name: 'TX Confirmation', status: 'online', value: '12s avg' },
  { id: '3', name: 'Error Rate', status: 'online', value: '0.01%' },
  { id: '4', name: 'Uptime (30d)', status: 'online', value: '99.99%' },
];

export function StatusDashboard() {
  const t = useTranslations('enterprise.status');

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <EnterpriseSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[260px]">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-40"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-foreground">{t('pageTitle')}</h1>
          <StatusBadge
            status={DEMO_OVERALL_STATUS}
            label={t('overallStatus.operational')}
          />
        </header>

        {/* Page Content */}
        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Status Grid - 2x2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Core Services */}
            <StatusServiceCard
              title={t('coreServices.title')}
              services={DEMO_CORE_SERVICES.map((s) => ({
                ...s,
                name: t(`coreServices.items.${s.id}.name`),
                value: t(`coreServices.items.${s.id}.value`),
              }))}
            />

            {/* External Connections */}
            <StatusServiceCard
              title={t('externalConnections.title')}
              services={DEMO_EXTERNAL_CONNECTIONS.map((s) => ({
                ...s,
                name: t(`externalConnections.items.${s.id}.name`),
                value: t(`externalConnections.items.${s.id}.value`),
                tooltip: t.has(`externalConnections.items.${s.id}.tooltip`) ? t(`externalConnections.items.${s.id}.tooltip`) : undefined,
              }))}
            />

            {/* Performance */}
            <StatusServiceCard
              title={t('performance.title')}
              services={DEMO_PERFORMANCE.map((s) => ({
                ...s,
                name: t(`performance.items.${s.id}.name`),
                value: t(`performance.items.${s.id}.value`),
              }))}
            />

            {/* Recent Incidents */}
            <StatusServiceCard
              title={t('incidents.title')}
              services={[]}
              emptyMessage={t('incidents.noIncidents')}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default StatusDashboard;

// Re-export components
export { StatusBadge } from './StatusBadge';
export { StatusServiceCard } from './StatusServiceCard';
export type { StatusLevel } from './StatusBadge';
export type { ServiceItem, ServiceStatus } from './StatusServiceCard';
