/**
 * Wallet Hook
 *
 * @module useWallet
 */

import { useState, useCallback } from 'react';
import { useQuantumShieldContext } from './QuantumShieldProvider';
import type { WalletState } from '@quantum-shield/sdk';

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
 *
 * @example
 * ```tsx
 * function WalletComponent() {
 *   const {
 *     isConnected,
 *     address,
 *     connect,
 *     disconnect,
 *     isAvailable,
 *   } = useWallet();
 *
 *   if (!isAvailable) {
 *     return <p>Please install MetaMask</p>;
 *   }
 *
 *   return isConnected ? (
 *     <div>
 *       <p>Connected: {address}</p>
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   ) : (
 *     <button onClick={connect}>Connect Wallet</button>
 *   );
 * }
 * ```
 */
export function useWallet(): UseWalletReturn {
  const { wallet, walletState, connectWallet, disconnectWallet } = useQuantumShieldContext();
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
    async (chainId: number) => {
      if (!wallet) throw new Error('Wallet not available');
      await wallet.switchChain(chainId);
    },
    [wallet]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      if (!wallet) throw new Error('Wallet not connected');
      return wallet.signMessage(message);
    },
    [wallet]
  );

  const getBalance = useCallback(
    async (address?: string): Promise<bigint> => {
      if (!wallet) throw new Error('Wallet not connected');
      return wallet.getBalance(address);
    },
    [wallet]
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
    isAvailable: wallet?.isAvailable() ?? false,
    isMetaMask: wallet?.isMetaMask() ?? false,
    error,
  };
}
