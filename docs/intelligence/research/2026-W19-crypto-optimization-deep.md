---
status: DRAFT — deep-research output from qs-crypto-research persona
date: 2026-05-09
parent: docs/intelligence/strategy/2026-W19-5-phase24-meeting.md
audience: 7-agent strategy meeting (Phase 2.5)
researcher: qs-crypto-research persona via general-purpose agent
---

# On-Chain NIST PQC Verification Optimization — Deep Research

## 1. Problem statement (technical)

The founder's reframe: *"How fast / light / cheap can NIST-certified PQC be verified ON-CHAIN on EVM?"*

Restated: given a NIST-certified PQ signature scheme S ∈ {ML-DSA-44/65/87, FN-DSA/Falcon-512, SLH-DSA-128s/f}, find verification artifact V and verifier contract C on EVM minimizing gas/sig amortized over batch size N, subject to (a) correctness, (b) latency bound for batch N, (c) preservation of S's NIST security level, (d) post-quantum soundness of the verification system itself, (e) finite, reviewable audit surface.

Three operating points QS should distinguish:

| Point | Scheme | N | Target gas/sig | Latency | Use case |
|---|---|---|---|---|---|
| **OP-1: hot path** | ML-DSA-65 / Falcon-512 | 1 | < 100k | < 1s | per-tx user signing (post EIP-8141) |
| **OP-2: medium batch** | ML-DSA-65 / Falcon-512 | 32–256 | < 10k | < 60s | rollup-style block of user txs |
| **OP-3: large batch** | ML-DSA-65 / Falcon-512 / SLH-DSA-128s | 1024–65536 | < 500 | < 10 min | validator/observer aggregation |

QS's deployed Sepolia stack (Vault `0x07012aeF…7260`, ProverRegistry `0x08e1fc1A…8946`, SPHINCSVerifier `0xD090b5A6…0103`) currently spends ~1.8M gas/sig for ML-DSA-65 in Solidity (`TODO[founder]: verify` against deployed contract) and treats SPHINCS+ as off-chain Prover-Pool co-sign because direct on-chain SPHINCS+ is prohibitive (poqeth eprint 2025/091). Today QS operates at OP-1 ≈ 1.8M gas/sig — ~20× the OP-1 target.

The narrow technical objective: move QS from 1.8M gas/sig to <10k gas/sig amortized (~180×) with NIST-aligned primitives and a finite audit surface, on a 6–8 week prototype timeline.

---

## 2. Solution-space map

Eight families of cryptographic approaches, ordered roughly by how much engineering exists today.

### 2.1 Single-sig precompile path (EIP-8051 / EIP-8052)

- **EIP-8051** (Dubois+Masson, Oct-2025 draft): `VERIFY_MLDSA` (FIPS-204 KAT, SHAKE) + `VERIFY_MLDSA_ETH` (keccak256-tuned). Per Ethereum-Magicians #25857, dominated by NTT + ~5 hash calls, **~4,500 gas** proposed (subject to benchmarking). Input ≤2,441 B, `ALG_TYPE=0xD1`. **Level II only** (= ML-DSA-44) per Phase 2.2 reading — `TODO[founder]: verify` if level III/87 added since.
- **EIP-8052** (Masson, PR #10560): two Falcon-512 precompiles (KAT-compatible + ETH-tuned). `GAS_PENALTY ≈ 3,000` proposed.
- Hard-fork target: QS internal docs say "Hegotia 2H-2026"; my searches surface **EIP-7773 Glamsterdam** as the upcoming Meta EIP. `TODO[founder]: verify` naming.
- Status: shipped + audited = **none yet**; both EIPs are spec drafts.

### 2.2 Single-sig Solidity (ETHFALCON, ETHDILITHIUM, EPERVIER)

- **ETHFALCON** (ZKNoxHQ, EF-grant 2025-02): Falcon-512 pure Solidity, **~1.5M gas** (zknox.eth.limo blog 2025-03-21). **EPERVIER** (ecrecover-shaped recovery): ~1.6M gas. `DO NOT USE IN PRODUCTION` warning persists.
- **ETHDILITHIUM** (ZKNoxHQ): ML-DSA-44 in Solidity, **~4.9M gas** per README (WebFetch 2026-05-09). `DO NOT USE IN PRODUCTION`.
- ZKNox blog 2025-02-24 reports a gen-2 result of **3.6M gas full Falcon verify** in a more recent revision — `TODO[founder]: verify` if same HEAD.
- Status: shipped + **unaudited**.

### 2.3 Single-sig zkVM proof (Architecture D's territory)

- **SP1 (Succinct)** + Groth16 wrap: **22 s prove time, 260 B proof, ~270k gas verify** for one Dilithium sig (Succinct blog "Google Uses SP1 to Prove Quantum Security Threat"; SP1 docs proof-types page). SP1 zkVM = Trail of Bits + Veridise round-2 + Nethermind+EF formal verification of RISC-V opcodes (SP1 Hypercube). **The ML-DSA app-layer circuit is NOT covered by opcode audit.** Closest public reference impl: Kota (Medium @phillyj1026) — single-sig NTT gadget, not audit-grade.
- **RISC Zero R0VM 2.0**: Veridise round 2 (2025-04, 96 person-weeks, V2 RISC-V Zirgen circuit). No public ML-DSA benchmark surfaced.
- **OpenVM 2.0 / SWIRL** (Axiom, paper 2026-01-29): post-quantum, no trusted setup, 100-bit provable, **<300 KB proof**, RISC-V 964 MHz on 64 GPUs. External review pending. No ML-DSA benchmark.
- Status: SP1 / RISC Zero zkVM-audited, app-circuit not; OpenVM external-review pending.

### 2.4 Batch ZK proof (N signatures → 1 proof) — three sub-families

(a) **Generic zkVM-style batching**: same SP1/RISC Zero/OpenVM circuit, iterating over N sigs. Per Google Q-day SP1 precedent, SP1 handles quantum-scale circuits in one proof; on-chain verify stays at ~270k gas regardless of N. Amortized = 270k/N. **At N=32: ~8,440 gas/sig; N=256: ~1,055; N=1024: ~264.** Strongest published OP-2/OP-3 numbers.

(b) **SNARK-friendly PQ signatures + native aggregation**: CAPSS (eprint 2025/061, CryptoExperts) builds sigs on arithmetization-oriented permutations (Rescue-Prime, Poseidon, Griffin, Anemoi). Anemoi instance: 128-bit security, 9.5–15.5 KB sig, 24K–35K R1CS, sub-KB amortized aggregate. Loquat (eprint 2024/868, Asiacrypt 2024): Legendre PRF, 46 KB sig, 148K R1CS, 0.21s verify, 32-sig aggregate = 197 KB / 7 min prove / 66 s verify (Aurora). **Both NOT NIST-certified** — fail the "NIST-certified" criterion unless wrapping an ML-DSA inner verify.

(c) **HAPPIER** (Springer 2026, hash-based, XMSS-flavoured, RISC Zero impl): 2–3 MB sigs, aggregates **2^16 sigs on standard laptop**. Disables Groth16 wrap to preserve end-to-end PQ. Trade-off: on-chain verify = full STARK verify (~5–15M gas no-precompile); accepting Groth16 wrap reintroduces BN254 (non-PQ) at outer layer.

Status: zkVM batching = shipped + zkVM-audited, app-circuit unaudited; CAPSS / Loquat = research + ref code; HAPPIER = research + RISC Zero impl.

### 2.5 Batch verifier tricks (Pippenger / random linear combination, applied to lattice)

For Schnorr / BLS, random-linear-combination batch verification ("Pippenger trick") gives constant-factor speedup via group-additive homomorphism on signatures. ML-DSA is **not** additively homomorphic (the rejection-sampled hint vector `h` breaks linearity); Falcon-512 is **not** either (NTRU short-vector structure doesn't compose). Literature search 2024–2026 returns **no batch verifier construction of the Pippenger family for ML-DSA or Falcon**. Closest: NTT-cost amortization (Saarinen) and LaBRADOR's batch *succinct argument* (not Pippenger-shape; PSE maintenance mode in 2026).

This cell is **genuinely open research**. A Pippenger-style trick would need either a new homomorphism in FIPS-204/206 (unlikely without spec change) or a reduction to short-pre-image batch verification (what LatticeFold uses — see §2.7).

- Status: research only; no shipped library.

### 2.6 Signature aggregation (FROST-style threshold, Mithril, Falcon-Sign-Aggregate)

Different shape from batch *verify*: aggregation produces **one signature** over N messages/keys, not one proof over N signatures.

- **Mithril threshold ML-DSA** (eprint 2026/013, USENIX Sec '26): FIPS-204-compatible, RSS-based, 3 rounds, ≤6 parties, <1s WAN. Output verifiable by any FIPS-204 verifier. Caps at 6 parties — wrong tool for OP-3.
- **Trilithium** (eprint 2025/675), **Quorus** (eprint 2025/1163): threshold-ML-DSA at larger party sets; all unaudited research code.
- **PQScale** (BTQ, shipping product): aggregates **1,722 Falcon signatures into ~94 KB total** (12.5× compression) via AURORA (post-quantum FRI-based SNARK). Closest-to-production for a NIST-certified PQC signature. AURORA's on-chain verifier gas not published.
- **leanMultisig** (`leanEthereum/leanMultisig`, EF-funded, ~10 interop devnets): hash-based (XMSS) aggregation via minimal zkVM; ~250× compression. Not ML-DSA / Falcon.
- **Falcon-LaBRADOR** (PSE blog 2025-05): research; maintenance mode 2026.
- Status: shipped+audited = none. Mithril unaudited. PQScale shipping, audit status unclear. leanMultisig devnet-only.

### 2.7 Folding schemes (Sangria / ProtoStar / HyperNova → lattice folding)

The Nova / Sangria / SuperNova / HyperNova / ProtoStar / ProtoGalaxy family does incrementally verifiable computation (IVC): fold N statements into one without proving each fully. Classical instantiations use group-additive Pedersen commitments and are **not** PQ-secure.

- **LatticeFold** (eprint 2024/257, Boneh+Chen, Asiacrypt 2025): first PQ folding scheme; Module-SIS-based; sumcheck binary tree; 64-bit field; HyperNova-comparable performance. Reference code only.
- **LatticeFold+** (eprint 2025/247): "Faster, Simpler, Shorter" follow-up.
- **Improving LatticeFold+ with ℓ2-norm checks** (eprint 2026/721): further constant-factor optimization.
- **Neo / SuperNeo** (eprint 2026/242, Nguyen+Setty, Feb 2026): lattice folding for CCS (R1CS / Plonkish / AIR generalization). Strongest 2026 result in this space.

Applied to ML-DSA: fold N (sig, msg, pk) triples into a single accumulator, open with one SNARK. Amortized verify approaches a constant ~270k gas regardless of N. At N=10,000: **~27 gas/sig amortized**.

- Status: all research; no production library for "fold-N-ML-DSA-sigs".

### 2.8 Hybrid: precompile single + ZK batch

Once EIP-8051 / 8052 ship (~3–4.5k gas single), batch-ZK is worthwhile only if amortized gas/sig undercuts the precompile and proof-system PQ-security is acceptable.

- Falcon-512 post-8052: ~3,000 gas single. SP1+Groth16 N=256: ~1,055 gas/sig (~2.8× speedup) at cost of multi-minute prover + BN254 (non-PQ) wrap.
- ML-DSA-44 post-8051: ~4,500 gas single. SP1+Groth16 N=256: ~1,055 gas/sig (~4.3× speedup).
- Hybrid model: single sigs use precompile (fast, PQ-secure); N≥~64 batches use zkVM proof. Crossover depends on exact precompile cost.

### 2.9 Recursive ZK / proof-of-proofs

Recursive STARK / Halo-style accumulation. SP1 / RISC Zero / OpenVM support recursion natively. PQ wrinkle: Groth16 (BN254) wrap loses outer PQ. The **clientsideproving WHIR-based PQ-SNARK** (HackMD `@clientsideproving/whir-based`) explicitly aims at an EVM-verifiable PQ SNARK with **no Groth16 wrapper**, via KoalaBear (31-bit) field. WHIR Solidity verifier gas benchmark was flagged early-April 2026 deliverable — `TODO[founder]: verify` if published.

---

## 3. Competitive map per approach

Maturity legend: P = production-deployed; A = shipped+audited; U = shipped+unaudited; R = research only.

| Cell | Status | Who / what |
|---|---|---|
| Precompile ML-DSA-44 | U | EIP-8051 draft |
| Precompile ML-DSA-65 | **VACANT** | EIP-8051 explicitly level-II only |
| Precompile Falcon-512 | U | EIP-8052 draft |
| Solidity ML-DSA | U | ETHDILITHIUM 4.9M gas (ZKNoxHQ) |
| Solidity Falcon | U | ETHFALCON 1.5M / 3.6M gen-2; EPERVIER 1.6M (ZKNoxHQ) |
| zkVM single-sig ML-DSA | A (zkVM) / U (app circuit) | SP1: 22s, 260B, 270k gas |
| zkVM single-sig Falcon | A (zkVM) / U (app circuit) | partial BTQ blog impl |
| **Batch ZK ML-DSA (N=32–1024)** | **VACANT** | derivable from SP1 / RISC0 / OpenVM; nobody shipped |
| Batch verifier Pippenger/linear-combination on lattice | **VACANT** | primitive does not exist |
| Aggregation Mithril threshold (≤6) | U | `threshold-ml-dsa` crate |
| Aggregation PQScale (Falcon, ≤1722) | P (commercial) | BTQ |
| Aggregation leanMultisig (XMSS) | U / devnet | leanEthereum |
| Aggregation LaBRADOR (Falcon) | R / maintenance | PSE 2025-05 |
| **Folding (lattice) for PQ sigs** | **VACANT** | LatticeFold(+) / Neo / SuperNeo papers; no lib |
| Hybrid precompile + ZK batch | **VACANT** | — |
| Recursive PQ-SNARK Solidity verifier (no Groth16) | R + active | clientsideproving WHIR |
| HAPPIER (hash-based 2^16 agg, RISC Zero) | R + impl | Springer 2026 |
| CAPSS (SNARK-friendly, NON-NIST sig) | R + impl | CryptoExperts |

**Two vacant cells of strategic interest**:
1. **Batched ML-DSA verifier with NIST inner signature** — no team has published "N ML-DSA-65 → 1 proof at <10k gas/sig amortized with audited circuits". SP1 / RISC Zero have the substrate; nobody shipped the circuit.
2. **Folding-scheme aggregation of FIPS-204 sigs** — LatticeFold / Neo papers exist; no team has built "fold N ML-DSA-65 verifies into one accumulator". Natural fit for QS Observer-Attestation streaming.

---

## 4. Where the GAP is

Three cells thin enough for QS to ship first:

**4.1 Batched ML-DSA-65 SP1 circuit + Solidity Groth16 verifier (genuinely vacant).** No published benchmark of "N>1 ML-DSA-65 verifies inside one SP1 proof". Google Q-day SP1 work was a bespoke cryptanalysis circuit. Kota Medium walkthrough is single-sig NTT. SP1 has zkVM audit but the ML-DSA verification circuit is application Rust code that QS would write and have separately audited. **The engineering gap.** Evidence: search "SP1 batch ML-DSA signatures verification benchmark" returns single-sig refs only.

**4.2 Folding-scheme streaming aggregation of NIST PQ sigs (research → production).** LatticeFold+ (2025/247) and Neo/SuperNeo (2026/242, Setty) ship as papers + ref code, not as ML-DSA aggregation libraries. Match between Neo's CCS folding and ML-DSA-verify-as-CCS is straightforward in principle, unimplemented in public. 2-team race (Setty/Microsoft Research camp + Boneh+Chen LatticeFold lineage); QS a credible third entrant.

**4.3 Hybrid precompile + ZK batch over the crossover point.** Post-EIP-8051, a "two-knob" architecture (single → precompile ~4.5k gas; N≥64 → zkVM proof) is straightforward but the routing contracts + batch-membership proofs do not exist publicly.

---

## 5. Proposed Architecture F (batch ZK verifier) — full technical design

### F.0 Headline

**N=256 ML-DSA-65 signatures verified inside one SP1 zkVM circuit, wrapped in Groth16, verified on EVM at ~270k gas total = ~1,055 gas per underlying ML-DSA-65 signature amortized.** Constructive demo on Sepolia within 8 weeks. The circuit itself is open-source and submittable as the audit scope.

### F.1 Primitive selection

- **Inner signature**: ML-DSA-65 (FIPS 204 final, Aug-2024). Level III, 3,309-byte sig, 1,952-byte pk. Choice rationale: CNSA 2.0 / Japan-FSA-citation defensibility (level III meets institutional defaults; level II via EIP-8051 is gas-optimization for a different regulatory crosswalk and should not be conflated).
- **Hash**: SHA3-256 inside the circuit (CP-1 rule compliance; ML-DSA-65 natively uses SHAKE-256 which is SHA3-family).
- **Proof system**: SP1 zkVM (Succinct), generating a STARK proof of "I executed ML-DSA-65 verify(pk_i, msg_i, sig_i) = true for all i in [N]". SP1 chosen over RISC Zero because (a) Google Q-day precedent April-2026 demonstrates production-scale circuit, (b) Nethermind+EF formal-verification audit of RISC-V opcodes is a strong substrate, (c) public benchmarks place SP1 production proof time at ~22s for one Dilithium verify.
- **On-chain wrapper**: Groth16 (BN254), per SP1 Network's default proof-types page (~270k gas verify). **Honest about the cost**: Groth16's BN254 pairing is NOT PQ-secure. Architecture F therefore has the property "inner signature is PQ; outer proof system is classical". This is a **conscious trade-off** — the alternative (direct STARK verify, ~5–15M gas without precompile) gives end-to-end PQ-security but at 20–50× the gas. Architecture F-prime (§6) keeps full-PQ for use cases that require it.

### F.2 Concrete protocol — mapping onto QS's deployed contracts

- **NEW**: `BatchAttestationVerifier` (~300 LOC Solidity). Inputs: Groth16 proof + `(msgHashRoot, pkCommitmentRoot, batchSize)`. ~270k gas.
- **SR_0 retention**: each leaf = `SR_0 = SHA3-256(lock_params_i || pk_i)` (QS's existing format). Batch root = Merkle tree of SR_0 leaves. SR_0 survives, moves from per-tx to per-leaf.
- **Deprecated**: `SPHINCSVerifier` at `0xD090b5A6…0103` (dual-sig dropped per Phase 2.4 decision #6).
- **Repurposed**: `ProverRegistry` at `0x08e1fc1A…8946` → "registry of approved batch-aggregator services" (small role; most current code deleted).
- **Vault entry**: `Vault.lockBatch(proof, batchRoot, batchSize)` calls `BatchAttestationVerifier`. Lock state machine downstream unchanged.

### F.3 Batching size analysis

| N | Per-batch prove time (SP1) | On-chain verify cost | Amortized gas/sig | Latency (user perspective) |
|---|---|---|---|---|
| 1 | ~22s | ~270k gas | 270k | 22 s (effectively a worse UX than ETHFALCON's 1.5M one-shot) |
| 32 | ~700s ≈ 12 min | ~270k gas | ~8,440 | 12 min if user waits; <1 min if batched with others |
| 256 | ~5,600s ≈ 93 min | ~270k gas | ~1,055 | unacceptable for single-user UX; perfect for hourly settlement |
| 1024 | ~6.2 hr | ~270k gas | ~264 | hourly-to-daily settlement; observer-attestation grade |

Per-batch prove time is a linear extrapolation from the 22s single-sig measurement; in practice SP1's recursion and parallel proving (multi-GPU) reduce the wall-time substantially — SP1 Hypercube claims real-time proving of mainnet Ethereum blocks, which dominates a 256-sig batch by orders of magnitude. `TODO[founder]: verify` actual wall-time on real hardware with N=256 ML-DSA-65.

### F.4 Known to work vs NEW

- **Known**: SP1 produces Groth16-wrapped proofs verifiable at ~270k gas (Succinct docs); SP1 ran a production cryptanalysis circuit (Google Q-day April-2026, Trail of Bits indep. verified); single Dilithium NTT compiles in SP1 (Kota Medium); ML-DSA-44 verify ~776K RISC-V instructions (Saarinen 2023, upper bound for ML-DSA-65).
- **NEW**: audit-grade batched ML-DSA-65 in SP1; Solidity `BatchAttestationVerifier` paired with SR_0 leaf format; non-replacement extension of deployed Vault.
- **Audit surface**: SP1 ML-DSA-65 circuit (~2K LOC Rust app code), Solidity verifier (~300 LOC), batch root + public-input commitment. **NOT in scope** (separately audited upstream): SP1 zkVM, Groth16 verifier, ML-DSA-65 standard. Estimate $40-60k, 5-7 weeks calendar.

---

## 6. Architecture F alternatives within the cryptographic-optimization frame

### Architecture G — Folding-scheme streaming ML-DSA aggregator

- **Primitive**: ML-DSA-65 verified inside a Neo / SuperNeo folding circuit (eprint 2026/242, Nguyen+Setty). Each new sig folded into a running accumulator; final accumulator opened by one PQ-SNARK.
- **Wrapping**: Groth16 (~270k gas, loses outer PQ) OR WHIR-based Solidity verifier (gas TBD — clientsideproving deliverable).
- **Target**: OP-3 (N=1024–65536). Amortized approaches `(single-proof cost) / N`. **At N=65,536 Groth16-wrapped: ~4 gas/sig.**
- **Honest about**: Neo/SuperNeo papers Feb-2026, 4 months old; no production library. Productionizing this is 8-12 month research-engineering, not 8-week prototype.
- **Why it matters**: natural fit for QS Observer-Attestation *streaming* — observers fold attestations into one accumulator opened periodically. The current Prover-Pool is structurally a worse approximation of this.

### Architecture H — Hybrid precompile + ZK batch (two-knob routing)

- **Primitive**: ML-DSA-44 single-sig via EIP-8051 precompile (~4,500 gas); ML-DSA-44 batched via SP1 zkVM for N≥64; entrypoint routes between paths.
- **Target**: OP-1 + OP-2 in one architecture. Single-tx = ~4.5k gas instant; batch = ~1,055 gas/sig amortized at N=256.
- **Honest about**: requires EIP-8051 to land in Glamsterdam (currently draft, no client in audit). Level-II vs level-III regulatory split (Phase 2.4 qs-threat) may force two separate batched circuits (one for ML-DSA-44, one for ML-DSA-65) each separately audited.

### Architecture I — SNARK-friendly aggregation under a NIST wrapper

- **Primitive**: User signs ML-DSA-65 (NIST). Aggregation layer uses CAPSS-Anemoi (eprint 2025/061) inside a STARK to compress a batch of `(msg, ml-dsa-sig)` verification statements. Critically the **inner ML-DSA-65 verify happens in clear**; CAPSS-Anemoi is the proof-friendly hash for the *recursive Fiat-Shamir*, not the signature.
- **Wrapping**: STARK; either Groth16 wrap (~270k gas, loses outer PQ) or Plonky3-style FRI verifier (~3M gas, retains PQ).
- **Honest about**: CAPSS itself is research, not NIST-certified, and is **not the signature scheme** — subtle, creates audit complexity. Marketing risk: readers will hear "CAPSS" and assume QS swapped NIST sigs.

### Architecture J — HAPPIER-equivalent for emergency path

QS's current SPHINCS+ emergency path is addressed by HAPPIER (Springer 2026 + RISC Zero): 2–3 MB aggregate proof, no Groth16 wrap, end-to-end PQ-secure, on-chain STARK verify ~5–15M gas (acceptable in emergencies). Drop-in for SR_1.

---

## 7. Why these don't compete with A-E

| New arch | A: EIP-native | B: Threshold-ML-DSA | C: Migration vehicle | D: ZKVM-attested | E: LaBRADOR aggregator |
|---|---|---|---|---|---|
| **F: Batch ZK verifier** | RUNS ORTHOGONAL — F is the cost-optimization that any of A/B/C/D can adopt for its batched path | RUNS ORTHOGONAL — threshold sig + batch ZK compose | RUNS ORTHOGONAL — migration STARK proof can be batched | **SUBSUMES D** — D is N=1 special case of F | REPLACES E — F achieves the same cost reduction without LaBRADOR (which is in maintenance) |
| **G: Folding aggregator** | RUNS ORTHOGONAL | RUNS ORTHOGONAL | RUNS ORTHOGONAL | SUBSUMES D for streaming use | REPLACES E with a different (Setty-camp) production substrate |
| **H: Hybrid precompile+ZK** | **EXTENDS A** — A is single-sig-only, H is single + batched | RUNS ORTHOGONAL | RUNS ORTHOGONAL | SUBSUMES D | REPLACES E |
| **I: SNARK-friendly wrapper** | RUNS ORTHOGONAL | RUNS ORTHOGONAL | RUNS ORTHOGONAL | refinement of D | REPLACES E |
| **J: HAPPIER emergency path** | RUNS ORTHOGONAL — emergency-path-only | RUNS ORTHOGONAL | RUNS ORTHOGONAL | RUNS ORTHOGONAL | RUNS ORTHOGONAL |

**Key observation**: F, G, H, I, J are *cost-optimization layers*, not custody-architecture choices. They live underneath A/B/C/D/E as the actual cryptographic engine. The Phase 2.4 meeting framed A-E as competing custody products; F-J are the cryptographic primitives those products would use. A founder can pick (A, F) or (B, F) or (C, G) — these are not mutually exclusive selections.

The single dominant new claim: **D (ZKVM-attested) is the N=1 degenerate case of F (batched ZK verifier)**. If QS is going to commit to a zkVM proof for a single signature (worth 22s prove + 270k gas), it should commit to the same proof system carrying N signatures (same 22-ish seconds wall-clock if SP1 parallelism is real, same 270k gas verify). D should be reformulated as "F at N=1".

---

## 8. Recommended winning niche for QS — single sentence

**QS wins if it ships, by 2026-08-15, an open-source SP1 circuit verifying N=256 ML-DSA-65 signatures in one Groth16-wrapped proof on Sepolia at <1,500 gas/sig amortized, with published audit scope, because (a) ZKnoxHQ targets single-sig Solidity, not batched ZK; (b) BTQ/PQScale ships Falcon-AURORA aggregation but closed-source and Falcon-only; (c) PSE LaBRADOR is in maintenance; (d) EF leanXMSS/leanMultisig is hash-based, not ML-DSA; (e) Setty's Neo/SuperNeo has no public ML-DSA productionization; (f) HAPPIER targets consensus-layer hash-based, not ML-DSA application-layer.**

The defensible niche: **batched ML-DSA-65 ZK verification on EVM** — the intersection of "ZK batching" × "NIST level-III lattice" × "EVM application-layer". Each constraint is addressed by a different team; their intersection is vacant.

---

## 9. Specific 8-week prototype path

Solo founder + Claude only, no contracted cryptographer. Goal: one Sepolia transaction demonstrating a verified batch ZK proof of 256 ML-DSA-65 signatures.

- **W1 — Substrate spike**: install SP1 (`github.com/succinctlabs/sp1`, Apache-2.0); compile Kota's Dilithium NTT gadget as baseline single-sig verifier; measure prove time + proof size on dev hardware; commit numbers to `docs/intelligence/research/`. If SP1 install fails: fall back to RISC Zero or OpenVM (+1 week).
- **W2 — Single-sig audit-grade circuit**: replace any hand-rolled Dilithium code with `fips204` v0.4.1 (no_std) inside SP1; add public input `(msgHash, pkHash, recipient, amount)` matching QS `lock(...)` ABI. Deliverable: `src/crypto/sp1-mldsa/` crate.
- **W3 — Batching loop**: wrap verify in loop over N sigs; public input becomes Merkle root over SR_0 = `SHA3-256(lock_params_i || pk_i)` leaves; measure prove time at N=1, 4, 16, 64, 256.
- **W4 — Groth16 wrap + Solidity verifier**: use SP1 Network Groth16 conversion (~260B proof, ~270k gas); generate Solidity verifier (`sp1-sui` adapted pattern); deploy `BatchAttestationVerifier` to Sepolia. Deliverable: first successful Sepolia verify tx.
- **W5 — Vault integration**: add `Vault.lockBatch(proof, batchRoot, batchSize)` to a forked **parallel** Vault (do NOT replace deployed `0x07012aeF…7260`); preserve SR_0 leaf format so backend produces identical receipts.
- **W6 — Adversarial testing**: negative tests (invalid sig, mismatched root, replay); property tests across N and validity patterns; CI passing.
- **W7 — Benchmark + writeup**: gas-cost table for N=1, 4, 16, 64, 256; compare side-by-side ETHFALCON (1.5M single) and ETHDILITHIUM (4.9M single); blog post + arxiv-style writeup.
- **W8 — Audit packaging + ethresear.ch post**: clean audit scope (single repo, README, threat model); contact 2 firms (Veridise + Cryspen — zkVM experience); post in PQTS Breakout context.

**Total: 8 weeks, ~$0 cash pre-audit, solo-founder bandwidth.** Audit ($40-60k) follows if buyer signal validates.

**Critical dependencies** (`TODO[founder]: verify` early): SP1 + Kota gadget compile in W1; `fips204` v0.4.1 in SP1 no_std; near-linear prove-time scaling with N in W3.

---

## 10. Failure modes + what would falsify the thesis

### 10.1 Soundness

SP1 ML-DSA-65 circuit is app-layer Rust; no formal verification beyond SP1's audited RISC-V opcodes.
- **Hint-vector**: ML-DSA's hint `h` must be bounded/well-formed. RustCrypto `ml-dsa` shipped GHSA-5x2r-hc65-25f9 (duplicate hint indices accepted). Mitigation: cross-test against `fips204`, `libcrux-ml-dsa`, NIST KAT vectors.
- **Public-input binding**: if batch root not bound to each (msg, pk, sig) inside the proof, adversary constructs proof with matching root but mismatched leaves. Classic ZK input-binding bug.
- **Groth16 PQ-security**: BN254 NOT PQ-secure. F's "PQ inner / classical outer" means **post-Q-day the outer wrap is forgeable**. F is a transition technology; F-prime (WHIR Solidity verifier when shipped) is the long-term path.

### 10.2 Audit difficulty

Veridise / Cryspen / Trail of Bits publish 4-8 weeks for novel crypto circuits. F's scope is small but ML-DSA circuit auditing is rare expertise — 2-3 firms can credibly do it. Realistic: 6-8 weeks, $40-60k. Audit may also require `fips204` to be audited (separate ~4 week workstream, no current public audit).

### 10.3 Library risk

`fips204` v0.4.1: no audit; small maintainer; MIT/Apache. Marginal for audit-grade; `libcrux-ml-dsa` (Cryspen) stronger but no_std+SP1 compat `TODO[founder]: verify`. SP1 Groth16 verifying-key generation: one-time trusted-setup-style ceremony — `TODO[founder]: verify` whether Succinct holds it (centralization) or per-user (UX).

### 10.4 Side-channel / liveness

Prover runs verify only — never sees signer's secret — so timing side-channels do not leak keys. Replay protection: bind `(block.number || lock_id)` into per-leaf hash. Liveness: 256-batch prove takes minutes; current Prover-Pool has same issue across quorum. Fallback single-sig path via ETHFALCON/ETHDILITHIUM (1.5M / 4.9M gas) for emergencies.

### 10.5 Falsification

- **F1**: SP1 N=256 prove time ≥1 hr (vs extrapolated 93 min if recursion holds) kills OP-2 UX; redirect to G.
- **F2**: EIP-8051 lands at ~4,500 gas AND no team adopts batching within 6 months — niche too narrow.
- **F3**: Q-day estimates compress <12 months (Google March-2026 already compressed 2×); Groth16 wrap forgeability becomes near-term threat.
- **F4**: Audit firms decline due to ML-DSA-circuit expertise gap.
- **F5**: Setty / ZKnoxHQ / BTQ publishes <500 gas/sig batched ML-DSA before QS's W7 publication — wedge closes.

---

## 11. What I am not certain about

1. **SP1 per-batch prove time at N=256 ML-DSA-65.** 22s single-sig is Dilithium-specific; my N=256 extrapolation assumes SP1 recursion holds. Could be 2× better or 5× worse.
2. **EIP-8051 security level.** Phase 2.2 stated level-II-only (ML-DSA-44); ethereum-magicians #25857 snippets reference ML-DSA-44 parameters specifically. Eips.ethereum.org HTTP-403-blocked; cannot confirm whether level-III variant has been added.
3. **Hard-fork name ("Hegotia" vs "Glamsterdam").** QS internal docs say Hegotia; my searches surface EIP-7773 Glamsterdam as the upcoming fork. Possible naming inconsistency.
4. **PQScale on-chain verifier gas.** BTQ blog cites 1722 Falcon → 94 KB aggregate; on-chain verifier cost not published. If cheap, competes directly with F for Falcon-side.
5. **Clientsideproving WHIR Solidity gas.** HackMD flagged early-April 2026 deliverable; result not surfaced. If <500k gas at PQ-secure params, F's Groth16 wrap becomes obsolete.
6. **`fips204` v0.4.1 in SP1 no_std.** Week-1-day-1 falsification test; may need alt crate.
7. **ML-DSA-65 vs -44 marginal SP1 cost.** Level III has larger (k,l) dimensions; estimate ~1.5× of -44 but unverified.
8. **Falcon FIPS 206 finalization timeline.** If 2027+, H's Falcon variant defensibility weakens.
9. **RISC Zero / OpenVM ML-DSA benchmarks I missed.** Searches surfaced none; their benchmark repos may have hidden data.
10. **"No Pippenger trick for lattice sigs" negative claim.** Hard to prove negatives definitively; did not exhaust arxiv cs.CR.
11. **QS's actual deployed Solidity ML-DSA gas (1.8M).** Phase-2.2 estimate, already flagged `TODO[founder]: verify`. The whole comparison baseline depends on this.
12. **Audit pricing $40-60k.** 2024-vintage estimate; 2026 zkVM audit prices may have risen.

---

## 12. Sources (HTTP status noted; all WebSearch unless stated)

**WebFetch attempted**:
- `github.com/ZKNoxHQ/ETHDILITHIUM` — 200 OK; 4.9M gas + "DO NOT USE IN PRODUCTION" confirmed.
- `eips.ethereum.org/EIPS/eip-8051` — HTTP 403 (sandbox-blocked, matches Phase 2.1/2.2).
- `blog.succinct.xyz/google-sp1-quantum-threat/` — certificate-not-yet-valid error; evidence via search snippet.

**Via WebSearch snippet (primary citations)**:
- Mithril threshold ML-DSA: `eprint.iacr.org/2026/013`
- Trilithium: `eprint.iacr.org/2025/675`; Quorus: `eprint.iacr.org/2025/1163`
- SP1 / Succinct: `blog.succinct.xyz/google-sp1-quantum-threat/`, `docs.succinct.xyz/docs/sp1/generating-proofs/proof-types`, `blog.succinct.xyz/google-quantum-ai-paper-crypto/` (22s + 260B + 270k gas)
- SP1 Dilithium NTT gadget: `medium.com/@phillyj1026/...` (Kota)
- LatticeFold / LatticeFold+ / Neo / SuperNeo / l2-norm: `eprint.iacr.org/{2024/257, 2025/247, 2026/242, 2026/721}`
- ZKNoxHQ ETHFALCON / ETHDILITHIUM: `github.com/ZKNoxHQ/{ETHFALCON,ETHDILITHIUM}`, `zknox.eth.limo/posts/2025/{03/21/ETHFALCON.html, 02/24/ETHEREUM_for_PQ_era_250224.html}` (1.5M Falcon, 4.9M Dilithium, 3.6M new bench)
- EIP-8051: `eips.ethereum.org/EIPS/eip-8051` (403), `ethereum-magicians.org/t/.../25857` (~4500 gas, NTT+hash-dominated)
- EIP-8052 Falcon precompile: `eips.ethereum.org/EIPS/eip-8052`, `github.com/ethereum/EIPs/pull/10560` (~3000 gas)
- OpenVM 2.0 / SWIRL: `blog.openvm.dev/2.0`, `openvm.dev/swirl.pdf` (<300KB proof, 100-bit PQ, no trusted setup)
- PQScale (BTQ): `www.btq.com/products/pq-scale`, `www.btq.com/blog/introducing-pqscale-...` (1722 Falcon → 94 KB, AURORA)
- CAPSS: `eprint.iacr.org/2025/061`, `www.cryptoexperts.com/capss/` (Anemoi 9.5-15.5KB sig, 24-35K R1CS, sub-KB amortized)
- Loquat: `eprint.iacr.org/2024/868` (46KB sig, 148K R1CS, 32-agg → 197KB)
- HAPPIER: Springer 10.1007/978-3-032-15541-2_1 (2-3MB sig, 2^16 aggregation, RISC Zero, Groth16 disabled for PQ)
- Google Q-day ZKP / Trail of Bits: `blog.trailofbits.com/2026/04/17/...`, `github.com/trailofbits/quantum-zk-proof-poc`
- leanMultisig: `github.com/leanEthereum/leanMultisig` (250× compression, hash-based)
- Clientsideproving WHIR: `hackmd.io/@clientsideproving/{pq-snark-verifier, whir-based, ByoYKGBmgl}` (gas TBD)
- PSE LaBRADOR (maintenance mode 2026): `pse.dev/blog/post-quantum-signature-aggregation-with-falcon-and-LaBRADOR`
- PQ Interop #37: `github.com/ethereum/pm/issues/2035` (April 29 2026)
- Veridise RISC Zero round-2 audit: `veridise.com/wp-content/uploads/2025/04/VAR-Risc0-241028-Round2-V4.pdf`
- HyperNova: Setty `andrew.cmu.edu/user/bparno/papers/hypernova-1.pdf`

**Unverified citations** (`TODO[founder]: verify`):
- ETHFALCON 3.6M-gas successor (zknox.eth.limo 2025-02-24): HEAD or branch?
- QS deployed ML-DSA verifier 1.8M baseline: confirm vs deployed contract trace.
- "Hegotia" fork name: appears in QS internal docs only; upcoming fork per EIP-7773 is **Glamsterdam**.
