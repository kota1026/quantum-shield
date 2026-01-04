import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

type Prover = {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'suspended';
  hsmConnected: boolean;
  stake: number;
  successRate: number;
  responseTime: number;
  operatorAddress: string;
};

export function ProverList() {
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['provers'],
    queryFn: () => api.get<{ provers: Prover[] }>('/provers'),
    refetchInterval: 30000, // Real-time monitoring: refresh every 30s
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/provers/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provers'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.post(`/provers/${id}/reject`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provers'] }),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/provers/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['provers'] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-qs-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load provers. Please try again.</p>
      </div>
    );
  }

  const provers = data?.provers?.filter(p => filter === 'all' || p.status === filter) || [];

  const statusCounts = {
    all: data?.provers?.length || 0,
    active: data?.provers?.filter(p => p.status === 'active').length || 0,
    pending: data?.provers?.filter(p => p.status === 'pending').length || 0,
    suspended: data?.provers?.filter(p => p.status === 'suspended').length || 0,
  };

  return (
    <div data-testid="prover-list">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prover Management</h1>
        <Link
          to="/provers/register"
          className="px-4 py-2 bg-qs-primary text-white rounded-lg hover:bg-qs-primary/90 transition-colors"
        >
          + Register New Prover
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6" data-testid="filter-tabs">
        {(['all', 'active', 'pending', 'suspended'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-${f}`}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-qs-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({statusCounts[f]})
          </button>
        ))}
      </div>

      {/* Quadratic Slashing Warning (SEQ#4) */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="slashing-warning">
        <div className="flex items-start">
          <span className="text-red-500 mr-2">⚠️</span>
          <div>
            <p className="font-semibold text-red-800">Quadratic Slashing Active (N² × 10%)</p>
            <p className="text-red-700 text-sm mt-1">
              Correlated failures result in exponentially higher penalties. 
              1 Prover = 10%, 2 Provers = 40%, 3 Provers = 90%
            </p>
          </div>
        </div>
      </div>

      {/* Prover Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200" data-testid="prover-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prover
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" data-testid="col-hsm">
                HSM
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stake
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" data-testid="col-success-rate">
                Success Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" data-testid="col-response-time">
                Response Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {provers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No provers found
                </td>
              </tr>
            ) : (
              provers.map((prover) => (
                <tr key={prover.id} data-testid={`prover-row-${prover.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <Link 
                        to={`/provers/${prover.id}`}
                        className="font-medium text-gray-900 hover:text-qs-primary"
                      >
                        {prover.name}
                      </Link>
                      <p className="text-sm text-gray-500 font-mono">
                        {prover.operatorAddress?.slice(0, 10)}...
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      data-testid={`status-${prover.id}`}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        prover.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : prover.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {prover.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      data-testid={`hsm-${prover.id}`}
                      className={`inline-flex items-center ${
                        prover.hsmConnected ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        prover.hsmConnected ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                      {prover.hsmConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ${(prover.stake / 1000).toFixed(0)}K
                  </td>
                  <td className="px-6 py-4 text-right" data-testid={`success-rate-${prover.id}`}>
                    <span className={prover.successRate >= 99 ? 'text-green-600' : prover.successRate >= 95 ? 'text-yellow-600' : 'text-red-600'}>
                      {prover.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" data-testid={`response-time-${prover.id}`}>
                    <span className={prover.responseTime <= 200 ? 'text-green-600' : prover.responseTime <= 500 ? 'text-yellow-600' : 'text-red-600'}>
                      {prover.responseTime}ms
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {prover.status === 'pending' && (
                        <>
                          <button
                            onClick={() => approveMutation.mutate(prover.id)}
                            data-testid={`approve-${prover.id}`}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(prover.id)}
                            data-testid={`reject-${prover.id}`}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {prover.status === 'active' && (
                        <button
                          onClick={() => suspendMutation.mutate(prover.id)}
                          data-testid={`suspend-${prover.id}`}
                          className="text-orange-600 hover:text-orange-800 font-medium text-sm"
                        >
                          Suspend
                        </button>
                      )}
                      <Link
                        to={`/provers/${prover.id}`}
                        className="text-qs-primary hover:text-qs-primary/80 font-medium text-sm"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 text-sm text-gray-500">
        <p>🟢 Success Rate ≥99% | 🟡 95-99% | 🔴 &lt;95%</p>
        <p>🟢 Response ≤200ms | 🟡 200-500ms | 🔴 &gt;500ms</p>
      </div>
    </div>
  );
}
