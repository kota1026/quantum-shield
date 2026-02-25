/**
 * L1Vault Hook
 *
 * Provides functionality to interact with the L1Vault contract on Sepolia.
 * Implements SEQUENCES.md Sequence #1: Lock flow.
 *
 * ## SEQUENCES.md Compliant Flow
 * 1. User signs lock message with Dilithium (ML-DSA-65)
 * 2. User → L3 Aegis: LockRequest with signature
 * 3. L3 validates signature, computes SR_0, generates lock_id
 * 4. L3 → User: {lock_id, sr_0, smt_proof}
 * 5. User → L1 Vault: lockWithSR0(lock_id, sr_0, recipient, expiry) + ETH
 *
 * This flow eliminates the 15.5M gas cost by moving SHA3-256 computation to L3.
 */

import { useCallback, useState } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useChainId,
  useSwitchChain,
  useReadContract,
} from 'wagmi';
import { parseEther, decodeEventLog, formatEther } from 'viem';
import {
  L1_VAULT_ADDRESS,
  L1_VAULT_ABI,
  SEPOLIA_CHAIN_ID,
} from '@/lib/contracts/l1vault';
import { createLock, constructLockMessage, type LockRequest, type LockResponse } from '@/lib/api/lock';

/**
 * Hook to read user's locked balance from L1 Vault
 * Uses the new lockedBalanceOf(address) function
 */
export function useUserLockedBalance() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: L1_VAULT_ADDRESS,
    abi: L1_VAULT_ABI,
    functionName: 'lockedBalanceOf',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  const balanceWei = data as bigint | undefined;
  const balanceEth = balanceWei ? parseFloat(formatEther(balanceWei)) : 0;

  return {
    balanceWei,
    balanceEth,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to read user's lock IDs from L1 Vault
 */
export function useUserLockIds() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: L1_VAULT_ADDRESS,
    abi: L1_VAULT_ABI,
    functionName: 'getUserLockIds',
    args: address ? [address] : undefined,
    chainId: SEPOLIA_CHAIN_ID,
    query: {
      enabled: !!address,
    },
  });

  const lockIds = data as `0x${string}`[] | undefined;

  return {
    lockIds: lockIds || [],
    isLoading,
    error,
    refetch,
  };
}

export interface UseLockL1Result {
  /**
   * Execute the full lock flow (L3 → L1)
   * @param params Lock parameters including amount and Dilithium keys
   * @returns Transaction hash and lock ID
   *
   * IMPORTANT: expiry and nonce must match the values used when signing
   */
  lock: (params: {
    amount: string; // ETH amount as string (e.g., "0.01")
    dilithiumPubKey: string; // Hex string with 0x prefix
    dilithiumSignature: string; // Hex string with 0x prefix
    expiry: number;  // Must match signature
    nonce: number;   // Must match signature
  }) => Promise<{
    txHash: `0x${string}`;
    lockId: string;
    sr0: string;
  }>;
  /**
   * Step 1: Request lock from L3 Aegis
   * Returns lock_id, sr_0, smt_proof
   *
   * IMPORTANT: expiry and nonce must match the values used when signing
   */
  requestLockFromL3: (params: {
    amount: string;
    dilithiumPubKey: string;
    dilithiumSignature: string;
    expiry: number;  // Must match signature
    nonce: number;   // Must match signature
  }) => Promise<LockResponse>;
  /**
   * Step 2: Submit lock to L1 Vault using L3 response
   */
  submitToL1: (params: {
    lockId: string;
    sr0: string;
    amount: string;
    expiry: number;
  }) => Promise<`0x${string}`>;
  isLoading: boolean;
  isPending: boolean;
  isConfirming: boolean;
  error: Error | null;
  txHash: `0x${string}` | undefined;
  l3Response: LockResponse | null;
  reset: () => void;
}

/**
 * Hook for locking ETH using SEQUENCES.md compliant flow
 * L3 Aegis validates Dilithium signature and computes SR_0
 * L1 Vault only receives lock_id, sr_0 (not the full public key)
 */
export function useLockL1(): UseLockL1Result {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [error, setError] = useState<Error | null>(null);
  const [l3Response, setL3Response] = useState<LockResponse | null>(null);

  const {
    data: hash,
    writeContractAsync,
    isPending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  /**
   * Step 1: Request lock from L3 Aegis
   * Validates Dilithium signature and computes SR_0
   *
   * IMPORTANT: expiry and nonce must match the values used when signing
   */
  const requestLockFromL3 = useCallback(
    async (params: {
      amount: string;
      dilithiumPubKey: string;
      dilithiumSignature: string;
      expiry: number;  // Must match signature
      nonce: number;   // Must match signature
    }): Promise<LockResponse> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Ensure keys have 0x prefix
      const pkDilithium = params.dilithiumPubKey.startsWith('0x')
        ? params.dilithiumPubKey
        : `0x${params.dilithiumPubKey}`;
      const sigDilithium = params.dilithiumSignature.startsWith('0x')
        ? params.dilithiumSignature
        : `0x${params.dilithiumSignature}`;

      // Create lock request for L3 Aegis
      // IMPORTANT: Use the same expiry and nonce that were used for signing
      const valueWei = parseEther(params.amount);

      const lockRequest: LockRequest = {
        chain_id: SEPOLIA_CHAIN_ID,
        asset: '0x0000000000000000000000000000000000000000', // Native ETH
        amount: valueWei.toString(),
        dest_addr: address,
        expiry: params.expiry,  // Use the same value as signature
        nonce: params.nonce,    // Use the same value as signature
        pk_dilithium: pkDilithium,
        sig_dilithium: sigDilithium,
      };

      console.log('Sending lock request to L3 Aegis:', {
        chain_id: lockRequest.chain_id,
        amount: lockRequest.amount,
        dest_addr: lockRequest.dest_addr,
        expiry: lockRequest.expiry,
        nonce: lockRequest.nonce,
        pk_length: pkDilithium.length,
        sig_length: sigDilithium.length,
      });

      // Call L3 API
      const response = await createLock(lockRequest);

      console.log('L3 Aegis response:', {
        lock_id: response.lock_id,
        sr_0: response.sr_0,
        status: response.status,
      });

      setL3Response(response);
      return response;
    },
    [address]
  );

  /**
   * Step 2: Submit lock to L1 Vault using L3 response
   */
  const submitToL1 = useCallback(
    async (params: {
      lockId: string;
      sr0: string;
      amount: string;
      expiry: number;
    }): Promise<`0x${string}`> => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      // Ensure we're on Sepolia
      if (chainId !== SEPOLIA_CHAIN_ID) {
        console.log('Switching to Sepolia network...');
        await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
      }

      const valueWei = parseEther(params.amount);

      // Ensure lock_id and sr_0 have 0x prefix and are bytes32
      const lockId = params.lockId.startsWith('0x')
        ? (params.lockId as `0x${string}`)
        : (`0x${params.lockId}` as `0x${string}`);
      const sr0 = params.sr0.startsWith('0x')
        ? (params.sr0 as `0x${string}`)
        : (`0x${params.sr0}` as `0x${string}`);

      console.log('Submitting to L1 Vault:', {
        lockId,
        sr0,
        recipient: address,
        expiry: params.expiry,
        value: valueWei.toString(),
      });

      // Call L1Vault.lockWithSR0
      // Gas estimate: ~200k (much lower than 15.5M for legacy lock)
      const txHash = await writeContractAsync({
        address: L1_VAULT_ADDRESS,
        abi: L1_VAULT_ABI,
        functionName: 'lockWithSR0',
        args: [lockId, sr0, address, BigInt(params.expiry)],
        value: valueWei,
        gas: BigInt(500000), // Reasonable gas for new function (no SHA3-256)
      });

      console.log('L1 Transaction submitted:', txHash);
      return txHash;
    },
    [address, chainId, switchChainAsync, writeContractAsync]
  );

  /**
   * Full lock flow: L3 request → L1 submission
   *
   * IMPORTANT: expiry and nonce must match the values used when signing
   */
  const lock = useCallback(
    async (params: {
      amount: string;
      dilithiumPubKey: string;
      dilithiumSignature: string;
      expiry: number;  // Must match signature
      nonce: number;   // Must match signature
    }) => {
      setError(null);

      try {
        // Step 1: Request lock from L3 Aegis
        console.log('Step 1: Requesting lock from L3 Aegis...');
        const l3Resp = await requestLockFromL3({
          amount: params.amount,
          dilithiumPubKey: params.dilithiumPubKey,
          dilithiumSignature: params.dilithiumSignature,
          expiry: params.expiry,
          nonce: params.nonce,
        });

        // Step 2: Submit to L1 Vault
        console.log('Step 2: Submitting to L1 Vault...');
        const txHash = await submitToL1({
          lockId: l3Resp.lock_id,
          sr0: l3Resp.sr_0,
          amount: params.amount,
          expiry: params.expiry,
        });

        return {
          txHash,
          lockId: l3Resp.lock_id,
          sr0: l3Resp.sr_0,
        };
      } catch (err) {
        console.error('Lock flow failed:', err);
        const error = err instanceof Error ? err : new Error('Lock failed');
        setError(error);
        throw error;
      }
    },
    [requestLockFromL3, submitToL1]
  );

  const reset = useCallback(() => {
    setError(null);
    setL3Response(null);
    resetWrite();
  }, [resetWrite]);

  return {
    lock,
    requestLockFromL3,
    submitToL1,
    isLoading: isPending || isConfirming,
    isPending,
    isConfirming,
    error,
    txHash: hash,
    l3Response,
    reset,
  };
}

/**
 * Construct the message to sign for Dilithium
 * This must match the format expected by L3 Aegis (services/api/src/routes/lock.rs)
 */
export function createDilithiumSigningMessage(params: {
  chainId: number;
  asset: string;
  amount: string;
  destAddr: string;
  expiry: number;
  nonce: number;
}): Uint8Array {
  return constructLockMessage({
    chainId: params.chainId,
    asset: params.asset,
    amount: params.amount,
    destAddr: params.destAddr,
    expiry: params.expiry,
    nonce: params.nonce,
  });
}

/**
 * Parse lockId from transaction receipt logs
 */
export function parseLockIdFromReceipt(receipt: {
  logs: Array<{ address: string; topics: string[]; data: string }>;
}): `0x${string}` | null {
  try {
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === L1_VAULT_ADDRESS.toLowerCase()) {
        const decoded = decodeEventLog({
          abi: L1_VAULT_ABI,
          data: log.data as `0x${string}`,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        });

        if (decoded.eventName === 'Locked' && 'lockId' in decoded.args) {
          return decoded.args.lockId as `0x${string}`;
        }
      }
    }
    return null;
  } catch (err) {
    console.error('Failed to parse lockId from receipt:', err);
    return null;
  }
}

/**
 * @deprecated Use lock() method which implements SEQUENCES.md compliant flow
 * Legacy hook for direct L1 lock (bypasses L3, high gas cost)
 */
export function useLockL1Legacy(): {
  lock: (params: { amount: string; dilithiumPubKey: string }) => Promise<{
    txHash: `0x${string}`;
    lockId: `0x${string}`;
  }>;
  isLoading: boolean;
  isPending: boolean;
  isConfirming: boolean;
  error: Error | null;
  txHash: `0x${string}` | undefined;
  reset: () => void;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const [error, setError] = useState<Error | null>(null);

  const {
    data: hash,
    writeContractAsync,
    isPending,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const lock = useCallback(
    async (params: { amount: string; dilithiumPubKey: string }) => {
      setError(null);

      try {
        if (!address) {
          throw new Error('Wallet not connected');
        }

        if (chainId !== SEPOLIA_CHAIN_ID) {
          console.log('Switching to Sepolia network...');
          await switchChainAsync({ chainId: SEPOLIA_CHAIN_ID });
        }

        const valueWei = parseEther(params.amount);
        const dilithiumPubKey = params.dilithiumPubKey.startsWith('0x')
          ? (params.dilithiumPubKey as `0x${string}`)
          : (`0x${params.dilithiumPubKey}` as `0x${string}`);

        console.warn(
          'WARNING: Using legacy lock function. This requires ~15.5M gas.',
          'Consider using the SEQUENCES.md compliant flow instead.'
        );

        const txHash = await writeContractAsync({
          address: L1_VAULT_ADDRESS,
          abi: L1_VAULT_ABI,
          functionName: 'lock',
          args: [address, dilithiumPubKey],
          value: valueWei,
          gas: BigInt(16000000),
        });

        return {
          txHash,
          lockId: txHash as `0x${string}`,
        };
      } catch (err) {
        console.error('Legacy L1 Lock failed:', err);
        const error = err instanceof Error ? err : new Error('Lock failed');
        setError(error);
        throw error;
      }
    },
    [address, chainId, switchChainAsync, writeContractAsync]
  );

  const reset = useCallback(() => {
    setError(null);
    resetWrite();
  }, [resetWrite]);

  return {
    lock,
    isLoading: isPending || isConfirming,
    isPending,
    isConfirming,
    error,
    txHash: hash,
    reset,
  };
}
