'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Unlock, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  WalletButton,
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
  {
    lockId: '3',
    amount: '2.0',
    lockedAt: Date.now() / 1000 - 86400 * 30,
    status: 'active' as const,
  },
];

export default function UnlockSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLockId = searchParams.get('lockId');
  const { address, isConnected } = useAccount();
  const [selectedLockId, setSelectedLockId] = useState<string | null>(
    preselectedLockId
  );

  const handleContinue = () => {
    if (!selectedLockId) return;
    router.push(`/unlock/method?lockId=${selectedLockId}`);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Unlock className="mx-auto mb-8 h-20 w-20 text-muted-foreground" />
        <h1 className="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
        <p className="mb-8 text-muted-foreground">
          Connect your wallet to unlock your assets.
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Unlock className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Select Lock to Unlock</CardTitle>
              <CardDescription>
                Choose which locked assets you want to unlock
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lock List */}
          {mockLocks.length > 0 ? (
            <div className="space-y-3">
              {mockLocks.map((lock) => (
                <button
                  key={lock.lockId}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    selectedLockId === lock.lockId
                      ? 'border-qs-primary-500 bg-qs-primary-50 dark:bg-qs-primary-950'
                      : 'hover:border-muted-foreground/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedLockId(lock.lockId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          selectedLockId === lock.lockId
                            ? 'bg-qs-primary-500 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{lock.amount} ETH</p>
                        <p className="text-sm text-muted-foreground">
                          Locked{' '}
                          {new Date(lock.lockedAt * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Active</Badge>
                      <div
                        className={`h-5 w-5 rounded-full border-2 ${
                          selectedLockId === lock.lockId
                            ? 'border-qs-primary-500 bg-qs-primary-500'
                            : 'border-muted-foreground/30'
                        }`}
                      >
                        {selectedLockId === lock.lockId && (
                          <div className="flex h-full w-full items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Lock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 font-medium">No Active Locks</p>
              <p className="mb-4 text-sm text-muted-foreground">
                You don&apos;t have any locked assets to unlock.
              </p>
              <Button asChild>
                <Link href="/lock">Lock Assets</Link>
              </Button>
            </div>
          )}

          {/* Continue Button */}
          {mockLocks.length > 0 && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleContinue}
              disabled={!selectedLockId}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
