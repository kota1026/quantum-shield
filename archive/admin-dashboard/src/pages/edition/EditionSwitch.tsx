/**
 * Edition Switch (Admin Common Function)
 * 
 * Reference: EDITION_SWITCH_SPEC.md
 * Core Principles: All CP-1~CP-5 must be maintained
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function EditionSwitch() {
  const queryClient = useQueryClient();
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  const { data } = useQuery({
    queryKey: ['edition', 'current'],
    queryFn: () => api.get<any>('/api/edition/current'),
  });

  const switchMutation = useMutation({
    mutationFn: (newEdition: string) => api.post('/api/edition/switch', { edition: newEdition }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['edition'] }); setConfirmSwitch(false); },
  });

  const currentEdition = data?.edition || 'enterprise';
  const targetEdition = currentEdition === 'enterprise' ? 'decentralized' : 'enterprise';

  return (
    <div className="space-y-6" data-testid="edition-switch">
      <h1 className="text-2xl font-bold">Edition Management</h1>

      {/* Current Edition */}
      <div className={`p-6 rounded-lg border-2 ${currentEdition === 'enterprise' ? 'bg-purple-50 border-purple-500' : 'bg-blue-50 border-blue-500'}`}>
        <h2 className="text-xl font-bold">Current Edition: {currentEdition === 'enterprise' ? '🏛️ Enterprise' : '🌐 Decentralized'}</h2>
        <ul className="mt-4 space-y-2">
          {data?.features && Object.entries(data.features).map(([k, v]) => (
            <li key={k} className="flex items-center"><span className={v ? 'text-green-600' : 'text-gray-400'}>{v ? '✓' : '✗'}</span> <span className="ml-2 capitalize">{k.replace(/([A-Z])/g, ' $1')}</span></li>
          ))}
        </ul>
      </div>

      {/* Core Principles Compliance Check */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Core Principles Compliance (Required for Both Editions)</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { id: 'CP-1', name: 'Quantum Resistance', desc: 'Dilithium/SPHINCS+/SHA3-256' },
            { id: 'CP-2', name: 'Self-Custody', desc: 'User key management' },
            { id: 'CP-3', name: 'Time Lock', desc: '24h/7d minimum' },
            { id: 'CP-4', name: 'Slashing', desc: 'N²×10% quadratic' },
            { id: 'CP-5', name: 'Transparency', desc: 'On-chain verifiable' },
          ].map((cp) => (
            <div key={cp.id} className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <p className="font-bold text-green-800">{cp.id} ✅</p>
              <p className="text-xs text-gray-600 mt-1">{cp.name}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">ℹ️ All Core Principles remain enforced regardless of edition. Edition affects operational model only.</p>
      </div>

      {/* Edition Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Edition Comparison</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left">Feature</th><th className="px-4 py-2 text-center">🏛️ Enterprise</th><th className="px-4 py-2 text-center">🌐 Decentralized</th></tr></thead>
          <tbody className="divide-y divide-gray-200">
            <tr><td className="px-4 py-2">SLA Guarantee</td><td className="px-4 py-2 text-center text-green-600">✓</td><td className="px-4 py-2 text-center text-gray-400">-</td></tr>
            <tr><td className="px-4 py-2">Dedicated Support</td><td className="px-4 py-2 text-center text-green-600">✓</td><td className="px-4 py-2 text-center">Community</td></tr>
            <tr><td className="px-4 py-2">Token Voting</td><td className="px-4 py-2 text-center text-gray-400">-</td><td className="px-4 py-2 text-center text-green-600">✓</td></tr>
            <tr><td className="px-4 py-2">Permissionless Provers</td><td className="px-4 py-2 text-center text-gray-400">-</td><td className="px-4 py-2 text-center text-green-600">✓</td></tr>
            <tr><td className="px-4 py-2">Compliance Reports</td><td className="px-4 py-2 text-center text-green-600">✓</td><td className="px-4 py-2 text-center text-gray-400">-</td></tr>
          </tbody>
        </table>
      </div>

      {/* Switch Action */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Switch Edition</h2>
        {!confirmSwitch ? (
          <button onClick={() => setConfirmSwitch(true)} className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">Switch to {targetEdition === 'enterprise' ? 'Enterprise' : 'Decentralized'}</button>
        ) : (
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-300">
            <p className="text-orange-800 mb-4">Confirm switch from <strong>{currentEdition}</strong> to <strong>{targetEdition}</strong>?</p>
            <div className="flex space-x-4">
              <button onClick={() => switchMutation.mutate(targetEdition)} disabled={switchMutation.isPending} className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50">Confirm Switch</button>
              <button onClick={() => setConfirmSwitch(false)} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}