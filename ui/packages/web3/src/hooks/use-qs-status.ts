import { useReadContract } from 'wagmi';

import { QS_VAULT_ABI, QS_VAULT_ADDRESS } from '../contracts/qs-vault';

export interface LockStatus {
  owner: string;
  amount: bigint;
  dilithiumPublicKey: string;
  lockedAt: bigint;
  status: number;
}

export interface UnlockStatus {
  lockId: bigint;
  amount: bigint;
  requestedAt: bigint;
  unlockTime: bigint;
  isEmergency: boolean;
  status: number;
}

export function useQSStatus() {
  const useLockStatus = (lockId: string) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: QS_VAULT_ADDRESS,
      abi: QS_VAULT_ABI,
      functionName: 'getLock',
      args: [BigInt(lockId)],
    });

    return {
      lock: data as LockStatus | undefined,
      isLoading,
      error,
      refetch,
    };
  };

  const useUnlockStatus = (unlockId: string) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: QS_VAULT_ADDRESS,
      abi: QS_VAULT_ABI,
      functionName: 'getUnlockRequest',
      args: [BigInt(unlockId)],
    });

    return {
      unlock: data as UnlockStatus | undefined,
      isLoading,
      error,
      refetch,
    };
  };

  const useUserLocks = (address: string) => {
    const { data, isLoading, error, refetch } = useReadContract({
      address: QS_VAULT_ADDRESS,
      abi: QS_VAULT_ABI,
      functionName: 'getUserLocks',
      args: [address as `0x${string}`],
    });

    return {
      lockIds: data as bigint[] | undefined,
      isLoading,
      error,
      refetch,
    };
  };

  return {
    useLockStatus,
    useUnlockStatus,
    useUserLocks,
  };
}
