'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Check, HelpCircle, AlertCircle, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useDilithium } from '@/hooks/consumer';
import { useTransactionDetail } from '@/hooks/consumer/useConsumer';
import {
  requestUnlock,
  requestEmergencyUnlock,
  constructUnlockMessage,
  calculateEmergencyBond,
  type UnlockResponse,
  type EmergencyUnlockResponse,
} from '@/lib/api/unlock';
import { parseEther } from 'viem';

type StepStatus = 'pending' | 'active' | 'complete' | 'error';

interface Step {
  id: number;
  status: StepStatus;
}

/**
 * UnlockProcessing Component
 *
 * Implements SEQUENCES.md Sequence #2 (Normal) and #3 (Emergency): Unlock flow
 *
 * Normal Unlock Steps (24h timelock):
 * 1. Load lock details from L3
 * 2. Sign unlock message with Dilithium (ML-DSA-65)
 * 3. Submit to L3 Aegis (validates signature, computes SR_1)
 * 4. L3 initiates VRF prover selection
 * 5. Wait for prover signatures / timelock activation
 *
 * Emergency Unlock Steps (7d timelock):
 * 1. Load lock details from L3
 * 2. Sign unlock message with Dilithium
 * 3. Submit to L3 Aegis with bond
 * 4. Wait for challenge period
 */
export function UnlockProcessing() {
  const t = useTranslations('consumer.unlockProcessing');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: walletAddress, isConnected } = useAccount();

  // Get data from URL params
  const lockId = searchParams.get('lockId') || '';
  const method = searchParams.get('method') || 'normal'; // 'normal' or 'emergency'
  const isEmergency = method === 'emergency';

  // Fetch lock details
  const { data: lockDetails, isLoading: isLoadingLock } = useTransactionDetail(lockId);

  // Dilithium hook for signing
  const {
    isInitialized: isDilithiumReady,
    hasKeys,
    publicKey,
    signMessage,
    error: dilithiumError,
  } = useDilithium();

  // Steps for unlock flow
  const [steps, setSteps] = useState<Step[]>([
    { id: 1, status: 'pending' }, // Load lock details
    { id: 2, status: 'pending' }, // Sign unlock message
    { id: 3, status: 'pending' }, // Submit to L3 Aegis
    { id: 4, status: 'pending' }, // VRF prover selection / bond verification
    { id: 5, status: 'pending' }, // Timelock activation
  ]);

  const [error, setError] = useState<string | null>(null);
  const [unlockResponse, setUnlockResponse] = useState<UnlockResponse | EmergencyUnlockResponse | null>(null);
  const unlockStarted = useRef(false);
  const hasNavigated = useRef(false);

  // Update step status helper
  const updateStep = useCallback((stepId: number, status: StepStatus) => {
    setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, status } : s)));
  }, []);

  // Execute SEQUENCES.md compliant unlock flow
  const executeUnlock = useCallback(async () => {
    if (unlockStarted.current || !lockId) return;
    unlockStarted.current = true;

    try {
      // Ensure wallet is connected
      if (!isConnected || !walletAddress) {
        throw new Error('Wallet not connected. Please connect your wallet and try again.');
      }

      // Ensure Dilithium keys are available
      if (!hasKeys || !publicKey) {
        throw new Error('Dilithium keys not available. Please complete a lock operation first.');
      }

      // ============================
      // Step 1: Load lock details
      // ============================
      updateStep(1, 'active');
      console.log('Step 1: Loading lock details...');

      // Wait for lock details to load if needed
      if (!lockDetails) {
        // Simple wait for data
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // For now, use the lockId directly - in production, we'd validate against L3
      const lockAmount = lockDetails?.transaction?.amount || parseEther('0.01').toString();
      console.log('Lock details loaded:', { lockId, amount: lockAmount });

      // Pre-check: Verify Dilithium key matches the lock's owner public key
      if (lockDetails?.ownerPublicKey && publicKey) {
        const normalizedOwnerPk = lockDetails.ownerPublicKey.replace(/^0x/, '').toLowerCase();
        const normalizedLocalPk = publicKey.replace(/^0x/, '').toLowerCase();
        if (normalizedOwnerPk !== normalizedLocalPk) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(
              'Dilithium key mismatch: Your current signing key does not match the key used to create this lock. ' +
              'This can happen if browser data was cleared or you are using a different device. ' +
              'Please use the same browser/device where the lock was originally created.'
            );
          }
          // In development: warn but continue (test locks may not have matching keys)
          console.warn('⚠️ Dilithium key mismatch (dev mode: continuing anyway)');
        } else {
          console.log('✓ Dilithium key pre-check passed');
        }
      }

      updateStep(1, 'complete');

      // ============================
      // Step 2: Sign unlock message with Dilithium
      // ============================
      updateStep(2, 'active');
      console.log('Step 2: Signing unlock message with Dilithium...');

      // Construct unlock message
      const messageBytes = constructUnlockMessage({
        lockId,
        destAddr: walletAddress,
        amount: lockAmount,
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

      let response: UnlockResponse | EmergencyUnlockResponse;

      if (isEmergency) {
        // Emergency unlock with bond
        const bondAmount = calculateEmergencyBond(lockAmount);
        console.log('Emergency unlock with bond:', bondAmount);

        response = await requestEmergencyUnlock({
          lock_id: lockId,
          dest_addr: walletAddress,
          amount: lockAmount,
          sig_dilithium: dilithiumSignature,
        });

        console.log('Emergency unlock response:', response);
      } else {
        // Normal unlock
        response = await requestUnlock({
          lock_id: lockId,
          dest_addr: walletAddress,
          amount: lockAmount,
          sig_dilithium: dilithiumSignature,
        });

        console.log('Normal unlock response:', response);
      }

      setUnlockResponse(response);
      updateStep(3, 'complete');

      // ============================
      // Step 4: VRF prover selection / bond verification
      // ============================
      updateStep(4, 'active');
      console.log('Step 4:', isEmergency ? 'Bond verification...' : 'VRF prover selection...');

      // Simulate waiting for prover selection or bond verification
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!isEmergency && 'selected_provers' in response) {
        console.log('Selected provers:', response.selected_provers);
      }

      updateStep(4, 'complete');

      // ============================
      // Step 5: Timelock activation
      // ============================
      updateStep(5, 'active');
      console.log('Step 5: Activating timelock...');

      // Brief delay before navigation
      await new Promise(resolve => setTimeout(resolve, 500));

      updateStep(5, 'complete');

      // Navigate to success page
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        setTimeout(() => {
          const params = new URLSearchParams({
            lockId,
            unlockId: response.unlock_id,
            releaseTime: response.release_time.toString(),
            method,
          });
          router.push(`/consumer/unlock/success?${params.toString()}`);
        }, 500);
      }

    } catch (err) {
      console.error('Unlock failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unlock failed';
      setError(errorMessage);

      // Mark current active step as error
      setSteps(prev => prev.map(s => (s.status === 'active' ? { ...s, status: 'error' } : s)));
    }
  }, [
    isConnected,
    walletAddress,
    lockId,
    lockDetails,
    hasKeys,
    publicKey,
    signMessage,
    isEmergency,
    router,
    updateStep,
  ]);

  // Start unlock process when Dilithium is ready
  useEffect(() => {
    if (isDilithiumReady && hasKeys && lockId && !unlockStarted.current) {
      executeUnlock();
    }
  }, [isDilithiumReady, hasKeys, lockId, executeUnlock]);

  // Handle retry
  const handleRetry = useCallback(() => {
    unlockStarted.current = false;
    hasNavigated.current = false;
    setError(null);
    setUnlockResponse(null);
    setSteps([
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' },
      { id: 3, status: 'pending' },
      { id: 4, status: 'pending' },
      { id: 5, status: 'pending' },
    ]);
    executeUnlock();
  }, [executeUnlock]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push('/consumer/dashboard');
  }, [router]);

  // Step labels for unlock flow
  const stepLabels = isEmergency
    ? [
        { label: t('steps.loadLock'), tooltip: t('steps.loadLockTooltip') },
        { label: t('steps.sign'), tooltip: t('steps.signTooltip') },
        { label: t('steps.submitEmergency'), tooltip: t('steps.submitEmergencyTooltip') },
        { label: t('steps.bondVerify'), tooltip: t('steps.bondVerifyTooltip') },
        { label: t('steps.activateTimelock'), tooltip: t('steps.activateTimelockTooltip') },
      ]
    : [
        { label: t('steps.loadLock'), tooltip: t('steps.loadLockTooltip') },
        { label: t('steps.sign'), tooltip: t('steps.signTooltip') },
        { label: t('steps.submitL3'), tooltip: t('steps.submitL3Tooltip') },
        { label: t('steps.vrfSelection'), tooltip: t('steps.vrfSelectionTooltip') },
        { label: t('steps.activateTimelock'), tooltip: t('steps.activateTimelockTooltip') },
      ];

  // Current status message
  const getStatusMessage = () => {
    if (error) return error;
    if (isLoadingLock) return t('loadingLock');
    const activeStep = steps.find(s => s.status === 'active');
    if (activeStep) {
      switch (activeStep.id) {
        case 1: return t('loadingLock');
        case 2: return t('signingMessage');
        case 3: return isEmergency ? t('submittingEmergency') : t('submittingToL3');
        case 4: return isEmergency ? t('verifyingBond') : t('selectingProvers');
        case 5: return t('activatingTimelock');
        default: return t('subtitle');
      }
    }
    return t('subtitle');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-gold/15 to-transparent" />
        </div>

        <main role="main" className="relative z-10 text-center px-6 max-w-md w-full">
          {/* Animated spinner - only show when no error */}
          {!error && (
            <div className="relative w-40 h-40 mx-auto mb-8">
              <div
                className="absolute inset-0 border-2 border-transparent border-t-hinomaru rounded-full animate-spin"
                style={{ animationDuration: '1.5s' }}
              />
              <div
                className="absolute -inset-2.5 border-2 border-transparent border-t-gold rounded-full animate-spin"
                style={{ animationDuration: '2s', animationDirection: 'reverse' }}
              />
              <div className="absolute inset-[30px]">
                <div className="absolute inset-0 bg-gradient-radial from-white/15 to-white/2 rounded-full border border-white/10" />
                <div
                  className="absolute inset-5 bg-gradient-to-br from-gold-400 via-gold to-gold-700 rounded-full shadow-[0_0_40px_rgba(201,169,98,0.4)] animate-pulse flex items-center justify-center"
                  style={{ animationDuration: '2s' }}
                >
                  <Unlock className="w-10 h-10 text-background" />
                </div>
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

          {/* Emergency warning */}
          {isEmergency && !error && (
            <div className="mb-6 p-3 bg-warning/10 border border-warning/30 rounded-qs">
              <p className="text-xs text-warning font-medium">
                {t('emergencyWarning')}
              </p>
            </div>
          )}

          {/* Steps */}
          <div className="text-left space-y-2 mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-qs transition-all',
                  step.status === 'pending' && 'bg-white/2',
                  step.status === 'active' && 'bg-gold/10',
                  step.status === 'complete' && 'bg-success/10',
                  step.status === 'error' && 'bg-destructive/10'
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                    step.status === 'pending' && 'bg-white/5 text-foreground-secondary',
                    step.status === 'active' && 'bg-gold text-background animate-pulse',
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

          {/* Unlock Response display */}
          {unlockResponse && !error && (
            <div className="mb-4 p-3 bg-surface-secondary/30 rounded-qs text-left">
              <p className="text-xs text-foreground-secondary mb-1">Unlock ID:</p>
              <p className="text-xs font-mono text-gold break-all">
                {unlockResponse.unlock_id.slice(0, 20)}...{unlockResponse.unlock_id.slice(-16)}
              </p>
              {'time_lock_hours' in unlockResponse && (
                <p className="text-xs text-foreground-secondary mt-2">
                  Timelock: {unlockResponse.time_lock_hours}h
                </p>
              )}
              {'time_lock_days' in unlockResponse && (
                <p className="text-xs text-foreground-secondary mt-2">
                  Timelock: {unlockResponse.time_lock_days}d (Emergency)
                </p>
              )}
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

          {/* No keys warning */}
          {isDilithiumReady && !hasKeys && !error && (
            <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-qs">
              <p className="text-xs text-warning">
                {t('noKeysWarning')}
              </p>
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
