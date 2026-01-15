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
  const [queryClient] = useState(() => new QueryClient());
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
