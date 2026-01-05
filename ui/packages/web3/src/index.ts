// Config
export { wagmiConfig, chains } from './config/wagmi';
export { CHAIN_IDS, SUPPORTED_CHAINS, getChainConfig } from './config/chains';

// Providers
export { Web3Provider } from './providers/web3-provider';

// Hooks
export { useSIWE, type SIWESession } from './hooks/use-siwe';
export { useQSLock } from './hooks/use-qs-lock';
export { useQSUnlock } from './hooks/use-qs-unlock';
export { useQSStatus } from './hooks/use-qs-status';

// Contracts
export { QS_VAULT_ABI, QS_VAULT_ADDRESS } from './contracts/qs-vault';
export { QS_STAKING_ABI, QS_STAKING_ADDRESS } from './contracts/qs-staking';
