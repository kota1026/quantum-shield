'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ObserverHeader } from '../Dashboard/ObserverHeader';
import { SuspiciousAlertCard } from './SuspiciousAlertCard';

// Mock data
const mockAlerts = [
  {
    id: '1',
    riskLevel: 'high' as const,
    riskScore: 87,
    detectedTime: '2 hours',
    address: '0x4b7c...9e1f',
    amount: '45.00 ETH',
    unlockType: 'emergency' as const,
    timeRemaining: '6d 14:22:18',
    riskFactors: [
      { type: 'high' as const, text: 'First-time emergency unlock from this address' },
      { type: 'high' as const, text: 'Amount is in top 5% of all unlock requests' },
      { type: 'medium' as const, text: 'Account created only 12 days ago' },
      { type: 'medium' as const, text: 'Unusual timing pattern (3:42 AM local time)' },
    ],
  },
  {
    id: '2',
    riskLevel: 'medium' as const,
    riskScore: 62,
    detectedTime: '5 hours',
    address: '0x2e5f...8a1b',
    amount: '25.00 ETH',
    unlockType: 'normal' as const,
    timeRemaining: '21:33:47',
    riskFactors: [
      { type: 'medium' as const, text: 'Unusual unlock pattern - 3 unlocks in 24 hours' },
      { type: 'medium' as const, text: 'Total unlocked amount exceeds historical average by 300%' },
    ],
  },
  {
    id: '3',
    riskLevel: 'medium' as const,
    riskScore: 48,
    detectedTime: '8 hours',
    address: '0x9c4a...2f7d',
    amount: '15.75 ETH',
    unlockType: 'normal' as const,
    timeRemaining: '19:45:22',
    riskFactors: [
      { type: 'medium' as const, text: 'Address previously associated with flagged account' },
    ],
  },
];

export function SuspiciousMonitor() {
  const t = useTranslations('observer.dashboard.suspiciousPage');

  const [alerts, setAlerts] = useState(mockAlerts);

  const handleDismiss = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px]"
          style={{
            background:
              'radial-gradient(ellipse, rgba(188, 0, 45, 0.12), transparent 60%)',
            opacity: 0.5,
          }}
        />
      </div>

      <main
        className="relative z-10 max-w-[1400px] mx-auto px-8 py-8"
        role="main"
        aria-label={t('pageTitle')}
      >
        {/* Header */}
        <ObserverHeader />

        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground">
            {t('pageTitle')}
          </h1>
          <div
            className={cn(
              'flex items-center gap-2 px-4 py-2',
              'bg-danger/10 border border-danger rounded-full',
              'text-danger text-xs font-semibold'
            )}
            role="status"
            aria-label={t('alertCount', { count: alerts.length })}
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            {t('alertCount', { count: alerts.length })}
          </div>
        </div>

        {/* Alerts Grid */}
        <div className="space-y-6">
          {alerts.map((alert) => (
            <SuspiciousAlertCard
              key={alert.id}
              alert={alert}
              onDismiss={handleDismiss}
            />
          ))}
        </div>

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {t('emptyState.title')}
            </h2>
            <p className="text-foreground-secondary">
              {t('emptyState.description')}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
