import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../app/dashboard/page';

describe('Dashboard Page', () => {
  it('renders dashboard with wallet connected', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('L1 Sepolia')).toBeInTheDocument();
  });

  it('displays wallet balance', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    expect(screen.getByText(/1.5000 ETH/)).toBeInTheDocument();
  });

  it('shows stats cards', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Total Locked (L1)')).toBeInTheDocument();
    expect(screen.getByText('Active Locks')).toBeInTheDocument();
    expect(screen.getByText('Pending Unlocks')).toBeInTheDocument();
  });

  it('displays quick action buttons', () => {
    render(<DashboardPage />);
    
    expect(screen.getByRole('link', { name: /New Lock/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request Unlock/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Contract/i })).toBeInTheDocument();
  });

  it('links to Etherscan for contract viewing', () => {
    render(<DashboardPage />);
    
    const contractLink = screen.getByRole('link', { name: /View Contract/i });
    expect(contractLink).toHaveAttribute('href', expect.stringContaining('etherscan.io'));
    expect(contractLink).toHaveAttribute('target', '_blank');
  });

  it('shows empty state when no locks', () => {
    render(<DashboardPage />);
    
    expect(screen.getByText('Active Locks')).toBeInTheDocument();
    expect(screen.getByText(/No active locks found/)).toBeInTheDocument();
  });

  it('has Create Lock button in empty state', () => {
    render(<DashboardPage />);
    
    const createButton = screen.getAllByRole('link', { name: /Create Lock/i })[0];
    expect(createButton).toHaveAttribute('href', '/lock');
  });

  it('displays connected address', () => {
    render(<DashboardPage />);
    
    // Address should be displayed (shortened)
    expect(screen.getByText(/0xe69B/i)).toBeInTheDocument();
  });

  it('shows refresh button for locks', () => {
    render(<DashboardPage />);
    
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
  });
});

describe('Dashboard Page - Core Principles Compliance', () => {
  it('displays L1 Sepolia network indicator (transparency)', () => {
    render(<DashboardPage />);
    
    // CP-5: Transparency - Clear network indication
    expect(screen.getByText('L1 Sepolia')).toBeInTheDocument();
  });

  it('provides Etherscan link for verification (CP-5)', () => {
    render(<DashboardPage />);
    
    // CP-5: Transparency - Link to verify on-chain
    const contractLink = screen.getByRole('link', { name: /View Contract/i });
    expect(contractLink).toHaveAttribute(
      'href',
      expect.stringContaining('0xAdEB23203bf5C45e3CbD3406122aED067E41255D')
    );
  });
});
