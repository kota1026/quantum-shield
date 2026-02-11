'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Copy,
  Lock,
  Unlock,
  Shield,
  FileWarning,
  RefreshCw,
  Hash,
  User,
  Wallet,
  Calendar,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLockDetail, useUnlockDetail } from '@/hooks/admin/useTransactions';

// UI_DESIGN_GUIDELINES.md Colors
const COLORS = {
  success: '#00C896',
  warning: '#F0A030',
  error: '#E07040',
  info: '#4A90D9',
  pending: '#8080A0',
  hinomaru: '#BC002D',
  gold: '#C9A962',
};

interface TransactionDetailProps {
  type: 'lock' | 'unlock' | 'emergency' | 'challenge';
  id: string;
}

// Helper to format timestamp
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Helper to format wei to ETH
function formatWeiToEth(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    const ethValue = Number(wei) / 1e18;
    return ethValue >= 1 ? `${ethValue.toFixed(4)} ETH` : `${ethValue.toFixed(6)} ETH`;
  } catch {
    return '0 ETH';
  }
}

// Helper to format expiry to readable date
function formatExpiry(expiryTimestamp: string): string {
  try {
    const expiry = parseInt(expiryTimestamp);
    if (isNaN(expiry)) return '-';
    const date = new Date(expiry * 1000);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

// Calculate lock duration in days
function calculateLockDuration(createdAt: number, expiry: string): string {
  try {
    const expiryTimestamp = parseInt(expiry);
    if (isNaN(expiryTimestamp)) return '-';
    const durationSeconds = expiryTimestamp - createdAt;
    const durationDays = Math.ceil(durationSeconds / (60 * 60 * 24));
    return `${durationDays}日`;
  } catch {
    return '-';
  }
}

// Status configuration with Japanese descriptions - Following UI_DESIGN_GUIDELINES.md
const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: COLORS.pending,
    label: '承認待ち',
    description: 'L1トランザクションの確認を待っています',
  },
  confirmed: {
    icon: CheckCircle,
    color: COLORS.success,
    label: '確認済み',
    description: 'L1トランザクションが確認されました',
  },
  completed: {
    icon: CheckCircle2,
    color: COLORS.success,
    label: '完了',
    description: 'トランザクションが正常に完了しました',
  },
  failed: {
    icon: XCircle,
    color: COLORS.error,
    label: '失敗',
    description: 'トランザクションが失敗しました',
  },
  challenged: {
    icon: AlertTriangle,
    color: COLORS.warning,
    label: 'チャレンジ中',
    description: 'チャレンジが進行中です',
  },
  approved: {
    icon: CheckCircle,
    color: COLORS.success,
    label: '承認済み',
    description: 'チャレンジが承認されました',
  },
  rejected: {
    icon: XCircle,
    color: COLORS.error,
    label: '却下',
    description: 'チャレンジが却下されました',
  },
};

const TYPE_CONFIG = {
  lock: {
    icon: Lock,
    label: 'ロック',
    description: 'ETHをQuantum Shieldにロック',
  },
  unlock: {
    icon: Unlock,
    label: 'アンロック',
    description: 'ロックされたETHを解除',
  },
  emergency: {
    icon: Shield,
    label: '緊急アンロック',
    description: 'Dilithium署名による即時解除',
  },
  challenge: {
    icon: FileWarning,
    label: 'チャレンジ',
    description: 'アンロック要求への異議申し立て',
  },
};

export function TransactionDetail({ type, id }: TransactionDetailProps) {
  const t = useTranslations('qsAdmin.transactions');
  const tCommon = useTranslations('qsAdmin.common');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch data based on transaction type
  const lockQuery = useLockDetail(type === 'lock' ? id : '');
  const unlockQuery = useUnlockDetail(type === 'unlock' ? id : '');

  const isLoading = type === 'lock' ? lockQuery.isLoading : type === 'unlock' ? unlockQuery.isLoading : false;
  const isError = type === 'lock' ? lockQuery.isError : type === 'unlock' ? unlockQuery.isError : false;
  const refetch = type === 'lock' ? lockQuery.refetch : type === 'unlock' ? unlockQuery.refetch : () => {};

  const lockData = type === 'lock' ? lockQuery.data : null;
  const unlockData = type === 'unlock' ? unlockQuery.data : null;

  const typeConfig = TYPE_CONFIG[type];
  const TypeIcon = typeConfig.icon;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/qs-admin/transactions/${type}`}>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px] hover:bg-[#1a1a1f]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 bg-[#1a1a1f] rounded-[6px] w-48 animate-pulse" />
        </div>
        <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="h-8 bg-[#1a1a1f] rounded-[6px] w-64 animate-pulse" />
              <div className="grid grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-[#1a1a1f] rounded-[6px] w-20 animate-pulse" />
                    <div className="h-6 bg-[#1a1a1f] rounded-[6px] w-32 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/qs-admin/transactions/${type}`}>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px] hover:bg-[#1a1a1f]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
            <p className="text-[#808080] font-mono">{id}</p>
          </div>
        </div>
        <Card
          className="rounded-[20px]"
          style={{
            backgroundColor: `${COLORS.error}08`,
            borderColor: `${COLORS.error}30`
          }}
        >
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.error }} />
            <h3 className="text-lg font-semibold mb-2">データの読み込みに失敗しました</h3>
            <p className="text-[#808080] mb-6">
              トランザクション詳細を取得できませんでした。再度お試しください。
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="min-h-[44px] rounded-[10px] border-[#1a1a1f]"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data found
  if (!lockData && !unlockData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/qs-admin/transactions/${type}`}>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px] hover:bg-[#1a1a1f]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('detail.title')}</h1>
            <p className="text-[#808080] font-mono">{id}</p>
          </div>
        </div>
        <Card
          className="rounded-[20px]"
          style={{
            backgroundColor: `${COLORS.warning}08`,
            borderColor: `${COLORS.warning}30`
          }}
        >
          <CardContent className="p-8 text-center">
            <Info className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.warning }} />
            <h3 className="text-lg font-semibold mb-2">トランザクションが見つかりません</h3>
            <p className="text-[#808080] mb-6">
              ID: {id} のトランザクションは存在しないか、削除された可能性があります。
            </p>
            <Link href={`/qs-admin/transactions/${type}`}>
              <Button
                variant="outline"
                className="min-h-[44px] rounded-[10px] border-[#1a1a1f]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                一覧に戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build display data from lock
  const status = lockData?.status || unlockData?.status || 'pending';
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;

  const walletAddress = lockData?.walletAddress || unlockData?.userAddress || '-';
  const amount = lockData ? formatWeiToEth(lockData.amount || '0') : (unlockData?.amount || '0 ETH');
  const createdAt = lockData?.createdAt ? formatTimestamp(lockData.createdAt) : (unlockData?.createdAt ? formatTimestamp(unlockData.createdAt / 1000) : '-');
  const confirmedAt = lockData?.confirmedAt ? formatTimestamp(lockData.confirmedAt) : (unlockData?.completedAt ? formatTimestamp(unlockData.completedAt / 1000) : '-');
  const l1TxHash = lockData?.l1TxHash || unlockData?.l1TxHash || null;
  const lockDuration = lockData && lockData.expiry ? calculateLockDuration(lockData.createdAt, lockData.expiry) : '-';
  const unlockDate = lockData?.expiry ? formatExpiry(lockData.expiry) : '-';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/qs-admin/transactions/${type}`}>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-[10px] hover:bg-[#1a1a1f]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-[14px] flex items-center justify-center"
              style={{
                backgroundColor: `${statusConfig.color}15`,
                border: `1px solid ${statusConfig.color}30`
              }}
            >
              <TypeIcon className="h-7 w-7" style={{ color: statusConfig.color }} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{typeConfig.label}</h1>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${statusConfig.color}15`,
                    color: statusConfig.color,
                    border: `1px solid ${statusConfig.color}30`
                  }}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-[#808080] mt-1 font-mono text-sm">{id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card - Hero Section */}
          <Card
            className="rounded-[20px]"
            style={{
              backgroundColor: `${COLORS.hinomaru}08`,
              borderColor: `${COLORS.hinomaru}30`
            }}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#808080] mb-2">
                    {type === 'lock' ? 'ロック金額' : type === 'unlock' ? 'アンロック金額' : type === 'emergency' ? '緊急アンロック金額' : 'チャレンジ金額'}
                  </p>
                  <p className="text-4xl font-bold text-foreground font-mono">{amount}</p>
                </div>
                <div
                  className="h-16 w-16 rounded-[20px] flex items-center justify-center"
                  style={{ backgroundColor: `${COLORS.hinomaru}15` }}
                >
                  <Wallet className="h-8 w-8" style={{ color: COLORS.hinomaru }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-[#808080]" />
                ユーザー情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[#808080] mb-2">ウォレットアドレス</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-[#0a0a0c] border border-[#1a1a1f] px-4 py-3 rounded-[14px] break-all">
                    {walletAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 rounded-[10px] border-[#1a1a1f]"
                    onClick={() => copyToClipboard(walletAddress, 'wallet')}
                  >
                    {copiedField === 'wallet' ? (
                      <CheckCircle className="h-4 w-4" style={{ color: COLORS.success }} />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-[10px] border-[#1a1a1f]"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5 text-[#808080]" />
                トランザクション情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* L1 Transaction Hash */}
              <div>
                <p className="text-sm font-medium text-[#808080] mb-2">L1 トランザクションハッシュ</p>
                {l1TxHash ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs bg-[#0a0a0c] border border-[#1a1a1f] px-4 py-3 rounded-[14px] break-all">
                      {l1TxHash}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 shrink-0 rounded-[10px] border-[#1a1a1f]"
                      onClick={() => copyToClipboard(l1TxHash, 'txHash')}
                    >
                      {copiedField === 'txHash' ? (
                        <CheckCircle className="h-4 w-4" style={{ color: COLORS.success }} />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${l1TxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-11 w-11 shrink-0 rounded-[10px] border-[#1a1a1f]"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                ) : (
                  <div
                    className="rounded-[14px] p-4 flex items-center gap-3"
                    style={{
                      backgroundColor: `${COLORS.warning}15`,
                      border: `1px solid ${COLORS.warning}30`
                    }}
                  >
                    <Clock className="h-5 w-5" style={{ color: COLORS.warning }} />
                    <div>
                      <p className="font-medium" style={{ color: COLORS.warning }}>未確認</p>
                      <p className="text-sm text-[#808080]">
                        L1トランザクションはまだ確認されていません
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1a1a1f]">
                <div className="bg-[#0a0a0c] rounded-[14px] p-4">
                  <p className="text-xs font-medium text-[#606060] mb-1">チェーン</p>
                  <p className="font-mono font-medium">Sepolia ({lockData?.chainId || 11155111})</p>
                </div>
                <div className="bg-[#0a0a0c] rounded-[14px] p-4">
                  <p className="text-xs font-medium text-[#606060] mb-1">アセット</p>
                  <p className="font-mono font-medium">{lockData?.asset || 'ETH'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {(status === 'pending') && type !== 'emergency' && (
            <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
              <CardContent className="p-6">
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-[10px] border-[#1a1a1f]"
                  >
                    {t('detail.actions.cancel')}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px] rounded-[10px]"
                    style={{
                      color: COLORS.error,
                      borderColor: `${COLORS.error}30`
                    }}
                  >
                    {t('detail.actions.reject')}
                  </Button>
                  <Button
                    className="min-h-[44px] rounded-[10px] text-white"
                    style={{ backgroundColor: COLORS.hinomaru }}
                  >
                    {t('detail.actions.approve')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Timeline & Lock Info */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card
            className="rounded-[20px]"
            style={{
              backgroundColor: `${statusConfig.color}15`,
              borderColor: `${statusConfig.color}30`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <StatusIcon className="h-6 w-6" style={{ color: statusConfig.color }} />
                <h3 className="text-lg font-semibold" style={{ color: statusConfig.color }}>
                  {statusConfig.label}
                </h3>
              </div>
              <p className="text-sm text-[#a0a0a0]">
                {statusConfig.description}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#808080]" />
                タイムライン
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <TimelineItem
                  label="作成日時"
                  value={createdAt}
                  status="completed"
                />
                {l1TxHash && (
                  <TimelineItem
                    label="L1確認日時"
                    value={confirmedAt}
                    status={confirmedAt !== '-' ? 'completed' : 'pending'}
                    isLast={type !== 'lock'}
                  />
                )}
                {type === 'lock' && (
                  <TimelineItem
                    label="ロック解除日"
                    value={unlockDate}
                    status="pending"
                    isLast
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lock Period Info */}
          {type === 'lock' && (
            <Card className="bg-[#0E0E11] border-[#1a1a1f] rounded-[20px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#808080]" />
                  ロック期間
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-[#0a0a0c] rounded-[14px] p-4">
                  <p className="text-xs font-medium text-[#606060] mb-1">期間</p>
                  <p className="text-xl font-bold font-mono">{lockDuration}</p>
                </div>
                <div className="bg-[#0a0a0c] rounded-[14px] p-4">
                  <p className="text-xs font-medium text-[#606060] mb-1">解除可能日</p>
                  <p className="font-medium font-mono">{unlockDate}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explorer Link */}
          {l1TxHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${l1TxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                variant="outline"
                className="w-full min-h-[44px] rounded-[10px] border-[#1a1a1f]"
                style={{ color: COLORS.gold }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Etherscanで確認
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

interface TimelineItemProps {
  label: string;
  value: string;
  status: 'completed' | 'pending';
  isLast?: boolean;
}

function TimelineItem({ label, value, status, isLast }: TimelineItemProps) {
  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: status === 'completed' ? COLORS.success : '#2a2a2f' }}
        />
        {!isLast && (
          <div
            className="w-0.5 h-12 mt-1"
            style={{ backgroundColor: status === 'completed' ? COLORS.success : '#2a2a2f' }}
          />
        )}
      </div>
      <div className="flex-1 pb-4">
        <p className="text-sm text-[#808080]">{label}</p>
        <p className="text-sm font-medium font-mono">{value}</p>
      </div>
    </div>
  );
}
