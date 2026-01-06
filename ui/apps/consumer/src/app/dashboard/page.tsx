'use client';

import { useAccount, useReadContract, useBalance } from 'wagmi';
import { Shield, Lock, Unlock, Plus, Clock, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Badge,
  WalletButton,
  AddressDisplay,
  TimeLockCountdown,
  Alert,
  AlertDescription,
} from '@quantum-shield/ui';
import { QS_VAULT_ABI, QS_VAULT_ADDRESS } from '@quantum-shield/web3';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';
  const enableMockData = process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true';

  // Read user's lock IDs from L1 Vault contract
  const { 
    data: userLockIds, 
    isLoading: isLoadingLocks, 
    isError: isLockError,
    refetch: refetchLocks 
  } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getUserLocks',
    args: address ? [address] : undefined,
  });

  // For demo purposes, also read first lock details if we have lock IDs
  const firstLockId = userLockIds && (userLockIds as bigint[]).length > 0 
    ? (userLockIds as bigint[])[0] 
    : undefined;

  const { data: firstLockDetails } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getLock',
    args: firstLockId !== undefined ? [firstLockId] : undefined,
  });

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="mx-auto mb-8 h-20 w-20 text-muted-foreground" />
        <h1 className="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
        <p className="mb-8 text-muted-foreground">
          Connect your wallet to view and manage your locked assets on L1 Sepolia.
        </p>
        <WalletButton />
      </div>
    );
  }

  // Process lock data from contract
  const lockIds = userLockIds as bigint[] | undefined;
  const lockCount = lockIds?.length || 0;

  // Calculate total locked (simplified - in production, fetch all lock details)
  const firstLockAmount = firstLockDetails 
    ? Number(formatEther((firstLockDetails as any).amount || 0n)) 
    : 0;

  // Mock pending unlocks for demo (in production, query from L1/API)
  const mockPendingUnlocks = enableMockData ? [
    {
      unlockId: '1',
      lockId: '1',
      amount: '0.5',
      unlockTime: Math.floor(Date.now() / 1000) + 3600 * 20,
      isEmergency: false,
      status: 'pending' as const,
    },
  ] : [];

  const isLoading = isLoadingLocks;
  const isContractZero = QS_VAULT_ADDRESS === '0x0000000000000000000000000000000000000000';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="mt-2 flex items-center gap-4">
            <AddressDisplay address={address!} showCopy showExplorer />
            <Badge variant="outline" className="text-xs">
              L1 Sepolia
            </Badge>
          </div>
        </div>
        <WalletButton address={address} isConnected />
      </div>

      {/* Network Warning */}
      {isContractZero && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Contract address not configured. Please set NEXT_PUBLIC_QS_VAULT_ADDRESS in your environment.
            <br />
            <span className="text-xs mt-1 block">
              Expected: 0xAdEB23203bf5C45e3CbD3406122aED067E41255D (Sepolia)
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Contract Error */}
      {isLockError && !isContractZero && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to fetch lock data from L1 Vault contract. Please check your network connection.
            <Button 
              variant="link" 
              className="ml-2 p-0 h-auto"
              onClick={() => refetchLocks()}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Wallet Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {balance ? parseFloat(balance.formatted).toFixed(4) : '0.0000'} ETH
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Locked (L1)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-bold">
                {firstLockAmount.toFixed(4)} ETH
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Locks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-12" />
            ) : (
              <div className="text-3xl font-bold">{lockCount}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Unlocks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockPendingUnlocks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <Button asChild>
          <Link href="/lock">
            <Plus className="mr-2 h-4 w-4" />
            New Lock
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/unlock">
            <Unlock className="mr-2 h-4 w-4" />
            Request Unlock
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <a 
            href={`${etherscanUrl}/address/${QS_VAULT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Contract
          </a>
        </Button>
      </div>

      {/* Pending Unlocks */}
      {mockPendingUnlocks.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Unlocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendingUnlocks.map((unlock) => (
                <div
                  key={unlock.unlockId}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <div className="font-medium">{unlock.amount} ETH</div>
                    <div className="text-sm text-muted-foreground">
                      Lock #{unlock.lockId}
                    </div>
                  </div>
                  <div className="w-64">
                    <TimeLockCountdown
                      unlockTime={unlock.unlockTime}
                      type={unlock.isEmergency ? 'emergency' : 'normal'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Locks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Active Locks
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchLocks()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : lockCount === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Lock className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No active locks found</p>
              <p className="mt-1 text-sm">
                Create your first lock to protect your assets with quantum-resistant security.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/lock">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Lock
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {lockIds?.map((lockId, index) => (
                <LockItem 
                  key={lockId.toString()} 
                  lockId={lockId} 
                  etherscanUrl={etherscanUrl}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component to display individual lock details
function LockItem({ lockId, etherscanUrl }: { lockId: bigint; etherscanUrl: string }) {
  const { data: lockDetails, isLoading } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getLock',
    args: [lockId],
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  const lock = lockDetails as any;
  if (!lock) return null;

  const amount = formatEther(lock.amount || 0n);
  const lockedAt = Number(lock.lockedAt || 0);
  const status = Number(lock.status || 0);

  const statusLabels: Record<number, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
    0: { label: 'Active', variant: 'success' },
    1: { label: 'Unlocking', variant: 'warning' },
    2: { label: 'Unlocked', variant: 'destructive' },
  };

  const statusInfo = statusLabels[status] || statusLabels[0];

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div className="font-medium">{parseFloat(amount).toFixed(4)} ETH</div>
        <div className="text-sm text-muted-foreground">
          Locked {lockedAt > 0 ? new Date(lockedAt * 1000).toLocaleDateString() : 'Unknown'}
        </div>
        <div className="mt-1 text-xs text-muted-foreground font-mono">
          Lock ID: {lockId.toString()}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        {status === 0 && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/unlock?lockId=${lockId.toString()}`}>Unlock</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
