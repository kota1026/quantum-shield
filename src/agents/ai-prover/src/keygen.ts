/**
 * AI Prover Agent - Key Generation CLI
 *
 * Generates a real SLH-DSA-SHAKE-128s (NIST FIPS 205) keypair for an
 * AI Prover and prints it in shell-friendly form.
 *
 * Usage:
 *   pnpm exec tsx src/keygen.ts                 # print to stdout
 *   pnpm exec tsx src/keygen.ts --env > .env.prover1   # write env file
 *   pnpm exec tsx src/keygen.ts --json          # JSON output
 *
 * The secret key MUST be stored securely (HSM, sealed env, encrypted file).
 * In production it should never sit in a plain .env file.
 */

import 'dotenv/config';
import {
  generateSphincsKeypair,
  verifySphincsSignature,
  generateSphincsSignature,
} from './wallet.js';
import { randomBytes } from 'crypto';

interface KeygenOutput {
  ethereum_address: string;
  sphincs_public_key: string;
  sphincs_secret_key: string;
  algorithm: string;
  pk_bytes: number;
  sk_bytes: number;
  sig_bytes: number;
}

function deriveAddress(): string {
  // Address is just an identifier — the actual operator key is registered
  // separately on L1 ProverRegistry. We use random bytes here so the address
  // is locally unique without binding to any private key.
  return '0x' + randomBytes(20).toString('hex');
}

function selfTest(kp: { publicKey: string; secretKey: string }): void {
  // Pick a deterministic 32-byte test message and confirm the keypair
  // produces a verifiable signature before we hand it to the operator.
  const msg = '0x' + 'ab'.repeat(32);
  const sig = generateSphincsSignature(msg, kp.secretKey);
  if (!verifySphincsSignature(sig, msg, kp.publicKey)) {
    throw new Error(
      'Generated keypair failed self-verification. Aborting — DO NOT USE.',
    );
  }
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const asEnv = args.has('--env');
  const asJson = args.has('--json');

  process.stderr.write('Generating SLH-DSA-SHAKE-128s keypair...\n');
  const t0 = Date.now();
  const kp = generateSphincsKeypair();
  process.stderr.write(`  keygen: ${Date.now() - t0}ms\n`);

  process.stderr.write('Self-verifying keypair...\n');
  const t1 = Date.now();
  selfTest(kp);
  process.stderr.write(`  self-test ok in ${Date.now() - t1}ms\n\n`);

  const out: KeygenOutput = {
    ethereum_address: deriveAddress(),
    sphincs_public_key: kp.publicKey,
    sphincs_secret_key: kp.secretKey,
    algorithm: 'SLH-DSA-SHAKE-128s (FIPS 205)',
    pk_bytes: 32,
    sk_bytes: 64,
    sig_bytes: 7856,
  };

  if (asJson) {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
    return;
  }

  if (asEnv) {
    process.stdout.write(
      [
        '# Generated SLH-DSA-SHAKE-128s keypair for AI Prover',
        '# Algorithm: ' + out.algorithm,
        '# pk=' + out.pk_bytes + 'B sk=' + out.sk_bytes + 'B sig=' + out.sig_bytes + 'B',
        '',
        `AI_PROVER_ADDRESS=${out.ethereum_address}`,
        `PROVER_SPHINCS_PK=${out.sphincs_public_key}`,
        `PROVER_SPHINCS_SK=${out.sphincs_secret_key}`,
        '',
      ].join('\n'),
    );
    return;
  }

  // Default: human-readable, secret key only on stderr (so > file capture
  // doesn't accidentally save the secret to the wrong place).
  process.stdout.write(`Ethereum Address:  ${out.ethereum_address}\n`);
  process.stdout.write(`SPHINCS+ Pubkey:   ${out.sphincs_public_key}\n`);
  process.stderr.write(`SPHINCS+ Secret:   ${out.sphincs_secret_key}\n`);
  process.stderr.write(`(secret printed to stderr; redirect with 2> if needed)\n`);
}

main();
