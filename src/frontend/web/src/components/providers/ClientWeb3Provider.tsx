'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

// Dynamically import Web3Provider with SSR disabled
// This prevents WalletConnect from trying to access localStorage during SSR
const Web3Provider = dynamic(
  () => import('./Web3Provider').then((mod) => mod.Web3Provider),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background">
        {/* Placeholder during loading */}
      </div>
    ),
  }
);

interface ClientWeb3ProviderProps {
  children: ReactNode;
}

export function ClientWeb3Provider({ children }: ClientWeb3ProviderProps) {
  return <Web3Provider>{children}</Web3Provider>;
}
