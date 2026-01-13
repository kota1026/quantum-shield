import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { StatsCard } from '../components/StatsCard';
import { NodeStatusCard } from '../components/NodeStatusCard';
import { AlertList } from '../components/AlertList';

export function Dashboard() {
  const { t } = useTranslation();

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/api/analytics/overview'),
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['system', 'status'],
    queryFn: () => api.get('/api/system/status'),
    refetchInterval: 10000,
  });

  if (overviewLoading || statusLoading) {
    return <div className="animate-pulse">{t('dashboard.loadingDashboard')}</div>;
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('dashboard.tvl')}
          value={`$${(overview?.tvl / 1e6 || 0).toFixed(2)}M`}
          change={overview?.tvlChange24h}
          icon="💰"
        />
        <StatsCard
          title={t('dashboard.totalLocks')}
          value={overview?.totalLocks?.toLocaleString() || '0'}
          icon="🔒"
        />
        <StatsCard
          title={t('dashboard.totalUnlocks')}
          value={overview?.totalUnlocks?.toLocaleString() || '0'}
          icon="🔓"
        />
        <StatsCard
          title={t('dashboard.activeProvers')}
          value={overview?.activeProvers?.toString() || '0'}
          icon="🔐"
        />
      </div>

      {/* L3 Node Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.l3NodeStatus')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemStatus?.l3Nodes?.map((node: any) => (
            <NodeStatusCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* Time Lock Parameters Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.securityParams')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-600">{t('dashboard.normalTimeLock')}</p>
            <p className="text-2xl font-bold text-blue-600">{t('dashboard.hours24')}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-gray-600">{t('dashboard.emergencyTimeLock')}</p>
            <p className="text-2xl font-bold text-orange-600">{t('dashboard.days7')}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-gray-600">{t('dashboard.quadraticSlashing')}</p>
            <p className="text-2xl font-bold text-red-600">{t('dashboard.slashingFormula')}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-gray-600">{t('dashboard.pauseDuration')}</p>
            <p className="text-2xl font-bold text-purple-600">{t('dashboard.hours72Max')}</p>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.recentAlerts')}</h2>
        <AlertList />
      </div>
    </div>
  );
}
