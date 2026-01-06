'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowLeft, CheckCircle, Clock, Shield } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@quantum-shield/ui';

export default function LockConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';

  const handleConfirm = () => {
    router.push(`/lock/processing?amount=${amount}`);
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Confirm Lock</CardTitle>
              <CardDescription>
                Review the details before locking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Amount to Lock</p>
              <p className="text-4xl font-bold">{amount} ETH</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-qs-success-500" />
              <div>
                <p className="font-medium">Quantum-Resistant Security</p>
                <p className="text-sm text-muted-foreground">
                  Protected by Dilithium-III and SPHINCS+ signatures
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-qs-secondary-500" />
              <div>
                <p className="font-medium">24-Hour Time Lock</p>
                <p className="text-sm text-muted-foreground">
                  Unlocking requires 24 hours waiting period
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-qs-primary-500" />
              <div>
                <p className="font-medium">Multi-Prover Verification</p>
                <p className="text-sm text-muted-foreground">
                  Multiple provers must verify your unlock request
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Transaction Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span>{amount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network</span>
                <span>Ethereum Sepolia</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Gas</span>
                <span>~0.002 ETH</span>
              </div>
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>~{(parseFloat(amount) + 0.002).toFixed(4)} ETH</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/lock">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button className="flex-1" onClick={handleConfirm}>
              <Lock className="mr-2 h-4 w-4" />
              Lock Assets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
