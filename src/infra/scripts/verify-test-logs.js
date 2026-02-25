#!/usr/bin/env node
/**
 * Test Log Verification Script (Phase 8-E)
 *
 * Verifies that E2E test results match backend API logs.
 * Detects "テスト成功だが実処理なし" (test passes but no actual processing).
 *
 * ## Usage
 * ```bash
 * # Run after E2E tests
 * node scripts/verify-test-logs.js --test-output=test-results.json --api-logs=api.log
 *
 * # Or with npm script
 * npm run verify:test-logs
 * ```
 *
 * ## BE Rules Compliance
 * - BE-001: Verifies real API calls were made
 * - BE-002: No test-specific hacks
 * - BE-003: Full log analysis
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  testResultsPath: process.argv.find(a => a.startsWith('--test-output='))?.split('=')[1] || 'test-results.json',
  apiLogsPath: process.argv.find(a => a.startsWith('--api-logs='))?.split('=')[1] || 'logs/api.log',
  verbose: process.argv.includes('--verbose'),
};

// Expected API patterns per screen/action
const EXPECTED_API_PATTERNS = {
  // Dashboard
  'dashboard.load': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/dashboard\/stats/ },
    { method: 'GET', pattern: /\/api\/v1\/admin\/dashboard\/alerts/ },
    { method: 'GET', pattern: /\/api\/v1\/admin\/dashboard\/activity/ },
  ],

  // Prover Management
  'provers.list': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/provers/ },
  ],
  'provers.detail': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/provers\/[\w-]+/ },
  ],
  'provers.suspend': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/provers\/[\w-]+\/suspend/ },
  ],
  'provers.approve': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/provers\/applications\/[\w-]+\/approve/ },
  ],

  // Observer Management
  'observers.list': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/observers/ },
  ],
  'observers.detail': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/observers\/[\w-]+/ },
  ],
  'observers.suspend': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/observers\/[\w-]+\/suspend/ },
  ],

  // Treasury
  'treasury.balance': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/treasury\/balance/ },
  ],
  'treasury.withdraw': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/treasury\/withdraw/ },
    // L3 signature
    { method: 'POST', pattern: /\/api\/v1\/admin\/l3\/sign/ },
  ],
  'treasury.history': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/treasury\/withdrawals/ },
  ],

  // Emergency
  'emergency.status': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/emergency\/status/ },
  ],
  'emergency.pause': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/emergency\/pause/ },
  ],
  'emergency.resume': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/emergency\/resume/ },
  ],

  // TX Monitor
  'tx-monitor.list': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/transactions/ },
  ],
  'tx-monitor.detail': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/transactions\/[\w-]+/ },
  ],
  'tx-monitor.pending': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/transactions\/pending/ },
  ],

  // Audit
  'audit.list': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/audit/ },
  ],
  'audit.detail': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/audit\/[\w-]+/ },
  ],

  // Staff
  'staff.list': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/staff/ },
  ],
  'staff.create': [
    { method: 'POST', pattern: /\/api\/v1\/admin\/staff/ },
  ],
  'staff.update': [
    { method: 'PUT', pattern: /\/api\/v1\/admin\/staff\/[\w-]+/ },
  ],

  // Parameters
  'parameters.list': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/parameters/ },
  ],
  'parameters.update': [
    { method: 'PUT', pattern: /\/api\/v1\/admin\/parameters\/[\w-]+/ },
  ],

  // Settings
  'settings.get': [
    { method: 'GET', pattern: /\/api\/v1\/admin\/settings/ },
  ],
  'settings.update': [
    { method: 'PUT', pattern: /\/api\/v1\/admin\/settings/ },
  ],
};

// Parse API log file
function parseApiLogs(logPath) {
  if (!fs.existsSync(logPath)) {
    console.warn(`⚠️  API log file not found: ${logPath}`);
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());

  return lines.map(line => {
    try {
      // Try JSON format first
      return JSON.parse(line);
    } catch {
      // Try structured log format: [timestamp] level method url status
      const match = line.match(/\[([^\]]+)\]\s+(\w+)\s+(\w+)\s+([^\s]+)\s+(\d+)/);
      if (match) {
        return {
          timestamp: match[1],
          level: match[2],
          method: match[3],
          url: match[4],
          status: parseInt(match[5]),
        };
      }
      return null;
    }
  }).filter(Boolean);
}

// Parse test results
function parseTestResults(resultsPath) {
  if (!fs.existsSync(resultsPath)) {
    console.warn(`⚠️  Test results file not found: ${resultsPath}`);
    return { tests: [] };
  }

  const content = fs.readFileSync(resultsPath, 'utf-8');
  return JSON.parse(content);
}

// Extract action from test name
function extractAction(testName) {
  // Map test names to expected actions
  const mappings = [
    { pattern: /dashboard.*load|should load dashboard/i, action: 'dashboard.load' },
    { pattern: /prover.*list|should display prover list/i, action: 'provers.list' },
    { pattern: /prover.*detail|should display prover detail/i, action: 'provers.detail' },
    { pattern: /prover.*suspend|should suspend prover/i, action: 'provers.suspend' },
    { pattern: /prover.*approve|should approve/i, action: 'provers.approve' },
    { pattern: /observer.*list/i, action: 'observers.list' },
    { pattern: /observer.*detail/i, action: 'observers.detail' },
    { pattern: /observer.*suspend/i, action: 'observers.suspend' },
    { pattern: /treasury.*balance|should display.*balance/i, action: 'treasury.balance' },
    { pattern: /treasury.*withdraw|should.*withdraw/i, action: 'treasury.withdraw' },
    { pattern: /treasury.*history/i, action: 'treasury.history' },
    { pattern: /emergency.*status|should display emergency/i, action: 'emergency.status' },
    { pattern: /emergency.*pause/i, action: 'emergency.pause' },
    { pattern: /emergency.*resume/i, action: 'emergency.resume' },
    { pattern: /tx-monitor.*list|transaction monitor/i, action: 'tx-monitor.list' },
    { pattern: /tx-monitor.*detail|transaction detail/i, action: 'tx-monitor.detail' },
    { pattern: /tx-monitor.*pending/i, action: 'tx-monitor.pending' },
    { pattern: /audit.*list|should display audit/i, action: 'audit.list' },
    { pattern: /audit.*detail/i, action: 'audit.detail' },
    { pattern: /staff.*list|should display staff/i, action: 'staff.list' },
    { pattern: /staff.*create|add.*staff/i, action: 'staff.create' },
    { pattern: /staff.*update|edit.*staff/i, action: 'staff.update' },
    { pattern: /parameters.*list|should display parameters/i, action: 'parameters.list' },
    { pattern: /parameters.*update|edit parameter/i, action: 'parameters.update' },
    { pattern: /settings.*get|should display settings/i, action: 'settings.get' },
    { pattern: /settings.*update|save settings/i, action: 'settings.update' },
  ];

  for (const { pattern, action } of mappings) {
    if (pattern.test(testName)) {
      return action;
    }
  }

  return null;
}

// Check if API logs contain expected patterns
function verifyApiCalls(action, apiLogs, testTimeRange) {
  const expectedPatterns = EXPECTED_API_PATTERNS[action];
  if (!expectedPatterns) {
    return { verified: true, missing: [], found: [] };
  }

  const found = [];
  const missing = [];

  for (const { method, pattern } of expectedPatterns) {
    const match = apiLogs.find(log =>
      log.method === method &&
      pattern.test(log.url) &&
      isInTimeRange(log.timestamp, testTimeRange)
    );

    if (match) {
      found.push({ method, pattern: pattern.toString(), url: match.url });
    } else {
      missing.push({ method, pattern: pattern.toString() });
    }
  }

  return {
    verified: missing.length === 0,
    missing,
    found,
  };
}

// Check if timestamp is within test time range
function isInTimeRange(timestamp, timeRange) {
  if (!timeRange) return true;

  const logTime = new Date(timestamp).getTime();
  return logTime >= timeRange.start && logTime <= timeRange.end;
}

// Main verification function
function verifyTestLogs() {
  console.log('🔍 Test Log Verification (Phase 8-E)');
  console.log('=====================================\n');

  // Parse inputs
  const testResults = parseTestResults(CONFIG.testResultsPath);
  const apiLogs = parseApiLogs(CONFIG.apiLogsPath);

  console.log(`📋 Test results: ${testResults.tests?.length || 0} tests`);
  console.log(`📝 API logs: ${apiLogs.length} entries\n`);

  // Results
  const results = {
    total: 0,
    verified: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  // Process each test
  for (const test of testResults.tests || []) {
    const testName = test.title || test.name;
    const action = extractAction(testName);

    if (!action) {
      results.skipped++;
      continue;
    }

    results.total++;

    // Get test time range if available
    const timeRange = test.startTime && test.endTime ? {
      start: new Date(test.startTime).getTime(),
      end: new Date(test.endTime).getTime() + 5000, // 5s buffer
    } : null;

    // Verify API calls
    const verification = verifyApiCalls(action, apiLogs, timeRange);

    if (verification.verified) {
      results.verified++;
      if (CONFIG.verbose) {
        console.log(`✅ ${testName}`);
        verification.found.forEach(f => {
          console.log(`   ${f.method} ${f.url}`);
        });
      }
    } else {
      results.failed++;
      results.details.push({
        test: testName,
        action,
        missing: verification.missing,
        found: verification.found,
      });

      console.log(`❌ ${testName}`);
      console.log(`   Action: ${action}`);
      console.log(`   Missing API calls:`);
      verification.missing.forEach(m => {
        console.log(`     - ${m.method} ${m.pattern}`);
      });
      if (verification.found.length > 0) {
        console.log(`   Found API calls:`);
        verification.found.forEach(f => {
          console.log(`     + ${f.method} ${f.url}`);
        });
      }
      console.log('');
    }
  }

  // Summary
  console.log('\n=====================================');
  console.log('📊 Summary');
  console.log('=====================================');
  console.log(`Total tests analyzed: ${results.total}`);
  console.log(`Verified: ${results.verified} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Skipped (no action mapping): ${results.skipped}`);

  if (results.failed > 0) {
    console.log('\n⚠️  VERIFICATION FAILED');
    console.log('Some tests passed but did not trigger expected API calls.');
    console.log('This may indicate stub responses or missing backend implementation.');
    console.log('\nFailed verifications:');
    results.details.forEach(d => {
      console.log(`  - ${d.test}: missing ${d.missing.length} API calls`);
    });
    process.exit(1);
  } else if (results.verified === 0 && results.total === 0) {
    console.log('\n⚠️  No tests to verify');
    console.log('Make sure test results and API logs are available.');
  } else {
    console.log('\n✅ ALL TESTS VERIFIED');
    console.log('Backend API calls match test expectations.');
  }

  // Output JSON report
  const reportPath = 'test-verification-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run verification
verifyTestLogs();
