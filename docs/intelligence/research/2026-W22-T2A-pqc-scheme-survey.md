---
date: 2026-06-01 (W22 Mon JST)
test: T2A — PQC scheme landscape survey (loop iteration #1)
status: DRAFT — loop #1 output, founder must verify primary sources before external use
charter: .claude/charter.md v1.2 §1.3 Engineering KPI floor
parent: docs/intelligence/research/2026-W22-T2-multi-platform-benchmark-plan.md
predecessors:
  - docs/intelligence/research/2026-W21-T1-sp1-results.md (2,739,124 cycles N=1)
  - docs/intelligence/research/2026-W21-T15-cycle-scaling.md (linear to N=128)
  - docs/intelligence/research/2026-W21-T1-cycle-count-context.md (comparables)
  - docs/intelligence/research/2026-06-01-W22-90day-deep-research.md (charter kill log)
loop: 1 of N
---

# T2A — PQC Scheme Survey: World's Fastest Cheapest On-Chain Verifier (Loop #1)

## 1. Executive Summary (≤ 300 words)

**Winning stack for QS to bet engineering on: SP1 v6.x (RISC-V 64-bit) + fips204 ML-DSA-65 + Plonky3 FRI over KoalaBear (BabyBear-compatible, 31-bit prime) + WHIR PCS as the outer proof commitment + Groth16 wrap for EVM on-chain verification.**

At N=1, QS already has the only public benchmark: 2,739,124 RISC-V cycles measured in T1 (sandbox, 2026-05-12). This is 49 % lighter than the Kota/sp1-ntt-gadget reference (5,625,411 cycles, SP1 4.x era) and places QS in "pre-empt" territory — no competitor has published a comparable number for ML-DSA-65 on a production zkVM. The charter §1.3 Q4 target of < 50M cycles for N=1 is already beaten by 18×.

The metric where QS is **farthest** from the §1.3 stretch target is aggregated verification gas amortized (N=64 < 20K gas/sig). The current path (Groth16 wrap of SP1 STARK, ~250K gas flat verifier) amortized over N=64 gives ~3,906 gas/sig, which clears the stretch target on paper — but only if the Groth16 wrapper's **fixed ~250K gas** is the correct verifier cost and the proof size scales sub-linearly. The real constraint is that no one has measured QS's SP1+ML-DSA-65 proof at N=64 in production; the Groth16 wrap OOM'd at 16 GB RAM and wall-clock is unknown. The 20K gas/sig stretch target is **reachable in theory** via the Groth16 path, **unproven in practice**.

The metric where QS is **closest** to the §1.3 target is SP1 cycles N=1: 2.74M vs 20M stretch target — QS is 7.3× under. This is the only QS-measured benchmark. All others are extrapolations or external comparables that need direct measurement.

---

## 2. Landscape Table

Sources: T1/T1.5 measured, ZKnox ETHDILITHIUM GitHub README (fetched 2026-06-01), ETHFALCON GitHub (fetched 2026-06-01), Succinct docs (various), Winterfell benchmark table in README, Whirlaway GitHub, Binius/Binius64 GitHub, OpenVM GitHub, Jolt GitHub, RISC Zero GitHub, Stwo GitHub, LatticeFold+ eprint 2025/247 (403 — indirect), LaBRADOR PSE GitHub (fetched), Kota Medium blog (cited in T1 context doc), Plonky3 GitHub (fetched). Multiple primary URLs returned HTTP 403 in this environment; all TODO[founder]: verify flags indicate where a primary read is needed.

Columns: Prover cycles N=1 | EC2 r6i.4xlarge wall-clock (est.) | RAM | On-chain verifier gas N=1 | Amortized gas N=64 | Proof size N=64 | Classical sec | PQ sec | License | Maturity

| # | Stack | Sig scheme | zkVM/PCS | Field/Hash | Cycles N=1 | Wall N=1 (est) | RAM | Gas N=1 | Gas/sig N=64 | Proof N=64 | Cl sec | PQ sec | License | Maturity | Source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **S1** | **QS baseline: SP1 6.1 + fips204 + Groth16** | ML-DSA-65 | SP1 STARK + Groth16 wrap | BabyBear/Poseidon2; BN254 wrap | **2,739,124** | ~3s STARK + ~20s Groth16 wrap (est.) | ≥32 GB | ~250K (Groth16 on BN254) | **~3,906** (250K/64) | **260 bytes** (Groth16, fixed) | ≥128 | STARK: ROM model; Groth16 outer: **not PQ** | Apache-2.0 (SP1), MIT (fips204) | SP1: audited (Veridise/Cantina/Zellic/KALOS); fips204: unaudited | T1 result; Kota Medium via T1 context; Succinct docs ~300K gas TODO[founder]: verify actual gas |
| **S2** | SP1 6.1 + fips204 + PLONK wrap | ML-DSA-65 | SP1 STARK + PLONK wrap | BabyBear/Poseidon2; BN254 | ~2,739,124 | ~3s STARK + ~25s wrap (est.) | ≥32 GB | ~350K (PLONK BN254, est.) | ~5,469 | 290 bytes (est.) | ≥128 | STARK: ROM; outer: not PQ | Apache-2.0 | SP1 audited; PLONK wrap unaudited for this config | Succinct docs proof types |
| **S3** | SP1 6.1 + fips204 + WHIR/KoalaBear outer verifier | ML-DSA-65 | SP1 STARK → WHIR PCS outer | KoalaBear 31-bit / Poseidon2 | ~2,739,124 | ~3s STARK; WHIR aggregation TBD | ≥32 GB | ~1.9M gas (WHIR Solidity, 100-bit, 22 vars) → <1.5M aggressive | <23,437 at 1.5M total (est.) | <100 KB (est., FRI-based) | ≥100 | **Full PQ under ROM** | Apache-2.0 (SP1), pending (Whirlaway) | SP1: audited; WHIR Solidity: shipped May 2026, unaudited | ethresear.ch /24902 (W22); Whirlaway GitHub (fetched) |
| **S4** | RISC Zero 2.x + fips204 + Groth16 | ML-DSA-65 | RISC Zero STARK + Groth16 | goldilocks/SHA2; BN254 | TODO[founder]: measure | TODO | TODO | ~250K (Groth16) | ~3,906 | 260 bytes | ≥128 | STARK: ROM; outer: not PQ | Apache-2.0 | RISC Zero: Veridise round-2 audit; fips204 port: unaudited | RISC Zero GitHub; no ML-DSA benchmark found (W22) |
| **S5** | Jolt (a16z) + fips204 + Groth16 | ML-DSA-65 | Jolt/Lasso + Groth16 | Goldilocks; BN254 | TODO[founder]: measure | TODO | TODO | ~250K | ~3,906 | 260 bytes (est.) | ≥128 | Jolt: ROM; outer: not PQ | Apache-2.0 | Jolt: alpha, not production-ready (GitHub, fetched) | Jolt GitHub; no ML-DSA benchmark found |
| **S6** | OpenVM 1.6 + fips204 | ML-DSA-65 | OpenVM STARK (STARK-based) | Various / Poseidon2 | TODO[founder]: measure | TODO | TODO | TODO | TODO | <300 KB (100-bit soundness, OpenVM blog) | ≥100 | ROM model | Apache-2.0 | OpenVM v1.6: production + Cantina audit + Lean formal verification; fips204 port: unaudited | OpenVM GitHub (fetched) |
| **S7** | Solidity direct: ZKnox ETHDILITHIUM (NIST-compat) | ML-DSA-44 | None — direct EVM | EVM word/SHA3-256 | N/A | N/A | N/A | **8,100,000** | 8,100,000 (no aggregation) | N/A | ≥128 | Classical | Not stated | Experimental, not audited | ZKnox ETHDILITHIUM GitHub (fetched) |
| **S8** | Solidity direct: ZKnox ETHDILITHIUM ETH-optimized | ML-DSA-44 | None — direct EVM | EVM word/Keccak | N/A | N/A | N/A | **4,900,000** | 4,900,000 | N/A | ≥128 | Classical (Keccak not SLH-DSA) | Not stated | Experimental, not audited | ZKnox ETHDILITHIUM GitHub (fetched) |
| **S9** | Solidity direct: ETHFALCON EVM-friendly | Falcon-512 | None — direct EVM | EVM word/Keccak | N/A | N/A | N/A | **1,500,000** | 1,500,000 | N/A | ≥128 | Classical | Not stated | Experimental, not audited ("DO NOT USE") | ETHFALCON GitHub (fetched) |
| **S10** | Solidity direct: ETHFALCON NIST-compat | Falcon-512 | None — direct EVM | EVM word/SHAKE | N/A | N/A | N/A | **3,900,000** | 3,900,000 | N/A | ≥128 | Classical | Not stated | Experimental, not audited | ETHFALCON GitHub (fetched) |
| **S11** | Solidity + EIP-8051 precompile (if Hegotá) | ML-DSA-44 | None — precompile | EVM native | N/A | N/A | N/A | **~4,500** | ~4,500 | N/A | ≥128 | Classical | N/A — EVM native | Proposed EIP, not deployed | EIP-8051 (W21 cycle count context doc); Ethereum Magicians |
| **S12** | Solidity + EIP-8052 precompile (if Hegotá) | Falcon-512 | None — precompile | EVM native | N/A | N/A | N/A | **~1,200** | ~1,200 | N/A | ≥128 | Classical | N/A | Proposed EIP, not deployed | EIP-8052 (cycle count context doc) |
| **S13** | SP1 6.1 + fips204 + Stwo/Circle STARK (exp.) | ML-DSA-65 | SP1 STARK → Circle STARK wrap | M31/Poseidon2 | ~2,739,124 inner | TBD | TBD | TBD | TBD | TBD | ≥100 | **Full PQ under ROM** | Apache-2.0 (SP1); Stwo: no license listed | SP1: audited; Stwo: production (used by SHARP), no audit listed | Stwo GitHub (fetched) |
| **S14** | Binius64 direct circuit for ML-DSA-65 | ML-DSA-65 | Binius SNARK (binary field) | GF(2^64) / GFNI | Research | Unknown | Unknown | Unknown | Unknown | Unknown | ≥128 | **Full PQ** — binary field FRI | MIT/Apache-2.0 | Not production; SHA-512 example ~130ms prove (Binius64 GitHub) | Binius64 GitHub (fetched) |
| **S15** | LaBRADOR lattice SNARK (PSE) | ML-DSA-65 (inner) | LaBRADOR (Module-SIS based) | Lattice | Research — no production impl | Unknown | Unknown | Unknown | Unknown | Unknown | ≥128 | **Full lattice PQ** (no ROM) | Unknown (research code) | Research code only (7 commits, PSE GitHub); PSE: maintenance mode | PSE LaBRADOR GitHub (fetched) |
| **S16** | LatticeFold+ (eprint 2025/247) | ML-DSA-65 (folded) | LatticeFold+ folding | Module-SIS field | Research | Unknown | Unknown | Unknown | Unknown | Unknown | ≥128 | **Full lattice PQ** | Unknown | Research only, no production code | eprint 2026/721 (403 in sandbox); W22 deep research |
| **S17** | RoKoko (eprint 2026/575) | Falcon/lattice | RoKoko PCS | Lattice | Research | Unknown | Unknown | Unknown | Unknown | ~200 KB / 100× faster than Greyhound (claimed) | ≥128 | **Full lattice PQ** | Unknown | Research only | W22 deep research (eprint ref) |
| **S18** | HAWK-based signing + SP1 verify | HAWK | SP1 STARK | BabyBear | Research | Unknown | Unknown | ~250K (Groth16) | ~3,906 | 260 bytes | ≥128 | STARK: ROM; HAWK: **broken side-channel** (eprint 2026/699) | Unknown | **BROKEN** — eprint 2026/699 reports side-channel break | W22 deep research, eprint 2026/699 |
| **S18b** | SLH-DSA-128s + SP1 verify (cold path) | SLH-DSA-128s | SP1 STARK | BabyBear | ~50M–200M (est.) | >>30s (est.) | ≥32 GB | ~250K (Groth16) | ~3,906 | 260 bytes | ≥256 | **Full hash PQ** | Apache-2.0 (SP1), Apache-2.0 (pqcrypto) | SP1: audited; fips205: unaudited | Extrapolation from SIG size (50KB), no direct measurement |
| **S19** | Groth16 wrap of direct ML-DSA-65 Solidity verifier | ML-DSA-65 | Groth16 BN254 (ZK of Solidity computation) | BN254 | N/A (no zkVM) | N/A | N/A | ~250K | ~3,906 | 260 bytes | ≥128 | BN254: not PQ | Apache-2.0 | No production implementation | Concept only |
| **S20** | SP1 + libcrux-ml-dsa (cryspen-audited) | ML-DSA-65 | SP1 STARK | BabyBear | ~2,739,124 (est. same fips204) | Same | Same | ~250K Groth16 | ~3,906 | 260 bytes | ≥128 | STARK: ROM; outer: not PQ | Apache-2.0 | libcrux: Cryspen-audited; integration: unaudited | Cryspen audit (TODO[founder]: verify SHA) |

**Notes on S3 (WHIR outer verifier):**
The 1.9M gas / <1.5M gas figures come from ethresear.ch /24902 (Tom Wambsgans, May 2026) and are for WHIR itself as a polynomial commitment verifier at 100-bit security, 22 variables. These figures are for the PCS verifier in isolation. The full system gas (SP1 inner + WHIR aggregation of N=64 verifications) would depend on how the SP1 proof is reduced to a WHIR-verifiable statement — which is the critical unknown T2.4 is designed to measure.

---

## 3. Current World Record Per §1.3 Metric

### Metric 1: ML-DSA-65 verification gas (Solidity), target < 400K / stretch < 250K

**Current public record**: No production Solidity verifier exists that verifies ML-DSA-65 within 400K gas. The ZKnox ETHDILITHIUM verifies ML-DSA-44 at 8.1M gas (NIST-compat) or 4.9M gas (ETH-optimized, Keccak-based). Both figures are for ML-DSA-44, not ML-DSA-65, which would be ~1.3–1.5× heavier due to larger keys and longer NTT polynomials (ML-DSA-65 has 256-degree vs 256-degree same ring but 4×4 matrix vs 3×4 matrix — the size difference is the k×l dimension). Source: ZKnox ETHDILITHIUM GitHub README (fetched 2026-06-01).

**Who can beat this**: EIP-8051 ML-DSA-44 precompile proposes ~4,500 gas (Ethereum Magicians, cited in T1 context doc). This is ML-DSA-44, not ML-DSA-65, and requires Hegotá adoption. EIP-7885 NTT precompile would further reduce Solidity ML-DSA cost by ~73% (cited in W22 deep research for ETHFALCON context). Neither precompile is in any scheduled fork as of ACDE #237 (2026-05-21).

**World record status**: ~4,500 gas is reachable if EIP-8051 ships. Without precompile, the 400K target requires a fundamentally different approach — either a Groth16/SNARK wrap (S1: ~250K flat) or NTT loop unrolling + packed encoding that has not been publicly benchmarked for ML-DSA-65. The 250K Groth16 gas is a flat cost independent of N, giving 3,906 gas/sig amortized at N=64.

**Confidence**: The 8.1M/4.9M ETHDILITHIUM gas is from GitHub README (directly readable). The ~250K Groth16 gas is from Succinct docs (TODO[founder]: verify — URL returned 403 in sandbox; Kota Medium cites 22s prove including Groth16 wrap without naming the gas figure; T1 context doc cites "~300K gas Groth16 verify" from `docs.succinct.xyz/docs/sp1/generating-proofs/proof-types`). Mark as **TODO[founder]: verify primary source**.

### Metric 2: ML-DSA-65 SP1 cycles (single sig N=1), target < 50M / stretch < 20M

**Current world record (QS, measured)**: **2,739,124 cycles** (T1, sandbox, SP1 6.1.0, fips204 0.4.6). Source: `docs/intelligence/research/2026-W21-T1-sp1-results.md`.

**Prior public record**: Kota / sp1-ntt-gadget: **5,625,411 cycles** (SP1 4.x era, Medium blog, cited in T1 context doc). QS is 49% lighter. No other public ML-DSA-65 SP1 measurement found in W22 search.

**QS position**: Already 7.3× under the 20M stretch target. This metric is **won** at the current SP1-level, subject to founder hardware real-prove confirmation (T1 follow-up).

**Adversarial caveat**: The cycle count uses SP1's RISC-V emulator in execute-only mode. The real prove cycle count may differ slightly (SP1 adds proving overhead, memory access table construction) but cycle count is by design hardware-independent and expected to be within ±1% of execute. The NTT gadget path (Kota) was not used; if SP1 adds a SHAKE-256 precompile syscall (currently only SHA2 and Keccak have precompiles), expect a further 30–50% reduction. Source: T1 context doc §7 item 3.

### Metric 3: Aggregated proof size (N=64), target < 200 KB / stretch < 80 KB

**Current reference**: SP1 Groth16 wrap proof size is **260 bytes** (Kota Medium, SP1 4.x, cited in T1 context doc; TODO[founder]: verify on SP1 6.x). This is N-independent — the Groth16 wrapper always produces a fixed 260-byte proof regardless of how many signatures are bundled inside the STARK.

**World record context**: Winterfell STARK (Facebook, Rust): 152 KB for 1024 Lamport+ signature verifications (Winterfell README, fetched). For our purposes: 64 ML-DSA-65 verifications inside one STARK producing a 260-byte Groth16 outer proof = **260 bytes at N=64**. This trivially beats the 80 KB stretch target if the 260-byte figure is accurate.

**Critical caveat**: The 260-byte figure is for the Groth16 *outer* proof. The SP1 STARK inner proof before Groth16 compression is much larger (megabytes). What the on-chain verifier sees is only the Groth16 outer proof. The aggregation happens inside the prover, not on-chain. This means "aggregated proof size" in the §1.3 metric refers to what gets posted on-chain, which for the Groth16 path is 260 bytes (plus public inputs).

**Gap**: If the metric means the calldata posted on-chain including public inputs (N=64 message hashes + one aggregate result), the size would be 260 bytes + 32 × N bytes of public inputs. For N=64: 260 + 2048 = ~2.3 KB, which still clears the 80 KB stretch target comfortably.

**TODO[founder]: verify** — Groth16 proof size on SP1 6.x specifically, and confirm that batch verify of N=64 ML-DSA-65 sigs in one SP1 execution produces one 260-byte outer proof.

### Metric 4: Aggregated verification gas amortized (N=64), target < 50K/sig / stretch < 20K/sig

**Current estimate**: If Groth16 verifier is ~250K–300K gas flat: 250K/64 = **3,906 gas/sig**, 300K/64 = **4,687 gas/sig**. Both clear the stretch target.

**Competitor doing this**: No public competitor has measured a batch ML-DSA-65 verify in a production zkVM and published amortized gas. QS has the field to itself at the moment, but this advantage is time-limited: PSE, ZKnox, and SP1 ecosystem contributors could produce the same number.

**Critical path dependency**: The gas number depends on (a) the Groth16 verifier gas, (b) that N=64 signatures can be batched into one SP1 execution without OOM, and (c) that the proof is accepted by an EVM Groth16 verifier contract. Item (b) is the OOM risk — T1 found 16 GB insufficient for even N=1 proving. N=64 would require at minimum 64× more memory or a sharded prover. With SP1's sharded proof system, N=64 should be feasible on 64–128 GB machines (EC2 r6i.8xlarge or larger). TODO[founder]: verify actual RAM requirement for N=64 SP1 STARK proof.

**WHIR path (S3)**: If WHIR outer verifier at 1.5M gas (aggressive parameters, ethresear.ch /24902) is used instead of Groth16, and N=64 ML-DSA-65 verifications are aggregated into one WHIR proof, the amortized cost is 1.5M/64 = **23,437 gas/sig**. This clears the Q4 target (50K/sig) but not the stretch target (20K/sig). To reach 20K/sig at N=64, the WHIR verifier gas must be < 1.28M — potentially achievable with more aggressive parameters (< 1.5M is already claimed, but the exact floor is unclear).

### Metric 5: Peer-reviewed citations, target ≥ 1 by 2026-Q4

**Current state**: Zero. QS has no published academic work. IEEE S&P 2027 Cycle 1 abstract registration is 2026-06-05 (4 days from this document date); full paper deadline is 2026-06-11. This is the only near-term gating opportunity for the 2026-Q4 target. Source: W22 deep research §B+E, IEEE S&P 2027 Cycle 1 CFP.

**Adversarial risk**: QS's 2.74M cycle number, if published quickly (e.g., via IACR ePrint before IEEE S&P), is the primary quantitative claim worth citing. If another team publishes a competing benchmark first, QS loses first-mover citation opportunity. The W22 search found no competing published number for ML-DSA-65 on SP1 as of 2026-06-01.

---

## 4. The Leader Stack and Why

**QS should bet T2 engineering on: SP1 6.x + fips204 (or libcrux-ml-dsa) + Groth16 wrap for N=1 and small N; WHIR-over-KoalaBear outer aggregation for N=64 target.**

### Mathematical rationale for the component choices

**Why SP1 over RISC Zero, Jolt, OpenVM, Nexus:**

SP1 is the only zkVM where QS has a measured cycle count for ML-DSA-65, audited by four independent firms (Veridise, Cantina, Zellic, KALOS — GitHub fetched 2026-06-01), and with a published reference implementation to compare against. RISC Zero has been audited (Veridise round-2, per system prompt), but no ML-DSA-65 cycle count is published and the `no_std` path for fips204 is unverified. Jolt is in alpha and explicitly not production-ready (GitHub fetched). OpenVM v1.6 is production-ready with Cantina audit + Lean formal verification (fetched 2026-06-01), but no ML-DSA-65 benchmark exists — making it a T2.3 spike, not a T2 lead. Nexus is experimental (fetched).

**Why fips204 over libcrux-ml-dsa:**

fips204 0.4.6 is proven to work inside SP1 (T1 result). libcrux-ml-dsa is Cryspen-audited (cited in system prompt), which is an advantage for production audit, but its `no_std` / SP1 compatibility is not verified (TODO[founder]: verify). For T2, use fips204 as the default; test libcrux-ml-dsa compatibility as a parallel spike. If libcrux-ml-dsa compiles to `riscv64im-succinct-zkvm-elf` and matches cycle count, it becomes the preferred path for audit reasons.

**Why Groth16 over PLONK or naked STARK for EVM verification:**

The Groth16 verifier on BN254 is ~250–300K gas on-chain and uses EIP-197 precompile (BN254 pairing), which is already in every EVM since Byzantium (2017). PLONK requires KZG with a trusted setup; gas is similar but less widely battle-tested for arbitrary circuits. A naked STARK on-chain (no wrap) would cost 5–15M gas (cited in system prompt). Groth16 is the cheapest current path to EVM-verifiable proofs. The PQ status of the outer layer: Groth16 over BN254 is NOT post-quantum — BN254 is a 254-bit pairing-friendly curve vulnerable to Shor's algorithm. However, the §1.3 architecture explicitly separates: the signature itself (ML-DSA-65, FIPS-compliant, PQ-secure) from the aggregation layer (Groth16, classically secure). The aggregate proof certifies that the ML-DSA-65 verifications ran correctly; the quantum adversary would need to forge a BN254 SNARK, not an ML-DSA-65 key. Whether this aggregation-layer classical security is acceptable is a design decision for the founder, not a cryptographic requirement imposed by NIST. NIST FIPS 204 governs the signature, not the proof system wrapping it.

**Why WHIR for N=64 aggregation (rather than Groth16 alone):**

The WHIR polynomial commitment scheme over a 31-bit prime field (KoalaBear or Mersenne31) achieves proof-of-proximity for a multilinear polynomial using Reed-Solomon codes and a proximity test with super-fast verification. The key property: WHIR's Solidity verifier is empirically measured at ~1.9M gas / <1.5M gas (100-bit security, 22 variables) per ethresear.ch /24902 (Tom Wambsgans, May 2026; URL 403 in sandbox, cited in W22 deep research). If N=64 ML-DSA-65 verifications can be expressed as a multilinear constraint system that WHIR proves, the on-chain cost is ~1.5M gas total, giving 23,437 gas/sig amortized — clearing the Q4 target and approaching (though not reaching) the stretch target.

The mathematical reason WHIR is attractive over FRI-based STARKs for the EVM context: WHIR achieves the smallest proof sizes and verifier complexity in the FRI/proximity-test family while using only standard hash functions (no elliptic curves, no pairings). This makes the verifier fully post-quantum under the ROM — a property Groth16 lacks. For the EVM, WHIR's Solidity verifier is about 1.5–1.9M gas vs 5–15M for a raw STARK, which is why it's emerged as the most promising PQ-compatible EVM verifier path.

**NIST compliance distinction:** ML-DSA-65 (the signature) is NIST FIPS 204 compliant. SP1 (the zkVM) is not NIST-standardized — it is a cryptographically sound, audited proof system. WHIR is not NIST-standardized — it is an academic construction (WHIR: Reed-Solomon Proximity Tests with Super-Fast Verification, eprint 2024/736, 403 in sandbox). Plonky3/KoalaBear is not NIST-standardized. The aggregation layer is QS's engineering choice; NIST compliance applies only to the signature primitive used by end users.

---

## 5. Gap Analysis

### Metric 1 — Solidity gas N=1: < 400K target / < 250K stretch

**Current**: ZKnox ETHDILITHIUM 4.9M gas (ML-DSA-44). ML-DSA-65 would be worse (~6–7M est.). Gap to 400K: **12–17×** improvement needed. Gap to 250K: **20–28×**.

**Path A (Groth16 wrap)**: ~250–300K gas flat. This clears both targets. But it is not a "Solidity verifier" in the traditional sense — it verifies an SP1 proof, not a raw signature. Caller must trust the SP1 circuit.

**Path B (Solidity optimizations only)**: ZKnox NTT loop unrolling + packed hint encoding reduces ETHDILITHIUM from 8.1M to 4.9M (1.65×). Extrapolating aggressively: another 4.9M / (number of further optimizations) → 3M (NTT precompile if EIP-7885 shipped, estimated from W22 73% reduction figure for ETHFALCON). Still far above 400K.

**Path C (EIP-8051)**: ~4,500 gas if Hegotá ships it. But EIP-8051 was absent from ACDE #237 (Glamsterdam devnet-4), making Hegotá adoption uncertain.

**Verdict**: The 400K / 250K Solidity target is only cleanly reachable via Groth16 wrap (Path A) or EIP precompile (Path C). Pure Solidity optimization (Path B) cannot reach 400K without a precompile. QS's T2.1 task should measure Path B as a baseline, then note that Path A / Path C are the actual routes to the KPI.

**Closeable in**: Path A = closeable now (measure it). Path B = not closeable without EIP precompile. Path C = dependent on Ethereum core dev timeline (Hegotá, estimated H2 2026 — uncertain).

### Metric 2 — SP1 cycles N=1: < 50M target / < 20M stretch

**Current**: 2,739,124 (QS, measured). Already 7.3× under stretch target.

**Gap**: None. Already cleared.

**Next frontier**: Can this be reduced further? The primary cost drivers in ML-DSA-65 verify are (a) NTT/INTT (polynomial multiplication in Z_q), (b) SHAKE-256 (hash expansion of the message and key), (c) polynomial arithmetic (rejection sampling is verify-side-free — only signing uses it). If SP1 adds a SHAKE-256 precompile syscall (currently SHA2 and Keccak have precompiles, SHAKE does not — per T1 context doc), expect 40–60% cycle reduction on the hash sub-path. The NTT is 31.25% of ML-DSA-44 cycles in the Saarinen analysis; on SP1 the relative weight will differ.

**Closeable in**: Already cleared for §1.3 stretch. If SP1 adds SHAKE-256 precompile, could drop to ~1.4M cycles (est.) — publishing this as a finding is the academic contribution.

### Metric 3 — Aggregated proof size N=64: < 200 KB target / < 80 KB stretch

**Current (Groth16 path)**: ~260 bytes on-chain (Groth16 proof) + 32 bytes per public input. At N=64: < 3 KB. Trivially clears 80 KB stretch.

**Current (WHIR path)**: Unknown — the Whirlaway WHIR proof size for a 22-variable polynomial is not explicitly stated in available sources. FRI-based proofs scale as O(log^2 n) in the number of queries; for 100-bit security at 22 variables, the proof size is estimated at ~10–50 KB (TODO[founder]: measure from WHIR reference implementation).

**Gap**: None on Groth16 path. Unknown on WHIR path.

**Closeable in**: Groth16 already done. WHIR requires T2.4 measurement.

### Metric 4 — Amortized gas N=64: < 50K/sig target / < 20K/sig stretch

**Current estimate (Groth16)**: 250K gas / 64 = 3,906 gas/sig. Clears stretch.

**Current estimate (WHIR)**: 1.5M gas / 64 = 23,437 gas/sig. Clears Q4 target; misses stretch.

**Gap to stretch via WHIR**: Need < 1.28M total gas for N=64. The ethresear.ch /24902 says "<1.5M gas at aggressive parameters" — unclear if there is headroom to 1.28M. This depends on WHIR parameter tuning (security bits, number of variables, folding factor). TODO[founder]: measure with Tom Wambsgans / Whirlaway reference.

**Closeable in**: Groth16 path clears stretch now (if 250K gas figure is correct). WHIR path: 6 months if T2.4 succeeds; requires upstream WHIR Solidity parameter tuning. If WHIR cannot reach 1.28M, the WHIR path achieves Q4 (< 50K/sig) but not stretch (< 20K/sig). Groth16 achieves stretch but sacrifices PQ-security of the aggregation layer.

**The fundamental tension**: The only paths that clear the 20K/sig stretch target are:
1. Groth16 wrap (~3.9K/sig) — fast, but outer proof is not PQ.
2. WHIR at aggressive parameters — PQ outer, uncertain whether 20K/sig is reachable.
3. EIP-8051 precompile + batching (~4,500 gas/sig if ML-DSA-44 precompile + some batch mechanism) — EIP-dependent.

No other public system achieves < 20K gas/sig for ML-DSA-65 aggregated on-chain verification.

### Metric 5 — Peer-reviewed citations: ≥ 1 by 2026-Q4

**Current**: Zero.

**Gap**: 1 paper required.

**Closeable in**: 4 days if IEEE S&P 2027 Cycle 1 abstract submitted 2026-06-05. Full paper 2026-06-11. Realistically 6 months if targeting Cycle 2 or RWC 2027. The T1 + T1.5 measured data (2.74M cycles, linear N-scaling) is sufficient for an academic contribution if no one else has published this.

**Risk**: If QS skips Cycle 1 deadline and a competitor (PSE, ZKnox, academic lab) publishes similar numbers first, QS loses the first-mover advantage on this specific benchmark.

---

## 6. On-Chain Implementation Plan

### 6.1 Solidity verifier file structure (leader stack: Groth16 wrap)

```
src/contracts/l1/
  pqc/
    MLDSAGroth16Verifier.sol     // SP1 Groth16 outer verifier (from Succinct SDK)
    MLDSABatchVerify.sol         // Orchestrator: accepts N (pk, msg, sig) tuples, calls prover, verifies proof
    IMLDSAVerifier.sol           // Interface: verifyBatch(bytes[] pks, bytes[] msgs, bytes[] sigs) returns (bool)
  experimental/
    ETHDilithiumFork.sol         // ZKnox ETHDILITHIUM fork for S1 Solidity benchmark (T2.1)
    WHIRVerifier.sol             // WHIR Solidity verifier (Whirlaway, T2.4)
```

The `MLDSAGroth16Verifier.sol` is generated by SP1's `cargo prove build --groth16` output (Succinct SDK provides a Solidity template). It is not hand-written. The public inputs are: (a) a hash of all (pk_i, msg_i) pairs, (b) a boolean `all_verified`. The on-chain contract checks the proof and the hash commitment, relying on the off-chain prover to have run fips204 ML-DSA-65 correctly.

### 6.2 zkVM guest program structure

```rust
// program/src/main.rs (SP1 guest, simplified)
use sp1_zkvm::io::{read, read_vec};
use fips204::ml_dsa_65::{PublicKey, Signature};

fn main() {
    let n: u32 = read();
    let mut all_ok = true;
    let mut hash_state = sha2::Sha256::new(); // or Keccak256 for EVM alignment
    for _ in 0..n {
        let pk_bytes: Vec<u8> = read_vec();
        let msg: Vec<u8> = read_vec();
        let sig_bytes: Vec<u8> = read_vec();
        // Commit (pk, msg) to hash chain for on-chain public input reconstruction
        hash_state.update(&pk_bytes);
        hash_state.update(&msg);
        let pk = PublicKey::try_from(pk_bytes.as_slice()).expect("pk parse");
        let sig = Signature::try_from(sig_bytes.as_slice()).expect("sig parse");
        all_ok &= pk.verify(&msg, &sig, b"").is_ok();
    }
    let commitment = hash_state.finalize();
    sp1_zkvm::io::commit(&commitment.as_slice());
    sp1_zkvm::io::commit(&all_ok);
}
```

The guest uses `default-features = false, features = ["ml-dsa-65"]` on fips204 (proven in T1). The hash chain construction ensures the on-chain verifier can check that the off-chain prover ran on the correct inputs without re-executing the NTTs.

### 6.3 Aggregation circuit composition (N=64)

In SP1, there is no "aggregation circuit" separate from the guest program — the guest loops over N signatures, accumulating state. This is what T1.5 measured: the program is a simple loop over N, and cycles scale linearly. For N=64 the cycle count is ~175.3M (T1.5 measurement: 175,298,745 cycles). The outer Groth16 wrap compresses the entire STARK proof (which covers all 175.3M cycles) into one 260-byte proof. There is no per-signature circuit — one circuit, one proof, N signatures processed inside.

**RAM requirement for N=64 SP1 prove**: T1 OOM'd at 16 GB for N=1. N=64 will require substantially more RAM. A rough scaling: SP1's RAM is dominated by the STARK constraint table, which scales with total cycles. 175.3M cycles vs 2.74M cycles = 64×. If N=1 requires ~16 GB (which caused OOM), N=64 may require ~64 GB RAM for native CPU prove. SP1 Hypercube (GPU cluster) distributes this across shards; for single-machine CPU prove, an EC2 r6i.8xlarge (256 GB RAM) or r6i.4xlarge (128 GB) is likely required. TODO[founder]: measure RAM at N=4, N=16, N=64 on founder hardware.

### 6.4 EVM precompile dependencies

**Groth16 path**: Depends on EIP-197 (BN254 pairing), deployed since Byzantium 2017. No new precompile needed.

**WHIR path**: Depends on SHA3-256 or Keccak256 (both EVM-native). No new precompile needed. Does NOT depend on EIP-8051, EIP-8052, or EIP-7885. The WHIR Solidity verifier uses only native EVM opcodes and keccak. This makes the WHIR path the most EVM-stable choice.

**What breaks if EIP-8051 lands (ML-DSA precompile in Hegotá)**: QS's Groth16 wrap becomes redundant for the N=1 use case (4,500 gas precompile vs 250K Groth16 wrap). The aggregation use case (N=64) may still favor the zkVM path since EIP-8051 does not batch. If EIP-8051 lands, QS should publish the comparison: precompile single-sig vs zkVM batch — QS wins on amortized batch economics.

**What breaks if EIP-2537 (BLS12-381) changes**: QS's Groth16 path uses BN254, not BLS12-381. EIP-2537 changes do not affect QS's Groth16 verifier. However, if QS ever switches to BLS12-381-based Groth16 for larger field security, EIP-2537 gas changes would matter.

**What breaks if Pectra MODEXP repricing is reverted**: MODEXP (`0x05`) is used by some Groth16 verifiers for modular exponentiation in BN254. If MODEXP gas changes, the exact gas cost of Groth16 verification on-chain changes. The Groth16 verifier generated by SP1 SDK uses EIP-197 pairing (not MODEXP directly for the core verification — BN254 pairing precompile handles the heavy lifting). TODO[founder]: check whether the SP1 Groth16 Solidity verifier uses MODEXP internally or exclusively EIP-197.

### 6.5 First Sepolia testnet deployment milestone

**Milestone T2-M1** (target: W24): Deploy `MLDSAGroth16Verifier.sol` on Sepolia. Run one on-chain verification of a real SP1 Groth16 proof of ML-DSA-65 N=1 verification. Measure gas with `eth_estimateGas`. Expected: ~250–300K gas. This is the first publicly verifiable on-chain ML-DSA-65 via zkVM proof. Commit the transaction hash as the canonical benchmark anchor.

**Milestone T2-M2** (target: W26): N=64 on-chain verification (amortized gas measurement). Requires N=64 SP1 proof generation on ≥64 GB machine. This is the load-bearing charter §1.3 validation.

---

## 7. Open Questions for Loop Iteration #2

**Q1: What is SP1's actual Groth16 verifier gas on-chain for the ML-DSA-65 circuit?**

The T1 context doc cites "~300K gas" from Succinct docs (URL 403 in sandbox). Kota Medium cites 22s prove time but not gas. The charter's amortized gas calculations rest entirely on this number. Experiment: deploy the SP1 Groth16 verifier contract on an Anvil fork of Sepolia, call it with a real proof, measure gas with `forge test --gas-report`. Cost: 2 founder hours + requires completing T1 real-prove (≥32 GB hardware). Gating decision: if gas is 250K, stretch target is reachable; if gas is > 1.28M, the stretch target via Groth16 path is not reachable.

**Q2: Can fips204 be replaced with libcrux-ml-dsa inside SP1 without cycle count regression?**

libcrux-ml-dsa is Cryspen-audited, which significantly simplifies QS's audit path. But its `no_std` compatibility with `riscv64im-succinct-zkvm-elf` has not been tested. Experiment: attempt `cargo prove build` with libcrux-ml-dsa using `default-features = false`. If it compiles, run execute to check cycle count. Cost: 4 founder hours. Gating decision: if libcrux cycles within ±10% of fips204, switch to libcrux for all future work; the audit story becomes much cleaner.

**Q3: What is the WHIR proof size and verifier gas for the specific parameter set needed to aggregate N=64 ML-DSA-65 verifications?**

The ethresear.ch /24902 gas figures (1.9M / <1.5M) are for WHIR as a PCS for a 22-variable polynomial. The ML-DSA-65 verification circuit, when compiled to WHIR's constraint system, may require different variable counts. The proof size (unknown) determines the calldata cost on-chain in addition to execution gas. Experiment: fork Whirlaway, run it on a synthetic constraint that represents N=64 ML-DSA-65 verifications, measure proof size and Solidity verify gas. Cost: 24 founder hours + $30 cloud. Gating decision: if WHIR verifier gas < 1.28M for N=64, the 20K gas/sig stretch target is achievable via PQ-outer-proof path.

**Q4: Does SP1 have a roadmap for a SHAKE-256 precompile syscall?**

ML-DSA-65's verification uses SHAKE-256 for message hashing (`H(M, ρ, ...)`) and for the challenge polynomial derivation. If SP1 adds a SHAKE-256 precompile (currently only SHA2 and Keccak are accelerated — T1 context doc), the per-verify cycle count could drop by 30–50%. Experiment: check SP1 GitHub issues/PRs for "SHAKE" or "XOF"; check SP1 precompile roadmap documentation. Cost: 1 founder hour. Gating decision: if SHAKE-256 precompile is on SP1 roadmap within 3 months, QS should target the lower cycle count for the paper rather than the current 2.74M.

**Q5: What is RISC Zero's cycle count for ML-DSA-65 verification?**

No public number exists. QS can pre-empt with a T2.2 measurement. But the value is strategic: if RISC Zero is faster (fewer cycles), QS should switch; if SP1 is faster (as expected given T1 result vs Kota's SP1 4.x number), QS confirms the benchmark advantage. Experiment: port fips204 to RISC Zero `no_std` guest (should be straightforward given RISC Zero's `no_std` support), run `risc0-zkvm execute`, record cycle count. Cost: 8 founder hours. Gating decision: if RISC Zero < 2M cycles, QS revises its stack choice; if > 2M, SP1 path confirmed.

**Q6: Is the N=64 SP1 STARK provable on a single EC2 r6i.4xlarge (128 GB RAM) or does it require r6i.8xlarge (256 GB)?**

T1 OOM'd at 16 GB for N=1. T1.5 showed cycles scale linearly (64× for N=64). RAM usage for the STARK prover does not scale exactly with cycles (it depends on shard size and memory table width). Experiment: run `cargo run --release -- --prove --n 4` on ≥32 GB hardware, note peak RSS. If RSS/verify stays constant, extrapolate to N=64. Cost: $10 cloud + 4 founder hours. Gating decision: determines minimum hardware spec for the prover node, which has direct implications for the economic model.

**Q7: Is the WHIR Solidity implementation in Whirlaway or a successor repo (leanMultisig?) production-candidate, and what is its license?**

The Whirlaway GitHub states "Development has moved to leanMultisig." If the WHIR Solidity verifier moved to a different repo, QS's T2.4 plan needs updating. Additionally, the Whirlaway license is not stated in the fetched GitHub README — for production use this matters. Experiment: visit `github.com/TomWambsgans/leanMultisig` and extract license + status. Cost: 1 founder hour. Gating decision: if license is non-commercial or incompatible with QS production, QS must implement WHIR Solidity verifier from the academic paper independently (adds 40–80 audit hours).

---

## 8. Citations

All URLs, eprint IDs, and sources used in this document:

**Internally sourced (QS repository):**
- `docs/intelligence/research/2026-W21-T1-sp1-results.md` — SP1 N=1 cycle count 2,739,124; sandbox environment; fips204 0.4.6; SP1 6.1.0
- `docs/intelligence/research/2026-W21-T15-cycle-scaling.md` — N=1..128 cycle scaling, linear within 0.19%
- `docs/intelligence/research/2026-W21-T1-cycle-count-context.md` — Kota 5,625,411 cycles; ETHDILITHIUM 8.1M/4.9M gas; ETHFALCON 1.5M/3.9M gas; EIP-8051 4,500 gas; EIP-8052 1,200 gas
- `docs/intelligence/research/2026-06-01-W22-90day-deep-research.md` — WHIR 1.9M/<1.5M gas; eprint 2026/721 LatticeFold+; eprint 2026/575 RoKoko; eprint 2026/699 HAWK break; ethresear.ch /24902; ACDE #237 PQ EIPs absent
- `.claude/charter.md v1.2` — §1.3 KPI floor; mission statement; NIST FIPS compliance rules

**Externally fetched (2026-06-01):**
- `github.com/ZKNoxHQ/ETHDILITHIUM` — 8.1M gas (NIST), 4.9M gas (ETH-optimized), ML-DSA-44, "DO NOT USE IN PRODUCTION"
- `github.com/ZKNoxHQ/ETHFALCON` — 3.9M gas (NIST), 1.5M gas (EVM-friendly), 1.6M gas (EPERVIER)
- `github.com/succinctlabs/sp1` — SP1 v6.2.2 (latest as of May 23 2026); audited by Veridise, Cantina, Zellic, KALOS
- `github.com/succinctlabs/zkvm-perf` — benchmark tooling description; no actual numbers in README
- `github.com/a16z/jolt` — "alpha, not suitable for production"; RV64IMAC; no audit; no benchmark numbers
- `github.com/risc0/risc0` — RISC-V architecture; 98-bit conjectured security; no ML-DSA benchmark
- `github.com/openvm-org/openvm` — v1.6.0 recommended for production (May 2026); Cantina audit; Lean formal verification; no ML-DSA benchmark
- `github.com/nexus-xyz/nexus-zkvm` — experimental; built with Stwo by StarkWare; no production recommendation
- `github.com/starkware-libs/stwo` — M31 field; Circle STARKs (eprint 2024/278); production-grade (SHARP usage); no completed audit listed
- `github.com/IrreducibleOSS/binius` — archived 2025-09-09; succeeded by Binius64; binary towers; not production
- `github.com/IrreducibleOSS/binius64` — GF(2^64); SHA-512 example ~130ms; MIT/Apache-2.0; no audit; Bain Capital Crypto + Paradigm backed
- `github.com/TomWambsgans/Whirlaway` — hash-based SNARK + WHIR PCS; 75K Poseidon2/s CPU (i9-12900H); 1M Poseidon2/s GPU (RTX 4090); "Development moved to leanMultisig"
- `github.com/WizardOfMenlo/whir` — WHIR reference; 100-bit security default; supported fields: Goldilocks2/3, Field192, Field256; no EVM benchmarks
- `github.com/Plonky3/Plonky3` — BabyBear, KoalaBear, Mersenne31, Goldilocks; Poseidon2/SHA3/Blake3/Monolith; audits directory present; "verifier may panic on malformed proofs"
- `github.com/privacy-scaling-explorations/labrador` — LaBRADOR lattice SNARK; C code; 7 commits; research only; no proof sizes in README; maintenance mode (system prompt)
- `github.com/facebook/winterfell` — 128-bit security STARK; 1024 Lamport+ sig verify = 152 KB proof; verify time 2–6ms; no Solidity verifier
- `github.com/ingonyama-zk/icicle` — GPU acceleration; BN254, BLS12-381, BLS12-377, BW6-761, Grumpkin, BabyBear, M31, KoalaBear; NTT + MSM accelerated

**eprint IDs (403 in sandbox — indirect via W22 deep research citations):**
- `eprint.iacr.org/2026/721` — LatticeFold+ ℓ2-norm soundness caveat (cited in W22 deep research)
- `eprint.iacr.org/2026/575` — RoKoko; ~200 KB; 100× faster than Greyhound (claimed); lattice PCS
- `eprint.iacr.org/2026/699` — HAWK side-channel break (cited in system prompt)
- `eprint.iacr.org/2026/472` — ML-DSA subkey leakage from 5,000–35,000 informative relations
- `eprint.iacr.org/2026/056` — ML-DSA key recovery in ~300 traces on ARM Cortex-M4
- `eprint.iacr.org/2024/278` — Circle STARKs (Stwo basis; fetched via Stwo GitHub reference)
- `eprint.iacr.org/2025/247` — LatticeFold+ (cited in T1 context doc and W22 deep research)
- `eprint.iacr.org/2026/814` — TSaaS Threshold ML-DSA-as-a-Service
- `eprint.iacr.org/2026/638` — THED FHE-based threshold ML-DSA

**Ethereum governance:**
- `ethereum-magicians.org/t/eip-8051-ml-dsa-verification/25857` — EIP-8051 ~4,500 gas (403 in sandbox; cited in T1 context doc)
- `ethereum-magicians.org/t/eip-8052-precompile-for-falcon-support/25860` — EIP-8052 ~1,200 gas
- `eips.ethereum.org/EIPS/eip-8141` — Frame Transaction (CFI status)
- `eips.ethereum.org/EIPS/eip-7885` — NTT precompile
- `ethresear.ch/t/evm-verification-of-whir-over-a-31-bit-field/24902` — WHIR 1.9M / <1.5M gas (403 in sandbox; cited in W22 deep research T2 plan)
- `hackmd.io/@clientsideproving/pq-snark-verifier` — PQ SNARK verifier (403 in sandbox; cited in T2 benchmark plan)
- Christine Kim ACDE #237 (2026-05-21): `christinedkim.substack.com/p/acde-237` — PQ EIPs absent from Glamsterdam devnet-4

**Other:**
- Kota Medium blog: `medium.com/@phillyj1026/building-a-zero-knowledge-verifier-for-dilithium-signatures-ntt-gadget-implementation-in-sp1-6c50ab262836` — 5,625,411 cycles; 22s prove time; 260-byte Groth16 proof (403 in sandbox; cited in T1 context doc with full detail)
- `docs.rs/sp1-ntt-gadget/latest/sp1_ntt_gadget/` — sp1-ntt-gadget (cited in T1 context)
- `benchmarks.risczero.com/main/datasheet` — RISC Zero benchmarks (403 in T1 context)
- `blog.succinct.xyz/real-time-proving-16-gpus` — SP1 Hypercube 16× RTX 5090, ~600M cycle Ethereum block in <12s
- `docs.succinct.xyz/docs/sp1/generating-proofs/proof-types` — ~300K gas Groth16 verify (TODO[founder]: verify — 403 in sandbox)

---

## What I Am Not Certain About

1. **The Groth16 on-chain gas figure**: The ~250–300K gas claim appears in T1 context doc citing `docs.succinct.xyz` (403 in sandbox). The entire amortized gas calculation for metrics 1 and 4 depends on this number. If it is wrong by 2×, the stretch target changes materially. This is the highest-priority founder verification item.

2. **Whether WHIR can handle the SP1 STARK output as its inner proof**: The S3 stack assumes that SP1's STARK proof can be "wrapped" by WHIR as an outer commitment. WHIR is a polynomial commitment scheme, not a general-purpose proof system. The connection between SP1's constraint system and WHIR's input format requires an adapter circuit. This adapter does not exist as a production library today. The 1.5M gas number from ethresear.ch /24902 is for WHIR verifying its own polynomial evaluations, not for WHIR verifying an SP1 STARK. The claim "N=64 ML-DSA sigs → one WHIR proof → 1.5M gas" requires a non-trivial engineering construction that T2.4 has not yet designed, let alone measured.

3. **LatticeFold+ (eprint 2026/721) ℓ2-norm soundness caveat**: The cited concern (W22 deep research, system prompt) is that LatticeFold+ has a soundness issue with ℓ2-norm checks. I could not fetch the paper (403). If the soundness issue is fundamental rather than parameter-dependent, LatticeFold+ cannot be used as a drop-in folding scheme for ML-DSA-65 aggregation. This needs direct paper reading by the founder.

4. **RoKoko (eprint 2026/575) "200 KB / 100× faster than Greyhound"**: The claim appears in W22 deep research but the paper returned 403. RoKoko is described as a lattice-based PCS; whether it has a production Rust implementation is unknown. If it does, it could replace WHIR as the aggregation layer with full lattice PQ-security. The 200 KB proof size at N=64 ML-DSA verifications is extrapolated — the paper may state it for a different use case.

5. **SP1 SHAKE-256 precompile status**: I know from T1 context that SHA2 and Keccak have precompiles in SP1 but SHAKE does not. Whether this is on SP1's roadmap is unknown (GitHub returned no relevant issue in the fetch). This is load-bearing for the cycle reduction estimate.

6. **RISC Zero RAM and cycle count for ML-DSA-65**: Zero public data. The comparison claimed in the T2 benchmark plan is important for credibility; without it, the SP1 claim is self-selected.

7. **Binius for ML-DSA constraints**: Binius64 operates over GF(2^64). ML-DSA-65 operates over Z_q where q = 8,380,417 (a 23-bit prime). These are different fields. Expressing ML-DSA-65 NTT arithmetic in binary field is non-trivial (requires range proofs or field embedding). The S14 entry is speculative — no paper or implementation for Binius-of-ML-DSA exists. I included it to acknowledge binary field options but QS should not plan engineering around it.

8. **HAWK side-channel break depth**: eprint 2026/699 is cited in the system prompt as "side-channel break." Whether this breaks HAWK for signing only (side-channel on the signer) or also for verification (which would affect the ZK-of-verification use case) is unclear without reading the paper. HAWK is excluded from QS's recommended stack regardless, but the nature of the break determines whether a future EVM-adapted HAWK scheme could be salvaged.
