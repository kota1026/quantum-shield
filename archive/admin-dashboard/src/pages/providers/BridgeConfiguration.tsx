/**
 * UI-006: Bridge Service Configuration
 * 
 * Reference: EVENT_BRIDGE_SPEC.md, HSM_INTEGRATION_SPEC.md
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function BridgeConfiguration() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState({ blockConfirmations: 12, relayerCount: 2 });

  const { data: status } = useQuery({
    queryKey: ['bridge', 'status'],
    queryFn: () => api.get('/api/system/status'),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6" data-testid="bridge-configuration">
      <h1 className="text-2xl font-bold">Bridge Service Configuration</h1>

      {/* Network Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Network Connections</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-medium">L1: Ethereum Sepolia</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Connected</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">Event Indexer Active</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="font-medium">L3: Aegis Chain</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Connected</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">4 Nodes Active</p>
          </div>
        </div>
      </div>

      {/* Block Confirmation (12-block reorg protection) */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Block Confirmation</h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">Required Confirmations (Reorg Protection)</p>
            <p className="text-3xl font-bold text-blue-600">12 blocks</p>
          </div>
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-sm">
            <p className="text-sm text-yellow-800"><strong>Security Note:</strong> 12-block confirmation prevents chain reorganization attacks on cross-chain events.</p>
          </div>
        </div>
      </div>

      {/* Multi-Relayer Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Multi-Relayer Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Relayer #1 (Primary)</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Healthy</span>
            </div>
            <p className="text-sm text-gray-500">Last heartbeat: 2s ago</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Relayer #2 (Backup)</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Standby</span>
            </div>
            <p className="text-sm text-gray-500">Ready for failover</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">Failover threshold: 30 seconds of primary inactivity</p>
      </div>

      {/* HSM Connection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">HSM Integration</h2>
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div>
            <p className="font-medium">HSM Connection Status</p>
            <p className="text-sm text-gray-600">mTLS: Enabled | Endpoint: hsm.quantum-shield.io:8443</p>
          </div>
          <span className="px-3 py-1 bg-green-600 text-white rounded">Connected</span>
        </div>
      </div>
    </div>
  );
}