/**
 * Quantum Shield React Hooks
 *
 * @packageDocumentation
 */

export { QuantumShieldProvider, useQuantumShieldContext } from './QuantumShieldProvider';
export type { QuantumShieldContextValue, QuantumShieldProviderProps } from './QuantumShieldProvider';

export { useQuantumShield } from './useQuantumShield';
export { useLock } from './useLock';
export type { UseLockReturn } from './useLock';
export { useUnlock } from './useUnlock';
export type { UseUnlockReturn } from './useUnlock';
export { useDilithium } from './useDilithium';
export type { UseDilithiumReturn, VerificationResult, AlgorithmInfo } from './useDilithium';

// WASM utilities
export { loadWasm, isWasmLoaded, stringToHex, hexToString } from './wasm';
export type { WasmKeyPairResult, WasmVerifyResult, WasmAlgorithmInfo } from './wasm';
export { useWallet } from './useWallet';
export type { UseWalletReturn } from './useWallet';
export { useTimeLock } from './useTimeLock';
export type { UseTimeLockReturn } from './useTimeLock';
<<<<<<< HEAD
export { useChallenge, ChallengeStatus } from './useChallenge';
export type { UseChallengeReturn, ChallengeInfo, ChallengeRequest, ChallengeResponse, DefenseRequest, DefenseResponse, AutoResolveResponse, DefenseTimeRemaining } from './useChallenge';
=======
export { useAuth } from './useAuth';
export type { UseAuthReturn, UseAuthConfig, SIWEMessage, AuthState } from './useAuth';
>>>>>>> origin/claude/implement-task-p5-013-gZN8G
