'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, Shield, ArrowLeft, CheckCircle, Info } from 'lucide-react';

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
  Progress,
} from '@quantum-shield/ui';

// SEQ#2: 24-hour time lock for normal unlock
const TIME_LOCK_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

export default function UnlockCountdownPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';

  // Mock start time (in production, this would come from API)
  // For demo, we'll use a time that's 23 hours ago so countdown is visible
  const [startTime] = useState(() => Date.now() - 23 * 60 * 60 * 1000);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TIME_LOCK_DURATION - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        setIsComplete(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const time = formatTime(timeRemaining);
  const progress = ((TIME_LOCK_DURATION - timeRemaining) / TIME_LOCK_DURATION) * 100;

  const handleContinue = () => {
    router.push(`/unlock/ready?lockId=${lockId}`);
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Time Lock Active</CardTitle>
              <CardDescription>
                24-hour security waiting period (CP-3)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Countdown Display */}
          <div className="flex flex-col items-center rounded-lg border bg-muted/30 p-8">
            {isComplete ? (
              <>
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-qs-success-100 dark:bg-qs-success-900">
                  <CheckCircle className="h-10 w-10 text-qs-success-500" />
                </div>
                <p className="text-xl font-bold text-qs-success-600 dark:text-qs-success-400">
                  Time Lock Complete!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your assets are ready to unlock
                </p>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">Time Remaining</p>
                <div className="flex gap-2 font-mono text-4xl font-bold">
                  <div className="flex flex-col items-center">
                    <span className="rounded bg-background px-3 py-2 shadow-sm">
                      {time.hours}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">Hours</span>
                  </div>
                  <span className="py-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="rounded bg-background px-3 py-2 shadow-sm">
                      {time.minutes}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">Min</span>
                  </div>
                  <span className="py-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="rounded bg-background px-3 py-2 shadow-sm">
                      {time.seconds}
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">Sec</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Info */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Why the Wait? (CP-3)</AlertTitle>
            <AlertDescription>
              The 24-hour time lock is a core security feature. It provides time for
              Observers and Challengers to verify the unlock request and flag any
              suspicious activity before funds are released.
            </AlertDescription>
          </Alert>

          {/* Details */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Unlock Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock ID</span>
                <span>#{lockId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Lock Type</span>
                <span>Normal (24h)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started</span>
                <span>{new Date(startTime).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unlocks At</span>
                <span>
                  {new Date(startTime + TIME_LOCK_DURATION).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="flex gap-2 rounded-lg bg-qs-secondary-50 p-3 dark:bg-qs-secondary-950">
            <Info className="h-5 w-5 flex-shrink-0 text-qs-secondary-500" />
            <p className="text-sm text-qs-secondary-700 dark:text-qs-secondary-300">
              You can safely close this page. The countdown continues on-chain and
              you&apos;ll be notified when ready.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button
              className="flex-1"
              onClick={handleContinue}
              disabled={!isComplete}
            >
              {isComplete ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Continue
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Waiting...
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
