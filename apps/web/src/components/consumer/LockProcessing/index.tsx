'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Check, HelpCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useDilithium, useLockL1 } from '@/hooks/consumer';
import { SEPOLIA_CHAIN_ID } from '@/lib/contracts/l1vault';
import { constructLockMessage } from '@/lib/api/lock';

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface Step {
  id: number;
  status: StepStatus;
}

/**
 * LockProcessing Component
 *
 * Implements SEQUENCES.md Sequence #1: Lock flow
 *
 * Steps:
 * 1. Generate/load Dilithium keys
 * 2. Sign lock message with Dilithium (ML-DSA-65)
 * 3. Submit to L3 Aegis (validates signature, computes SR_0)
 * 4. Submit to L1 Vault (using lock_id, sr_0 from L3)
 * 5. Wait for L1 confirmation
 */
export function LockProcessing() {
  const t = useTranslations('consumer.lockProcessing');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: walletAddress, isConnected } = useAccount();

  // Get data from URL params
  const amount = searchParams.get('amount') || '0';

  // Dilithium hook for key generation and signing
  const {
    isInitialized: isDilithiumReady,
    hasKeys,
    publicKey,
    generateKeys,
    signMessage,
    error: dilithiumError,
  } = useDilithium();

  // L1 Vault hook for SEQUENCES.md compliant lock flow
  const {
    lock: lockFull,
    requestLockFromL3,
    submitToL1,
    txHash: l1TxHash,
    l3Response,
    isPending: isL1Pending,
    isConfirming: isL1Confirming,
    error: l1Error,
    reset: resetL1,
  } = useLockL1();

  // Wait for L1 transaction receipt
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: l1TxHash,
  });

  // 5 steps for SEQUENCES.md compliant flow
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, status: 'pending' }, // Generate Dilithium keys
    { id: 2, status: 'pending' }, // Sign lock message
    { id: 3, status: 'pending' }, // Submit to L3 Aegis
    { id: 4, status: 'pending' }, // Submit to L1 Vault
    { id: 5, status: 'pending' }, // Wait for L1 confirmation
  ]);

  const [error, setError] = useState<string | null>(null);
  const lockStarted = useRef(false);
  const hasNavigated = useRef(false);

  // Update step status helper
  const updateStep = useCallback((stepId: number, status: StepStatus) => {
    setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, status } : s)));
  }, []);

  // Minimum lock amount (must match L1Vault MIN_LOCK_AMOUNT = 0.01 ether)
  const MIN_LOCK_AMOUNT = 0.01;

  // Execute SEQUENCES.md compliant lock flow
  const executeLock = useCallback(async () => {
    if (lockStarted.current) return;
    lockStarted.current = true;

    try {
      // Validate amount before proceeding
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < MIN_LOCK_AMOUNT) {
        throw new Error(`Minimum lock amount is ${MIN_LOCK_AMOUNT} ETH`);
      }

      // Ensure wallet is connected
      if (!isConnected || !walletAddress) {
        throw new Error('Wallet not connected. Please connect your wallet and try again.');
      }

      // ============================
      // Step 1: Generate/load Dilithium keys
      // ============================
      updateStep(1, 'active');
      console.log('Step 1: Generating/loading Dilithium keys...');

      let pk = publicKey;
      if (!hasKeys) {
        const keys = await generateKeys();
        pk = keys.publicKey;
      }

      if (!pk) {
        throw new Error('Failed to get Dilithium public key');
      }

      // Ensure public key has 0x prefix
      const dilithiumPubKey = pk.startsWith('0x') ? pk : `0x${pk}`;
      console.log('Dilithium public key ready:', dilithiumPubKey.slice(0, 20) + '...');

      updateStep(1, 'complete');

      // ============================
      // Step 2: Sign lock message with Dilithium
      // ============================
      updateStep(2, 'active');
      console.log('Step 2: Signing lock message with Dilithium...');

      // Construct lock message (same format as L3 Aegis expects)
      const valueWei = parseEther(amount);
      const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24 hours from now
      const nonce = Date.now(); // Use timestamp as nonce for uniqueness

      const messageBytes = constructLockMessage({
        chainId: SEPOLIA_CHAIN_ID,
        asset: '0x0000000000000000000000000000000000000000', // Native ETH
        amount: valueWei.toString(),
        destAddr: walletAddress,
        expiry,
        nonce,
      });

      // Sign with Dilithium
      const signature = await signMessage(messageBytes);
      if (!signature) {
        throw new Error('Failed to sign message with Dilithium');
      }

      const dilithiumSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
      console.log('Dilithium signature ready:', dilithiumSignature.slice(0, 20) + '...');

      updateStep(2, 'complete');

      // ============================
      // Step 3: Submit to L3 Aegis
      // ============================
      updateStep(3, 'active');
      console.log('Step 3: Submitting to L3 Aegis...');

      // IMPORTANT: Pass the same expiry and nonce used for signing
      const l3Resp = await requestLockFromL3({
        amount,
        dilithiumPubKey,
        dilithiumSignature,
        expiry,  // Same value used when signing
        nonce,   // Same value used when signing
      });

      console.log('L3 Response:', {
        lock_id: l3Resp.lock_id,
        sr_0: l3Resp.sr_0,
        status: l3Resp.status,
      });

      updateStep(3, 'complete');

      // ============================
      // Step 4: Submit to L1 Vault
      // ============================
      updateStep(4, 'active');
      console.log('Step 4: Submitting to L1 Vault...');

      await submitToL1({
        lockId: l3Resp.lock_id,
        sr0: l3Resp.sr_0,
        amount,
        expiry,
      });

      console.log('L1 transaction submitted');
      updateStep(4, 'complete');

      // ============================
      // Step 5: Wait for L1 confirmation (handled by useEffect below)
      // ============================
      updateStep(5, 'active');
      console.log('Step 5: Waiting for L1 confirmation...');

    } catch (err) {
      console.error('Lock failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lock failed';
      setError(errorMessage);

      // Mark current active step as error
      setSteps(prev => prev.map(s => (s.status === 'active' ? { ...s, status: 'error' } : s)));
    }
  }, [
    isConnected,
    walletAddress,
    publicKey,
    hasKeys,
    generateKeys,
    signMessage,
    amount,
    requestLockFromL3,
    submitToL1,
    updateStep,
  ]);

  // Start lock process when Dilithium is ready
  useEffect(() => {
    if (isDilithiumReady && !lockStarted.current) {
      executeLock();
    }
  }, [isDilithiumReady, executeLock]);

  // Update step 5 and navigate when confirmed OR show error if reverted
  useEffect(() => {
    console.log('Receipt effect:', { receipt, l1TxHash, hasNavigated: hasNavigated.current });
    if (receipt && l1TxHash && !hasNavigated.current) {
      console.log('Receipt status:', receipt.status);
      // Check if transaction was successful (status === 'success') or reverted
      if (receipt.status === 'success') {
        hasNavigated.current = true;
        updateStep(5, 'complete');

        // Navigate to success page with L1 tx hash and L3 lock_id
        setTimeout(() => {
          const params = new URLSearchParams({
            amount,
            txHash: l1TxHash,
            ...(l3Response?.lock_id && { lockId: l3Response.lock_id }),
            ...(l3Response?.sr_0 && { sr0: l3Response.sr_0 }),
          });
          router.push(`/consumer/lock/success?${params.toString()}`);
        }, 500);
      } else {
        // Transaction was reverted on L1
        hasNavigated.current = true;
        const revertError = 'Transaction reverted on L1. This may be due to insufficient amount (minimum 0.01 ETH), TVL cap exceeded, or invalid lock_id/sr_0.';
        setError(revertError);
        updateStep(5, 'error');
      }
    }
  }, [receipt, l1TxHash, l3Response, amount, router, updateStep]);

  // Handle L1 error (submission errors, user rejection, etc.)
  useEffect(() => {
    if (l1Error) {
      setError(l1Error.message);
      setSteps(prev => prev.map(s => (s.status === 'active' ? { ...s, status: 'error' } : s)));
    }
  }, [l1Error]);

  // Handle retry
  const handleRetry = useCallback(() => {
    lockStarted.current = false;
    hasNavigated.current = false;
    setError(null);
    resetL1();
    setSteps([
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' },
      { id: 3, status: 'pending' },
      { id: 4, status: 'pending' },
      { id: 5, status: 'pending' },
    ]);
    executeLock();
  }, [executeLock, resetL1]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push('/consumer/dashboard');
  }, [router]);

  // Step labels for SEQUENCES.md compliant flow
  const stepLabels = [
    { label: t('steps.generateKeys'), tooltip: t('steps.generateKeysTooltip') },
    { label: t('steps.sign'), tooltip: t('steps.signTooltip') },
    { label: t('steps.submitL3'), tooltip: t('steps.submitL3Tooltip') },
    { label: t('steps.submitL1'), tooltip: t('steps.submitL1Tooltip') },
    { label: t('steps.confirm'), tooltip: t('steps.confirmTooltip') },
  ];

  // Current status message
  const getStatusMessage = () => {
    if (error) return error;
    if (isL1Pending) return t('waitingForWallet');
    if (isL1Confirming) return t('waitingForL1');
    const activeStep = steps.find(s => s.status === 'active');
    if (activeStep) {
      switch (activeStep.id) {
        case 1: return t('generatingKeys');
        case 2: return t('signingMessage');
        case 3: return t('submittingToL3');
        case 4: return t('submittingToL1');
        case 5: return t('waitingForL1');
        default: return t('subtitle');
      }
    }
    return t('subtitle');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-hinomaru/15 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-md w-full">
          {/* Animated spinner - only show when no error */}
          {!error && (
            <div className="relative w-40 h-40 mx-auto mb-8">
              <div
                className="absolute inset-0 border-2 border-transparent border-t-gold rounded-full animate-spin"
                style={{ animationDuration: '1.5s' }}
              />
              <div
                className="absolute -inset-2.5 border-2 border-transparent border-t-hinomaru rounded-full animate-spin"
                style={{ animationDuration: '2s', animationDirection: 'reverse' }}
              />
              <div className="absolute inset-[30px]">
                <div className="absolute inset-0 bg-gradient-radial from-white/15 to-white/2 rounded-full border border-white/10" />
                <div
                  className="absolute inset-5 bg-gradient-to-br from-[#ff3050] via-hinomaru to-[#8a001a] rounded-full shadow-[0_0_40px_rgba(188,0,45,0.4)] animate-pulse"
                  style={{ animationDuration: '2s' }}
                />
              </div>
            </div>
          )}

          {/* Error icon */}
          {error && (
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-destructive" />
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold mb-3">
            {error ? t('errorTitle') : t('title')}
          </h1>
          <p className="text-sm text-foreground-secondary mb-8">
            {getStatusMessage()}
          </p>

          {/* Steps */}
          <div className="text-left space-y-2 mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-qs transition-all',
                  step.status === 'pending' && 'bg-white/2',
                  step.status === 'active' && 'bg-hinomaru/10',
                  step.status === 'complete' && 'bg-success/10',
                  step.status === 'error' && 'bg-destructive/10'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                    step.status === 'pending' && 'bg-white/5 text-foreground-secondary',
                    step.status === 'active' && 'bg-hinomaru text-white animate-pulse',
                    step.status === 'complete' && 'bg-success text-white',
                    step.status === 'error' && 'bg-destructive text-white'
                  )}
                >
                  {step.status === 'complete' ? (
                    <Check className="w-4 h-4" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={cn(
                    'flex-1 text-sm flex items-center gap-1',
                    step.status === 'pending' && 'text-foreground-secondary',
                    step.status === 'active' && 'text-foreground font-medium',
                    step.status === 'complete' && 'text-success',
                    step.status === 'error' && 'text-destructive'
                  )}
                >
                  {stepLabels[index]?.label || `Step ${step.id}`}
                  {stepLabels[index]?.tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-3 rounded hover:bg-surface-secondary/50 transition-colors"
                          aria-label={t('steps.tooltipAriaLabel')}
                        >
                          <HelpCircle className="h-3 w-3 text-foreground-tertiary" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>{stepLabels[index].tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* L3 Response display */}
          {l3Response && !error && (
            <div className="mb-4 p-3 bg-surface-secondary/30 rounded-qs text-left">
              <p className="text-xs text-foreground-secondary mb-1">L3 Lock ID:</p>
              <p className="text-xs font-mono text-gold break-all">
                {l3Response.lock_id.slice(0, 20)}...{l3Response.lock_id.slice(-16)}
              </p>
            </div>
          )}

          {/* TX Hash display */}
          {l1TxHash && !error && (
            <div className="mb-4">
              <p className="text-xs text-foreground-secondary font-mono">
                L1 TX: <span className="text-gold">{l1TxHash.slice(0, 10)}...{l1TxHash.slice(-8)}</span>
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${l1TxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-hinomaru hover:text-hinomaru/80 underline"
              >
                View on Etherscan
              </a>
            </div>
          )}

          {/* Error actions */}
          {error && (
            <div className="flex flex-col gap-3">
              <Button variant="primary" fullWidth onClick={handleRetry}>
                {t('retry')}
              </Button>
              <Button variant="ghost" fullWidth onClick={handleCancel}>
                {t('cancel')}
              </Button>
            </div>
          )}

          {/* Dilithium error */}
          {dilithiumError && (
            <p className="text-xs text-destructive mt-4">{dilithiumError}</p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
