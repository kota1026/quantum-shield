'use client';

import { ReactNode, useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, State } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
  initialState?: State;
}

// Custom theme matching Quantum Shield design
const quantumShieldTheme = darkTheme({
  accentColor: '#BC002D', // hinomaru
  accentColorForeground: '#FAFAFA',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Create query client outside of component to prevent recreation
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Reduce retry attempts for failed queries (prevents error spam in dev)
        retry: 1,
        // Don't refetch on window focus in development
        refetchOnWindowFocus: false,
        // Longer stale time for mock data
        staleTime: 1000 * 60 * 5, // 5 minutes
        // Prevent immediate garbage collection
        gcTime: 1000 * 60 * 10, // 10 minutes
      },
    },
  });

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [queryClient] = useState(createQueryClient);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render children during SSR but without web3 providers to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  return (
    <WagmiProvider config={config} initialState={initialState} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <RainbowKitProvider
            theme={quantumShieldTheme}
            modalSize="compact"
            coolMode
          >
            {children}
          </RainbowKitProvider>
        </Suspense>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
