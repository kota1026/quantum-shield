'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Pause,
  Unlock,
  Key,
  History,
  AlertCircle,
  X,
} from 'lucide-react';
import { EnterpriseSidebar } from '@/components/enterprise/Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '@/components/enterprise/Dashboard/EnterpriseTopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmergencyAction {
  id: string;
  key: 'pauseSystem' | 'emergencyUnlock' | 'revokeKeys';
  icon: React.ComponentType<{ className?: string }>;
  danger: boolean;
}

interface EmergencyLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: 'completed' | 'reverted';
}

const EMERGENCY_ACTIONS: EmergencyAction[] = [
  { id: '1', key: 'pauseSystem', icon: Pause, danger: true },
  { id: '2', key: 'emergencyUnlock', icon: Unlock, danger: true },
  { id: '3', key: 'revokeKeys', icon: Key, danger: true },
];

const DEMO_LOGS: EmergencyLog[] = [
  {
    id: '1',
    action: 'System Pause',
    user: 'admin@acme.co',
    timestamp: '2024-11-15 14:32:00',
    status: 'reverted',
  },
  {
    id: '2',
    action: 'Emergency Unlock',
    user: 'admin@acme.co',
    timestamp: '2024-10-22 09:15:00',
    status: 'completed',
  },
];

export function EnterpriseEmergency() {
  const t = useTranslations('enterprise.emergency');
  const tCommon = useTranslations('enterprise');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const handleAction = (actionKey: string) => {
    setConfirmAction(actionKey);
  };

  const confirmExecution = () => {
    // In production, execute the emergency action
    console.log('Executing:', confirmAction);
    setConfirmAction(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <EnterpriseSidebar />

      <div className="flex-1 ml-[260px]">
        <EnterpriseTopBar
          pageTitle={t('pageTitle')}
          userName={tCommon('dashboard.demoUser.name')}
          userInitial={tCommon('dashboard.demoUser.initial')}
        />

        <main className="p-8" role="main" aria-label={t('ariaLabel')}>
          {/* Warning Banner */}
          <div className="mb-8 p-4 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{t('warning')}</p>
          </div>

          {/* Emergency Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {EMERGENCY_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <Card key={action.id} className="p-6 border-danger/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-danger/10 rounded-lg">
                      <Icon className="h-6 w-6 text-danger" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t(`actions.${action.key}.title`)}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-6">
                    {t(`actions.${action.key}.description`)}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-danger/30 text-danger hover:bg-danger/10"
                    onClick={() => handleAction(action.key)}
                  >
                    {t(`actions.${action.key}.button`)}
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Emergency Log */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <History className="h-5 w-5 text-foreground-secondary" />
              <h3 className="font-semibold">{t('log.title')}</h3>
            </div>

            {DEMO_LOGS.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="h-12 w-12 text-foreground-tertiary mx-auto mb-4" />
                <p className="text-foreground-secondary">{t('log.noLogs')}</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {DEMO_LOGS.map((log) => (
                  <div key={log.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-foreground-secondary">
                        {log.user} • {log.timestamp}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        log.status === 'completed'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      )}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </main>

        {/* Confirmation Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Card className="w-full max-w-md mx-4 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-danger/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-danger" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{t('confirmation.title')}</h3>
                  <p className="text-sm text-foreground-secondary">{t('confirmation.message')}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                  {t('confirmation.cancel')}
                </Button>
                <Button
                  className="bg-danger hover:bg-danger/90 text-white"
                  onClick={confirmExecution}
                >
                  {t('confirmation.confirm')}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnterpriseEmergency;
