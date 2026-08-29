# [DRAFT — ethresear.ch 投稿用 / 英語] Full FIPS 205 SLH-DSA verification on the EVM for 2.4M gas

> 投稿前 TODO: (1) リポジトリ公開後に code リンクを差す (2) ハンドルネーム/所属表記の確認 (3) 数値は全て 2026-08 実測 — 再計測不要
> 想定カテゴリ: Cryptography

---

**TL;DR** — We implemented strictly FIPS-205-conformant SLH-DSA-SHA2-128s signature verification in Solidity and measured it end to end: **2,423,441 gas per signature, 4,846,882 for a 2-of-N threshold — 16% of a 30M block, with no deviation from the standard**. Up to 11 signatures fit in one block. We believe the common assumption that on-chain post-quantum verification requires either leaving the standard or wrapping in a SNARK is wrong, and we can show where that assumption comes from.

## The assumption

The prevailing view is that hash-based signature verification is too heavy for the EVM, so you must trade something away:

- **SPHINCS−** (posted here in June) achieves an impressive 94K–142K gas — by reducing the signature budget from 2^64 to 2^14–2^20 and (in its cheapest variants) replacing the FIPS hash with KECCAK256. Excellent work, optimized for wallet-scale economics (~$0.07/verification). But it is deliberately not FIPS 205.
- **BNB Chain's research report** (May 2026) evaluated ML-DSA transaction signatures and stopped at a 40% throughput loss, framing PQ verification as a scalability problem.
- SNARK-wrapping (Groth16) is the other common answer — which reintroduces an elliptic-curve assumption into the verification path. If your threat model includes a quantum attacker, the wrap is the weakest link: the attacker forges the proof and never touches a post-quantum signature. For a PQ protocol this is self-defeating.

## Where the assumption comes from (a confession)

Our own project carried an on-chain "SPHINCS+ verifier" for months. When we finally ran a genuine, independently-generated FIPS 205 signature through it, it consumed **673,778,501 gas and reverted** — twenty-two blocks' worth. It had also silently replaced the 32-byte ADRS structure with a one-byte domain separator, so it was not FIPS 205 at all: no conforming signature could ever verify, at any gas limit.

We suspect this pattern is common. "PQ verification is too expensive on-chain" often decodes to "our implementation was wrong, and nothing ever executed it against a real signature."

## Method

Three choices made the result possible:

1. **SHA2 parameter set, not SHAKE.** The EVM has a SHA-256 precompile (0x02) and nothing for SHAKE256. FIPS 205 defines SHA2 parameter sets as first-class standard — so strict conformance and precompile-friendliness are compatible. No hash substitution needed.
2. **Reference implementation first.** We wrote a Rust reference for SLH-DSA-SHA2-128s, cross-validated against the independent RustCrypto `slh-dsa` implementation (it accepts their signatures, rejects six tamper classes). The Solidity verifier is pinned against this reference **layer by layer** — ADRS compression, F/H/T_l, H_msg (MGF1), base_2b, WOTS+ chains, FORS, XMSS, hypertree — with component test vectors, so a mismatch names the layer that broke instead of just failing a signature.
3. **Measure marginal cost, not naive cost.** A naive `abi.encodePacked` implementation costs 12,986 gas per hash call. Laying `PK.seed ‖ toByte(0,48) ‖ ADRS^c ‖ M` into scratch memory directly and reading signature elements via `calldataload` brings the marginal cost per F call to **568 gas** (intrinsic SHA-256 precompile floor at 102-byte inputs: ~290×2 blocks).

## Numbers

One SLH-DSA-SHA2-128s verification = 2,174 hash calls.

| Phase | Gas |
|---|---:|
| H_msg (MGF1-SHA-256) | 10,598 |
| FORS (182 hash calls) | 209,459 |
| Hypertree (~1,990 hash calls) | 1,646,623 |
| **Total, one signature** | **2,423,441** |
| **2-of-N threshold** | **4,846,882 (16% of a block)** |
| Max signatures per block | **11** |

For comparison we also measured the arithmetic floor of **ML-DSA-65** verification on the EVM: 27,648 multiplications mod q (95 gas each via `mulmod`) + 159 Keccak permutations ⇒ **~2.67M gas floor**. Both NIST signature families land in the same single-digit-percent-of-a-block range. (EIP-8051's proposed ML-DSA precompile at 4,500 gas would make that side ~600× cheaper still.)

## Two negative results

**Groth16 wrapping is not an option for PQ protocols.** Stated above; worth repeating because it is the default industry answer. Any classical-assumption wrap caps the whole system's quantum resistance at the wrap's.

**Lattice proof systems don't pay on-chain either.** LaBRADOR-family proofs (M-SIS, post-quantum, 58–110KB) are the algebraically natural fit for *proving* ML-DSA statements — but the verifier is linear in the statement. At 110KB the calldata alone is 1.8M gas; direct verification is 2.67M; the verifier would need to be >3× lighter than the statement it certifies to break even, which a linear verifier cannot be. Succinct proofs of PQ signatures save bandwidth, not gas. They belong off-chain (the EIP-8292 aggregator role), not in the L1 verification path.

## Implications

1. **For custody-style protocols (low-frequency, high-value operations), strict FIPS 205 on-chain verification is simply affordable today.** No signature-budget reduction, no hash substitution, no SNARK wrap, no trusted verifier set.
2. **A SLH-DSA precompile is the missing companion to EIP-8051.** Our measurements say what it would save: 2.42M → (precompile floor). We're not aware of another measured, strictly conformant SLH-DSA EVM verifier; we'd be glad to contribute this as a reference implementation and are interested in co-authoring.
3. **Crypto-agility matters more than any single number here.** Signature schemes are baked into addresses and contracts; migration is the hard problem, and cheap verification of *both* NIST families is what keeps options open.

## Limitations

Category 1 parameter set (128s) only; unaudited (differential testing against a cross-validated reference is a necessary condition, not a sufficient one); measured on a Cancun-level EVM via Foundry; single-vector families plus tamper-class tests, not a full KAT sweep on the Solidity side.

Code: [repo link — 公開後に追加]

Comments and counter-measurements welcome — especially if anyone has a cheaper strictly-conformant implementation, or reasons the marginal-cost methodology overstates/understates real calldata-heavy deployments.
