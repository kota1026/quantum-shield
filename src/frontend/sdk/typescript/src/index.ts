/**
 * Quantum Shield TypeScript SDK
 *
 * Post-quantum secure bridge SDK for Ethereum
 *
 * @packageDocumentation
 */

export { QuantumShieldClient, type QuantumShieldConfig } from './client';
export { DilithiumCrypto, type DilithiumKeyPair, type VerificationResult } from './crypto';
export { WalletConnector, type WalletState } from './wallet';
export {
  AuthClient,
  type AuthClientConfig,
  type AuthState,
  type SIWEMessage,
} from './auth';
export * from './types';
