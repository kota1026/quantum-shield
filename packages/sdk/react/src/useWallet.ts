/**
 * Wallet Hook
 *
 * @module useWallet
 */

import { useState, useCallback } from 'react';
import { useQuantumShieldContext, type WalletState } from './QuantumShieldProvider';

export interface UseWalletReturn {
  /** Wallet state */
  state: WalletState;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Connected address */
  address: string | null;
  /** Current chain ID */
  chainId: number | null;
  /** Connect wallet */
  connect: () => Promise<void>;
  /** Disconnect wallet */
  disconnect: () => void;
  /** Switch chain */
  switchChain: (chainId: number) => Promise<void>;
  /** Sign message (secp256k1 - for wallet auth only) */
  signMessage: (message: string) => Promise<string>;
  /** Get balance */
  getBalance: (address?: string) => Promise<bigint>;
  /** Whether wallet is available */
  isAvailable: boolean;
  /** Whether MetaMask specifically */
  isMetaMask: boolean;
  /** Error state */
  error: Error | null;
}

/**
 * Hook for wallet operations
 */
export function useWallet(): UseWalletReturn {
  const { walletState, connectWallet, disconnectWallet } = useQuantumShieldContext();
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(async () => {
    try {
      setError(null);
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Connection failed'));
    }
  }, [connectWallet]);

  const switchChain = useCallback(
    async (_chainId: number) => {
      // Placeholder - in production would call wallet
      console.log('Switch chain not implemented');
    },
    []
  );

  const signMessage = useCallback(
    async (_message: string): Promise<string> => {
      // Placeholder - in production would call wallet
      return `0x${Math.random().toString(16).slice(2)}`;
    },
    []
  );

  const getBalance = useCallback(
    async (_address?: string): Promise<bigint> => {
      // Placeholder - in production would call wallet
      return BigInt(0);
    },
    []
  );

  return {
    state: walletState,
    isConnected: walletState.connected,
    address: walletState.address,
    chainId: walletState.chainId,
    connect,
    disconnect: disconnectWallet,
    switchChain,
    signMessage,
    getBalance,
    isAvailable: typeof window !== 'undefined',
    isMetaMask: false,
    error,
  };
}
