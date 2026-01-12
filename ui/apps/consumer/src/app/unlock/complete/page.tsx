'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  PartyPopper,
  ExternalLink,
  Home,
  Lock,
  Shield,
  Share2,
} from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@quantum-shield/ui';

export default function UnlockCompletePage() {
  const searchParams = useSearchParams();
  const lockId = searchParams.get('lockId') || '1';

  // Mock unlock data - in production, fetch from API
  const unlockData = {
    id: lockId,
    amount: '1.5 ETH',
    txHash: '0x1234567890abcdef1234567890abcdef12345678',
    timestamp: new Date().toLocaleString(),
    destination: '0x1234...5678',
  };

  const handleShare = () => {
    const text = `I just unlocked ${unlockData.amount} with quantum-resistant security on Quantum Shield! 🛡️`;
    if (navigator.share) {
      navigator.share({ text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-qs-success-100 dark:bg-qs-success-900">
            <PartyPopper className="h-10 w-10 text-qs-success-500" />
          </div>
          <CardTitle className="text-2xl">Unlock Complete!</CardTitle>
          <CardDescription>
            Your assets have been successfully released
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="rounded-lg bg-qs-success-50 p-4 text-center dark:bg-qs-success-950">
            <p className="text-2xl font-bold text-qs-success-700 dark:text-qs-success-300">
              {unlockData.amount}
            </p>
            <p className="text-sm text-qs-success-600 dark:text-qs-success-400">
              sent to your wallet
            </p>
          </div>

          {/* Transaction Details */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Transaction Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lock ID</span>
                <span className="font-mono">#{unlockData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Unlocked</span>
                <span className="font-semibold">{unlockData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-mono">{unlockData.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{unlockData.timestamp}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Transaction</span>
                <a
                  href={`https://sepolia.etherscan.io/tx/${unlockData.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-qs-primary-500 hover:underline"
                >
                  {`${unlockData.txHash.slice(0, 10)}...${unlockData.txHash.slice(-8)}`}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Security Summary */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Security Journey Complete</h3>
            <div className="space-y-2">
              {[
                { icon: Lock, label: 'Assets locked with quantum-resistant encryption' },
                { icon: Shield, label: 'Dilithium-III signature verified' },
                { icon: Shield, label: 'Multi-prover consensus achieved' },
                { icon: CheckCircle, label: '24-hour time lock elapsed safely' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <item.icon className="h-4 w-4 text-qs-success-500" />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CP-5 Transparency Notice */}
          <div className="rounded-lg bg-muted/50 p-4 text-center text-sm">
            <p className="text-muted-foreground">
              <strong>CP-5 Transparency:</strong> All transactions are recorded
              on-chain and verifiable via{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${unlockData.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-qs-primary-500 hover:underline"
              >
                Etherscan
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/dashboard">
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button className="flex-1" asChild>
                <Link href="/lock">
                  <Lock className="mr-2 h-4 w-4" />
                  Lock More
                </Link>
              </Button>
            </div>
            <Button variant="ghost" onClick={handleShare} className="w-full">
              <Share2 className="mr-2 h-4 w-4" />
              Share Your Success
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
