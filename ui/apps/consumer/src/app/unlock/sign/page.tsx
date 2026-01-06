'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Key, Shield, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

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

export default function UnlockSignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSign = async () => {
    setIsSigning(true);
    // TODO: Replace with actual Dilithium WASM signing
    // import { signWithDilithium } from '@quantum-shield/crypto';
    // const signature = await signWithDilithium(privateKey, unlockRequest);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSigned(true);
    setIsSigning(false);
    // Wait a moment then redirect
    setTimeout(() => {
      router.push(`/unlock/waiting?lockId=${lockId}`);
    }, 1000);
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Key className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Sign with Dilithium Key</CardTitle>
              <CardDescription>
                Authenticate your unlock request
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Signing Status */}
          <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-8">
            {signed ? (
              <>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qs-success-100 dark:bg-qs-success-900">
                  <CheckCircle className="h-8 w-8 text-qs-success-500" />
                </div>
                <p className="font-medium text-qs-success-600 dark:text-qs-success-400">
                  Signature Complete!
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to prover verification...
                </p>
              </>
            ) : isSigning ? (
              <>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qs-primary-100 dark:bg-qs-primary-900">
                  <Loader2 className="h-8 w-8 animate-spin text-qs-primary-500" />
                </div>
                <p className="font-medium">Signing with Dilithium Key...</p>
                <p className="text-sm text-muted-foreground">
                  This may take a few seconds
                </p>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Key className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium">Ready to Sign</p>
                <p className="text-sm text-muted-foreground">
                  Click below to sign with your Dilithium key
                </p>
              </>
            )}
          </div>

          {/* Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Quantum-Resistant Signature</AlertTitle>
            <AlertDescription>
              Your Dilithium-III signature proves ownership without exposing your
              private key. This signature is resistant to quantum computer attacks.
            </AlertDescription>
          </Alert>

          {/* Details */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Unlock Request Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock ID</span>
                <span>#{lockId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Lock</span>
                <span>24 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Signature Algorithm</span>
                <span>Dilithium-III (FIPS 204)</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild disabled={isSigning}>
              <Link href={`/unlock/method?lockId=${lockId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={handleSign}
              disabled={isSigning || signed}
            >
              {isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing...
                </>
              ) : signed ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Signed
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Sign Request
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
