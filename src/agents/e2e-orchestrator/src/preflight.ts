import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Config } from './config.js';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
const DEFAULT_VAULT_ADDRESS = '0x07012aeF87C6E423c32F2f8eaF81762f63337260';

export type PreflightCheck = {
  name: string;
  passed: boolean;
  detail: string;
};

export type PreflightResult = {
  passed: boolean;
  failed_check?: string;
  checks: PreflightCheck[];
};

async function jsonRpc(url: string, method: string, params: unknown[] = []): Promise<unknown> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const body = (await res.json()) as { result?: unknown; error?: { message: string } };
  if (body.error) throw new Error(`RPC error: ${body.error.message}`);
  return body.result;
}

/**
 * Validate the infrastructure-class invariants the orchestrator depends on
 * before spending any Anthropic API tokens. Catches the failure class that
 * burned multiple full runs over PRs #160-#163: missing/malformed L1 signing
 * key, wrong RPC, vault contract not deployed at the expected address.
 *
 * Each check produces a stable name; on failure the caller writes a verdict
 * with `summary=preflight_<name>_failed` so a human reading verdict.json
 * sees the exact infra issue without hunting through stage logs.
 */
export async function runPreflight(config: Config, runDir: string): Promise<PreflightResult> {
  const checks: PreflightCheck[] = [];

  // Check 1: QS__L1_PRIVATE_KEY is present and exactly 64 hex chars (no 0x).
  // std::env::var().is_ok() returns Ok("") for an empty secret, so the
  // api-server logs "SET" while bash's [-z] correctly says "EMPTY". Catch
  // both at the source: refuse to proceed unless the key parses as 32 bytes.
  const pk = process.env.QS__L1_PRIVATE_KEY ?? '';
  const pkValid = /^[0-9a-fA-F]{64}$/.test(pk);
  checks.push({
    name: 'l1_private_key_format',
    passed: pkValid,
    detail: pkValid
      ? `len=64 hex (valid)`
      : `len=${pk.length} (expected 64 hex chars; secret is missing or malformed in the CI environment)`,
  });

  // Check 2: L1 RPC reachable AND returns Sepolia chain ID.
  // Catches: wrong RPC URL, network-down RPC provider, accidentally pointing
  // at mainnet/Anvil. Run 25267401162 hit Cloudflare 522 on rpc.sepolia.org;
  // the env var name typo in PR #160 made this invisible until #161.
  let chainOk = false;
  let chainDetail: string;
  try {
    const result = (await jsonRpc(config.L1_RPC_URL, 'eth_chainId')) as string;
    chainOk = result.toLowerCase() === SEPOLIA_CHAIN_ID;
    chainDetail = chainOk
      ? `${result} (Sepolia, via ${config.L1_RPC_URL})`
      : `got ${result}, expected ${SEPOLIA_CHAIN_ID} (Sepolia) at ${config.L1_RPC_URL}`;
  } catch (e) {
    chainDetail = `RPC unreachable at ${config.L1_RPC_URL}: ${(e as Error).message}`;
  }
  checks.push({ name: 'l1_rpc_chain_id', passed: chainOk, detail: chainDetail });

  // Check 3: Vault contract has bytecode at the configured address.
  // Guards against the address being wrong, the contract being self-destructed
  // (impossible post-Cancun for SELFDESTRUCT, but the check is cheap), or the
  // RPC node having a stale state view. eth_getCode returns "0x" for an EOA
  // or a non-existent address; a real contract returns hundreds of hex chars.
  const vault = process.env.QS__L1_VAULT_ADDRESS ?? DEFAULT_VAULT_ADDRESS;
  let vaultOk = false;
  let vaultDetail: string;
  try {
    const code = (await jsonRpc(config.L1_RPC_URL, 'eth_getCode', [vault, 'latest'])) as string;
    vaultOk = code !== '0x' && code.length > 4;
    vaultDetail = vaultOk
      ? `${code.length - 2} hex chars of bytecode at ${vault}`
      : `no bytecode at ${vault} (address is an EOA, not deployed, or RPC has stale state)`;
  } catch (e) {
    vaultDetail = `eth_getCode failed for ${vault}: ${(e as Error).message}`;
  }
  checks.push({ name: 'l1_vault_bytecode', passed: vaultOk, detail: vaultDetail });

  const failed = checks.find((c) => !c.passed);
  const result: PreflightResult = {
    passed: !failed,
    failed_check: failed?.name,
    checks,
  };

  await mkdir(runDir, { recursive: true });
  await writeFile(resolve(runDir, 'preflight.json'), JSON.stringify(result, null, 2));

  return result;
}
