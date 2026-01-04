/**
 * Main Quantum Shield Hook
 *
 * @module useQuantumShield
 */

import { useQuantumShieldContext } from './QuantumShieldProvider';

/**
 * Main hook for Quantum Shield SDK
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     client,
 *     isInitialized,
 *     walletState,
 *     keyPair,
 *     connectWallet,
 *     generateKeyPair,
 *   } = useQuantumShield();
 *
 *   if (!isInitialized) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {!walletState.connected && (
 *         <button onClick={connectWallet}>Connect Wallet</button>
 *       )}
 *       {!keyPair && (
 *         <button onClick={generateKeyPair}>Generate Key</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useQuantumShield() {
  return useQuantumShieldContext();
}
