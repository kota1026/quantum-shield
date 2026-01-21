'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Users,
  ChevronRight,
  Shield,
  Wallet,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Copy,
  ArrowLeft,
  Activity,
  History,
  FileSignature,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface PublicUserDetailProps {
  userId: string;
}

// Mock data
const mockUserDetail = {
  id: 'user-001',
  address: '0x7a3f4b8c9d2e1f0a5b6c7d8e9f0a1b2c3d4e5f6g',
  ensName: 'tanaka.eth',
  status: 'active',
  totalLocked: '12.5 ETH',
  totalLockedUsd: '$31,250',
  activeLocks: 3,
  completedLocks: 15,
  registeredAt: '2025-10-15',
  lastActivity: '2分前',
  dilithiumKeyGenerated: true,
  keyGeneratedAt: '2025-10-15 14:32:00',
};

const mockLockHistory = [
  {
    id: 'lock-001',
    amount: '5.0 ETH',
    status: 'locked',
    lockedAt: '2026-01-10 09:15',
    unlockRequested: null,
    unlockedAt: null,
    prover: 'Alpha Node Labs',
  },
  {
    id: 'lock-002',
    amount: '4.5 ETH',
    status: 'locked',
    lockedAt: '2025-12-20 14:30',
    unlockRequested: null,
    unlockedAt: null,
    prover: 'Beta Validators',
  },
  {
    id: 'lock-003',
    amount: '3.0 ETH',
    status: 'locked',
    lockedAt: '2025-11-15 10:00',
    unlockRequested: null,
    unlockedAt: null,
    prover: 'Gamma Security',
  },
  {
    id: 'lock-004',
    amount: '2.0 ETH',
    status: 'unlocked',
    lockedAt: '2025-10-20 16:45',
    unlockRequested: '2025-11-20 12:00',
    unlockedAt: '2025-11-21 12:00',
    prover: 'Delta Network',
  },
];

const mockActivityLog = [
  { type: 'lock', amount: '5.0 ETH', timestamp: '2026-01-10 09:15', txHash: '0x1234...5678' },
  { type: 'signature', prover: 'Alpha Node Labs', timestamp: '2026-01-10 09:16', txHash: '0x2345...6789' },
  { type: 'lock', amount: '4.5 ETH', timestamp: '2025-12-20 14:30', txHash: '0x3456...7890' },
  { type: 'unlock_request', amount: '2.0 ETH', timestamp: '2025-11-20 12:00', txHash: '0x4567...8901' },
  { type: 'unlock_complete', amount: '2.0 ETH', timestamp: '2025-11-21 12:00', txHash: '0x5678...9012' },
];

export function PublicUserDetail({ userId }: PublicUserDetailProps) {
  const t = useTranslations('admin.publicUserDetail');
  const [activeTab, setActiveTab] = useState<'locks' | 'activity' | 'signatures'>('locks');

  const tabs = [
    { key: 'locks', label: t('tabs.locks'), count: mockLockHistory.length },
    { key: 'activity', label: t('tabs.activity') },
    { key: 'signatures', label: t('tabs.signatures') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'pending_unlock':
        return <Badge variant="warning">{t('status.pendingUnlock')}</Badge>;
      case 'flagged':
        return <Badge variant="danger">{t('status.flagged')}</Badge>;
      default:
        return null;
    }
  };

  const getLockStatusBadge = (status: string) => {
    switch (status) {
      case 'locked':
        return <Badge variant="success">{t('lockStatus.locked')}</Badge>;
      case 'pending_unlock':
        return <Badge variant="warning">{t('lockStatus.pendingUnlock')}</Badge>;
      case 'unlocked':
        return <Badge variant="default">{t('lockStatus.unlocked')}</Badge>;
      default:
        return null;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lock':
        return <Lock className="h-4 w-4 text-success" />;
      case 'unlock_request':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'unlock_complete':
        return <Unlock className="h-4 w-4 text-gold" />;
      case 'signature':
        return <FileSignature className="h-4 w-4 text-gold" />;
      default:
        return <Activity className="h-4 w-4 text-foreground-tertiary" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
              <Link href="/admin/public/users" className="hover:text-foreground">
                Users
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{mockUserDetail.ensName || mockUserDetail.address.slice(0, 10)}...</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Link
                href="/admin/public/users"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-tertiary hover:bg-background-secondary"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {mockUserDetail.ensName || t('title')}
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm text-foreground-secondary">
                    {mockUserDetail.address}
                  </span>
                  <button
                    onClick={() => copyToClipboard(mockUserDetail.address)}
                    className="text-foreground-tertiary hover:text-gold"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <a
                    href={`https://etherscan.io/address/${mockUserDetail.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground-tertiary hover:text-gold"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* User Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('userInfo.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/10">
                      <Users className="h-10 w-10 text-gold" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-foreground-tertiary">{t('userInfo.status')}</div>
                    <div className="mt-1">{getStatusBadge(mockUserDetail.status)}</div>
                  </div>

                  <div>
                    <div className="text-xs text-foreground-tertiary">{t('userInfo.totalLocked')}</div>
                    <div className="font-mono text-xl font-bold text-gold">{mockUserDetail.totalLocked}</div>
                    <div className="text-xs text-foreground-secondary">{mockUserDetail.totalLockedUsd}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-foreground-tertiary">{t('userInfo.activeLocks')}</div>
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-success" />
                        <span className="font-medium">{mockUserDetail.activeLocks}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-foreground-tertiary">{t('userInfo.completedLocks')}</div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-foreground-tertiary" />
                        <span className="font-medium">{mockUserDetail.completedLocks}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-foreground-tertiary">{t('userInfo.registeredAt')}</div>
                    <div className="text-sm">{mockUserDetail.registeredAt}</div>
                  </div>

                  <div>
                    <div className="text-xs text-foreground-tertiary">{t('userInfo.lastActivity')}</div>
                    <div className="text-sm">{mockUserDetail.lastActivity}</div>
                  </div>

                  <div className="border-t border-surface-tertiary pt-4">
                    <div className="text-xs text-foreground-tertiary">{t('userInfo.dilithiumKey')}</div>
                    <div className="mt-1 flex items-center gap-2">
                      {mockUserDetail.dilithiumKeyGenerated ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm text-success">{t('userInfo.keyGenerated')}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <span className="text-sm text-warning">{t('userInfo.keyNotGenerated')}</span>
                        </>
                      )}
                    </div>
                    {mockUserDetail.dilithiumKeyGenerated && (
                      <div className="mt-1 text-xs text-foreground-tertiary">
                        {mockUserDetail.keyGeneratedAt}
                      </div>
                    )}
                  </div>

                  {mockUserDetail.status === 'flagged' && (
                    <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
                      <div className="flex items-center gap-2 text-danger">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">{t('userInfo.flaggedWarning')}</span>
                      </div>
                      <Button size="sm" className="mt-3 w-full">
                        {t('userInfo.reviewFlag')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
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
                    {tab.label}
                    {tab.count !== undefined && (
                      <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>

              {/* Locks Tab */}
              {activeTab === 'locks' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('locks.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockLockHistory.map((lock) => (
                        <div
                          key={lock.id}
                          className="rounded-lg border border-surface-tertiary p-4"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                lock.status === 'locked' && 'bg-success/10',
                                lock.status === 'unlocked' && 'bg-foreground-tertiary/10'
                              )}>
                                {lock.status === 'locked' ? (
                                  <Lock className="h-5 w-5 text-success" />
                                ) : (
                                  <Unlock className="h-5 w-5 text-foreground-tertiary" />
                                )}
                              </div>
                              <div>
                                <div className="font-mono text-lg font-bold">{lock.amount}</div>
                                <div className="text-xs text-foreground-tertiary">{lock.prover}</div>
                              </div>
                            </div>
                            {getLockStatusBadge(lock.status)}
                          </div>
                          <div className="mt-3 grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <div className="text-foreground-tertiary">{t('locks.lockedAt')}</div>
                              <div className="text-foreground">{lock.lockedAt}</div>
                            </div>
                            {lock.unlockRequested && (
                              <div>
                                <div className="text-foreground-tertiary">{t('locks.unlockRequested')}</div>
                                <div className="text-foreground">{lock.unlockRequested}</div>
                              </div>
                            )}
                            {lock.unlockedAt && (
                              <div>
                                <div className="text-foreground-tertiary">{t('locks.unlockedAt')}</div>
                                <div className="text-foreground">{lock.unlockedAt}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('activity.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockActivityLog.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 border-b border-surface-tertiary/50 pb-4 last:border-0"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background-secondary">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {t(`activity.types.${activity.type}`)}
                              {activity.amount && ` - ${activity.amount}`}
                              {activity.prover && ` - ${activity.prover}`}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-foreground-tertiary">
                              <span>{activity.timestamp}</span>
                              <span>•</span>
                              <a
                                href={`https://etherscan.io/tx/${activity.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-gold hover:underline"
                              >
                                {activity.txHash}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Signatures Tab */}
              {activeTab === 'signatures' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('signatures.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                      <div className="text-center text-foreground-tertiary">
                        <FileSignature className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('signatures.placeholder')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
