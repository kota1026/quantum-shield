'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface Web3ProviderProps {
  children: ReactNode;
}

// Create query client outside of component to prevent recreation
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        throwOnError: false,
      },
      mutations: {
        retry: false,
        throwOnError: false,
      },
    },
  });

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(createQueryClient);
  const [Web3Components, setWeb3Components] = useState<{
    WagmiProvider: React.ComponentType<{ config: unknown; reconnectOnMount: boolean; children: ReactNode }>;
    RainbowKitProvider: React.ComponentType<{ theme: unknown; modalSize: string; coolMode: boolean; children: ReactNode }>;
    config: unknown;
    theme: unknown;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Dynamically import wagmi and rainbowkit on client side only
    Promise.all([
      import('wagmi'),
      import('@rainbow-me/rainbowkit'),
      import('@/lib/wagmi'),
    ]).then(([wagmi, rainbowkit, wagmiConfig]) => {
      // Import CSS on client side
      // @ts-expect-error CSS modules don't have type declarations
      import('@rainbow-me/rainbowkit/styles.css');

      const theme = rainbowkit.darkTheme({
        accentColor: '#BC002D',
        accentColorForeground: '#FAFAFA',
        borderRadius: 'medium',
        fontStack: 'system',
        overlayBlur: 'small',
      });

      setWeb3Components({
        WagmiProvider: wagmi.WagmiProvider as unknown as typeof Web3Components extends null ? never : NonNullable<typeof Web3Components>['WagmiProvider'],
        RainbowKitProvider: rainbowkit.RainbowKitProvider as unknown as typeof Web3Components extends null ? never : NonNullable<typeof Web3Components>['RainbowKitProvider'],
        config: wagmiConfig.config,
        theme,
      });
    });

    // Suppress connection errors in development
    if (process.env.NODE_ENV !== 'production') {
      const originalError = console.error;
      console.error = (...args) => {
        // Skip empty objects (WalletConnect often logs {} as error)
        if (args.length === 0) return;

        // Check for empty or near-empty objects
        if (args.length === 1) {
          const arg = args[0];
          if (arg === null || arg === undefined) return;
          if (typeof arg === 'object') {
            try {
              const keys = Object.keys(arg);
              if (keys.length === 0) return;
              const str = JSON.stringify(arg);
              if (str === '{}' || str === '[]') return;
            } catch {
              // If we can't stringify, it might be a circular object - skip it
              return;
            }
          }
        }

        const message = args.map(a => {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') {
            try {
              return JSON.stringify(a);
            } catch {
              return String(a);
            }
          }
          return String(a);
        }).join(' ');

        // Suppress WalletConnect/Reown/Turbopack errors in development
        if (
          message.includes('Connection interrupted') ||
          message.includes('WebSocket') ||
          message.includes('subscription') ||
          message.includes('watchBlockNumber') ||
          message.includes('WalletConnect') ||
          message.includes('walletconnect') ||
          message.includes('projectId') ||
          message.includes('Reown') ||
          message.includes('appkit') ||
          message.includes('web3modal') ||
          message.includes('Failed to fetch remote') ||
          message.includes('Expected module to match pattern') ||
          message.includes('@walletconnect') ||
          message.includes('relay') ||
          message === '{}' ||
          message === '[]' ||
          message.trim() === ''
        ) {
          // Suppress silently
          return;
        }
        originalError.apply(console, args);
      };

      return () => {
        console.error = originalError;
      };
    }
  }, []);

  // Show loading state before mount and while loading components
  // Don't render children until WagmiProvider is available to prevent hook errors
  if (!mounted || !Web3Components) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const { WagmiProvider, RainbowKitProvider, config, theme } = Web3Components;

  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme}
          modalSize="compact"
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
