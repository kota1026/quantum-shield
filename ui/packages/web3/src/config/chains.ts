import { defineChain } from 'viem';
import { sepolia } from 'viem/chains';

export const CHAIN_IDS = {
  SEPOLIA: 11155111,
  AEGIS_L3: 3311155111, // Custom L3 chain ID
} as const;

// Re-export sepolia for convenience
export { sepolia };

// Aegis L3 chain definition
export const aegisL3 = defineChain({
  id: CHAIN_IDS.AEGIS_L3,
  name: 'Aegis L3',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_AEGIS_RPC_URL || 'http://localhost:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Aegis Explorer',
      url: process.env.NEXT_PUBLIC_AEGIS_EXPLORER_URL || 'http://localhost:3000',
    },
  },
  testnet: true,
});

export const SUPPORTED_CHAINS = [sepolia, aegisL3] as const;

/**
 * Get chain configuration by chain ID
 */
export function getChainConfig(chainId: number) {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId);
}

/**
 * Check if a chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some((chain) => chain.id === chainId);
}
