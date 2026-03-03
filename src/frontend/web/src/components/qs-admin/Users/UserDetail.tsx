'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  UserCheck,
  UserX,
  Users,
  Copy,
  Mail,
  Calendar,
  Lock,
  Unlock,
  Activity,
  Ban,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUserDetail, useUserTransactions, useSuspendUser, useActivateUser } from '@/hooks/admin/useUsers';
import type { UserDetail as UserDetailType, UserTransaction } from '@/lib/api/admin/mock';

interface UserDetailProps {
  id: string;
}

// Empty defaults when API data is unavailable
const DEFAULT_USER: UserDetailType = {
  id: '',
  wallet: '0x0000000000000000000000000000000000000000',
  email: '',
  status: 'inactive',
  joined: '',
  lastActive: '',
  locked: '0 ETH',
  unlocked: '0 ETH',
  totalValue: '0 ETH',
  transactions: 0,
};
const DEFAULT_TRANSACTIONS: UserTransaction[] = [];

const STATUS_CONFIG = {
  active: { icon: UserCheck, color: 'text-success', bg: 'bg-success/10', label: 'active' },
  inactive: { icon: Users, color: 'text-foreground-tertiary', bg: 'bg-foreground-tertiary/10', label: 'inactive' },
  suspended: { icon: UserX, color: 'text-danger', bg: 'bg-danger/10', label: 'suspended' },
};

const TX_TYPE_CONFIG = {
  lock: { icon: Lock, color: 'text-success' },
  unlock: { icon: Unlock, color: 'text-info' },
};

// Loading Skeleton
function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-surface rounded-lg animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-surface rounded animate-pulse" />
              <div className="h-4 w-24 bg-surface rounded animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-40 bg-surface rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="h-32 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Error State
function UserDetailError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('common.error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UserDetail({ id }: UserDetailProps) {
  const t = useTranslations('qsAdmin');

  // Fetch data using hooks
  const { data: apiUser, isLoading: userLoading, error: userError, refetch: refetchUser } = useUserDetail(id);
  const { data: txData, isLoading: txLoading, error: txError, refetch: refetchTx } = useUserTransactions(id);
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();

  const isLoading = userLoading || txLoading;
  const hasError = userError || txError;

  // Use API data with fallback
  const user = apiUser ?? { ...DEFAULT_USER, id };
  const transactions = txData?.transactions ?? DEFAULT_TRANSACTIONS;

  const statusConfig = STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSuspend = () => {
    suspendMutation.mutate(id);
  };

  const handleActivate = () => {
    activateMutation.mutate(id);
  };

  if (isLoading) {
    return <UserDetailSkeleton />;
  }

  if (hasError && !apiUser) {
    return <UserDetailError onRetry={() => { refetchUser(); refetchTx(); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/users/list">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', statusConfig.bg)}>
              <StatusIcon className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('users.detail.title')}</h1>
              <p className="text-foreground-secondary font-mono text-sm">{user.wallet.substring(0, 10)}...{user.wallet.substring(user.wallet.length - 8)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', statusConfig.bg, statusConfig.color)}>
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {t(`users.status.${user.status}`)}
          </span>
          {user.status === 'active' && (
            <Button
              variant="outline"
              className="text-danger border-danger hover:bg-danger/10"
              onClick={handleSuspend}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              {t('users.actions.suspend')}
            </Button>
          )}
          {user.status === 'suspended' && (
            <Button
              variant="outline"
              className="text-success border-success hover:bg-success/10"
              onClick={handleActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t('users.actions.activate')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('users.detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary mb-2">{t('users.table.wallet')}</p>
                <div className="flex items-center space-x-2">
                  <code className="font-mono text-sm bg-surface px-3 py-2 rounded-lg flex-1">{user.wallet}</code>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(user.wallet)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <a href={`https://sepolia.etherscan.io/address/${user.wallet}`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>

              {user.email && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-foreground-secondary mb-2">{t('users.table.email')}</p>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-foreground-tertiary" />
                    <span>{user.email}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-foreground-secondary">{t('users.table.joined')}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-foreground-tertiary" />
                    <span className="font-medium">{user.joined}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-secondary">{t('users.table.lastActive')}</p>
                  <p className="font-medium mt-1">{user.lastActive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('users.detail.activityInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Lock className="h-6 w-6 text-success mx-auto mb-2" />
                  <p className="text-lg font-bold">{user.locked}</p>
                  <p className="text-xs text-foreground-secondary">{t('users.table.locked')}</p>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Unlock className="h-6 w-6 text-info mx-auto mb-2" />
                  <p className="text-lg font-bold">{user.unlocked}</p>
                  <p className="text-xs text-foreground-secondary">{t('users.table.unlocked')}</p>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Activity className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-lg font-bold">{user.totalValue}</p>
                  <p className="text-xs text-foreground-secondary">{t('users.stats.lockedVolume')}</p>
                </div>
                <div className="text-center p-4 bg-surface rounded-lg">
                  <Activity className="h-6 w-6 text-hinomaru mx-auto mb-2" />
                  <p className="text-lg font-bold">{user.transactions}</p>
                  <p className="text-xs text-foreground-secondary">{t('users.table.transactions')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('users.detail.transactionHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const TxIcon = TX_TYPE_CONFIG[tx.type as keyof typeof TX_TYPE_CONFIG].icon;
                  const txColor = TX_TYPE_CONFIG[tx.type as keyof typeof TX_TYPE_CONFIG].color;
                  // Use L1 tx hash if available, otherwise show shortened internal ID
                  const displayHash = tx.txHash || tx.id;
                  const shortHash = `${displayHash.slice(0, 10)}...${displayHash.slice(-6)}`;
                  const hasEtherscanLink = !!tx.txHash;
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center bg-background')}>
                          <TxIcon className={cn('h-4 w-4', txColor)} />
                        </div>
                        <div>
                          {hasEtherscanLink ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-sm hover:text-hinomaru transition-colors flex items-center gap-1"
                            >
                              {shortHash}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <p className="font-mono text-sm text-foreground-secondary">{shortHash}</p>
                          )}
                          <p className="text-xs text-foreground-secondary">{tx.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{tx.amount}</p>
                        <p className="text-xs text-success">{t(`transactions.status.${tx.status}`)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('users.table.actions')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href={`https://etherscan.io/address/${user.wallet}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-start">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Etherscan
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
