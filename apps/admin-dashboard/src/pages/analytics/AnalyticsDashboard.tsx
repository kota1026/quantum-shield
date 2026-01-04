/**
 * UI-007: Analytics Dashboard
 * 
 * Reference: UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md §2.1 Admin
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get<any>('/api/analytics/overview'),
  });

  if (isLoading) return <div className="animate-pulse">Loading analytics...</div>;

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg ${period === p ? 'bg-qs-primary text-white' : 'bg-gray-200'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* TVL Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Total Value Locked</h2>
        <div className="flex items-end space-x-4">
          <p className="text-4xl font-bold">${(data?.tvl / 1e6 || 0).toFixed(2)}M</p>
          <p className={`text-lg ${data?.tvlChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data?.tvlChange24h >= 0 ? '↑' : '↓'} {Math.abs(data?.tvlChange24h || 0).toFixed(2)}%
          </p>
        </div>
        <div className="mt-4 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">[TVL Chart Placeholder]</div>
      </div>

      {/* Lock/Unlock Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Lock Statistics</h3>
          <p className="text-3xl font-bold text-blue-600">{data?.totalLocks?.toLocaleString() || 0}</p>
          <p className="text-gray-500">Total Locks</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Unlock Statistics</h3>
          <p className="text-3xl font-bold text-green-600">{data?.totalUnlocks?.toLocaleString() || 0}</p>
          <p className="text-gray-500">Total Unlocks</p>
        </div>
      </div>

      {/* Prover Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Prover Performance</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Prover ID</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Success Rate</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Avg Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.proverPerformance?.map((p: any) => (
              <tr key={p.proverId}>
                <td className="px-4 py-2 text-sm font-mono">{p.proverId}</td>
                <td className="px-4 py-2 text-sm text-right text-green-600">{p.successRate}%</td>
                <td className="px-4 py-2 text-sm text-right">{p.avgResponseTime}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Export CSV</button>
      </div>
    </div>
  );
}