'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Shield,
  ArrowLeft,
  Loader2,
  Wallet,
  Clock,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@quantum-shield/ui';

export default function UnlockReadyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Mock lock data - in production, fetch from API
  const lockData = {
    id: lockId,
    amount: '1.5 ETH',
    lockedAt: '2026-01-04 10:30',
    timeLockCompleted: '2026-01-05 10:30',
    proverSignatures: 3,
    gasEstimate: '0.002 ETH',
  };

  const handleUnlock = async () => {
    setIsUnlocking(true);
    // TODO: Replace with actual contract call via wagmi
    // import { useWriteContract } from 'wagmi';
    // const { writeContract } = useWriteContract();
    // await writeContract({ ... });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push(`/unlock/complete?lockId=${lockId}`);
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-qs-success-100 dark:bg-qs-success-900">
              <CheckCircle className="h-7 w-7 text-qs-success-500" />
            </div>
            <div>
              <CardTitle>Ready to Unlock</CardTitle>
              <CardDescription>
                Time lock complete - execute your unlock
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Banner */}
          <div className="rounded-lg bg-qs-success-50 p-4 dark:bg-qs-success-950">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-qs-success-500" />
              <div>
                <p className="font-medium text-qs-success-700 dark:text-qs-success-300">
                  All Security Checks Passed
                </p>
                <p className="text-sm text-qs-success-600 dark:text-qs-success-400">
                  24-hour time lock complete, {lockData.proverSignatures} prover
                  signatures verified
                </p>
              </div>
            </div>
          </div>

          {/* Unlock Summary */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Unlock Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock ID</span>
                <span className="font-mono">#{lockData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">{lockData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Originally Locked</span>
                <span>{lockData.lockedAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Lock Completed</span>
                <span>{lockData.timeLockCompleted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prover Signatures</span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-qs-success-500" />
                  {lockData.proverSignatures}/3 verified
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Gas</span>
                <span>{lockData.gasEstimate}</span>
              </div>
            </div>
          </div>

          {/* Security Checklist */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Security Verification</h3>
            <div className="space-y-2">
              {[
                { label: 'Dilithium signature verified', checked: true },
                { label: '24-hour time lock elapsed', checked: true },
                { label: 'Multi-prover consensus achieved', checked: true },
                { label: 'No challenges raised', checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-qs-success-500" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertTitle>Final Step</AlertTitle>
            <AlertDescription>
              Click &quot;Execute Unlock&quot; to release your assets to your wallet.
              This will require a transaction signature from your connected wallet.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              className="flex-1 bg-qs-success-500 hover:bg-qs-success-600"
              onClick={handleUnlock}
              disabled={isUnlocking}
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Execute Unlock
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
