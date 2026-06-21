'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
}

// Custom theme matching Quantum Shield design
const quantumShieldTheme = darkTheme({
  accentColor: '#BC002D', // hinomaru
  accentColorForeground: '#FAFAFA',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce retry attempts for failed queries (prevents error spam in dev)
        retry: 1,
        // Don't refetch on window focus in development
        refetchOnWindowFocus: false,
        // Longer stale time for mock data
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={quantumShieldTheme}
          modalSize="compact"
          coolMode
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
