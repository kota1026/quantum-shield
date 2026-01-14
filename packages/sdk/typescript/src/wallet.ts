/**
 * Wallet Connector Module
 *
 * Provides MetaMask and other wallet integrations.
 *
 * @module wallet
 */

import { ethers } from 'ethers';

/**
 * Wallet connection state
 */
export interface WalletState {
  /** Whether wallet is connected */
  connected: boolean;
  /** Connected address */
  address: string | null;
  /** Chain ID */
  chainId: number | null;
  /** Provider instance */
  provider: ethers.BrowserProvider | null;
  /** Signer instance */
  signer: ethers.Signer | null;
}

/**
 * Wallet event types
 */
export type WalletEvent =
  | { type: 'connected'; address: string; chainId: number }
  | { type: 'disconnected' }
  | { type: 'chainChanged'; chainId: number }
  | { type: 'accountsChanged'; accounts: string[] };

/**
 * Wallet event listener
 */
export type WalletEventListener = (event: WalletEvent) => void;

/**
 * Supported chain configurations
 */
const CHAIN_CONFIG = {
  mainnet: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/',
  },
} as const;

/**
 * Wallet Connector
 *
 * Handles wallet connections (MetaMask, etc.) for transaction signing.
 *
 * Note: MetaMask uses secp256k1 for transaction signing, which is allowed
 * for wallet authentication only. Quantum Shield internal signatures use
 * Dilithium (FIPS 204 ML-DSA-65).
 *
 * @example
 * ```typescript
 * const wallet = new WalletConnector();
 *
 * // Listen for events
 * wallet.onEvent((event) => {
 *   console.log('Wallet event:', event);
 * });
 *
 * // Connect
 * const state = await wallet.connect();
 * console.log('Connected:', state.address);
 * ```
 */
export class WalletConnector {
  private state: WalletState = {
    connected: false,
    address: null,
    chainId: null,
    provider: null,
    signer: null,
  };

  private listeners: Set<WalletEventListener> = new Set();
  private ethereum: typeof window.ethereum | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.ethereum) {
      this.ethereum = window.ethereum;
      this.setupEventListeners();
    }
  }

  /**
   * Set up wallet event listeners
   */
  private setupEventListeners(): void {
    if (!this.ethereum) return;

    this.ethereum.on('accountsChanged', (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.state.address = accounts[0];
        this.emit({ type: 'accountsChanged', accounts });
      }
    });

    this.ethereum.on('chainChanged', (...args: unknown[]) => {
      const chainIdHex = args[0] as string;
      const chainId = parseInt(chainIdHex, 16);
      this.state.chainId = chainId;
      this.emit({ type: 'chainChanged', chainId });
    });

    this.ethereum.on('disconnect', () => {
      this.disconnect();
    });
  }

  /**
   * Emit event to listeners
   */
  private emit(event: WalletEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Check if wallet is available
   */
  isAvailable(): boolean {
    return this.ethereum !== null;
  }

  /**
   * Check if MetaMask specifically
   */
  isMetaMask(): boolean {
    return this.ethereum?.isMetaMask ?? false;
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Add event listener
   */
  onEvent(listener: WalletEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Connect wallet
   *
   * @returns Wallet state after connection
   */
  async connect(): Promise<WalletState> {
    if (!this.ethereum) {
      throw new Error('No wallet found. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainIdHex = await this.ethereum.request({
        method: 'eth_chainId',
      }) as string;
      const chainId = parseInt(chainIdHex, 16);

      // Create provider and signer
      const provider = new ethers.BrowserProvider(this.ethereum);
      const signer = await provider.getSigner();

      // Update state
      this.state = {
        connected: true,
        address: accounts[0],
        chainId,
        provider,
        signer,
      };

      this.emit({ type: 'connected', address: accounts[0], chainId });

      return this.getState();
    } catch (error) {
      throw new Error(
        `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.state = {
      connected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
    };
    this.emit({ type: 'disconnected' });
  }

  /**
   * Get connected address
   */
  getAddress(): string | null {
    return this.state.address;
  }

  /**
   * Get chain ID
   */
  getChainId(): number | null {
    return this.state.chainId;
  }

  /**
   * Get signer
   */
  getSigner(): ethers.Signer | null {
    return this.state.signer;
  }

  /**
   * Get provider
   */
  getProvider(): ethers.BrowserProvider | null {
    return this.state.provider;
  }

  /**
   * Switch to a specific chain
   *
   * @param chainId - Target chain ID
   */
  async switchChain(chainId: number): Promise<void> {
    if (!this.ethereum) {
      throw new Error('No wallet found');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: unknown) {
      // Chain not added, try to add it
      if ((error as { code?: number }).code === 4902) {
        await this.addChain(chainId);
      } else {
        throw error;
      }
    }
  }

  /**
   * Add a chain to wallet
   */
  private async addChain(chainId: number): Promise<void> {
    if (!this.ethereum) {
      throw new Error('No wallet found');
    }

    const config = Object.values(CHAIN_CONFIG).find((c) => c.chainId === chainId);
    if (!config) {
      throw new Error(`Unknown chain ID: ${chainId}`);
    }

    await this.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainId.toString(16)}`,
          chainName: config.name,
          rpcUrls: [config.rpcUrl],
        },
      ],
    });
  }

  /**
   * Sign a message (for authentication, not Dilithium)
   *
   * Note: This uses secp256k1 (MetaMask), which is allowed for
   * wallet authentication only. Quantum Shield signatures use Dilithium.
   *
   * @param message - Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    if (!this.state.signer) {
      throw new Error('Wallet not connected');
    }

    return this.state.signer.signMessage(message);
  }

  /**
   * Send transaction
   *
   * @param transaction - Transaction data
   * @returns Transaction response
   */
  async sendTransaction(
    transaction: ethers.TransactionRequest
  ): Promise<ethers.TransactionResponse> {
    if (!this.state.signer) {
      throw new Error('Wallet not connected');
    }

    return this.state.signer.sendTransaction(transaction);
  }

  /**
   * Get ETH balance
   *
   * @param address - Address to check (defaults to connected address)
   * @returns Balance in wei
   */
  async getBalance(address?: string): Promise<bigint> {
    if (!this.state.provider) {
      throw new Error('Wallet not connected');
    }

    const targetAddress = address ?? this.state.address;
    if (!targetAddress) {
      throw new Error('No address specified');
    }

    return this.state.provider.getBalance(targetAddress);
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
