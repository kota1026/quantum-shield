'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, CheckCircle, Loader2, Users } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
  AlertTitle,
  Progress,
} from '@quantum-shield/ui';

interface ProverStatus {
  id: string;
  name: string;
  status: 'pending' | 'verifying' | 'verified';
}

export default function UnlockWaitingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';

  // Mock prover verification status
  // TODO: Replace with actual WebSocket or polling from API
  const [provers, setProvers] = useState<ProverStatus[]>([
    { id: '1', name: 'Prover Alpha', status: 'pending' },
    { id: '2', name: 'Prover Beta', status: 'pending' },
    { id: '3', name: 'Prover Gamma', status: 'pending' },
  ]);

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Simulate prover verification progress
    const timers: NodeJS.Timeout[] = [];

    // Prover 1 starts verifying
    timers.push(
      setTimeout(() => {
        setProvers((prev) =>
          prev.map((p, i) => (i === 0 ? { ...p, status: 'verifying' } : p))
        );
        setCurrentStep(1);
      }, 500)
    );

    // Prover 1 verified
    timers.push(
      setTimeout(() => {
        setProvers((prev) =>
          prev.map((p, i) => (i === 0 ? { ...p, status: 'verified' } : p))
        );
      }, 2000)
    );

    // Prover 2 starts verifying
    timers.push(
      setTimeout(() => {
        setProvers((prev) =>
          prev.map((p, i) => (i === 1 ? { ...p, status: 'verifying' } : p))
        );
        setCurrentStep(2);
      }, 2500)
    );

    // Prover 2 verified
    timers.push(
      setTimeout(() => {
        setProvers((prev) =>
          prev.map((p, i) => (i === 1 ? { ...p, status: 'verified' } : p))
        );
      }, 4000)
    );

    // Prover 3 starts verifying
    timers.push(
      setTimeout(() => {
        setProvers((prev) =>
          prev.map((p, i) => (i === 2 ? { ...p, status: 'verifying' } : p))
        );
        setCurrentStep(3);
      }, 4500)
    );

    // Prover 3 verified
    timers.push(
      setTimeout(() => {
        setProvers((prev) =>
          prev.map((p, i) => (i === 2 ? { ...p, status: 'verified' } : p))
        );
      }, 6000)
    );

    // All verified, redirect to countdown
    timers.push(
      setTimeout(() => {
        router.push(`/unlock/countdown?lockId=${lockId}`);
      }, 7000)
    );

    return () => timers.forEach(clearTimeout);
  }, [lockId, router]);

  const verifiedCount = provers.filter((p) => p.status === 'verified').length;
  const progress = (verifiedCount / provers.length) * 100;

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Prover Verification</CardTitle>
              <CardDescription>
                Multi-Prover network is verifying your request
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span className="font-medium">
                {verifiedCount} / {provers.length} Provers
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Prover Status List */}
          <div className="space-y-3">
            {provers.map((prover) => (
              <div
                key={prover.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  prover.status === 'verified'
                    ? 'border-qs-success-200 bg-qs-success-50 dark:border-qs-success-800 dark:bg-qs-success-950'
                    : prover.status === 'verifying'
                    ? 'border-qs-primary-200 bg-qs-primary-50 dark:border-qs-primary-800 dark:bg-qs-primary-950'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      prover.status === 'verified'
                        ? 'bg-qs-success-500'
                        : prover.status === 'verifying'
                        ? 'bg-qs-primary-500'
                        : 'bg-muted'
                    }`}
                  >
                    {prover.status === 'verified' ? (
                      <CheckCircle className="h-5 w-5 text-white" />
                    ) : prover.status === 'verifying' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{prover.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SPHINCS+-128s Signature
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-medium ${
                    prover.status === 'verified'
                      ? 'text-qs-success-600 dark:text-qs-success-400'
                      : prover.status === 'verifying'
                      ? 'text-qs-primary-600 dark:text-qs-primary-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {prover.status === 'verified'
                    ? 'Verified'
                    : prover.status === 'verifying'
                    ? 'Verifying...'
                    : 'Pending'}
                </span>
              </div>
            ))}
          </div>

          {/* Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Multi-Prover Security</AlertTitle>
            <AlertDescription>
              Your unlock request requires verification from multiple independent
              provers. Each prover uses SPHINCS+ quantum-resistant signatures stored
              in HSM hardware.
            </AlertDescription>
          </Alert>

          {/* Status Message */}
          <div className="rounded-lg bg-muted/50 p-4 text-center">
            {verifiedCount === provers.length ? (
              <p className="font-medium text-qs-success-600 dark:text-qs-success-400">
                All provers verified! Starting time lock...
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Please wait while provers verify your signature...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
