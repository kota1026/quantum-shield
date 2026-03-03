'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  ChevronRight,
  Key,
  Lock,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Activity,
  RefreshCw,
  Settings,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'info' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger',
          status === 'info' && 'bg-info/10 text-info'
        )}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

export function AdminSecuritySettings() {
  const t = useTranslations('admin.securitySettings');
  const [activeTab, setActiveTab] = useState<'overview' | 'mfa' | 'sessions' | 'api_keys' | 'audit'>('overview');
  const [showApiKey, setShowApiKey] = useState<string | null>(null);

  const SAMPLE_SESSIONS = [
    {
      id: 'session-001',
      device: 'Chrome on macOS',
      location: 'Tokyo, Japan',
      ip: '203.0.113.45',
      lastActive: '現在アクティブ',
      current: true,
    },
    {
      id: 'session-002',
      device: 'Safari on iPhone',
      location: 'Tokyo, Japan',
      ip: '203.0.113.46',
      lastActive: '2時間前',
      current: false,
    },
    {
      id: 'session-003',
      device: 'Firefox on Windows',
      location: 'Osaka, Japan',
      ip: '192.0.2.12',
      lastActive: '1日前',
      current: false,
    },
  ];

  const SAMPLE_API_KEYS = [
    {
      id: 'key-001',
      name: 'Production API Key',
      key: 'qs_prod_*****************************abc123',
      created: '2025-06-15',
      lastUsed: '5分前',
      status: 'active',
    },
    {
      id: 'key-002',
      name: 'Staging API Key',
      key: 'qs_stag_*****************************def456',
      created: '2025-08-20',
      lastUsed: '1日前',
      status: 'active',
    },
    {
      id: 'key-003',
      name: 'Development API Key',
      key: 'qs_dev_******************************ghi789',
      created: '2025-09-01',
      lastUsed: '未使用',
      status: 'inactive',
    },
  ];

  const SAMPLE_AUDIT_LOGS = [
    {
      id: 'log-001',
      action: 'ログイン成功',
      user: '田中 健一',
      ip: '203.0.113.45',
      time: '5分前',
      type: 'success',
    },
    {
      id: 'log-002',
      action: 'APIキー作成',
      user: '山田 花子',
      ip: '192.0.2.10',
      time: '1時間前',
      type: 'info',
    },
    {
      id: 'log-003',
      action: 'パスワード変更',
      user: '鈴木 太郎',
      ip: '198.51.100.23',
      time: '3時間前',
      type: 'warning',
    },
    {
      id: 'log-004',
      action: 'ログイン失敗（3回）',
      user: '不明',
      ip: '203.0.113.99',
      time: '6時間前',
      type: 'danger',
    },
  ];

  const tabs = [
    { key: 'overview', label: t('tabs.overview'), icon: <Shield className="h-4 w-4" /> },
    { key: 'mfa', label: t('tabs.mfa'), icon: <Smartphone className="h-4 w-4" /> },
    { key: 'sessions', label: t('tabs.sessions'), icon: <Activity className="h-4 w-4" /> },
    { key: 'api_keys', label: t('tabs.apiKeys'), icon: <Key className="h-4 w-4" /> },
    { key: 'audit', label: t('tabs.audit'), icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-foreground-tertiary" aria-label="Breadcrumb">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </nav>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('stats.securityScore')}
              value="92/100"
              icon={<Shield className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.activeSessions')}
              value="3"
              icon={<Activity className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.apiKeys')}
              value="3"
              subValue={t('stats.activeKeys', { count: 2 })}
              icon={<Key className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.failedLogins')}
              value="1"
              subValue={t('stats.last24h')}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Security Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.securityStatus')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-success/50 bg-success/5 p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">{t('overview.mfaEnabled')}</span>
                      </div>
                      <Badge variant="success">{t('overview.active')}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-success/50 bg-success/5 p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">{t('overview.strongPassword')}</span>
                      </div>
                      <Badge variant="success">{t('overview.active')}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <span className="text-sm">{t('overview.passwordAge')}</span>
                      </div>
                      <Badge variant="warning">{t('overview.days', { count: 45 })}</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-success/50 bg-success/5 p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="text-sm">{t('overview.ipRestriction')}</span>
                      </div>
                      <Badge variant="success">{t('overview.configured')}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" leftIcon={<Lock className="h-4 w-4" />}>
                      {t('overview.changePassword')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" leftIcon={<Smartphone className="h-4 w-4" />}>
                      {t('overview.setupMfa')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" leftIcon={<Key className="h-4 w-4" />}>
                      {t('overview.generateApiKey')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start" leftIcon={<RefreshCw className="h-4 w-4" />}>
                      {t('overview.rotateKeys')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'mfa' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('mfa.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Authenticator App */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                        <Smartphone className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t('mfa.authenticator')}</span>
                          <Badge variant="success">{t('mfa.enabled')}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-foreground-secondary">{t('mfa.authenticatorDesc')}</p>
                      </div>
                    </div>
                    <Button variant="outline">{t('mfa.manage')}</Button>
                  </div>

                  {/* Email OTP */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                        <Mail className="h-6 w-6 text-info" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t('mfa.emailOtp')}</span>
                          <Badge variant="default">{t('mfa.backup')}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-foreground-secondary">{t('mfa.emailOtpDesc')}</p>
                      </div>
                    </div>
                    <Button variant="outline">{t('mfa.configure')}</Button>
                  </div>

                  {/* Recovery Codes */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                        <Key className="h-6 w-6 text-warning" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{t('mfa.recoveryCodes')}</span>
                          <Badge variant="warning">{t('mfa.remaining', { count: 5 })}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-foreground-secondary">{t('mfa.recoveryCodesDesc')}</p>
                      </div>
                    </div>
                    <Button variant="outline">{t('mfa.regenerate')}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'sessions' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('sessions.title')}</CardTitle>
                <Button variant="danger" size="sm">
                  {t('sessions.terminateAll')}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_SESSIONS.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-4',
                        session.current
                          ? 'border-success/50 bg-success/5'
                          : 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          session.current ? 'bg-success/10' : 'bg-background'
                        )}>
                          <Activity className={cn(
                            'h-5 w-5',
                            session.current ? 'text-success' : 'text-foreground-tertiary'
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{session.device}</span>
                            {session.current && (
                              <Badge variant="success">{t('sessions.current')}</Badge>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-foreground-secondary">
                            {session.location} • {session.ip}
                          </div>
                          <div className="mt-1 text-xs text-foreground-tertiary">
                            {t('sessions.lastActive')}: {session.lastActive}
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button variant="outline" size="sm">
                          {t('sessions.terminate')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'api_keys' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('apiKeys.title')}</CardTitle>
                <Button leftIcon={<Key className="h-4 w-4" />}>
                  {t('apiKeys.create')}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_API_KEYS.map((apiKey) => (
                    <div
                      key={apiKey.id}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            apiKey.status === 'active' ? 'bg-success/10' : 'bg-foreground-tertiary/10'
                          )}>
                            <Key className={cn(
                              'h-5 w-5',
                              apiKey.status === 'active' ? 'text-success' : 'text-foreground-tertiary'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{apiKey.name}</span>
                              <Badge variant={apiKey.status === 'active' ? 'success' : 'default'}>
                                {apiKey.status === 'active' ? t('apiKeys.active') : t('apiKeys.inactive')}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <code className="font-mono text-xs text-foreground-secondary">
                                {showApiKey === apiKey.id ? apiKey.key : apiKey.key.replace(/[a-z0-9]/gi, '*')}
                              </code>
                              <button
                                onClick={() => setShowApiKey(showApiKey === apiKey.id ? null : apiKey.id)}
                                className="text-foreground-tertiary hover:text-foreground"
                              >
                                {showApiKey === apiKey.id ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <div className="mt-1 text-xs text-foreground-tertiary">
                              {t('apiKeys.created')}: {apiKey.created} • {t('apiKeys.lastUsed')}: {apiKey.lastUsed}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            {t('apiKeys.revoke')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'audit' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('audit.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SAMPLE_AUDIT_LOGS.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        'flex items-center justify-between rounded-lg border p-3',
                        log.type === 'danger' && 'border-danger/50 bg-danger/5',
                        log.type === 'warning' && 'border-warning/50 bg-warning/5',
                        log.type === 'success' && 'border-success/50 bg-success/5',
                        log.type === 'info' && 'border-surface-tertiary bg-background-secondary'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          log.type === 'danger' && 'bg-danger/10',
                          log.type === 'warning' && 'bg-warning/10',
                          log.type === 'success' && 'bg-success/10',
                          log.type === 'info' && 'bg-info/10'
                        )}>
                          {log.type === 'danger' && <AlertTriangle className="h-4 w-4 text-danger" />}
                          {log.type === 'warning' && <AlertTriangle className="h-4 w-4 text-warning" />}
                          {log.type === 'success' && <CheckCircle className="h-4 w-4 text-success" />}
                          {log.type === 'info' && <Activity className="h-4 w-4 text-info" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{log.action}</div>
                          <div className="text-xs text-foreground-secondary">
                            {log.user} • {log.ip}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-foreground-tertiary">{log.time}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    {t('audit.viewAll')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
