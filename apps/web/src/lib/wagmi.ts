import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// RPC endpoints for reliable connections
// In production, these should be set via environment variables
const MAINNET_RPC = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com';
const SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

// Quantum Shield Wagmi Configuration
export const config = getDefaultConfig({
  appName: 'Quantum Shield',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'quantum-shield-dev',
  chains: [
    sepolia, // Default to Sepolia testnet for development
    ...(process.env.NODE_ENV === 'production' ? [mainnet] : []),
  ],
  transports: {
    [mainnet.id]: fallback([
      http(MAINNET_RPC),
      http(), // fallback to default
    ]),
    [sepolia.id]: fallback([
      http(SEPOLIA_RPC),
      http(), // fallback to default
    ]),
  },
  ssr: true,
});

// Export chains for use in components
export const supportedChains = config.chains;
