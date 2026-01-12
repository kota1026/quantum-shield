import * as React from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';

import { QS_VAULT_ABI, QS_VAULT_ADDRESS } from '../contracts/qs-vault';

export interface UseLockOptions {
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export function useQSLock(options: UseLockOptions = {}) {
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

  const lock = React.useCallback(
    async (params: {
      amount: string;
      dilithiumPublicKey: string;
      userSignature: string;
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      try {
        const hash = await writeContractAsync({
          address: QS_VAULT_ADDRESS,
          abi: QS_VAULT_ABI,
          functionName: 'lock',
          args: [
            `0x${params.dilithiumPublicKey}` as `0x${string}`,
            `0x${params.userSignature}` as `0x${string}`,
          ],
          value: parseEther(params.amount),
        });

        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Lock failed');
        options.onError?.(error);
        throw error;
      }
    },
    [address, writeContractAsync, options]
  );

  return {
    lock,
    isPending,
    isConfirming,
    isSuccess,
    txHash,
  };
}
