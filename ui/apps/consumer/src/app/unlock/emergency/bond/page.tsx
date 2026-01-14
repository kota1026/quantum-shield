'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Shield,
  ArrowLeft,
  Loader2,
  Calculator,
  Clock,
  Info,
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

// SEQ#3: Emergency Bond = MAX(0.5 ETH, amount × 5%)
const MIN_BOND = 0.5;
const BOND_PERCENTAGE = 0.05;

// SEQ#3: Emergency Time Lock = 7 days
const EMERGENCY_TIMELOCK_DAYS = 7;

export default function EmergencyBondPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock lock data - in production, fetch from API
  const lockAmount = 1.5; // ETH

  // Calculate bond per SEQ#3: MAX(0.5 ETH, amount × 5%)
  const calculatedBond = useMemo(() => {
    const percentageBond = lockAmount * BOND_PERCENTAGE;
    return Math.max(MIN_BOND, percentageBond);
  }, [lockAmount]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Replace with actual contract call
    // 1. Deposit bond to contract
    // 2. Initiate emergency unlock
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push(`/unlock/countdown?lockId=${lockId}&emergency=true`);
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-qs-warning-100 dark:bg-qs-warning-900">
              <AlertTriangle className="h-7 w-7 text-qs-warning-500" />
            </div>
            <div>
              <CardTitle>Emergency Unlock Bond</CardTitle>
              <CardDescription>
                Deposit required for emergency unlock (SEQ#3)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Warning Alert */}
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              Emergency unlock bypasses normal signature verification and requires
              a bond deposit. The bond is returned after successful unlock if no
              valid challenge is raised.
            </AlertDescription>
          </Alert>

          {/* Bond Calculation */}
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-qs-secondary-500" />
              <h3 className="font-medium">Bond Calculation</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock Amount</span>
                <span className="font-semibold">{lockAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">5% of Lock Amount</span>
                <span>{(lockAmount * BOND_PERCENTAGE).toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Minimum Bond</span>
                <span>{MIN_BOND} ETH</span>
              </div>
              <hr />
              <div className="flex justify-between">
                <span className="font-medium">Required Bond</span>
                <span className="font-bold text-qs-warning-600 dark:text-qs-warning-400">
                  {calculatedBond.toFixed(4)} ETH
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Formula: MAX(0.5 ETH, amount × 5%)
              </p>
            </div>
          </div>

          {/* Time Lock Info */}
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-qs-warning-500" />
              <h3 className="font-medium">Extended Time Lock</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Normal Time Lock</span>
                <span>24 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Emergency Time Lock</span>
                <span className="font-bold text-qs-warning-600 dark:text-qs-warning-400">
                  {EMERGENCY_TIMELOCK_DAYS} days
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                The extended time lock allows Observers to detect and Challenge
                potentially fraudulent emergency unlocks.
              </p>
            </div>
          </div>

          {/* Bond Return Policy */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Bond Return Policy</p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Bond is returned after {EMERGENCY_TIMELOCK_DAYS}-day waiting period</li>
                  <li>If a valid Challenge is raised, bond may be slashed</li>
                  <li>Challenger receives a portion of slashed bond as reward</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href={`/unlock/method?lockId=${lockId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button
              className="flex-1 bg-qs-warning-500 hover:bg-qs-warning-600"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Depositing...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Deposit {calculatedBond.toFixed(4)} ETH
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
