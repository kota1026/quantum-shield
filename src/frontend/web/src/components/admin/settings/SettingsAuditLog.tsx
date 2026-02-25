'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  FileText,
  ChevronRight,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Shield,
  Database,
  Settings,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Mock data
const mockAuditLogs = [
  {
    id: 'log-001',
    action: 'user.login',
    actor: '山田太郎',
    actorEmail: 'yamada@quantumshield.io',
    target: null,
    status: 'success',
    ipAddress: '192.168.1.100',
    timestamp: '2026-01-18 14:30:45',
    details: 'ログインに成功しました',
  },
  {
    id: 'log-002',
    action: 'operator.update',
    actor: '佐藤花子',
    actorEmail: 'sato@quantumshield.io',
    target: 'Global Finance Corp',
    status: 'success',
    ipAddress: '192.168.1.101',
    timestamp: '2026-01-18 14:15:30',
    details: 'オペレーター情報を更新しました',
  },
  {
    id: 'log-003',
    action: 'settings.update',
    actor: '山田太郎',
    actorEmail: 'yamada@quantumshield.io',
    target: 'Security Settings',
    status: 'success',
    ipAddress: '192.168.1.100',
    timestamp: '2026-01-18 13:45:00',
    details: 'セキュリティ設定を更新しました',
  },
  {
    id: 'log-004',
    action: 'user.create',
    actor: '山田太郎',
    actorEmail: 'yamada@quantumshield.io',
    target: 'suzuki@quantumshield.io',
    status: 'success',
    ipAddress: '192.168.1.100',
    timestamp: '2026-01-18 12:30:15',
    details: '新しいユーザーを招待しました',
  },
  {
    id: 'log-005',
    action: 'billing.export',
    actor: '佐藤花子',
    actorEmail: 'sato@quantumshield.io',
    target: '2026-01 Invoice',
    status: 'success',
    ipAddress: '192.168.1.101',
    timestamp: '2026-01-18 11:00:00',
    details: '請求書をエクスポートしました',
  },
  {
    id: 'log-006',
    action: 'user.login',
    actor: 'unknown',
    actorEmail: 'test@attacker.com',
    target: null,
    status: 'failure',
    ipAddress: '203.0.113.50',
    timestamp: '2026-01-18 10:30:00',
    details: 'ログインに失敗しました（無効な認証情報）',
  },
  {
    id: 'log-007',
    action: 'prover.restart',
    actor: '田中一郎',
    actorEmail: 'tanaka@quantumshield.io',
    target: 'QS-Prover-Tokyo-01',
    status: 'success',
    ipAddress: '192.168.1.102',
    timestamp: '2026-01-18 09:15:30',
    details: 'Proverを再起動しました',
  },
  {
    id: 'log-008',
    action: 'role.update',
    actor: '山田太郎',
    actorEmail: 'yamada@quantumshield.io',
    target: 'Support Role',
    status: 'success',
    ipAddress: '192.168.1.100',
    timestamp: '2026-01-17 16:45:00',
    details: 'ロールの権限を更新しました',
  },
];

const actionCategories = [
  { key: 'all', label: 'All' },
  { key: 'user', label: 'User' },
  { key: 'operator', label: 'Operator' },
  { key: 'billing', label: 'Billing' },
  { key: 'settings', label: 'Settings' },
  { key: 'prover', label: 'Prover' },
];

export function SettingsAuditLog() {
  const t = useTranslations('admin.settingsAuditLog');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<typeof mockAuditLogs[0] | null>(mockAuditLogs[0]);

  const getActionIcon = (action: string) => {
    if (action.startsWith('user.')) return <User className="h-4 w-4" />;
    if (action.startsWith('operator.')) return <Database className="h-4 w-4" />;
    if (action.startsWith('settings.')) return <Settings className="h-4 w-4" />;
    if (action.startsWith('billing.')) return <FileText className="h-4 w-4" />;
    if (action.startsWith('prover.')) return <Shield className="h-4 w-4" />;
    if (action.startsWith('role.')) return <Shield className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getActionLabel = (action: string) => {
    return t(`actions.${action.replace('.', '_')}`);
  };

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.target && log.target.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeCategory === 'all') return matchesSearch;
    return matchesSearch && log.action.startsWith(activeCategory + '.');
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/settings/members" className="hover:text-foreground">
                Settings
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
                {t('actions.export')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
              {actionCategories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                    activeCategory === category.key
                      ? 'bg-gold text-background'
                      : 'text-foreground-secondary hover:text-foreground'
                  )}
                >
                  {category.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Log List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('logList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedLog?.id === log.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50',
                          log.status === 'failure' && 'border-l-4 border-l-danger'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              log.status === 'success' ? 'bg-gold/10' : 'bg-danger/10'
                            )}>
                              {log.status === 'success' ? (
                                <span className="text-gold">{getActionIcon(log.action)}</span>
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-danger" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">
                                {getActionLabel(log.action)}
                              </div>
                              <div className="text-xs text-foreground-tertiary">
                                {log.actor} • {log.actorEmail}
                              </div>
                            </div>
                          </div>
                          {log.status === 'success' ? (
                            <Badge variant="success">{t('status.success')}</Badge>
                          ) : (
                            <Badge variant="danger">{t('status.failure')}</Badge>
                          )}
                        </div>

                        {log.target && (
                          <div className="mt-2 text-sm text-foreground-secondary">
                            {t('logList.target')}: {log.target}
                          </div>
                        )}

                        <div className="mt-2 flex items-center gap-1 text-xs text-foreground-tertiary">
                          <Clock className="h-3 w-3" />
                          {log.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="mt-4 flex items-center justify-between border-t border-surface-tertiary pt-4">
                    <div className="text-sm text-foreground-tertiary">
                      {t('pagination.showing', { count: filteredLogs.length, total: mockAuditLogs.length })}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        {t('pagination.previous')}
                      </Button>
                      <Button variant="outline" size="sm">
                        {t('pagination.next')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Log Detail */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLog ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {selectedLog.status === 'success' ? (
                          <Badge variant="success">{t('status.success')}</Badge>
                        ) : (
                          <Badge variant="danger">{t('status.failure')}</Badge>
                        )}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.action')}</div>
                        <div className="flex items-center gap-2">
                          {getActionIcon(selectedLog.action)}
                          <span className="font-medium">{getActionLabel(selectedLog.action)}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.actor')}</div>
                        <div className="font-medium">{selectedLog.actor}</div>
                        <div className="text-sm text-foreground-tertiary">{selectedLog.actorEmail}</div>
                      </div>

                      {selectedLog.target && (
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.target')}</div>
                          <div className="text-sm">{selectedLog.target}</div>
                        </div>
                      )}

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.timestamp')}</div>
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-foreground-tertiary" />
                          {selectedLog.timestamp}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.ipAddress')}</div>
                        <div className="font-mono text-sm">{selectedLog.ipAddress}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.details')}</div>
                        <div className="mt-1 rounded-lg bg-background-secondary p-3 text-sm">
                          {selectedLog.details}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Eye className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectLog')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
