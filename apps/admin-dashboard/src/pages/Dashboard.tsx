import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { StatsCard } from '../components/StatsCard';
import { NodeStatusCard } from '../components/NodeStatusCard';
import { AlertList } from '../components/AlertList';

export function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/api/analytics/overview'),
  });

  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['system', 'status'],
    queryFn: () => api.get('/api/system/status'),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (overviewLoading || statusLoading) {
    return <div className="animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Value Locked"
          value={`$${(overview?.tvl / 1e6 || 0).toFixed(2)}M`}
          change={overview?.tvlChange24h}
          icon="💰"
        />
        <StatsCard
          title="Total Locks"
          value={overview?.totalLocks?.toLocaleString() || '0'}
          icon="🔒"
        />
        <StatsCard
          title="Total Unlocks"
          value={overview?.totalUnlocks?.toLocaleString() || '0'}
          icon="🔓"
        />
        <StatsCard
          title="Active Provers"
          value={overview?.activeProvers?.toString() || '0'}
          icon="🔐"
        />
      </div>

      {/* L3 Node Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">L3 Aegis Node Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {systemStatus?.l3Nodes?.map((node: any) => (
            <NodeStatusCard key={node.id} node={node} />
          ))}
        </div>
      </div>

      {/* Time Lock Parameters Display */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Security Parameters (CP Compliant)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-600">Normal Time Lock (SEQ#2)</p>
            <p className="text-2xl font-bold text-blue-600">24 hours</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-gray-600">Emergency Time Lock (SEQ#3)</p>
            <p className="text-2xl font-bold text-orange-600">7 days</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-gray-600">Quadratic Slashing (SEQ#4)</p>
            <p className="text-2xl font-bold text-red-600">N² × 10%</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-gray-600">Pause Duration (SEQ#8)</p>
            <p className="text-2xl font-bold text-purple-600">72 hours max</p>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Alerts</h2>
        <AlertList />
      </div>
    </div>
  );
}