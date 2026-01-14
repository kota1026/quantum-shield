import * as React from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';

import { QS_VAULT_ABI, QS_VAULT_ADDRESS } from '../contracts/qs-vault';

export interface UseUnlockOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export function useQSUnlock(options: UseUnlockOptions = {}) {
  const { address } = useAccount();
  const { writeContractAsync, isPending, data: txHash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  React.useEffect(() => {
    if (isSuccess && txHash) {
      options.onSuccess?.(txHash);
    }
  }, [isSuccess, txHash, options]);

  const requestUnlock = React.useCallback(
    async (params: {
      lockId: string;
      amount: string;
      dilithiumSignature: string;
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      try {
        const hash = await writeContractAsync({
          address: QS_VAULT_ADDRESS,
          abi: QS_VAULT_ABI,
          functionName: 'requestUnlock',
          args: [
            BigInt(params.lockId),
            parseEther(params.amount),
            `0x${params.dilithiumSignature}` as `0x${string}`,
          ],
        });

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unlock request failed');
        options.onError?.(error);
        throw error;
      }
    },
    [address, writeContractAsync, options]
  );

  const executeUnlock = React.useCallback(
    async (unlockId: string) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      try {
        const hash = await writeContractAsync({
          address: QS_VAULT_ADDRESS,
          abi: QS_VAULT_ABI,
          functionName: 'executeUnlock',
          args: [BigInt(unlockId)],
        });

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unlock execution failed');
        options.onError?.(error);
        throw error;
      }
    },
    [address, writeContractAsync, options]
  );

  return {
    requestUnlock,
    executeUnlock,
    isPending,
    isConfirming,
    isSuccess,
    txHash,
  };
}
