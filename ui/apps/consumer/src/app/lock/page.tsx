'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { Lock, AlertTriangle, Info } from 'lucide-react';
import { parseEther } from 'viem';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Alert,
  AlertDescription,
  AlertTitle,
  WalletButton,
} from '@quantum-shield/ui';

export default function LockInputPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError(null);

    if (value === '') return;

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (balance && parseEther(value) > balance.value) {
      setError('Amount exceeds your balance');
      return;
    }

    // Minimum lock amount (0.01 ETH)
    if (numValue < 0.01) {
      setError('Minimum lock amount is 0.01 ETH');
      return;
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      // Leave some ETH for gas
      const maxAmount = Math.max(
        0,
        parseFloat(balance.formatted) - 0.01
      ).toFixed(4);
      setAmount(maxAmount);
      setError(null);
    }
  };

  const handleContinue = () => {
    if (!amount || error) return;
    // Store amount in URL params for the next page
    router.push(`/lock/confirm?amount=${amount}`);
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Lock className="mx-auto mb-8 h-20 w-20 text-muted-foreground" />
        <h1 className="mb-4 text-3xl font-bold">Connect Your Wallet</h1>
        <p className="mb-8 text-muted-foreground">
          Connect your wallet to lock your assets with quantum-resistant security.
        </p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Lock className="h-8 w-8 text-qs-primary-500" />
            <div>
              <CardTitle>Lock Assets</CardTitle>
              <CardDescription>
                Secure your assets with quantum-resistant protection
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount to Lock</Label>
              {balance && (
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </span>
              )}
            </div>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pr-20"
                step="0.01"
                min="0.01"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleMaxClick}
                  className="h-6 px-2 text-xs"
                >
                  MAX
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  ETH
                </span>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              Your ETH will be locked in a quantum-resistant vault. To unlock,
              you will need to sign with your Dilithium key and wait 24 hours.
            </AlertDescription>
          </Alert>

          {/* Warning */}
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Make sure you have backed up your Dilithium keys before locking.
              Without your keys, you can only use emergency unlock (7-day wait + bond).
            </AlertDescription>
          </Alert>

          {/* Submit Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleContinue}
            disabled={!amount || !!error}
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
