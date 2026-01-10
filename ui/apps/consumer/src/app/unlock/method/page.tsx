'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, AlertTriangle, Shield, ArrowLeft, ArrowRight } from 'lucide-react';

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

type UnlockMethod = 'normal' | 'emergency';

export default function UnlockMethodPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const [selectedMethod, setSelectedMethod] = useState<UnlockMethod | null>(null);

  const handleContinue = () => {
    if (!selectedMethod) return;
    if (selectedMethod === 'normal') {
      router.push(`/unlock/sign?lockId=${lockId}`);
    } else {
      router.push(`/unlock/emergency/bond?lockId=${lockId}`);
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Choose Unlock Method</CardTitle>
              <CardDescription>
                Select how you want to unlock your assets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Normal Unlock Option */}
          <button
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              selectedMethod === 'normal'
                ? 'border-qs-primary-500 bg-qs-primary-50 dark:bg-qs-primary-950'
                : 'hover:border-muted-foreground/30 hover:bg-muted/50'
            }`}
            onClick={() => setSelectedMethod('normal')}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  selectedMethod === 'normal'
                    ? 'bg-qs-primary-500 text-white'
                    : 'bg-muted'
                }`}
              >
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Normal Unlock</h3>
                  <span className="rounded bg-qs-success-100 px-2 py-0.5 text-xs font-medium text-qs-success-700 dark:bg-qs-success-900 dark:text-qs-success-300">
                    Recommended
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Standard unlock with your Dilithium key
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-qs-secondary-500" />
                    <span>24-hour time lock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-qs-success-500" />
                    <span>No additional fees or bond</span>
                  </div>
                </div>
              </div>
              <div
                className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                  selectedMethod === 'normal'
                    ? 'border-qs-primary-500 bg-qs-primary-500'
                    : 'border-muted-foreground/30'
                }`}
              >
                {selectedMethod === 'normal' && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Emergency Unlock Option */}
          <button
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              selectedMethod === 'emergency'
                ? 'border-qs-warning-500 bg-qs-warning-50 dark:bg-qs-warning-950'
                : 'hover:border-muted-foreground/30 hover:bg-muted/50'
            }`}
            onClick={() => setSelectedMethod('emergency')}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  selectedMethod === 'emergency'
                    ? 'bg-qs-warning-500 text-white'
                    : 'bg-muted'
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Emergency Unlock</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  For when you&apos;ve lost your Dilithium keys
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-qs-warning-500" />
                    <span>7-day time lock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-qs-warning-500" />
                    <span>Requires bond deposit (5% or 0.5 ETH min)</span>
                  </div>
                </div>
              </div>
              <div
                className={`h-5 w-5 flex-shrink-0 rounded-full border-2 ${
                  selectedMethod === 'emergency'
                    ? 'border-qs-warning-500 bg-qs-warning-500'
                    : 'border-muted-foreground/30'
                }`}
              >
                {selectedMethod === 'emergency' && (
                  <div className="flex h-full w-full items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Info about selected method */}
          {selectedMethod === 'emergency' && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Emergency Unlock Notice</AlertTitle>
              <AlertDescription>
                Emergency unlocks require a bond deposit that will be returned after
                successful unlock. The 7-day waiting period allows time for challenges
                if the unlock is fraudulent.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/unlock?lockId=${lockId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={handleContinue}
              disabled={!selectedMethod}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
