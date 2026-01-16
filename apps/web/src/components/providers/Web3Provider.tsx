'use client';

import { ReactNode, useState, useEffect } from 'react';
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
        // Disable retries to prevent error spam
        retry: false,
        // Don't refetch on window focus
        refetchOnWindowFocus: false,
        // Longer stale time for mock data
        staleTime: 1000 * 60 * 5, // 5 minutes
        // Prevent immediate garbage collection
        gcTime: 1000 * 60 * 10, // 10 minutes
        // Don't throw errors to UI
        throwOnError: false,
      },
      mutations: {
        retry: false,
        throwOnError: false,
      },
    },
  });

export function Web3Provider({ children, initialState }: Web3ProviderProps) {
  const [queryClient] = useState(createQueryClient);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Suppress connection errors in development
    if (process.env.NODE_ENV !== 'production') {
      const originalError = console.error;
      console.error = (...args) => {
        const message = args[0]?.toString() || '';
        // Suppress known Wagmi/WebSocket connection errors
        if (
          message.includes('Connection interrupted') ||
          message.includes('WebSocket') ||
          message.includes('subscription') ||
          message.includes('watchBlockNumber')
        ) {
          return;
        }
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    }
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
        <RainbowKitProvider
          theme={quantumShieldTheme}
          modalSize="compact"
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
