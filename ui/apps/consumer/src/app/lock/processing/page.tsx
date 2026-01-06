'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, CheckCircle2, Circle, XCircle, ExternalLink, AlertTriangle, FlaskConical } from 'lucide-react';
import { useAccount } from 'wagmi';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Progress,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@quantum-shield/ui';
import { useQSLock } from '@quantum-shield/web3';

type Step = 'preparing' | 'signing' | 'submitting' | 'confirming' | 'complete' | 'error';

const steps: { id: Step; title: string; description: string }[] = [
  {
    id: 'preparing',
    title: 'Preparing Transaction',
    description: 'Generating Dilithium signature',
  },
  {
    id: 'signing',
    title: 'Wallet Signature',
    description: 'Please sign the transaction in your wallet',
  },
  {
    id: 'submitting',
    title: 'Submitting Transaction',
    description: 'Sending transaction to L1 Sepolia',
  },
  {
    id: 'confirming',
    title: 'Confirming',
    description: 'Waiting for block confirmation',
  },
  {
    id: 'complete',
    title: 'Complete',
    description: 'Your assets are now locked',
  },
];

// Environment flags
const IS_TESTNET_MODE = process.env.NEXT_PUBLIC_ENABLE_TESTNET_MODE === 'true';
const USE_MOCK_SIGNATURES = !process.env.NEXT_PUBLIC_DILITHIUM_WASM_URL;

export default function LockProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const dilithiumPubKey = searchParams.get('pubKey') || '';
  const userSignature = searchParams.get('signature') || '';
  
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState<Step>('preparing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingMockSignatures, setUsingMockSignatures] = useState(false);
  
  const { 
    lock, 
    isPending, 
    isConfirming, 
    isSuccess, 
    txHash 
  } = useQSLock({
    onSuccess: (hash) => {
      console.log('Lock successful:', hash);
      setCurrentStep('complete');
      setProgress(100);
      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/lock/success?amount=${amount}&txHash=${hash}`);
      }, 2000);
    },
    onError: (error) => {
      console.error('Lock failed:', error);
      setErrorMessage(error.message);
      setCurrentStep('error');
    },
  });

  const executeLock = useCallback(async () => {
    if (!isConnected || !address) {
      setErrorMessage('Wallet not connected');
      setCurrentStep('error');
      return;
    }

    try {
      // Step 1: Prepare (generate mock signature if not provided)
      setCurrentStep('preparing');
      setProgress(10);

      let pubKey = dilithiumPubKey;
      let signature = userSignature;
      
      // Check if we need to use mock signatures
      if (!pubKey || !signature) {
        if (!IS_TESTNET_MODE) {
          setErrorMessage('Dilithium WASM module not available. Cannot generate real quantum-resistant signatures.');
          setCurrentStep('error');
          return;
        }
        
        // Generate mock signatures for testnet
        setUsingMockSignatures(true);
        pubKey = generateMockDilithiumPubKey(address);
        signature = generateMockSignature(address, amount);
        console.warn('[TESTNET] Using mock Dilithium signatures - NOT FOR PRODUCTION');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Request wallet signature
      setCurrentStep('signing');
      setProgress(25);

      // Step 3: Submit transaction
      await lock({
        amount,
        dilithiumPublicKey: pubKey,
        userSignature: signature,
      });

      setCurrentStep('submitting');
      setProgress(50);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Lock failed');
      setErrorMessage(error.message);
      setCurrentStep('error');
    }
  }, [isConnected, address, amount, dilithiumPubKey, userSignature, lock]);

  // Watch for transaction state changes
  useEffect(() => {
    if (isPending) {
      setCurrentStep('signing');
      setProgress(25);
    }
  }, [isPending]);

  useEffect(() => {
    if (isConfirming && txHash) {
      setCurrentStep('confirming');
      setProgress(75);
    }
  }, [isConfirming, txHash]);

  useEffect(() => {
    if (isSuccess) {
      setCurrentStep('complete');
      setProgress(100);
    }
  }, [isSuccess]);

  // Auto-start lock process
  useEffect(() => {
    if (isConnected && currentStep === 'preparing') {
      executeLock();
    }
  }, [isConnected, currentStep, executeLock]);

  const handleRetry = () => {
    setErrorMessage(null);
    setCurrentStep('preparing');
    setProgress(0);
    setUsingMockSignatures(false);
    executeLock();
  };

  const handleCancel = () => {
    router.push('/lock');
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';

  if (currentStep === 'error') {
    return (
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Transaction Failed</CardTitle>
            <CardDescription>
              Something went wrong while locking your assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleCancel}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-lg px-4 py-8">
      {/* Testnet Mode Warning Banner */}
      {IS_TESTNET_MODE && usingMockSignatures && (
        <Alert variant="warning" className="mb-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
          <FlaskConical className="h-4 w-4" />
          <AlertTitle className="text-orange-700 dark:text-orange-300">Testnet Mode</AlertTitle>
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            Using mock Dilithium signatures for testing. 
            Real quantum-resistant signatures require the Dilithium WASM module.
            <strong className="block mt-1">Do not use this configuration in production.</strong>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qs-primary-100 dark:bg-qs-primary-900">
            {currentStep === 'complete' ? (
              <CheckCircle2 className="h-8 w-8 text-qs-success-500" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-qs-primary-500" />
            )}
          </div>
          <CardTitle>
            {currentStep === 'complete' ? 'Lock Complete!' : 'Processing Lock'}
          </CardTitle>
          <CardDescription>
            {currentStep === 'complete'
              ? `Successfully locked ${amount} ETH`
              : 'Please wait while we secure your assets on L1 Sepolia'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <Progress value={progress} className="h-2" />

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 ${
                    isComplete || isCurrent
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className="mt-0.5">
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-qs-success-500" />
                    ) : isCurrent ? (
                      <Loader2 className="h-5 w-5 animate-spin text-qs-primary-500" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {step.title}
                      {step.id === 'preparing' && usingMockSignatures && (
                        <span className="ml-2 text-xs text-orange-500">(Mock)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="mb-2 text-sm text-muted-foreground">Transaction Hash</p>
              <a
                href={`${etherscanUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-mono text-qs-primary-500 hover:underline"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-8)}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Amount Info */}
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">Locking</p>
            <p className="text-2xl font-bold">{amount} ETH</p>
            <p className="mt-1 text-xs text-muted-foreground">
              on L1 Sepolia (Chain ID: 11155111)
            </p>
          </div>

          {/* Warning */}
          <p className="text-center text-sm text-muted-foreground">
            Do not close this window until the process is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate deterministic mock Dilithium public key for testing
 * Uses address as seed for reproducibility
 * 
 * ⚠️ TESTNET ONLY - Not cryptographically secure
 * Production requires actual Dilithium WASM module
 */
function generateMockDilithiumPubKey(address: string): string {
  // Create deterministic but fake public key based on address
  const seed = address.toLowerCase().replace('0x', '');
  const mockPubKey = Array.from({ length: 64 }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return ((charCode + i * 17) % 256).toString(16).padStart(2, '0');
  }).join('');
  
  console.warn('[MOCK] Generated mock Dilithium public key:', mockPubKey.slice(0, 16) + '...');
  return mockPubKey;
}

/**
 * Generate deterministic mock signature for testing
 * 
 * ⚠️ TESTNET ONLY - Not cryptographically secure
 * Production requires actual Dilithium WASM module
 */
function generateMockSignature(address: string, amount: string): string {
  const seed = `${address}:${amount}`.toLowerCase();
  const mockSignature = Array.from({ length: 128 }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return ((charCode + i * 31) % 256).toString(16).padStart(2, '0');
  }).join('');
  
  console.warn('[MOCK] Generated mock signature for amount:', amount);
  return mockSignature;
}
