import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runPreflight, type PreflightResult } from './preflight.js';
import type { Config } from './config.js';

const baseConfig: Config = {
  ANTHROPIC_API_KEY: 'sk-test',
  DATABASE_URL: 'postgresql://x@localhost/x',
  L1_RPC_URL: 'http://test-rpc.local',
  L3_RPC_URL: 'http://localhost:8545',
  REPO_ROOT: '/repo',
  REPORTS_DIR: '/reports',
  HAIKU_MODEL: 'claude-haiku-4-5-20251001',
  SONNET_MODEL: 'claude-sonnet-4-6',
  AUTO_FIX: false,
};

function mockFetch(responses: Record<string, unknown>): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: { body?: string }) => {
      const body = JSON.parse(init?.body ?? '{}') as { method: string };
      const result = responses[body.method];
      if (result === undefined) {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, error: { message: 'method not stubbed' } }) };
      }
      return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result }) };
    }),
  );
}

describe('runPreflight', () => {
  let runDir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    runDir = await mkdtemp(join(tmpdir(), 'preflight-test-'));
  });

  afterEach(async () => {
    await rm(runDir, { recursive: true, force: true });
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('passes when all checks succeed', async () => {
    process.env.QS__L1_PRIVATE_KEY = 'a'.repeat(64);
    mockFetch({
      eth_chainId: '0xaa36a7',
      eth_getCode: '0x' + 'ab'.repeat(100),
    });

    const result = await runPreflight(baseConfig, runDir);

    expect(result.passed).toBe(true);
    expect(result.failed_check).toBeUndefined();
    expect(result.checks).toHaveLength(3);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it('fails on empty private key (CI secret missing — the PR #162 case)', async () => {
    process.env.QS__L1_PRIVATE_KEY = '';
    mockFetch({
      eth_chainId: '0xaa36a7',
      eth_getCode: '0x' + 'ab'.repeat(100),
    });

    const result = await runPreflight(baseConfig, runDir);

    expect(result.passed).toBe(false);
    expect(result.failed_check).toBe('l1_private_key_format');
    expect(result.checks[0]!.detail).toContain('len=0');
  });

  it('fails on malformed private key (non-hex chars)', async () => {
    process.env.QS__L1_PRIVATE_KEY = 'g'.repeat(64); // 'g' is not hex
    mockFetch({ eth_chainId: '0xaa36a7', eth_getCode: '0x' + 'ab'.repeat(100) });

    const result = await runPreflight(baseConfig, runDir);

    expect(result.passed).toBe(false);
    expect(result.failed_check).toBe('l1_private_key_format');
  });

  it('fails on wrong chain ID (RPC pointed at non-Sepolia)', async () => {
    process.env.QS__L1_PRIVATE_KEY = 'a'.repeat(64);
    mockFetch({
      eth_chainId: '0x1', // mainnet
      eth_getCode: '0x' + 'ab'.repeat(100),
    });

    const result = await runPreflight(baseConfig, runDir);

    expect(result.passed).toBe(false);
    expect(result.failed_check).toBe('l1_rpc_chain_id');
    expect(result.checks[1]!.detail).toContain('0x1');
    expect(result.checks[1]!.detail).toContain('0xaa36a7');
  });

  it('fails when vault has no bytecode (contract not deployed)', async () => {
    process.env.QS__L1_PRIVATE_KEY = 'a'.repeat(64);
    mockFetch({
      eth_chainId: '0xaa36a7',
      eth_getCode: '0x', // EOA / not deployed
    });

    const result = await runPreflight(baseConfig, runDir);

    expect(result.passed).toBe(false);
    expect(result.failed_check).toBe('l1_vault_bytecode');
  });

  it('writes preflight.json to runDir on both pass and fail', async () => {
    process.env.QS__L1_PRIVATE_KEY = '';
    mockFetch({ eth_chainId: '0xaa36a7', eth_getCode: '0x' + 'ab'.repeat(100) });

    await runPreflight(baseConfig, runDir);

    const written = JSON.parse(await readFile(join(runDir, 'preflight.json'), 'utf8')) as PreflightResult;
    expect(written.passed).toBe(false);
    expect(written.failed_check).toBe('l1_private_key_format');
  });
});
