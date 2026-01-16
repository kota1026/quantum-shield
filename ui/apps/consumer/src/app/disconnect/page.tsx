'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  AlertTriangle,
  Shield,
  Lock,
  CheckCircle,
  ArrowLeft,
  Loader2,
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
  Checkbox,
  Label,
} from '@quantum-shield/ui';

export default function DisconnectPage() {
  const router = useRouter();
  const [checks, setChecks] = useState({
    noActiveLocks: false,
    backupSaved: false,
    understand: false,
  });
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Mock active lock data - in production, fetch from API
  const hasActiveLocks = false;
  const activeLockCount = 0;

  const allChecked = Object.values(checks).every(Boolean) && !hasActiveLocks;

  const handleDisconnect = async () => {
    if (!allChecked) return;
    setIsDisconnecting(true);
    // TODO: Disconnect wallet via wagmi
    // import { useDisconnect } from 'wagmi';
    // const { disconnect } = useDisconnect();
    // disconnect();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push('/');
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Disconnect Wallet</h1>
          <p className="text-muted-foreground">End your session</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-qs-error-100 dark:bg-qs-error-900">
              <LogOut className="h-7 w-7 text-qs-error-500" />
            </div>
            <div>
              <CardTitle>Before You Go</CardTitle>
              <CardDescription>
                Please confirm the following before disconnecting
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Locks Warning */}
          {hasActiveLocks ? (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertTitle>Active Locks Detected</AlertTitle>
              <AlertDescription>
                You have {activeLockCount} active lock(s). Please unlock all assets
                before disconnecting, or your funds will remain locked until you
                reconnect.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center gap-3 rounded-lg bg-qs-success-50 p-4 dark:bg-qs-success-950">
              <CheckCircle className="h-5 w-5 text-qs-success-500" />
              <p className="text-sm text-qs-success-700 dark:text-qs-success-300">
                No active locks - you&apos;re safe to disconnect
              </p>
            </div>
          )}

          {/* Checklist */}
          <div className="space-y-4">
            <h3 className="font-medium">Disconnect Checklist</h3>

            <div className="flex items-start gap-3">
              <Checkbox
                id="no-locks"
                checked={checks.noActiveLocks}
                onCheckedChange={(v) =>
                  setChecks((prev) => ({ ...prev, noActiveLocks: v === true }))
                }
                disabled={hasActiveLocks}
              />
              <div>
                <Label htmlFor="no-locks" className="cursor-pointer">
                  I have no active locks or pending unlocks
                </Label>
                <p className="text-sm text-muted-foreground">
                  All my assets have been unlocked
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="backup"
                checked={checks.backupSaved}
                onCheckedChange={(v) =>
                  setChecks((prev) => ({ ...prev, backupSaved: v === true }))
                }
              />
              <div>
                <Label htmlFor="backup" className="cursor-pointer">
                  I have saved my Dilithium key backup
                </Label>
                <p className="text-sm text-muted-foreground">
                  My keys are securely backed up for future use
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="understand"
                checked={checks.understand}
                onCheckedChange={(v) =>
                  setChecks((prev) => ({ ...prev, understand: v === true }))
                }
              />
              <div>
                <Label htmlFor="understand" className="cursor-pointer">
                  I understand I can reconnect anytime
                </Label>
                <p className="text-sm text-muted-foreground">
                  My on-chain data remains intact
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>What Happens When You Disconnect</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Your browser session will be cleared</li>
                <li>Your on-chain locks remain unchanged</li>
                <li>You can reconnect with the same wallet anytime</li>
                <li>Your Dilithium keys stay in your browser (if saved)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Link>
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDisconnect}
              disabled={!allChecked || isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
