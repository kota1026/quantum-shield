/**
 * Emergency Pause (Admin Common Function)
 *
 * Reference: SEQUENCES.md #8 - Emergency Pause & Recovery
 * Core Principles: CP-3 Time Lock
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useState } from 'react';

export function EmergencyPause() {
  const { t } = useTranslation();
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
      <h1 className="text-2xl font-bold">{t('emergency.title')}</h1>

      {/* Current Status */}
      <div className={`p-6 rounded-lg ${isPaused ? 'bg-red-100 border-2 border-red-500' : 'bg-green-100 border-2 border-green-500'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{isPaused ? `⚠️ ${t('emergency.systemPaused')}` : `✅ ${t('emergency.systemActive')}`}</h2>
            <p className="text-gray-700 mt-1">{isPaused ? t('emergency.pausedDescription') : t('emergency.activeDescription')}</p>
          </div>
          <div className={`w-4 h-4 rounded-full ${isPaused ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
        </div>
      </div>

      {/* 72h Maximum Pause Duration (SEQ#8) */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-purple-800">{t('emergency.maxPauseDuration.title')}</h3>
        <p className="text-purple-700" dangerouslySetInnerHTML={{ __html: t('emergency.maxPauseDuration.description') }}></p>
      </div>

      {/* Security Council Requirement */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800">{t('emergency.securityCouncil.title')}</h3>
        <p className="text-blue-700">{t('emergency.securityCouncil.description')}</p>
      </div>

      {/* Affected Operations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('emergency.affectedOps.title')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-red-50 rounded-lg border border-red-200"><span className="text-red-800">❌ {t('emergency.affectedOps.newLock')}</span> - {t('common.stopped')}</div>
          <div className="p-3 bg-red-50 rounded-lg border border-red-200"><span className="text-red-800">❌ {t('emergency.affectedOps.newUnlock')}</span> - {t('common.stopped')}</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ {t('emergency.affectedOps.inProgressUnlock')}</span> - {t('common.continues')}</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ {t('emergency.affectedOps.claim')}</span> - {t('common.continues')}</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ {t('emergency.affectedOps.challenge')}</span> - {t('common.continues')}</div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200"><span className="text-green-800">✅ {t('emergency.affectedOps.proverExit')}</span> - {t('common.continues')}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">{t('emergency.actions.title')}</h2>
        {!isPaused ? (
          <div>
            {!confirmPause ? (
              <button onClick={() => setConfirmPause(true)} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700">🚨 {t('emergency.actions.initiatePause')}</button>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-300">
                <p className="text-red-800 font-semibold mb-4">{t('emergency.actions.confirmMessage')}</p>
                <div className="flex space-x-4">
                  <button onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">{t('emergency.actions.confirmPause')}</button>
                  <button onClick={() => setConfirmPause(false)} className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('common.cancel')}</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => unpauseMutation.mutate()} disabled={unpauseMutation.isPending} className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">✅ {t('emergency.actions.resume')}</button>
        )}
      </div>
    </div>
  );
}
