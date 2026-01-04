/**
 * Quantum Shield React Context Provider
 *
 * @module QuantumShieldProvider
 */

import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

// Types inlined to avoid external dependency during tests
export interface QuantumShieldConfig {
  apiUrl: string;
  network: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  provider: unknown;
  signer: unknown;
}

export interface DilithiumKeyPair {
  publicKey: string;
  secretKey: string;
  publicKeyHash: string;
}

const defaultWalletState: WalletState = {
  connected: false,
  address: null,
  chainId: null,
  provider: null,
  signer: null,
};

/**
 * Context value type
 */
export interface QuantumShieldContextValue {
  /** SDK client instance */
  client: unknown;
  /** Crypto module */
  crypto: unknown;
  /** Wallet connector */
  wallet: unknown;
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
  const [client, setClient] = useState<unknown>(null);
  const [crypto, setCrypto] = useState<unknown>(null);
  const [wallet, setWallet] = useState<unknown>(null);
  const [walletState, setWalletState] = useState<WalletState>(defaultWalletState);
  const [keyPair, setKeyPairState] = useState<DilithiumKeyPair | null>(null);
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

        // In production, this would initialize the actual SDK
        // For now, we'll set up mock objects
        setClient({ config });
        setCrypto({});
        setWallet({});
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
    // Placeholder implementation
    setWalletState({
      connected: true,
      address: '0x0000000000000000000000000000000000000000',
      chainId: 11155111, // Sepolia
      provider: null,
      signer: null,
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState(defaultWalletState);
  }, []);

  const generateKeyPairFn = useCallback((): DilithiumKeyPair | null => {
    // Placeholder - in production would call WASM
    const mockKeyPair: DilithiumKeyPair = {
      publicKey: 'a'.repeat(3904),
      secretKey: 'b'.repeat(8064),
      publicKeyHash: 'c'.repeat(64),
    };
    setKeyPairState(mockKeyPair);
    return mockKeyPair;
  }, []);

  const setKeyPair = useCallback((kp: DilithiumKeyPair) => {
    setKeyPairState(kp);
  }, []);

  const clearKeyPair = useCallback(() => setKeyPairState(null), []);

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
