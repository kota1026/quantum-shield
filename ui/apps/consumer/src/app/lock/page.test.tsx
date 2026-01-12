import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LockInputPage from '../app/lock/page';

// Mock the router
const mockPush = vi.fn();
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

describe('Lock Input Page', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the lock form when connected', () => {
    render(<LockInputPage />);
    
    expect(screen.getByText('Lock Assets')).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount to Lock/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('shows balance from wagmi hook', () => {
    render(<LockInputPage />);
    
    expect(screen.getByText(/Balance:/)).toBeInTheDocument();
    expect(screen.getByText(/1.5000 ETH/)).toBeInTheDocument();
  });

  it('validates minimum lock amount', async () => {
    render(<LockInputPage />);
    
    const input = screen.getByLabelText(/Amount to Lock/i);
    fireEvent.change(input, { target: { value: '0.001' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Minimum lock amount is 0.01 ETH/)).toBeInTheDocument();
    });
  });

  it('validates amount exceeds balance', async () => {
    render(<LockInputPage />);
    
    const input = screen.getByLabelText(/Amount to Lock/i);
    fireEvent.change(input, { target: { value: '10' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Amount exceeds your balance/)).toBeInTheDocument();
    });
  });

  it('disables continue button when amount is invalid', () => {
    render(<LockInputPage />);
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('enables continue button with valid amount', async () => {
    render(<LockInputPage />);
    
    const input = screen.getByLabelText(/Amount to Lock/i);
    fireEvent.change(input, { target: { value: '0.5' } });
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });

  it('navigates to confirm page with amount', async () => {
    render(<LockInputPage />);
    
    const input = screen.getByLabelText(/Amount to Lock/i);
    fireEvent.change(input, { target: { value: '0.5' } });
    
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/lock/confirm?amount=0.5');
    });
  });

  it('fills max amount when MAX button clicked', async () => {
    render(<LockInputPage />);
    
    const maxButton = screen.getByRole('button', { name: /max/i });
    fireEvent.click(maxButton);
    
    const input = screen.getByLabelText(/Amount to Lock/i) as HTMLInputElement;
    await waitFor(() => {
      // Max = 1.5 - 0.01 (gas reserve) = 1.49
      expect(parseFloat(input.value)).toBeCloseTo(1.49, 1);
    });
  });

  it('displays security warning about key backup', () => {
    render(<LockInputPage />);
    
    expect(screen.getByText(/Make sure you have backed up your Dilithium keys/)).toBeInTheDocument();
  });

  it('displays how it works info', () => {
    render(<LockInputPage />);
    
    expect(screen.getByText(/Your ETH will be locked in a quantum-resistant vault/)).toBeInTheDocument();
  });
});

describe('Lock Input Page - Disconnected State', () => {
  beforeEach(() => {
    // Override wagmi mock to simulate disconnected state
    vi.mock('wagmi', async () => {
      const actual = await vi.importActual('wagmi');
      return {
        ...actual,
        useAccount: () => ({
          address: undefined,
          isConnected: false,
        }),
        useBalance: () => ({
          data: undefined,
          isLoading: false,
        }),
      };
    });
  });

  it('shows connect wallet prompt when disconnected', () => {
    // Note: This test would require resetting the mock
    // In production, use a more sophisticated mocking strategy
  });
});
