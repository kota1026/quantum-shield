/**
 * Cross-language test fixture generator.
 *
 * Produces an SLH-DSA-SHAKE-128s (FIPS 205) keypair and signature from a
 * deterministic seed, so the Rust side can verify that noble's output is
 * bit-for-bit compatible with the `slh-dsa` crate's output.
 *
 * Expected property (KAT behavior): the same 48-byte seed decomposed into
 * (sk_seed[16] || sk_prf[16] || pk_seed[16]) must produce the same public
 * key in both libraries.
 *
 * Usage: pnpm exec tsx src/gen-xlang-fixture.ts
 */
import { slh_dsa_shake_128s } from '@noble/post-quantum/slh-dsa.js';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Deterministic seeds matching the Rust test in sphincs_service.rs:
//   SigningKey::slh_keygen_internal(&[1u8; 16], &[2u8; 16], &[3u8; 16])
const skSeed = new Uint8Array(16).fill(0x01);
const skPrf = new Uint8Array(16).fill(0x02);
const pkSeed = new Uint8Array(16).fill(0x03);
const seed = new Uint8Array(48);
seed.set(skSeed, 0);
seed.set(skPrf, 16);
seed.set(pkSeed, 32);

const kp = slh_dsa_shake_128s.keygen(seed);
const message = new Uint8Array(32).fill(0xab);
const sig = kp.secretKey
  ? slh_dsa_shake_128s.sign(message, kp.secretKey)
  : (() => {
      throw new Error('no secret key');
    })();

// Self-verify first (belt + braces).
if (!slh_dsa_shake_128s.verify(sig, message, kp.publicKey)) {
  throw new Error('noble self-verify failed — fixture would be useless');
}

console.log(JSON.stringify({
  library: '@noble/post-quantum slh_dsa_shake_128s',
  seed_hex: bytesToHex(seed),
  sk_seed: bytesToHex(skSeed),
  sk_prf: bytesToHex(skPrf),
  pk_seed: bytesToHex(pkSeed),
  public_key: bytesToHex(kp.publicKey),
  secret_key: bytesToHex(kp.secretKey),
  message: bytesToHex(message),
  signature: bytesToHex(sig),
  pk_bytes: kp.publicKey.length,
  sk_bytes: kp.secretKey.length,
  sig_bytes: sig.length,
}, null, 2));
