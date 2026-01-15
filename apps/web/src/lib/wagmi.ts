import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

// Quantum Shield Wagmi Configuration
export const config = getDefaultConfig({
  appName: 'Quantum Shield',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'quantum-shield-dev',
  chains: [
    mainnet,
    ...(process.env.NODE_ENV === 'development' ? [sepolia] : []),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

// Export chains for use in components
export const supportedChains = config.chains;
