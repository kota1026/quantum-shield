'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
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

const SEPOLIA_RPCS = [
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.drpc.org',
].filter(Boolean) as string[];

async function checkL1Receipt(txHash: string): Promise<'success' | 'reverted' | null> {
  for (const rpcUrl of SEPOLIA_RPCS) {
    try {
      const resp = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [txHash],
          id: 1,
        }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await resp.json();
      if (data.result) {
        return data.result.status === '0x1' ? 'success' : 'reverted';
      }
      // RPC responded but no receipt yet — try next RPC in case it has a newer view
      continue;
    } catch {
      continue;
    }
  }
  return null;
}

function ensureHexPrefix(hash: string | undefined): `0x${string}` | undefined {
  if (!hash) return undefined;
  return (hash.startsWith('0x') ? hash : `0x${hash}`) as `0x${string}`;
}

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface Step {
  id: number;
  status: StepStatus;
}

export function LockProcessing() {
  const t = useTranslations('consumer.lockProcessing');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: walletAddress, isConnected } = useAccount();

  const amount = searchParams.get('amount') || '0';
  const unmountedRef = useRef(false);

  useEffect(() => {
    return () => { unmountedRef.current = true; };
  }, []);

  const {
    isInitialized: isDilithiumReady,
    hasKeys,
    publicKey,
    generateKeys,
    signMessage,
    error: dilithiumError,
  } = useDilithium();

  const {
    requestLockFromL3,
    submitToL1,
    txHash: l1TxHashFromFrontend,
    l3Response,
    isPending: isL1Pending,
    isConfirming: isL1Confirming,
    error: l1Error,
    reset: resetL1,
  } = useLockL1();

  const l1TxHash = ensureHexPrefix(l3Response?.l1_tx_hash) || l1TxHashFromFrontend;

  const [steps, setSteps] = useState<Step[]>([
    { id: 1, status: 'pending' },
    { id: 2, status: 'pending' },
    { id: 3, status: 'pending' },
    { id: 4, status: 'pending' },
    { id: 5, status: 'pending' },
  ]);

  const [error, setError] = useState<string | null>(null);
  const lockStarted = useRef(false);
  const hasNavigated = useRef(false);

  const updateStep = useCallback((stepId: number, status: StepStatus) => {
    setSteps((prev: Step[]) => prev.map((s: Step) => (s.id === stepId ? { ...s, status } : s)));
  }, []);

  const MIN_LOCK_AMOUNT = 0.01;

  const executeLock = useCallback(async () => {
    if (lockStarted.current) return;
    lockStarted.current = true;

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < MIN_LOCK_AMOUNT) {
        throw new Error(t('errors.minimumAmount'));
      }

      if (!isConnected || !walletAddress) {
        throw new Error(t('errors.walletNotConnected'));
      }

      // Step 1: Generate/load Dilithium keys
      updateStep(1, 'active');

      let pk = publicKey;
      if (!hasKeys) {
        const keys = await generateKeys();
        pk = keys.publicKey;
      }

      if (!pk) {
        throw new Error(t('errors.dilithiumKeyFailed'));
      }

      const dilithiumPubKey = pk.startsWith('0x') ? pk : `0x${pk}`;
      updateStep(1, 'complete');

      // Step 2: Sign lock message with Dilithium
      updateStep(2, 'active');

      const valueWei = parseEther(amount);
      const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const nonce = Date.now();

      const messageBytes = constructLockMessage({
        chainId: SEPOLIA_CHAIN_ID,
        asset: '0x0000000000000000000000000000000000000000',
        amount: valueWei.toString(),
        destAddr: walletAddress,
        expiry,
        nonce,
      });

      const signature = await signMessage(messageBytes);
      if (!signature) {
        throw new Error(t('errors.signFailed'));
      }

      const dilithiumSignature = signature.startsWith('0x') ? signature : `0x${signature}`;
      updateStep(2, 'complete');

      // Step 3: Submit to L3 Aegis
      updateStep(3, 'active');

      const l3Resp = await requestLockFromL3({
        amount,
        dilithiumPubKey,
        dilithiumSignature,
        expiry,
        nonce,
      });

      updateStep(3, 'complete');

      // Step 4: Submit to L1 Vault (if not already done by backend)
      updateStep(4, 'active');

      if (!l3Resp.l1_tx_hash) {
        await submitToL1({
          lockId: l3Resp.lock_id,
          sr0: l3Resp.sr_0,
          amount,
          expiry,
        });
      }

      updateStep(4, 'complete');

      // Step 5: Wait for L1 confirmation
      updateStep(5, 'active');

      const txHashToWait = l3Resp.l1_tx_hash || l1TxHashFromFrontend;

      if (!txHashToWait) {
        throw new Error(t('errors.noTxHash'));
      }

      for (let attempt = 0; attempt < 120; attempt++) {
        if (hasNavigated.current || unmountedRef.current) return;

        const receiptStatus = await checkL1Receipt(txHashToWait);

        if (unmountedRef.current) return;

        if (receiptStatus === 'success') {
          hasNavigated.current = true;
          updateStep(5, 'complete');

          setTimeout(() => {
            const params = new URLSearchParams({
              amount,
              txHash: txHashToWait,
              ...(l3Resp.lock_id && { lockId: l3Resp.lock_id }),
              ...(l3Resp.sr_0 && { sr0: l3Resp.sr_0 }),
            });
            router.push(`/consumer/lock/success?${params.toString()}`);
          }, 500);
          return;
        }

        if (receiptStatus === 'reverted') {
          throw new Error(t('errors.txReverted'));
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      throw new Error(t('errors.confirmationTimeout'));

    } catch (err) {
      if (unmountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : t('errors.generic');
      setError(errorMessage);
      setSteps((prev: Step[]) => prev.map((s: Step) => (s.status === 'active' ? { ...s, status: 'error' } : s)));
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
    router,
    l1TxHashFromFrontend,
    t,
  ]);

  useEffect(() => {
    if (isDilithiumReady && !lockStarted.current) {
      executeLock();
    }
  }, [isDilithiumReady, executeLock]);

  useEffect(() => {
    if (l1Error) {
      setError(l1Error.message);
      setSteps((prev: Step[]) => prev.map((s: Step) => (s.status === 'active' ? { ...s, status: 'error' } : s)));
    }
  }, [l1Error]);

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

  const handleCancel = useCallback(() => {
    router.push('/consumer/dashboard');
  }, [router]);

  const stepLabels = [
    { label: t('steps.generateKeys'), tooltip: t('steps.generateKeysTooltip') },
    { label: t('steps.sign'), tooltip: t('steps.signTooltip') },
    { label: t('steps.submitL3'), tooltip: t('steps.submitL3Tooltip') },
    { label: t('steps.submitL1'), tooltip: t('steps.submitL1Tooltip') },
    { label: t('steps.confirm'), tooltip: t('steps.confirmTooltip') },
  ];

  const getStatusMessage = () => {
    if (error) return error;
    if (isL1Pending) return t('waitingForWallet');
    if (isL1Confirming) return t('waitingForL1');
    const activeStep = steps.find((s: Step) => s.status === 'active');
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

        <main role="main" className="relative z-10 text-center px-6 max-w-md w-full">
          {!error && (
            <div className="relative w-40 h-40 mx-auto mb-8" role="status" aria-label={t('waitingForL1')}>
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

          {error && (
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-16 h-16 text-destructive" aria-hidden="true" />
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold mb-3">
            {error ? t('errorTitle') : t('title')}
          </h1>
          <p className="text-sm text-foreground-secondary mb-8">
            {getStatusMessage()}
          </p>

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
                  {stepLabels[index]?.label}
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

          {l3Response && !error && (
            <div className="mb-4 p-3 bg-surface-secondary/30 rounded-qs text-left">
              <p className="text-xs text-foreground-secondary mb-1">{t('l3LockId')}:</p>
              <p className="text-xs font-mono text-gold break-all">
                {l3Response.lock_id.slice(0, 20)}...{l3Response.lock_id.slice(-16)}
              </p>
            </div>
          )}

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
                aria-label={t('viewOnEtherscan')}
              >
                {t('viewOnEtherscan')}
              </a>
            </div>
          )}

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

          {dilithiumError && (
            <p className="text-xs text-destructive mt-4">{dilithiumError}</p>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
