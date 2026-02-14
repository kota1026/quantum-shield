'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  Search,
  Download,
  ExternalLink,
  ArrowLeft,
  Users,
  Shield,
  Settings,
  Plus,
  Copy,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTreasuryWallets } from '@/hooks/admin/useTreasury';
import { type TreasuryWalletExtended } from '@/lib/api/admin/types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  subValue?: string;
}

function StatCard({ title, value, icon: Icon, subValue }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subValue && <p className="text-sm text-foreground-tertiary mt-1">{subValue}</p>}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function WalletsListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function WalletsListError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-danger mb-4" />
      <p className="text-foreground-secondary mb-4">{error.message || t('error')}</p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {t('retry')}
      </Button>
    </div>
  );
}

// Map API wallet to component format
function mapApiWallet(data: unknown): TreasuryWalletExtended {
  if (!data || typeof data !== 'object') return {} as any;
  const d = data as Record<string, unknown>;
  return {
    id: (d.id as string) || '',
    name: (d.name as string) || '',
    address: (d.address as string) || '',
    balance: (d.balance as string) || '0 ETH',
    usdValue: (d.usdValue as string) || '$0',
    signers: (d.signers as number) || (d.signerList as string[] || []).length || 0,
    threshold: (d.threshold as number) || (d.multisigThreshold as number) || 0,
    status: (d.status as string) || 'active',
    lastActivity: (d.lastActivity as string) || '',
    signerList: (d.signerList as string[]) || [],
  };
}

export function WalletsList() {
  const t = useTranslations('qsAdmin.treasury');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

  // Fetch data with hooks
  const walletsQuery = useTreasuryWallets();

  // Map API data or use fallback
  const apiWallets = walletsQuery.data;
  const wallets: TreasuryWalletExtended[] = apiWallets
    ? apiWallets.map(mapApiWallet)
    : [];

  const totalBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance.replace(/,/g, '')), 0);

  // Show skeleton only on initial load
  if (walletsQuery.isLoading && !walletsQuery.data) {
    return <WalletsListSkeleton />;
  }

  // Show error state
  if (walletsQuery.error && !walletsQuery.data) {
    return <WalletsListError error={walletsQuery.error as Error} onRetry={() => walletsQuery.refetch()} />;
  }

  const filteredWallets = wallets.filter(wallet => {
    if (searchQuery && !wallet.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !wallet.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/treasury">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('wallets.title')}</h1>
            <p className="text-foreground-secondary">{t('wallets.subtitle')}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button className="bg-gradient-hinomaru text-white">
            <Plus className="h-4 w-4 mr-2" />
            {t('wallets.addWallet')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('wallets.stats.totalBalance')} value={`${totalBalance.toLocaleString()} ETH`} icon={Wallet} subValue="$312,500,000" />
        <StatCard title={t('wallets.stats.activeWallets')} value={wallets.length} icon={Shield} />
        <StatCard title={t('wallets.stats.totalSigners')} value={wallets.reduce((sum, w) => sum + w.signers, 0)} icon={Users} />
        <StatCard title={t('wallets.stats.avgThreshold')} value={`${Math.round(wallets.reduce((sum, w) => sum + (w.threshold / w.signers) * 100, 0) / wallets.length)}%`} icon={Shield} />
      </div>

      {/* Wallets List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('wallets.title')}</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
            <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredWallets.map((wallet) => (
              <div key={wallet.id} className="border border-border rounded-lg overflow-hidden">
                {/* Wallet Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface transition-colors"
                  onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
                      <Wallet className="h-6 w-6 text-hinomaru" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{t(`wallets.${wallet.name}`)}</p>
                      <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                        <code className="font-mono">{wallet.address}</code>
                        <button className="hover:text-foreground" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(wallet.address); }}>
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-right">
                      <p className="font-bold text-foreground">{wallet.balance}</p>
                      <p className="text-sm text-foreground-tertiary">{wallet.usdValue}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-foreground">{wallet.threshold}/{wallet.signers}</p>
                      <p className="text-sm text-foreground-tertiary">{t('wallets.signers')}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedWallet === wallet.id && (
                  <div className="border-t border-border p-4 bg-surface/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-foreground-secondary mb-2">{t('wallets.authorizedSigners')}</h4>
                        <div className="space-y-2">
                          {wallet.signerList?.map((signer, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm">
                              <Users className="h-4 w-4 text-foreground-tertiary" />
                              <span>{signer}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground-secondary mb-2">{t('wallets.walletDetails')}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">{t('wallets.status')}</span>
                            <span className="text-success font-medium">{t('wallets.active')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">{t('wallets.lastActivity')}</span>
                            <span>{wallet.lastActivity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-foreground-secondary">{t('wallets.threshold')}</span>
                            <span>{wallet.threshold} / {wallet.signers}</span>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('wallets.viewOnEtherscan')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredWallets.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('wallets.noWalletsFound')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
