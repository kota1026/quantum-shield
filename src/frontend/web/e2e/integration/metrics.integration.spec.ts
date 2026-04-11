/**
 * Prometheus Metrics Integration Tests (Phase D)
 *
 * Verifies that GET /v1/metrics returns valid Prometheus text format
 * with all expected business metrics and dependency health gauges.
 *
 * Prerequisites:
 * - Backend running on localhost:8080
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

test.describe('Prometheus Metrics Endpoint', () => {
  test('GET /v1/metrics returns Prometheus text format', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/metrics`);
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');

    const body = await response.text();

    // Should contain HELP and TYPE comments (Prometheus format)
    expect(body).toContain('# HELP');
    expect(body).toContain('# TYPE');

    console.log(`[Metrics] Response length: ${body.length} chars`);
  });

  test('metrics include service info', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/metrics`);
    const body = await response.text();

    expect(body).toContain('qs_info{version=');
    console.log('[Metrics] qs_info present');
  });

  test('metrics include dependency health', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/metrics`);
    const body = await response.text();

    // Dependency up/down gauges
    expect(body).toContain('qs_dependency_up{dependency="database"}');
    expect(body).toContain('qs_dependency_up{dependency="redis"}');
    expect(body).toContain('qs_dependency_up{dependency="l3"}');

    // Latency metrics
    expect(body).toContain('qs_dependency_latency_ms');

    // Parse database health — should be 1 (up)
    const dbMatch = body.match(/qs_dependency_up\{dependency="database"\}\s+(\d+)/);
    expect(dbMatch).toBeTruthy();
    expect(parseInt(dbMatch![1])).toBe(1);

    console.log('[Metrics] Dependency health gauges present, DB is up');
  });

  test('metrics include business metrics', async ({ request }) => {
    const response = await request.get(`${API_BASE}/v1/metrics`);
    const body = await response.text();

    // All business metrics should be present
    const expectedMetrics = [
      'qs_total_locks',
      'qs_pending_unlocks_count',
      'qs_active_provers',
      'qs_active_challenges',
      'qs_total_unlocks',
      'qs_governance_proposals',
    ];

    for (const metric of expectedMetrics) {
      expect(body).toContain(metric);
    }

    // Parse total_locks — should be >= 0
    const locksMatch = body.match(/qs_total_locks\s+(\d+)/);
    expect(locksMatch).toBeTruthy();
    const totalLocks = parseInt(locksMatch![1]);
    expect(totalLocks).toBeGreaterThanOrEqual(0);

    console.log(`[Metrics] Business metrics: total_locks=${totalLocks}`);
  });

  test('metrics are consistent with explorer API', async ({ request }) => {
    // Get metrics
    const metricsRes = await request.get(`${API_BASE}/v1/metrics`);
    const metricsBody = await metricsRes.text();

    // Get explorer overview
    const explorerRes = await request.get(`${API_BASE}/v1/explorer/overview`);
    const explorer = await explorerRes.json();

    // Parse metrics values
    const locksMatch = metricsBody.match(/qs_total_locks\s+(\d+)/);
    const proversMatch = metricsBody.match(/qs_active_provers\s+(\d+)/);

    if (locksMatch && explorer.network) {
      const metricsLocks = parseInt(locksMatch[1]);
      expect(metricsLocks).toBe(explorer.network.totalLocks);
      console.log(`[Consistency] Metrics locks=${metricsLocks}, Explorer locks=${explorer.network.totalLocks}`);
    }

    if (proversMatch && explorer.network) {
      const metricsProvers = parseInt(proversMatch[1]);
      expect(metricsProvers).toBe(explorer.network.activeProvers);
      console.log(`[Consistency] Metrics provers=${metricsProvers}, Explorer provers=${explorer.network.activeProvers}`);
    }
  });
});
