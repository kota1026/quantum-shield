/**
 * Smoke test: given a prover env file (PROVER_SPHINCS_PK / PROVER_SPHINCS_SK),
 * produce a real SLH-DSA-SHAKE-128s signature over the same message the
 * backend expects (SHA3_256(lockId || sr1)) and locally verify it.
 *
 * Exit code 0 = keypair is valid and interoperable.
 *
 * Usage:
 *   pnpm exec tsx src/verify-prover-secret.ts ../../../secrets/provers/prover1.env
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  computeProverMessage,
  generateSphincsSignature,
  verifySphincsSignature,
} from './wallet.js';

function parseEnvFile(p: string): Record<string, string> {
  const raw = fs.readFileSync(p, 'utf-8');
  const out: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: verify-prover-secret.ts <env-file>');
  process.exit(2);
}

const envPath = path.resolve(file);
const env = parseEnvFile(envPath);

const pk = env.PROVER_SPHINCS_PK;
const sk = env.PROVER_SPHINCS_SK;
if (!pk || !sk) {
  console.error(`${envPath}: missing PROVER_SPHINCS_PK or PROVER_SPHINCS_SK`);
  process.exit(2);
}

// Simulate a realistic unlock request — the same format the backend signs.
const lockId = '0x' + '11'.repeat(32);
const sr1 = '0x' + '22'.repeat(32);
const message = computeProverMessage(lockId, sr1);

console.log(`env file     : ${envPath}`);
console.log(`operator     : ${env.AI_PROVER_ADDRESS ?? '(none)'}`);
console.log(`public key   : ${pk}`);
console.log(`pk bytes     : ${(pk.length - 2) / 2}`);
console.log(`sk bytes     : ${(sk.length - 2) / 2}`);
console.log(`message      : ${message}`);

const t0 = Date.now();
const sig = generateSphincsSignature(message, sk);
const signMs = Date.now() - t0;

const t1 = Date.now();
const ok = verifySphincsSignature(sig, message, pk);
const verifyMs = Date.now() - t1;

console.log(`signature    : ${sig.slice(0, 34)}...${sig.slice(-16)} (${(sig.length - 2) / 2} bytes)`);
console.log(`sign time    : ${signMs}ms`);
console.log(`verify time  : ${verifyMs}ms`);
console.log(`verify ok    : ${ok ? 'YES' : 'NO'}`);

if (!ok) {
  console.error('Keypair is NOT self-consistent. Aborting.');
  process.exit(1);
}

console.log('OK — real SLH-DSA signature produces a valid verifiable proof.');
