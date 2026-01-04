/**
 * Quantum Shield React Context Provider
 *
 * @module QuantumShieldProvider
 */

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  QuantumShieldClient,
  type QuantumShieldConfig,
  DilithiumCrypto,
  type DilithiumKeyPair,
  WalletConnector,
  type WalletState,
} from '@quantum-shield/sdk';

/**
 * Context value type
 */
export interface QuantumShieldContextValue {
  /** SDK client instance */
  client: QuantumShieldClient | null;
  /** Crypto module */
  crypto: DilithiumCrypto | null;
  /** Wallet connector */
  wallet: WalletConnector | null;
  /** Wallet state */
  walletState: WalletState;
  /** Current Dilithium key pair */
  keyPair: DilithiumKeyPair | null;
  /** Whether SDK is initialized */
  isInitialized: boolean;
  /** Whether SDK is loading */
  isLoading: boolean;
  /** Initialization error */
  error: Error | null;
  /** Connect wallet */
  connectWallet: () => Promise<void>;
  /** Disconnect wallet */
  disconnectWallet: () => void;
  /** Generate new key pair */
  generateKeyPair: () => DilithiumKeyPair | null;
  /** Set key pair (for importing) */
  setKeyPair: (keyPair: DilithiumKeyPair) => void;
  /** Clear key pair */
  clearKeyPair: () => void;
}

const defaultWalletState: WalletState = {
  connected: false,
  address: null,
  chainId: null,
  provider: null,
  signer: null,
};

const QuantumShieldContext = createContext<QuantumShieldContextValue | null>(null);

/**
 * Provider props
 */
export interface QuantumShieldProviderProps {
  /** SDK configuration */
  config: QuantumShieldConfig;
  /** Auto-initialize on mount */
  autoInit?: boolean;
  /** Children */
  children: ReactNode;
}

/**
 * Quantum Shield Provider Component
 */
export function QuantumShieldProvider({
  config,
  autoInit = true,
  children,
}: QuantumShieldProviderProps): JSX.Element {
  const [client, setClient] = useState<QuantumShieldClient | null>(null);
  const [crypto, setCrypto] = useState<DilithiumCrypto | null>(null);
  const [wallet, setWallet] = useState<WalletConnector | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState);
  const [keyPair, setKeyPair] = useState<DilithiumKeyPair | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!autoInit) {
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const newClient = new QuantumShieldClient(config);
        await newClient.init();

        const newWallet = new WalletConnector();

        newWallet.onEvent((event) => {
          if (event.type === 'connected' || event.type === 'accountsChanged') {
            setWalletState(newWallet.getState());
          } else if (event.type === 'disconnected') {
            setWalletState(defaultWalletState);
          } else if (event.type === 'chainChanged') {
            setWalletState(newWallet.getState());
          }
        });

        setClient(newClient);
        setCrypto(newClient.getCrypto());
        setWallet(newWallet);
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown initialization error'));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [config, autoInit]);

  const connectWallet = useCallback(async () => {
    if (!wallet) throw new Error('SDK not initialized');
    const state = await wallet.connect();
    setWalletState(state);
  }, [wallet]);

  const disconnectWallet = useCallback(() => {
    if (wallet) {
      wallet.disconnect();
      setWalletState(defaultWalletState);
    }
  }, [wallet]);

  const generateKeyPairFn = useCallback((): DilithiumKeyPair | null => {
    if (!crypto) return null;
    const newKeyPair = crypto.generateKeyPair();
    setKeyPair(newKeyPair);
    return newKeyPair;
  }, [crypto]);

  const clearKeyPair = useCallback(() => setKeyPair(null), []);

  const value: QuantumShieldContextValue = {
    client,
    crypto,
    wallet,
    walletState,
    keyPair,
    isInitialized,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    generateKeyPair: generateKeyPairFn,
    setKeyPair,
    clearKeyPair,
  };

  return (
    <QuantumShieldContext.Provider value={value}>
      {children}
    </QuantumShieldContext.Provider>
  );
}

export function useQuantumShieldContext(): QuantumShieldContextValue {
  const context = useContext(QuantumShieldContext);
  if (!context) {
    throw new Error('useQuantumShieldContext must be used within QuantumShieldProvider');
  }
  return context;
}
