/**
 * Quantum Shield API Load Test (k6)
 *
 * Benchmarks backend API performance under load.
 *
 * Prerequisites:
 *   brew install k6  (macOS)
 *   Backend running on localhost:8080
 *
 * Usage:
 *   # Quick smoke test (10 VUs, 30s)
 *   k6 run src/infra/load-test/k6-api-load-test.js
 *
 *   # Full load test (100 VUs, 5 minutes)
 *   k6 run --vus 100 --duration 5m src/infra/load-test/k6-api-load-test.js
 *
 *   # With HTML report
 *   k6 run --out json=results.json src/infra/load-test/k6-api-load-test.js
 *
 * Targets (per LAUNCH_MASTER_PLAN.md Phase E):
 *   GET /v1/health:  1000 RPS, p99 < 10ms
 *   GET /v1/locks:    500 RPS, p99 < 50ms
 *   POST /v1/lock:    100 RPS, p99 < 200ms
 *   POST /v1/unlock:   50 RPS, p99 < 500ms
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthLatency = new Trend('health_latency', true);
const lockLatency = new Trend('lock_latency', true);
const explorerLatency = new Trend('explorer_latency', true);
const metricsLatency = new Trend('metrics_latency', true);

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp up
    { duration: '30s', target: 50 },   // Sustained load
    { duration: '10s', target: 100 },  // Peak
    { duration: '20s', target: 100 },  // Hold peak
    { duration: '10s', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    health_latency: ['p(99)<50'],
    explorer_latency: ['p(95)<200'],
    errors: ['rate<0.01'],  // < 1% error rate
  },
};

function hexBytes(n) {
  const chars = '0123456789abcdef';
  let result = '0x';
  for (let i = 0; i < n * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export default function () {
  // --- Health Check (lightweight, high frequency) ---
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/v1/health`);
    healthLatency.add(res.timings.duration);
    check(res, {
      'health: status 200': (r) => r.status === 200,
      'health: body contains healthy': (r) => r.body.includes('healthy'),
    }) || errorRate.add(1);
  });

  sleep(0.1);

  // --- Explorer Overview (read-heavy, common operation) ---
  group('Explorer Overview', () => {
    const res = http.get(`${BASE_URL}/v1/explorer/overview`);
    explorerLatency.add(res.timings.duration);
    check(res, {
      'explorer: status 200': (r) => r.status === 200,
      'explorer: has network data': (r) => r.body.includes('totalLocks'),
    }) || errorRate.add(1);
  });

  sleep(0.1);

  // --- Metrics Endpoint (Prometheus scraping) ---
  group('Prometheus Metrics', () => {
    const res = http.get(`${BASE_URL}/v1/metrics`);
    metricsLatency.add(res.timings.duration);
    check(res, {
      'metrics: status 200': (r) => r.status === 200,
      'metrics: prometheus format': (r) => r.body.includes('qs_total_locks'),
    }) || errorRate.add(1);
  });

  sleep(0.1);

  // --- Lock Creation (write, 1 in 10 iterations) ---
  if (Math.random() < 0.1) {
    group('Lock Creation', () => {
      const payload = JSON.stringify({
        chain_id: 11155111,
        asset: 'ETH',
        amount: '100000000000000000',
        dest_addr: hexBytes(20),
        pk_dilithium: hexBytes(32),
        sig_dilithium: hexBytes(64),
        expiry: Math.floor(Date.now() / 1000) + 86400 * 7,
        nonce: Date.now() + Math.floor(Math.random() * 1000000),
      });

      const params = { headers: { 'Content-Type': 'application/json' } };
      const res = http.post(`${BASE_URL}/v1/lock`, payload, params);
      lockLatency.add(res.timings.duration);
      check(res, {
        'lock: status 200': (r) => r.status === 200,
        'lock: has lock_id': (r) => r.body.includes('lock_id'),
      }) || errorRate.add(1);
    });
  }

  // --- Explorer Locks List ---
  group('Explorer Locks', () => {
    const res = http.get(`${BASE_URL}/v1/explorer/locks`);
    check(res, {
      'locks list: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.2);

  // --- Token Hub Delegates (paginated read) ---
  group('Token Hub Delegates', () => {
    const res = http.get(`${BASE_URL}/v1/token-hub/delegates?page=1&limit=10`);
    check(res, {
      'delegates: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.1);

  // --- Governance Proposals ---
  group('Governance Proposals', () => {
    const res = http.get(`${BASE_URL}/v1/governance/proposals`);
    check(res, {
      'proposals: status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  });

  sleep(0.2);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    duration: data.state.testRunDurationMs,
    vus_max: data.metrics.vus_max ? data.metrics.vus_max.values.max : 0,
    requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
    rps: data.metrics.http_reqs ? data.metrics.http_reqs.values.rate : 0,
    p95: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0,
    p99: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'] : 0,
    error_rate: data.metrics.errors ? data.metrics.errors.values.rate : 0,
  };

  console.log('\n========================================');
  console.log('  LOAD TEST SUMMARY');
  console.log('========================================');
  console.log(`  Duration:    ${(summary.duration / 1000).toFixed(0)}s`);
  console.log(`  Max VUs:     ${summary.vus_max}`);
  console.log(`  Requests:    ${summary.requests}`);
  console.log(`  RPS:         ${summary.rps.toFixed(1)}`);
  console.log(`  p95 latency: ${summary.p95.toFixed(1)}ms`);
  console.log(`  p99 latency: ${summary.p99.toFixed(1)}ms`);
  console.log(`  Error rate:  ${(summary.error_rate * 100).toFixed(2)}%`);
  console.log('========================================');

  return {
    stdout: JSON.stringify(summary, null, 2),
  };
}
