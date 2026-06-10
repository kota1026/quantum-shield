---
agent: qs-crypto-research
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# W24 Deep-Crypto Position Paper — 2026-06-10

**Role**: primitive / verifier-construction depth. Question: audit the S0 serialization spec, rank the highest-risk pre-flight item, surface anything new since 2026-06-01.

## (a) S0 Serialization Spec Audit — Cryptographic Landmines

**Landmine 1 — Montgomery-form contamination (HIGH severity).** The kickoff plan's "canonical form mandatory before hashing" is correct policy, but Plonky3's `MontyField31` `Serialize` impl does the opposite: it serializes in Montgomery representation by default ("It's faster to Serialize and Deserialize in monty form" — Plonky3 `monty-31/src/monty_31.rs`, fetched 2026-06-10). KoalaBear is `MontyField31<KoalaBearParameters>` with `MONTY_BITS=32`, `MONTY_MU=0x81000001`. If any slop-whir code path serializes via default Serde rather than explicit `as_canonical_u32()`, it writes Montgomery form into the transcript — the Solidity verifier computes a different Keccak input and a different challenge. Silent completeness failure. **The S0 spec must require `as_canonical_u32()` before every observe, and the 20 test vectors must be generated from that explicit path, not Serde.**

**Landmine 2 — No domain separation in the transcript (MEDIUM-HIGH).** slop-whir's verifier writes config via `config.write_to_challenger()` at init, then absorbs commitments and field elements without message-type tags; the WizardOfMenlo reference has no label-based separation either. For the PQ-sound claim: (1) F-S soundness in ROM wants structurally distinct messages distinguished — separation by length only is fragile; (2) any framing divergence between KeccakIopCtx prover and Solidity verifier is silent. **The S0 spec needs a transcript message-type map (byte prefixes for root observations, OOD answers, sumcheck partial sums, PoW witnesses).** An unframed transcript is an audit finding waiting to happen.

**Landmine 3 — Rejection-sampling bias with a 31-bit prime (MEDIUM).** KoalaBear p = 0x7f000001. Taking 4 bytes mod p rejects ~50% of attempts. Standard, but the spec must pin: (i) byte grouping per attempt, (ii) max rejections before re-hash with counter, (iii) counter extension domain-separated from the next challenge call. A naive loop without a counter is grindable. **Pin an IETF-style hash-to-field construction (RFC 9380 §5.2 adapted) or specify QS's own with a security argument.** TODO[founder]: verify whether the duplex-sponge sampler in KoalaBearDegree4Duplex sidesteps this (sponges handle bias naturally) — KeccakIopCtx must match the security level explicitly.

**New requirement from upstream (March 2026 slop fix)**: "fix(WHIR): observe config at F-S instantiation, remove config field from WHIRProof struct" — KeccakIopCtx's `default_challenger()` must implement the same config-observation pattern or prover/verifier transcripts diverge. **The kickoff plan does not mention this. Add to S0's transcript-framing section.**

Spec items the plan handles correctly: 4-byte LE; `[KoalaBear;8]` digest (248 bits packed in 256); 20 differential vectors before S1/S2 code.

## (b) Highest-Risk Pre-Flight Item

**P3 (m-measurement) has the highest re-plan probability.**

| Pre-flight | Re-plan probability | Cheapest early test |
|---|---|---|
| P3: m-measurement | High — m>36 forces N reduction; m>40 misses proof-size KPI at N=64 | Run runbook now (2h, no code deps); binary result |
| P2: Theorem 4.8 Johnson bound | Medium — weakens paper claim only, not build | Read eprint 2024/1586 in browser; Loop #4 checklist |
| P4: slop-whir audit status | Medium-low — $50K if unaudited; doesn't block build | SP1 issue #2706: **still open as of 2026-06-10**, no completion announcement |
| P5: leanMultisig encoding | Medium-low — silent failure; caught by S0 vectors | leanMultisig `lib.rs` shows `pub type F = KoalaBear`, no serialization code reachable today — unresolved |
| P1: KeccakChallenger in branch | Low — none on main per Loop #4 | `gh search code` with auth (10 min) |

P3 is founder-executable now and the only pre-flight that alters S1/S2 code structure. **Run before the W25 meeting**: zero hours if caught now, 40+ if caught mid-S1.

## (c) New Signals Since 2026-06-01

- **SP1**: v6.2.3 (2026-06-01, executor serialization + Rust 1.94), v6.2.4 (2026-06-08, GPU server experimental). Neither touches slop-whir challenger/serialization. Only slop change since kickoff: June 4 veil-crate refactor. **Pin S1 to v6.2.4.** No breaking changes.
- **WizardOfMenlo/whir**: no commits since May 25. Stable; neutral.
- **Scoop risk**: eprint 403 from sandbox. Known frontier (Mithril, Hermine, THED, TALUS) is all threshold co-signing — none is on-chain batch verification acceleration. The RWC claim occupies a distinct niche. TODO[founder]: fresh eprint search for June 2026 "STARK batch ML-DSA" / "zkSNARK lattice verification" before any public priority claim.

## Top 3 Recommendations (Ranked)

1. **CRITICAL (blocks S0 completion)**: Amend the S0 spec — explicit `as_canonical_u32()` normalization, transcript message-type map, pinned hash-to-field with counter extension, and the config-observed-at-F-S-instantiation requirement. All 20 vectors generated from an implementation making these choices explicit.
2. **HIGH (before W25)**: Execute P3 m-measurement in W24. Gates the N=64 vs N=16 decision and the Q4 proof-size KPI.
3. **MEDIUM (before S1)**: Resolve P5 — pull leanMultisig's actual Solidity field arithmetic and confirm canonical vs Montgomery u32. 1-hour founder task with GitHub auth; eliminates a completeness failure mode before 120h of Solidity work.

## What I Am Not Certain About

1. leanMultisig Solidity KoalaBear encoding — actual `.sol` not reachable today; P5 unresolved.
2. Exact byte layout of slop-whir's `write_to_challenger` config framing — S0 must match exactly; unconfirmed.
3. eprint June 2026 scoop risk — unverifiable from sandbox.
4. Theorem 4.8 ProvableList vs ConjectureList — believed provable mode; founder must confirm from paper.
5. SP1 v6.2.4 internal slop-whir compatibility — no breaking change observed, pin should be confirmed at S1 entry.
