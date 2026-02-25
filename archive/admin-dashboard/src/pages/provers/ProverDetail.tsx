/**
 * UI-003: Prover Reward Tracking
 * UI-004: Prover Staking Management
 * 
 * Reference: SEQUENCES.md #5, #6 and UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md
 */
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function ProverDetail() {
  const { proverId } = useParams<{ proverId: string }>();
  const queryClient = useQueryClient();
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const { data: prover, isLoading } = useQuery({
    queryKey: ['prover', proverId],
    queryFn: () => api.get<any>(`/api/provers/${proverId}`),
  });

  const { data: rewards } = useQuery({
    queryKey: ['prover', proverId, 'rewards'],
    queryFn: () => api.get<any>(`/api/provers/${proverId}/rewards`),
  });

  const addStakeMutation = useMutation({
    mutationFn: (amount: string) => api.post(`/api/provers/${proverId}/stake/add`, { amount }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prover', proverId] }); setStakeAmount(''); },
  });

  const withdrawMutation = useMutation({
    mutationFn: (amount: string) => api.post(`/api/provers/${proverId}/stake/withdraw`, { amount }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prover', proverId] }); setWithdrawAmount(''); },
  });

  if (isLoading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6" data-testid="prover-rewards">
      <div className="flex items-center space-x-4">
        <Link to="/provers" className="text-qs-primary hover:underline">&larr; Back</Link>
        <h1 className="text-2xl font-bold">{prover?.name || 'Prover Details'}</h1>
        <StatusBadge status={prover?.status} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Total Stake</p><p className="text-2xl font-bold">${(prover?.stake / 1000 || 0).toFixed(0)}K</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Total Rewards</p><p className="text-2xl font-bold text-green-600">${rewards?.totalRewards || '0'}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Success Rate</p><p className="text-2xl font-bold">{prover?.successRate?.toFixed(1) || 0}%</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Avg Response</p><p className="text-2xl font-bold">{prover?.responseTime || 0}ms</p></div>
      </div>

      {/* Staking Management (UI-004) */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="prover-staking">
        <h2 className="text-lg font-semibold mb-4">Staking Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Add Stake</h3>
            <div className="flex space-x-2">
              <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="Amount (USD)" className="flex-1 border rounded-lg p-2" />
              <button onClick={() => addStakeMutation.mutate(stakeAmount)} disabled={!stakeAmount || addStakeMutation.isPending} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">Add</button>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Withdraw Stake</h3>
            <div className="flex space-x-2">
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="Amount (USD)" className="flex-1 border rounded-lg p-2" />
              <button onClick={() => withdrawMutation.mutate(withdrawAmount)} disabled={!withdrawAmount || withdrawMutation.isPending} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50">Withdraw</button>
            </div>
          </div>
        </div>
        {/* 7-day Unbonding Warning (SEQ#6) */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm"><strong>Unbonding Period (SEQ#6):</strong> Withdrawals require 7-day unbonding. Stake remains subject to slashing during this period.</p>
        </div>
      </div>

      {/* Slashing Risk Display (CP-4) */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-4">Quadratic Slashing Risk (N² × 10%)</h2>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-white rounded-lg"><p className="text-sm text-gray-600">1 Prover</p><p className="text-xl font-bold text-red-600">10%</p></div>
          <div className="p-3 bg-white rounded-lg"><p className="text-sm text-gray-600">2 Provers</p><p className="text-xl font-bold text-red-600">40%</p></div>
          <div className="p-3 bg-white rounded-lg"><p className="text-sm text-gray-600">3 Provers</p><p className="text-xl font-bold text-red-600">90%</p></div>
          <div className="p-3 bg-white rounded-lg"><p className="text-sm text-gray-600">4+ Provers</p><p className="text-xl font-bold text-red-600">100%</p></div>
        </div>
      </div>

      {/* Reward History (UI-003) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Reward History</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-green-50 rounded-lg"><p className="text-sm text-gray-600">Total Earned</p><p className="text-lg font-bold text-green-600">${rewards?.totalRewards || 0}</p></div>
          <div className="p-3 bg-blue-50 rounded-lg"><p className="text-sm text-gray-600">Pending</p><p className="text-lg font-bold text-blue-600">${rewards?.pendingRewards || 0}</p></div>
          <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">Claimed</p><p className="text-lg font-bold">${rewards?.claimedRewards || 0}</p></div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th><th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            {rewards?.history?.map((entry: any, i: number) => (
              <tr key={i}><td className="px-4 py-2 text-sm">{entry.date}</td><td className="px-4 py-2 text-sm text-right text-green-600">+${entry.amount}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = { active: 'bg-green-100 text-green-800', pending: 'bg-yellow-100 text-yellow-800', suspended: 'bg-red-100 text-red-800' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${s[status as keyof typeof s]}`}>{status}</span>;
}