'use client';

/**
 * Test Wallet Provider
 *
 * When NEXT_PUBLIC_TEST_WALLET=true, automatically:
 * 1. Injects a mock window.ethereum (EIP-1193)
 * 2. Performs real SIWE auth against the backend with a test private key
 * 3. Injects the resulting JWT into sessionStorage
 *
 * This eliminates the need for MetaMask during development/testing.
 * The test wallet uses Anvil account #0 (well-known test key).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';

const TEST_WALLET_ENABLED = process.env.NEXT_PUBLIC_TEST_WALLET === 'true';

// Anvil account #0 — well-known test key, never use with real funds
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function performSiweAuth(): Promise<{ accessToken: string; refreshToken: string; expiresAt: number } | null> {
  try {
    // Dynamic import to avoid bundling ethers in production
    const { ethers } = await import('ethers');
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);

    const nonce = Math.random().toString(36).substring(2, 15);
    const issuedAt = new Date().toISOString();
    const domain = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const uri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    const message = [
      `${domain} wants you to sign in with your Ethereum account:`,
      wallet.address,
      '',
      'Sign in to Quantum Shield Consumer App',
      '',
      `URI: ${uri}`,
      'Version: 1',
      `Chain ID: 11155111`,
      `Nonce: ${nonce}`,
      `Issued At: ${issuedAt}`,
    ].join('\n');

    const signature = await wallet.signMessage(message);

    const response = await fetch(`${API_BASE_URL}/v1/auth/siwe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature, public_key: wallet.address }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  } catch {
    return null;
  }
}

function injectMockEthereum() {
  if (typeof window === 'undefined') return;
  if ((window as unknown as Record<string, unknown>).ethereum) return;

  (window as unknown as Record<string, unknown>).ethereum = {
    isMetaMask: true,
    selectedAddress: TEST_ADDRESS,
    chainId: '0xaa36a7',
    networkVersion: '11155111',
    isConnected: () => true,
    request: async ({ method }: { method: string }) => {
      switch (method) {
        case 'eth_accounts':
        case 'eth_requestAccounts':
          return [TEST_ADDRESS];
        case 'eth_chainId':
          return '0xaa36a7';
        case 'net_version':
          return '11155111';
        case 'eth_getBalance':
          return '0x8AC7230489E80000';
        case 'eth_blockNumber':
          return '0x1';
        case 'eth_estimateGas':
          return '0x5208';
        case 'eth_gasPrice':
          return '0x3B9ACA00';
        case 'wallet_switchEthereumChain':
          return null;
        default:
          return null;
      }
    },
    on: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    emit: () => {},
  };
}

function injectAuthState(auth: { accessToken: string; refreshToken: string; expiresAt: number }) {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem(
    'consumer-auth',
    JSON.stringify({
      state: {
        user: { address: TEST_ADDRESS, created_at: new Date().toISOString() },
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        expiresAt: auth.expiresAt,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      version: 0,
    })
  );

  localStorage.setItem('quantum_shield_user_address', TEST_ADDRESS);
}

export function TestWalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const initiated = useRef(false);

  useEffect(() => {
    if (!TEST_WALLET_ENABLED || initiated.current) return;
    initiated.current = true;

    const existing = sessionStorage.getItem('consumer-auth');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.state?.isAuthenticated && parsed.state?.accessToken) {
          injectMockEthereum();
          setStatus('ready');
          return;
        }
      } catch { /* re-auth */ }
    }

    setStatus('loading');
    injectMockEthereum();

    performSiweAuth().then((auth) => {
      if (auth) {
        injectAuthState(auth);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    });
  }, []);

  if (!TEST_WALLET_ENABLED) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {status !== 'idle' && (
        <div
          className="fixed bottom-2 right-2 z-50 px-3 py-1.5 rounded-full text-xs font-mono"
          style={{
            backgroundColor: status === 'ready' ? '#065F46' : status === 'loading' ? '#92400E' : '#991B1B',
            color: '#fff',
            opacity: 0.9,
          }}
        >
          {status === 'loading' && 'Test Wallet: connecting...'}
          {status === 'ready' && `Test Wallet: ${TEST_ADDRESS.slice(0, 6)}...${TEST_ADDRESS.slice(-4)}`}
          {status === 'error' && 'Test Wallet: auth failed'}
        </div>
      )}
    </>
  );
}
