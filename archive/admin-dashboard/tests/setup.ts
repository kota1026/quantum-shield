import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock API handlers
export const handlers = [
  // Prover endpoints
  http.get('/api/provers', () => {
    return HttpResponse.json({
      provers: [
        {
          id: 'prover-001',
          name: 'QS Prover Alpha',
          status: 'active',
          stake: '500000',
          rewards: '12500',
          responseTime: 245,
          successRate: 99.8,
          hsmStatus: 'connected',
          registeredAt: '2025-06-15T10:00:00Z',
        },
        {
          id: 'prover-002',
          name: 'QS Prover Beta',
          status: 'pending',
          stake: '400000',
          rewards: '0',
          responseTime: 0,
          successRate: 0,
          hsmStatus: 'pending',
          registeredAt: '2026-01-05T14:30:00Z',
        },
      ],
    });
  }),

  http.post('/api/provers/register', () => {
    return HttpResponse.json({
      success: true,
      proverId: 'prover-003',
      status: 'pending',
    });
  }),

  http.post('/api/provers/:id/approve', () => {
    return HttpResponse.json({ success: true, status: 'active' });
  }),

  http.post('/api/provers/:id/reject', () => {
    return HttpResponse.json({ success: true, status: 'rejected' });
  }),

  http.get('/api/provers/:id/rewards', () => {
    return HttpResponse.json({
      totalRewards: '25000',
      pendingRewards: '2500',
      claimedRewards: '22500',
      history: [
        { date: '2026-01-04', amount: '850' },
        { date: '2026-01-03', amount: '920' },
      ],
    });
  }),

  http.post('/api/provers/:id/stake/add', () => {
    return HttpResponse.json({ success: true, newStake: '550000' });
  }),

  http.post('/api/provers/:id/stake/withdraw', () => {
    return HttpResponse.json({
      success: true,
      unbondingEnd: '2026-01-12T10:00:00Z',
      amount: '50000',
    });
  }),

  // Provider endpoints
  http.get('/api/providers', () => {
    return HttpResponse.json({
      providers: [
        {
          id: 'provider-001',
          name: 'Financial Corp',
          type: 'enterprise',
          status: 'active',
          tvl: '125000000',
          monthlyTx: 4532,
        },
      ],
    });
  }),

  http.post('/api/providers/register', () => {
    return HttpResponse.json({
      success: true,
      providerId: 'provider-002',
      status: 'pending',
    });
  }),

  http.put('/api/providers/:id/config', () => {
    return HttpResponse.json({ success: true });
  }),

  // Analytics endpoints
  http.get('/api/analytics/overview', () => {
    return HttpResponse.json({
      tvl: '850000000',
      tvlChange24h: 5.2,
      totalLocks: 15234,
      totalUnlocks: 12456,
      activeProvers: 5,
      proverPerformance: [
        { proverId: 'prover-001', successRate: 99.8, avgResponseTime: 245 },
      ],
    });
  }),

  // Emergency endpoints
  http.get('/api/system/status', () => {
    return HttpResponse.json({
      status: 'active',
      l3Nodes: [
        { id: 'node-1', status: 'healthy', blockHeight: 1234567 },
        { id: 'node-2', status: 'healthy', blockHeight: 1234567 },
        { id: 'node-3', status: 'healthy', blockHeight: 1234566 },
        { id: 'node-4', status: 'healthy', blockHeight: 1234567 },
      ],
    });
  }),

  http.post('/api/system/pause', () => {
    return HttpResponse.json({
      success: true,
      pausedAt: '2026-01-05T15:00:00Z',
      expiresAt: '2026-01-08T15:00:00Z',
    });
  }),

  http.post('/api/system/unpause', () => {
    return HttpResponse.json({ success: true });
  }),

  // Edition endpoints
  http.get('/api/edition/current', () => {
    return HttpResponse.json({
      edition: 'enterprise',
      features: {
        dedicatedNodes: true,
        slaGuarantee: true,
        prioritySupport: true,
      },
    });
  }),

  http.post('/api/edition/switch', () => {
    return HttpResponse.json({
      success: true,
      newEdition: 'decentralized',
    });
  }),
];

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());