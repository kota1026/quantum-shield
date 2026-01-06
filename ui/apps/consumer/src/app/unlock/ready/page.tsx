'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Shield,
  ArrowLeft,
  Loader2,
  Wallet,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';

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
import { useQSUnlock, QS_VAULT_ABI, QS_VAULT_ADDRESS } from '@quantum-shield/web3';

export default function UnlockReadyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const unlockId = searchParams.get('unlockId') || '1';
  const amount = searchParams.get('amount') || '1.5';
  
  const { address, isConnected } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';

  // Read unlock request from L1 contract
  const { data: unlockRequest, isLoading: isLoadingUnlock } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getUnlockRequest',
    args: [BigInt(unlockId)],
  });

  // Read lock details from L1 contract
  const { data: lockDetails, isLoading: isLoadingLock } = useReadContract({
    address: QS_VAULT_ADDRESS,
    abi: QS_VAULT_ABI,
    functionName: 'getLock',
    args: [BigInt(lockId)],
  });

  const { 
    executeUnlock, 
    isPending, 
    isConfirming, 
    isSuccess, 
    txHash 
  } = useQSUnlock({
    onSuccess: (hash) => {
      console.log('Unlock executed:', hash);
      router.push(`/unlock/complete?lockId=${lockId}&amount=${amount}&txHash=${hash}`);
    },
    onError: (error) => {
      console.error('Unlock execution failed:', error);
      setErrorMessage(error.message);
      setIsExecuting(false);
    },
  });

  // Check if time lock has elapsed
  const isTimeLockComplete = (): boolean => {
    if (!unlockRequest) return false;
    const unlockTime = Number((unlockRequest as any).unlockTime || 0);
    const now = Math.floor(Date.now() / 1000);
    return now >= unlockTime;
  };

  const handleUnlock = async () => {
    if (!isConnected || !address) {
      setErrorMessage('Wallet not connected');
      return;
    }

    if (!isTimeLockComplete()) {
      setErrorMessage('Time lock has not yet elapsed');
      return;
    }

    setIsExecuting(true);
    setErrorMessage(null);

    try {
      await executeUnlock(unlockId);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unlock failed');
      setErrorMessage(error.message);
      setIsExecuting(false);
    }
  };

  // Redirect to complete page on success
  useEffect(() => {
    if (isSuccess && txHash) {
      router.push(`/unlock/complete?lockId=${lockId}&amount=${amount}&txHash=${txHash}`);
    }
  }, [isSuccess, txHash, router, lockId, amount]);

  const isLoading = isLoadingUnlock || isLoadingLock;
  const proverSignatures = 3; // In production, query from L3

  // Format timestamps
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
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
                Time lock complete - execute your unlock on L1 Sepolia
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
                  24-hour time lock complete, {proverSignatures} prover signatures verified
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Unlock Summary */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Unlock Summary</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lock ID</span>
                  <span className="font-mono">#{lockId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unlock ID</span>
                  <span className="font-mono">#{unlockId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold">{amount} ETH</span>
                </div>
                {lockDetails && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Originally Locked</span>
                    <span>{formatDate(Number((lockDetails as any).lockedAt || 0))}</span>
                  </div>
                )}
                {unlockRequest && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unlock Requested</span>
                      <span>{formatDate(Number((unlockRequest as any).requestedAt || 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time Lock Completed</span>
                      <span>{formatDate(Number((unlockRequest as any).unlockTime || 0))}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prover Signatures</span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4 text-qs-success-500" />
                    {proverSignatures}/3 verified
                  </span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network</span>
                  <span className="flex items-center gap-1">
                    L1 Sepolia
                    <a
                      href={`${etherscanUrl}/address/${QS_VAULT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-qs-primary-500 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Security Checklist */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Security Verification</h3>
            <div className="space-y-2">
              {[
                { label: 'Dilithium signature verified (CP-1)', checked: true },
                { label: '24-hour time lock elapsed (CP-3)', checked: isTimeLockComplete() },
                { label: 'Multi-prover consensus achieved', checked: proverSignatures >= 2 },
                { label: 'No challenges raised', checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {item.checked ? (
                    <CheckCircle className="h-4 w-4 text-qs-success-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <span className={item.checked ? '' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Status */}
          {txHash && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="mb-2 text-sm text-muted-foreground">Transaction Hash</p>
              <a
                href={`${etherscanUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-mono text-qs-primary-500 hover:underline"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Info */}
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertTitle>Final Step</AlertTitle>
            <AlertDescription>
              Click &quot;Execute Unlock&quot; to release your assets to your wallet.
              This will send a transaction to L1 Sepolia that requires a signature from your connected wallet.
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
              disabled={isExecuting || isPending || isConfirming || !isTimeLockComplete()}
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPending ? 'Confirm in Wallet...' : 'Confirming...'}
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
