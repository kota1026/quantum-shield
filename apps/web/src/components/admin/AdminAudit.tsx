'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type LogType = 'user' | 'prover' | 'security' | 'system';
type TabType = 'all' | 'user' | 'security' | 'system';

interface AuditLog {
  id: string;
  time: string;
  type: LogType;
  userInitial: string;
  userName: string;
  action: string;
  details: string;
}

// Tab component
interface TabItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabItem({ label, isActive, onClick }: TabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        'rounded-lg px-5 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isActive
          ? 'bg-background-tertiary text-foreground'
          : 'text-foreground-secondary hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

// Log type badge component
interface LogTypeBadgeProps {
  type: LogType;
}

function LogTypeBadge({ type }: LogTypeBadgeProps) {
  const t = useTranslations('admin.audit.logType');

  const typeConfig = {
    user: {
      label: t('user'),
      bgClass: 'bg-gold/10',
      textClass: 'text-gold',
    },
    prover: {
      label: t('prover'),
      bgClass: 'bg-success/10',
      textClass: 'text-success',
    },
    security: {
      label: t('security'),
      bgClass: 'bg-hinomaru/10',
      textClass: 'text-hinomaru',
    },
    system: {
      label: t('system'),
      bgClass: 'bg-[#4a90d9]/10',
      textClass: 'text-[#4a90d9]',
    },
  };

  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-[11px] font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      {config.label}
    </span>
  );
}

// User avatar component
interface UserAvatarProps {
  initial: string;
}

function UserAvatar({ initial }: UserAvatarProps) {
  return (
    <div
      className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/10 text-[10px] font-medium text-gold"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

// Log row component
interface LogRowProps {
  log: AuditLog;
  onClick: () => void;
}

function LogRow({ log, onClick }: LogRowProps) {
  return (
    <tr
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-b border-surface-tertiary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      tabIndex={0}
      role="button"
      aria-label={`${log.action}, ${log.time}`}
    >
      <td className="px-4 py-3.5">
        <span className="font-mono text-xs text-foreground-tertiary">{log.time}</span>
      </td>
      <td className="px-4 py-3.5">
        <LogTypeBadge type={log.type} />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <UserAvatar initial={log.userInitial} />
          <span className="text-sm">{log.userName}</span>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-[13px] font-medium">{log.action}</span>
      </td>
      <td className="px-4 py-3.5">
        <span className="text-[13px] text-foreground-tertiary">{log.details}</span>
      </td>
    </tr>
  );
}

export function AdminAudit() {
  const t = useTranslations('admin.audit');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Mock data - in production would come from API
  const logs: AuditLog[] = [
    {
      id: '1',
      time: '2026-01-11 10:32:15',
      type: 'user',
      userInitial: '松',
      userName: 'matsumoto',
      action: 'Dashboard accessed',
      details: 'IP: 192.168.1.100',
    },
    {
      id: '2',
      time: '2026-01-11 10:28:42',
      type: 'prover',
      userInitial: 'S',
      userName: 'System',
      action: 'Prover #42 signed unlock request',
      details: 'TX: 0x7a3f...9c2d',
    },
    {
      id: '3',
      time: '2026-01-11 10:15:33',
      type: 'security',
      userInitial: '田',
      userName: 'tamura',
      action: 'Permission change: kato (Viewer → Operator)',
      details: 'Approved by: matsumoto',
    },
    {
      id: '4',
      time: '2026-01-11 10:00:00',
      type: 'system',
      userInitial: 'S',
      userName: 'System',
      action: 'Daily report generated',
      details: 'Scheduled task',
    },
    {
      id: '5',
      time: '2026-01-11 09:45:12',
      type: 'user',
      userInitial: '加',
      userName: 'kato',
      action: 'Onboarding completed',
      details: 'Permission: Operator',
    },
  ];

  const handleLogClick = (logId: string) => {
    // In production, would open detail modal
    console.log('Log clicked:', logId);
  };

  // Filter logs based on active tab
  const filteredLogs = logs.filter((log) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'user') return log.type === 'user';
    if (activeTab === 'security') return log.type === 'security';
    if (activeTab === 'system') return log.type === 'system' || log.type === 'prover';
    return true;
  });

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
        </div>

        {/* Tabs */}
        <div
          className="mb-6 flex gap-1 rounded-lg bg-background-secondary p-1"
          role="tablist"
          aria-label={t('title')}
          style={{ width: 'fit-content' }}
        >
          <TabItem
            label={t('tabs.all')}
            isActive={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
          />
          <TabItem
            label={t('tabs.user')}
            isActive={activeTab === 'user'}
            onClick={() => setActiveTab('user')}
          />
          <TabItem
            label={t('tabs.security')}
            isActive={activeTab === 'security'}
            onClick={() => setActiveTab('security')}
          />
          <TabItem
            label={t('tabs.system')}
            isActive={activeTab === 'system'}
            onClick={() => setActiveTab('system')}
          />
        </div>

        {/* Logs Table */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-tertiary px-5 py-4">
            <CardTitle className="text-base">{t('card.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-background-secondary">
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.time')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.type')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.user')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.action')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.details')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <LogRow
                        key={log.id}
                        log={log}
                        onClick={() => handleLogClick(log.id)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-foreground-secondary"
                      >
                        {t('table.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
