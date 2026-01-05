'use client';

import { useAccount } from 'wagmi';
import { Shield, Lock, Unlock, Plus, Clock } from 'lucide-react';
import Link from 'next/link';

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
} from '@quantum-shield/ui';

// Mock data - will be replaced with real API calls
const mockLocks = [
  {
    lockId: '1',
    amount: '1.5',
    lockedAt: Date.now() / 1000 - 86400 * 3,
    status: 'active' as const,
  },
  {
    lockId: '2',
    amount: '0.5',
    lockedAt: Date.now() / 1000 - 86400 * 10,
    status: 'active' as const,
  },
];

const mockPendingUnlocks = [
  {
    unlockId: '1',
    lockId: '1',
    amount: '0.5',
    unlockTime: Math.floor(Date.now() / 1000) + 3600 * 20,
    isEmergency: false,
    status: 'pending' as const,
  },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Shield className="mx-auto mb-8 h-20 w-20 text-muted-foreground" />
        <h1 className="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
        <p className="mb-8 text-muted-foreground">
          Connect your wallet to view and manage your locked assets.
        </p>
        <WalletButton />
      </div>
    );
  }

  const totalLocked = mockLocks.reduce(
    (sum, lock) => sum + parseFloat(lock.amount),
    0
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="mt-2">
            <AddressDisplay address={address!} showCopy showExplorer />
          </div>
        </div>
        <WalletButton address={address} isConnected />
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Locked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLocked.toFixed(4)} ETH</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Locks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{mockLocks.length}</div>
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
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Active Locks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockLocks.map((lock) => (
              <div
                key={lock.lockId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="font-medium">{lock.amount} ETH</div>
                  <div className="text-sm text-muted-foreground">
                    Locked {new Date(lock.lockedAt * 1000).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Active</Badge>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/unlock?lockId=${lock.lockId}`}>Unlock</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
