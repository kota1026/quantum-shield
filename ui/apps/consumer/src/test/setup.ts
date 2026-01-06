import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      const params: Record<string, string> = {
        amount: '1.5',
        lockId: '1',
        unlockId: '1',
      };
      return params[key] || null;
    }),
  }),
  usePathname: () => '/',
}));

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3',
    isConnected: true,
    isConnecting: false,
    isDisconnected: false,
  }),
  useBalance: () => ({
    data: {
      value: BigInt('1500000000000000000'),
      formatted: '1.5',
      symbol: 'ETH',
      decimals: 18,
    },
    isLoading: false,
  }),
  useReadContract: () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useWriteContract: () => ({
    writeContractAsync: vi.fn().mockResolvedValue('0x123'),
    isPending: false,
    data: undefined,
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
  useConnect: () => ({
    connect: vi.fn(),
    connectors: [],
    isPending: false,
  }),
  useDisconnect: () => ({
    disconnect: vi.fn(),
  }),
  WagmiProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @quantum-shield/web3
vi.mock('@quantum-shield/web3', () => ({
  useQSLock: () => ({
    lock: vi.fn().mockResolvedValue('0x123'),
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    txHash: undefined,
  }),
  useQSUnlock: () => ({
    requestUnlock: vi.fn().mockResolvedValue('0x456'),
    executeUnlock: vi.fn().mockResolvedValue('0x789'),
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    txHash: undefined,
  }),
  QS_VAULT_ADDRESS: '0xAdEB23203bf5C45e3CbD3406122aED067E41255D',
  QS_VAULT_ABI: [],
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CHAIN_ID = '11155111';
process.env.NEXT_PUBLIC_ETHERSCAN_URL = 'https://sepolia.etherscan.io';
process.env.NEXT_PUBLIC_QS_VAULT_ADDRESS = '0xAdEB23203bf5C45e3CbD3406122aED067E41255D';
process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA = 'false';

// Suppress console errors in tests
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: React does not recognize') ||
      args[0].includes('act(...)'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
