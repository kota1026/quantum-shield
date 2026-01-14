import { createConfig, http } from 'wagmi';
import { sepolia } from 'viem/chains';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

import { aegisL3, SUPPORTED_CHAINS } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const chains = SUPPORTED_CHAINS;

export const wagmiConfig = createConfig({
  chains: [sepolia, aegisL3],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({
      appName: 'Quantum Shield',
      appLogoUrl: 'https://quantum-shield.io/logo.png',
    }),
  ],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [aegisL3.id]: http(process.env.NEXT_PUBLIC_AEGIS_RPC_URL),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
