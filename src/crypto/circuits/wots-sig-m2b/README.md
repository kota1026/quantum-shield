# wots-sig-m2b — M2b signature-verification WOTS+ AIR (SPHINCS+-SHAKE-128s)

M2a (`../wots-link-m2a`) proved the *pk-generation form* of a WOTS+ unit:
35 chains, each running the full 15 F steps. Verification
(FIPS 205 `wots_pkFromSig`) instead runs chain k from the k-th base-w message
digit d_k up to w-2 — `w-1-d_k` F applications — recovering the pk element
from the signature element. This crate proves that form: variable-length,
message-dependent chains.

## Design

- **Digits are never taken from the prover.** The verifier derives the len1
  message digits and len2 checksum digits from the message itself
  (`wots_digits`), so a forger cannot claim smaller digits (shorter chains).
  The checksum equation is enforced by construction, not in-circuit.
- **Digit-15 chains are native checks.** A chain with d_k = w-1 performs no F
  at all, so nothing about it appears in the trace; the verifier checks
  pk_k == sig_k natively before looking at the proof.
- **The walk skips inactive chains.** M2a's one-hot "+1 shift" at chain
  boundaries becomes a jump to the publicly-derived next active chain, with
  0 as the "padding follows" sentinel on the last active chain (sound: a
  genuine successor index is always > 0). Early padding is thereby rejected.
- **Chain entry is digit-bound.** At the first trace row and at every chain
  boundary, the entered chain's step counter must equal its public digit and
  its message input M must equal its public signature element.
- **The last trace row must be padding** — otherwise a prover could end the
  trace mid-walk and leave the remaining chains' pk elements unbound. (This
  also closes a gap M2a had at dishonest trace heights; to be backported.)

All added constraints remain degree ≤ 3 (keccak-air's own budget): public
values are scalars, so one-hot-selected public combinations are degree 1 in
the trace columns.

## What is NOT yet constrained (M2c+)

- WOTS+ pk compression T_len (multi-block SHAKE256 absorption — needs XOR
  linking between permutations), FORS, and the hypertree auth paths.
- H_msg: binding the message digest itself to the signed message.
- FIPS 205 KAT (needs the full signature, M2d).

## Run

```bash
cargo run --release
```

Proves the honest witness (must accept) and 7 tampered cases (broken chain
link, wrong start digit, stop-early, overrun, skipped chain, forged sig/pk
public inputs — all must reject), plus 1 native-check rejection (digit-15
chain with pk != sig, no proof involved). Every tampered trace still contains
only valid Keccak-f permutations. FRI parameters match M0/M1/M2a
(log_blowup=3, 100 queries, 16-bit PoW, single-threaded).

Results feed `docs/core/STARK_AIR_GAP_ANALYSIS.md` §9.
