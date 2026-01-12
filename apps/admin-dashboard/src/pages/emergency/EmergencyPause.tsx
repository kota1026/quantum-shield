/**
 * Emergency Pause (Admin Common Function)
 * 
 * Reference: SEQUENCES.md #8 - Emergency Pause & Recovery
 * Core Principles: CP-3 Time Lock
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useState } from 'react';

export function EmergencyPause() {
  const queryClient = useQueryClient();
  const [confirmPause, setConfirmPause] = useState(false);

  const { data: status } = useQuery({
    queryKey: ['system', 'status'],
    queryFn: () => api.get<any>('/api/system/status'),
    refetchInterval: 5000,
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.post('/api/system/pause'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['system'] }); setConfirmPause(false); },
  });

  const unpauseMutation = useMutation({
    mutationFn: () => api.post('/api/system/unpause'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['system'] }),
  });

  const isPaused = status?.status === 'paused';

  return (
    <div className="space-y-6" data-testid="emergency-pause">
      <h1 className="text-2xl font-bold">Emergency Management</h1>

      {/* Current Status */}
      <div className={`p-6 rounded-lg ${isPaused ? 'bg-red-100 border-2 border-red-500' : 'bg-green-100 border-2 border-green-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{isPaused ? '⚠️ System PAUSED' : '✅ System Active'}</h2>
            <p className="text-gray-700 mt-1">{isPaused ? 'New locks and unlocks are disabled' : 'All operations are functioning normally'}</p>
          </div>
          <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
        </div>
      </div>

      {/* 72h Maximum Pause Duration (SEQ#8) */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800">Maximum Pause Duration (SEQ#8)</h3>
        <p className="text-purple-700">Emergency pause is limited to <strong>72 hours</strong>. Extension requires Token Vote approval.</p>
      </div>

      {/* Security Council Requirement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800">Security Council Approval (5/9)</h3>
        <p className="text-blue-700">Emergency pause requires 5 of 9 Security Council member signatures.</p>
      </div>

      {/* Affected Operations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Affected Operations During Pause</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200"><span className="text-red-800">❌ New Lock</span> - Stopped</div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200"><span className="text-red-800">❌ New Unlock</span> - Stopped</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ In-progress Unlock</span> - Continues</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ Claim</span> - Continues</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ Challenge</span> - Continues</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ Prover Exit</span> - Continues</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Emergency Actions</h2>
        {!isPaused ? (
          <div>
            {!confirmPause ? (
              <button onClick={() => setConfirmPause(true)} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">🚨 Initiate Emergency Pause</button>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-300">
                <p className="text-red-800 font-semibold mb-4">Are you sure? This will disable new locks and unlocks.</p>
                <div className="flex space-x-4">
                  <button onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">Confirm Pause</button>
                  <button onClick={() => setConfirmPause(false)} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => unpauseMutation.mutate()} disabled={unpauseMutation.isPending} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✅ Resume Operations</button>
        )}
      </div>
    </div>
  );
}