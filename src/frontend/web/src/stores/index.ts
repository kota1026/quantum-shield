/**
 * Auth Stores - Re-exports
 */

// Consumer App Auth
export {
  useConsumerAuthStore,
  useConsumerUser,
  useIsConsumerAuthenticated,
  useConsumerAuthLoading,
  useConsumerAuthError,
} from './consumerAuthStore';

// Prover Portal Auth
export {
  useProverAuthStore,
  useProverUser,
  useIsProverAuthenticated,
  useProverAuthLoading,
  useProverAuthError,
} from './proverAuthStore';

// Observer Portal Auth
export {
  useObserverAuthStore,
  useObserverUser,
  useIsObserverAuthenticated,
  useObserverAuthLoading,
  useObserverAuthError,
} from './observerAuthStore';

// Admin Auth (if exists)
export * from './adminAuthStore';
