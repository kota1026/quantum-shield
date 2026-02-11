/**
 * Consumer E2E Test Authentication Helper
 *
 * Uses the test wallet private key (from contracts/.env) to perform
 * real SIWE authentication against the live backend API.
 *
 * Flow:
 * 1. Generate SIWE message (EIP-4361 format)
 * 2. Sign with ECDSA using ethers.js (real cryptographic signature)
 * 3. POST to /v1/auth/siwe on live backend → get real JWT
 * 4. Inject JWT into sessionStorage (Zustand consumerAuthStore format)
 * 5. Inject window.ethereum for wagmi useAccount/useBalance UI display
 *
 * After setup, all frontend code paths are identical to production:
 * - consumerAuthStore.onRehydrate() restores JWT from sessionStorage
 * - consumerApi uses Authorization: Bearer header for all API calls
 * - All API calls go to the real backend (localhost:8080)
 */

import { ethers } from 'ethers';
import type { Page } from '@playwright/test';

// Test wallet private key from contracts/.env (Sepolia testnet)
const TEST_PRIVATE_KEY =
  '0xREDACTED_ETH_PRIVATE_KEY';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

/**
 * Perform real SIWE authentication and inject auth state into the page.
 *
 * This creates a real JWT by signing a SIWE message with the test wallet's
 * private key and sending it to the live backend API. The JWT is then
 * injected into sessionStorage so the frontend's Zustand store picks it up.
 *
 * @returns The wallet address and access token for use in test assertions
 */
export async function setupConsumerAuth(page: Page) {
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  const address = wallet.address;

  // 1. Construct SIWE message (matches frontend Login/index.tsx format)
  const nonce = Math.random().toString(36).substring(2, 15);
  const issuedAt = new Date().toISOString();
  const domain = 'localhost:3000';
  const uri = 'http://localhost:3000';
  const chainId = 11155111; // Sepolia

  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign in to Quantum Shield Consumer App',
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');

  // 2. Sign with ECDSA (ethers.js auto-adds EIP-191 prefix)
  const signature = await wallet.signMessage(message);

  // 3. Authenticate with live backend API
  const response = await fetch(`${API_BASE_URL}/v1/auth/siwe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      signature,
      public_key: address,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SIWE authentication failed (${response.status}): ${errorText}`
    );
  }

  const authData = await response.json();
  const { access_token, refresh_token, expires_at } = authData;

  // 4. Intercept API requests to the backend to ensure X-User-Address header is always present.
  //    This is necessary because the Dashboard's useEffect clears localStorage when
  //    wagmi reports isConnected=false (our window.ethereum mock isn't a full wagmi connector).
  //    By intercepting at the Playwright network layer, we guarantee the header is sent
  //    regardless of what happens in the browser's localStorage.
  //    Uses URL function matcher to only intercept backend API calls, not wagmi RPC requests.
  await page.route(
    (url) => url.origin === API_BASE_URL.replace(/\/$/, ''),
    async (route) => {
      const request = route.request();
      const headers = { ...request.headers() };
      if (!headers['x-user-address']) {
        headers['x-user-address'] = address;
      }
      await route.continue({ headers });
    }
  );

  // 5. Inject auth state into sessionStorage + window.ethereum before page loads
  await page.addInitScript(
    ({ token, refresh, expiry, addr }) => {
      // Zustand consumerAuthStore format (key: 'consumer-auth')
      sessionStorage.setItem(
        'consumer-auth',
        JSON.stringify({
          state: {
            user: { address: addr, created_at: new Date().toISOString() },
            accessToken: token,
            refreshToken: refresh,
            expiresAt: expiry,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          },
          version: 0,
        })
      );

      // Set user address in localStorage for fetchApi X-User-Address header
      localStorage.setItem('quantum_shield_user_address', addr);

      // Protect the user address key from being removed by Dashboard's useEffect
      // (wagmi reports isConnected=false → Dashboard calls clearUserAddress())
      const originalRemoveItem = localStorage.removeItem.bind(localStorage);
      localStorage.removeItem = (key: string) => {
        if (key === 'quantum_shield_user_address') return; // Prevent removal
        originalRemoveItem(key);
      };

      // EIP-1193 compatible window.ethereum for wagmi hooks (useAccount, useBalance)
      (window as any).ethereum = {
        isMetaMask: true,
        selectedAddress: addr,
        chainId: '0xaa36a7', // Sepolia
        networkVersion: '11155111',
        isConnected: () => true,
        request: async ({
          method,
        }: {
          method: string;
          params?: unknown[];
        }) => {
          switch (method) {
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [addr];
            case 'eth_chainId':
              return '0xaa36a7';
            case 'net_version':
              return '11155111';
            case 'eth_getBalance':
              return '0x8AC7230489E80000'; // 10 ETH in wei
            case 'eth_blockNumber':
              return '0x1';
            case 'eth_estimateGas':
              return '0x5208'; // 21000
            case 'eth_gasPrice':
              return '0x3B9ACA00'; // 1 gwei
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
    },
    {
      token: access_token,
      refresh: refresh_token,
      expiry: expires_at,
      addr: address,
    }
  );

  return { address, accessToken: access_token };
}

/**
 * Get the test wallet address without performing authentication.
 * Useful for tests that just need the address for assertions.
 */
export function getTestWalletAddress(): string {
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  return wallet.address;
}
