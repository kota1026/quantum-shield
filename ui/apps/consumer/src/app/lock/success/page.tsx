'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Shield, Clock, ArrowRight, ExternalLink } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@quantum-shield/ui';

export default function LockSuccessPage() {
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';

  // Mock transaction hash - will be real in production
  const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const lockId = Math.floor(Math.random() * 1000) + 1;

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-qs-success-100 dark:bg-qs-success-900">
            <CheckCircle className="h-10 w-10 text-qs-success-500" />
          </div>
          <CardTitle className="text-2xl">Lock Successful!</CardTitle>
          <CardDescription>
            Your assets are now protected with quantum-resistant security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Summary */}
          <div className="rounded-lg bg-qs-success-50 p-6 text-center dark:bg-qs-success-950">
            <p className="text-sm text-muted-foreground">Amount Locked</p>
            <p className="text-4xl font-bold text-qs-success-600 dark:text-qs-success-400">
              {amount} ETH
            </p>
          </div>

          {/* Lock Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Lock ID</span>
              <Badge variant="secondary">#{lockId}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Transaction</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-qs-primary-500 hover:underline"
              >
                {txHash.slice(0, 6)}...{txHash.slice(-4)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* What's Next */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">What&apos;s Next?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-qs-primary-500" />
                <p className="text-muted-foreground">
                  Your assets are now secured with quantum-resistant protection
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-qs-secondary-500" />
                <p className="text-muted-foreground">
                  To unlock, you&apos;ll need to sign with your Dilithium key and wait 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/lock">Lock More Assets</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
