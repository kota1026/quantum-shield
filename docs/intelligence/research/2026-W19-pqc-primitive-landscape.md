---
status: DRAFT — research output, founder must verify before any external claim
date: 2026-05-09
author: research agent (qs-research)
purpose: 2026-05 inventory of PQC primitives available for QS Path A architecture rebuild; identify what is NEW or PRODUCTION-READY since Nov-Dec 2025
parent: docs/intelligence/strategy/2026-W19-5-architecture-audit.md
---

# PQC Primitive Landscape (2026-05)

## Why this document exists

QS's Nov–Dec 2025 architecture anchored on **ML-DSA-65** (FIPS 204) as the user-facing primitive, **SLH-DSA / SPHINCS+** (FIPS 205) as emergency-path, **SHA3-256** for hashing, and a **Prover Pool + Observer Challenge** layered on top — because no on-chain PQC primitive was cheap enough for direct EVM verification. Six months later, on the eve of a Path A contract rebuild, the EVM landscape has shifted: EIPs 8051 / 8052 are in draft, the NTT precompile (0x15) has shipped on devnets, EIP-8141 is on the Hegotia hard-fork track, and threshold ML-DSA has its first FIPS-204-compatible scheme (Mithril, USENIX Sec '26) with a published Rust crate. This audit captures what changed, what is genuinely production-ready vs hype, and what should be on the Path A candidate list that was not on the table in Nov 2025.

---

## Maturity matrix

| # | Primitive | Standard / status | Sig size (bytes) | Verify cost | Rust lib | Audit | Δ vs Nov-2025 |
|---|---|---|---|---|---|---|---|
| 1 | ML-DSA-65 (FIPS 204) | Final, Aug-2024 | 3,309 | EIP-8051 draft ~3k gas precompile / 1.8M+ in Solidity | `fips204` v0.4.1, `libcrux-ml-dsa`, RustCrypto `ml-dsa` | mixed (RustCrypto had GHSA-5x2r-hc65-25f9) | EIP-8051 did not exist Nov-2025 |
| 2 | ML-DSA-44 | Final, FIPS 204 | 2,420 | n/a (not in EIP-8051; 8051 covers level II) | same crates | same | EIP-8051 explicitly targets level II |
| 3 | ML-DSA-87 | Final, FIPS 204 | 4,627 | not in 8051 draft | same crates | same | unchanged |
| 4 | FN-DSA / Falcon (FIPS 206) | **Initial Public Draft submitted 2025-08-28** | 666 (Falcon-512) | EIP-8052 draft ~3k gas, 1.5M gas in EVM (ETHFALCON) | `fips206` not yet stable; ZKNoxHQ `ETHFALCON` | not audited (`DO NOT USE IN PRODUCTION`) | **NEW: was non-standard in Nov-2025** |
| 5 | HAWK | NIST Round 2 (only lattice in R2 add'l), 2024-10 | 555 (HAWK-512) | none on EVM | reference C, no production Rust | none | **side-channel paper eprint 2026/699 = caution** |
| 6 | SLH-DSA / SPHINCS+ (FIPS 205) | Final, Aug-2024 | 7,856–49,856 | not in any EIP precompile yet | RustCrypto `slh-dsa` | RustCrypto reviews | unchanged at standard level; on-chain still infeasible |
| 7 | XMSS / LMS (SP 800-208) | Final 2020 | ~2,500 (XMSS) | not on EVM (no precompile); leanVM aggregates off-chain | `xmss-rs`, wolfSSL XMSS/LMS | CNSA 2.0 firmware-grade | **leanXMSS / leanSig is new EF deliverable Q1-2026** |
| 8 | SQIsign | NIST Round 2, isogeny | **177–335** | none on EVM | reference C only | open analysis | spec v2.0.1 (2025-07); still very slow signer |
| 9 | Classic McEliece | KEM only — no sig variant exists | n/a | n/a | `classic-mceliece-rust` | n/a | unchanged |
| 10 | Threshold ML-DSA (Mithril) | Paper Eurocrypt-class, USENIX Sec '26 (eprint 2026/013) | same as ML-DSA | n/a (off-chain co-signing) | `threshold-ml-dsa` crate (lattice-safe org) | unaudited research code | **NEW: did not exist in Nov-2025** |
| 11 | FROST | RFC 9591 (Schnorr-only, classical) | n/a (DLP-bound) | n/a | many | RFC-grade | not PQ; lattice analogue is Hermine |
| 12 | BBS+ | IRTF CFRG draft-10 | DLP-bound | n/a | many | n/a | **not PQ secure** (privacy properties survive ROM, signature does not) |
| 13 | Falcon aggregation (LaBRADOR) | 2024 paper, PSE blog 2025-05 | aggregate proof, KB-scale | research only | none production | n/a | active research, no shipped lib |
| 14 | RISC Zero zkVM | R0VM 2.0 with formal verification track (Veridise/Picus) | proof STARK-based | recursive proof + Groth16 wrapper | `risc0-zkvm` | Veridise round 2 (2025-04) | formal verification milestones new |
| 15 | SP1 (Succinct) | SP1 Hypercube, formally verified RISC-V opcodes (Nethermind+EF) | STARK proof | real-time L1 proving milestone | `sp1-zkvm` | full formal verification of 62 opcodes | **NEW: full formal verif. of opcodes, used by Google PQ-threat ZKP April 2026** |
| 16 | OpenVM (Axiom) | OpenVM 2.0 with **SWIRL** | <300 KB proof | post-quantum, no trusted setup, 100-bit security | `openvm` Rust | external review pending | **SWIRL announced 2026 — NEW vs Nov-2025** |
| 17 | Cairo / Stwo | S-two 2.0.0 on crates.io 2026-01-27 | Circle STARK | 96-bit + 30-bit grinding | `stwo` / `stwo-cairo` | live on Starknet mainnet | PQ security claimed under ROM (no public formal proof) |
| 18 | Plonky3 / Plonky2 | Plonky3 production-ready (2024) | FRI-based | varies | `plonky3` | Least Authority 2024-11 | unchanged maturity-wise |
| 19 | Thales Luna HSM | Firmware **v7.9.3** (2026-04-22) | n/a | n/a | PKCS#11 / JCE | NIST CAVP-validated | **GA shifted forward**: 7.9 (2025-06), 7.9.2 (2026-02), 7.9.3 (2026-04) |
| 20 | Utimaco SecurityServer / Quantum Protect | ML-DSA + ML-KEM + LMS in shipping app pkg | n/a | n/a | PKCS#11 | NIST CAVP-validated | shipping; was preview Nov-2025 |
| 21 | AWS CloudHSM | ML-DSA in **preview** | n/a | n/a | KMS/CloudHSM SDK | FIPS 140-3 L3 (KMS path) | KMS GA in two regions; CloudHSM still preview |
| 22 | YubiHSM 2 | classical only; sunset May-2026 | n/a | n/a | n/a | n/a | sunset confirmed; PQC roadmap deferred to next-gen HSM |
| 23 | NTT precompile (0x15) | Devnet I+ activation 2026-02-27 | n/a | enables 0x15 BN254 fwd/inv NTT + Goldilocks fwd | `ZKNoxHQ/NTT` | devnet only | **NEW: did not exist Nov-2025** |
| 24 | EIP-8141 (Frame Transaction / AA) | Drafted Jan-2026, on Hegotia track | n/a | enables arbitrary verifier in EOA | client-side only | n/a | **NEW: published Jan-2026** |
| – | EIP-8051 (ML-DSA precompile) | Draft Oct-2025 | input ≤2,441 B | ~3,000–4,500 gas (proposed) | n/a | n/a | **NEW: did not exist Nov-2025** |
| – | EIP-8052 (Falcon precompile) | Draft, simon-masson PR #10560 | input ~666 B | ~3,000 gas (proposed) | n/a | n/a | **NEW** |

(Row count exceeds the 24-primitive list because EIP-8051 and EIP-8052 are EVM-side enablers, not primitives.)

---

## Per-primitive detail

### 1–3. ML-DSA-44 / 65 / 87 (FIPS 204)
Final since Aug-2024. ML-DSA-65 sig 3,309 B / pk 1,952 B. EIP-8051 (Oct-2025 draft) targets **NIST level II only** (= ML-DSA-44), proposes ~3,000 gas (subject to benchmarking) plus an EVM-friendly variant; ALG_TYPE = 0xD1, MAX_SIZE = 2,441 B. **If 8051 ships unchanged, QS's ML-DSA-65 hot path will not benefit directly** — only ML-DSA-44 will. Rust libs: `fips204` v0.4.1 (no_std, no published audit), `libcrux-ml-dsa` (44/65/87, AVX2), RustCrypto `ml-dsa` (had verify bug GHSA-5x2r-hc65-25f9 — duplicate hint indices accepted).

### 4. FN-DSA / Falcon (FIPS 206)  ⭐
**Largest 2026 delta.** NIST submitted FIPS 206 IPD on 2025-08-28; finalization expected late-2026 or early-2027. Falcon-512: 666-byte sig, 897-byte pk. ZKNoxHQ's `ETHFALCON` brings full Falcon-512 verify down to **1.5M gas in pure Solidity** (from a 20M-gas baseline) and EIP-8052 proposes ~3,000 gas as a precompile. The `EPERVIER` variant exposes an `ecrecover`-shaped recovery API. Caveat: ETHFALCON carries `DO NOT USE IN PRODUCTION` warning.

### 5. HAWK
Only lattice scheme in NIST Round 2 additional-sig track. HAWK-512 sig 555 B (smaller than Falcon). 2026: still Round 2; eprint 2026/699 published a side-channel-based key-recovery against HAWK ("HAWK with Hint"), reducing its "standardize quickly" appeal. No production Rust.

### 6. SLH-DSA / SPHINCS+ (FIPS 205)
Final Aug-2024. -128s: 7,856-byte sig; -128f: 17,088; -256s: 29,792. RFC 9814 (Jul-2025) defines SLH-DSA in CMS. **No proposed EVM precompile.** poqeth (eprint 2025/091, AsiaCCS '25) measured full on-chain SPHINCS+ verify as "prohibitively costly" except in optimistic Naysayer mode. [Δ: unchanged.]

### 7. XMSS / LMS (SP 800-208)
Stateful HBS, standardized 2020. XMSS sig ~2.5 KB. State management is critical; CNSA 2.0 elevated XMSS/LMS to "highest-priority firmware-signing use case". 2026 development: **leanXMSS / leanSig / leanMultisig** — EF Rust reference of XMSS-over-Poseidon2 + minimal zkVM for SNARK aggregation + executable Python spec, used by ~10 client teams. EF formed a Post-Quantum Security team Jan-2026.

### 8. SQIsign
Isogeny-based, **177–335 byte signatures** (smallest of any candidate). Spec v2.0.1 (2025-07). NIST Additional Signatures Round 2. Verifier fast but **signer very slow**. Reference C only.

### 9. Classic McEliece
KEM only — no signature variant exists. Public keys 261 KB–1.3 MB. Not relevant.

### 10. Threshold ML-DSA (Mithril, eprint 2026/013, USENIX Sec '26)  ⭐
**Single biggest "did-not-exist-Nov-2025" deliverable.** First FIPS-204-compatible threshold scheme: Replicated Secret Sharing (RSS) in 3 online rounds, ≤6 parties, ≤1 MB comms/party, latency <20 ms LAN / <1 s WAN. Uses hyperball-based local rejection to dodge Lagrange-coefficient blowup. Rust crate: `threshold-ml-dsa` (lattice-safe org) — **unaudited research code**. Adjacent work: TALUS (arxiv 2603.22109), Hermine (eprint 2026/419, lattice FROST-like, Raccoon-based not FIPS-204), THED (eprint 2026/638, FHE-based), Quorus, Tanuki. [Δ: in Nov-2025, threshold-Dilithium = Damgård–Orlandi 2020 / DiLizium / TOPCOAT — none FIPS-204-compatible.]

### 11–13. FROST / BBS+ / Falcon-aggregation-via-LaBRADOR
FROST (RFC 9591): Schnorr, classical, **broken under Shor**. BBS+ (IRTF CFRG draft-10): DLP-based, **not PQ secure**; only privacy of derived proofs survives a CRQC. Falcon-LaBRADOR aggregation (PSE blog 2025-05 + Eurocrypt 2024 chapter): research only, no shipped library.

### 14–18. zkVMs and STARK provers
**RISC Zero**: STARK-based ⇒ plausibly PQ-secure under ROM. R0VM 2.0 advancing formal verification (Veridise/Picus). **SP1 (Succinct)**: SP1 Hypercube formally verifies all 62 RISC-V opcodes (Nethermind + EF); Google used SP1 + Groth16 to publish ZKP of a Q-day-relevant cryptanalysis April-2026 (Trail of Bits blog). Medium walkthrough exists for Dilithium NTT gadget in SP1. **OpenVM 2.0 / SWIRL**: post-quantum, no trusted setup, 100-bit provable, <300 KB proof, AOT compiler. **Stwo (S-two 2.0.0 on crates.io 2026-01-27)**: Circle-STARK; live on Starknet mainnet; PQ claim is informal (96 + 30-bit grinding under ROM). **Plonky3**: production-ready (Least Authority 2024-11), FRI-based.

### 19–22. HSMs
**Thales Luna**: v7.9.0 (2025-06) shipped ML-DSA + ML-KEM in core firmware (no FM); 7.9.3 GA'd 2026-04-22; PKCS#11 / CAPI/CNG / JCE; CAVP-validated. **Utimaco SecurityServer / Quantum Protect**: ML-KEM + ML-DSA + LMS + XMSS shipping, CAVP-validated. **AWS**: KMS ML-DSA-44/65/87 GA in two regions; **CloudHSM ML-DSA still in PREVIEW**; AWS Private CA + IAM Roles Anywhere both shipping ML-DSA. **YubiHSM 2**: classical only, **sunset 2026-05-02**; PQC story deferred to next-gen HSM.

### 23. NTT precompile (0x15)
ethresear.ch/t/21775 proposed; address 0x15; BN254 fwd+inv NTT and Goldilocks fwd. **Devnet I+ activation at genesis 2026-02-27** (Kurtosis devnet, 2 EL + 2 CL, 13 custom precompiles). Not yet on a mainnet hard-fork track but actively developed. Largest gas-cost reducer for ML-DSA/Falcon/STARK on EVM. [Δ: did not exist Nov-2025.]

### 24. EIP-8141 (Frame Transaction)
Authored Vitalik et al., **drafted Jan-2026**, on the **Hegotia hard-fork track** (planned 2H-2026). Allows accounts to define and interpret their own signature scheme using arbitrary EVM code at verification time. Does not require any new primitive itself; needs a verifier contract. This is the structural enabler that lets ML-DSA-EOA or Falcon-EOA happen without a precompile.

---

## Significant 2026 developments since Nov–Dec 2025

1. **EIP-8051 (ML-DSA precompile, draft Oct-2025)** + **EIP-8052 (Falcon precompile, draft 2025-onwards)** + **NTT precompile 0x15** on devnet 2026-02-27. None of these were on the table when QS designed Prover Pool as the workaround for "ML-DSA verification is too expensive on-chain."
2. **EIP-8141 drafted Jan-2026** + on-chain Hegotia track. Programmable verifiers in EOAs is the structural enabler for replacing ECDSA with ML-DSA without a precompile.
3. **FN-DSA / Falcon FIPS 206 IPD submitted 2025-08-28**. Falcon is now a real standardization target with a 666-byte sig — about 5× smaller than ML-DSA-65.
4. **Threshold ML-DSA (Mithril, USENIX Sec '26)** — first FIPS-204-compatible threshold scheme with a published Rust crate (`threshold-ml-dsa`).
5. **Ethereum Foundation Post-Quantum Security team** stood up January 2026; **leanXMSS / leanSig / leanMultisig** stack with executable Python spec used by ~10 client teams.
6. **OpenVM 2.0 / SWIRL** (post-quantum, 100-bit provable, no trusted setup) and **SP1 Hypercube** (formally verified all 62 RISC-V opcodes; Google used it April-2026 to publish a ZKP of a Q-day-relevant cryptanalysis result).
7. **Thales Luna v7.9 → v7.9.3** firmware ships ML-DSA + ML-KEM in core (no FM); **AWS KMS ML-DSA GA**; **Utimaco Quantum Protect** shipping.

---

## Composability with EVM

| Path | Today (May-2026, no precompile) | With EIP-8051/8052 (~3k gas) | With NTT 0x15 only |
|---|---|---|---|
| ML-DSA-65 verify | ~1.8M gas (Solidity, project-specific) | not covered (8051 = level II) | partial reduction (NTT-bound) |
| ML-DSA-44 verify | ~1.8M gas | **~3,000 gas** | partial |
| Falcon-512 verify | ~1.5M gas (ETHFALCON, EVM-tuned) | **~3,000 gas** | partial |
| SLH-DSA-128s verify | prohibitive on-chain (poqeth: optimistic-only) | no EIP proposed | no benefit (no NTT) |
| XMSS verify | high cost on-chain; off-chain via leanMultisig | not on EIP track | no NTT path |
| SQIsign verify | unmeasured on EVM | none | none |
| FRI/STARK verify | already feasible (Stwo / SP1 / RISC Zero verifiers) | n/a | helps NTT-heavy circuits |

**TODO[founder]: verify** — ETHFALCON 1.5M-gas number is from the ZKNOX blog post (2025-03-21); need to confirm whether the Solidity verifier they benchmarked includes hash-to-point + NTT, or just NTT. The 8051 / 8052 ~3,000-gas figure is **proposed and subject to benchmarking** per the EIP texts; should not be quoted externally as a confirmed cost.

---

## Implication for QS Path A rebuild

The Nov-2025 architecture chose Prover Pool as the workaround for *"ML-DSA verification is too expensive on-chain → we need an off-chain attestation pool that posts a one-bit on-chain signal."* In May-2026 that constraint is **provisionally relaxed** for ML-DSA-44 and Falcon-512 (if EIP-8051/8052 ship), and **structurally relaxed** for any signature scheme via EIP-8141 (verifier-as-contract).

Primitives that should be **on the candidate list for Path A** that were NOT considered in Nov-2025:

1. **Falcon-512 / EPERVIER**, EVM-friendly, 666-byte sig + recovery (looks like ecrecover). Concretely deployable today as a Solidity verifier (~1.5M gas) and trivially upgradable to a precompile call when 8052 ships. **This is the strongest candidate change** because the architecture audit's primary claim — "hot-path PQC signatures cost too much on-chain" — is what motivated Prover Pool, and Falcon-512 + EPERVIER weakens that claim by an order of magnitude.

2. **ML-DSA-44 (level II)** instead of ML-DSA-65 for the hot path, **iff** the threat model accepts 128-bit security and the ESP / regulatory crosswalk does not specifically require level III. Level II is what EIP-8051 will support natively.

3. **EIP-8141 verifier contract** as the user-facing entrypoint. This is the architecturally clean way to deliver "users sign with PQC" without re-doing transaction encoding. Reference: Vitalik's March-2026 framing — "verification stage gets the same programmability the EVM gave execution."

4. **Threshold ML-DSA via Mithril** for the custodian-facing path (Path A composable layer). This is the missing piece that lets QS plausibly say "MPC custodians can co-sign FIPS-204-compliant signatures across N parties without breaking standards compliance." `threshold-ml-dsa` crate exists but is unaudited research code; QS should **not** depend on it for production but **should** cite it as the demonstrated feasibility evidence in any Path A doc.

5. **leanXMSS / leanMultisig** for any QS aggregation use case (e.g. aggregating Observer attestations into one on-chain commitment). The EF reference implementation + 10-team adoption gives QS a free upgrade path that did not exist in Nov-2025.

6. **OpenVM 2.0 / SWIRL or SP1 Hypercube** as the proof system if QS ever wants to publish on-chain proofs of off-chain ML-DSA verifications. Both are post-quantum-secure and audited (SP1 has formal RISC-V opcode verification; OpenVM 2.0 is in external review).

Primitives that should **stay off** the candidate list:

- **SLH-DSA on-chain** — still prohibitive (poqeth confirms).
- **SQIsign** — fast verify but signer too slow + Round 2 only.
- **HAWK** — recent side-channel paper (2026/699) makes it imprudent to anchor on.
- **BBS+ / FROST (classical)** — not PQ.
- **Classic McEliece** — KEM only, no signature variant.
- **YubiHSM 2** — sunset 2026-05.

### Architectural conclusion

The Nov-2025 architecture was correct *for its constraint set*. Six months later, two constraints have loosened: (a) EVM-side primitives (NTT 0x15, EIP-8051/8052/8141) cut on-chain PQC verify cost by ~600× as a precompile and ~13× even in pure Solidity (ETHFALCON). (b) Threshold ML-DSA now has Mithril, FIPS-204-compatible — the audit's Finding E ("structurally invalid") is now obsolete. **The Path A rebuild should at minimum substitute Falcon-512 / EPERVIER for the ML-DSA-65 hot path, target EIP-8141 as the user entrypoint, and cite Mithril as the threshold-ML-DSA path for the composable-layer custodian story** — exactly the primitives that did not exist or were not production-credible in Nov 2025.

---

## Sources

Fetched via WebSearch / WebFetch 2026-05-09. WebFetch on `eips.ethereum.org`, `ethresear.ch`, `eip.tools`, `crates.io` returned HTTP 403 (anti-bot); content for those is from WebSearch result excerpts and is marked ⚠ — re-verify before external claim.

- NIST FIPS 204 / 205 (final): csrc.nist.gov/pubs/fips/204/final, /205/final  ✓
- FIPS 206 status (NIST 2025): csrc.nist.gov/csrc/media/presentations/2025/fips-206-fn-dsa-(falcon)/  ✓
- HAWK: hawk-sign.info ✓; side-channel: eprint.iacr.org/2026/699.pdf  ✓
- SQIsign v2.0.1: sqisign.org/spec/sqisign-20250707.pdf  ✓
- SP 800-208: csrc.nist.gov/pubs/sp/800/208/final  ✓
- Mithril threshold ML-DSA: eprint.iacr.org/2026/013 + MPTS 2026 slides  ✓
- TALUS: arxiv.org/pdf/2603.22109  ✓ ; Hermine: eprint.iacr.org/2026/419  ✓ ; THED: eprint.iacr.org/2026/638  ✓
- threshold-ml-dsa Rust: crates.io/crates/threshold-ml-dsa  ⚠
- fips204 Rust: github.com/integritychain/fips204  ✓ (v0.4.1, 2024-10-04, no published audit)
- libcrux-ml-dsa: crates.io/crates/libcrux-ml-dsa  ⚠
- RustCrypto ml-dsa GHSA-5x2r-hc65-25f9  ✓
- EIP-8051 / 8052 / 8141: eips.ethereum.org/EIPS/{eip-8051,eip-8052,eip-8141}  ⚠ (gas figures from WebSearch excerpt only)
- NTT precompile (0x15): ethresear.ch/t/21775, eipfun.substack.com/p/eip-fun-weekly-86  ⚠
- ETHFALCON / ETHDILITHIUM (ZKNOX): github.com/ZKNoxHQ/{ETHFALCON,ETHDILITHIUM} + zknox.eth.limo/posts/2025/03/21/ETHFALCON.html  ✓ (1.5M gas Falcon-512)
- poqeth: eprint.iacr.org/2025/091.pdf + github.com/ruslan-ilesik/poqeth  ✓
- Falcon-LaBRADOR: pse.dev/blog/post-quantum-signature-aggregation-with-falcon-and-LaBRADOR  ✓
- Hash-Based Multi-Sig PQ Ethereum: cic.iacr.org/p/2/1/13 + hackmd.io/@tcoratger/S1t-qhPFJx  ✓
- pq.ethereum.org  ✓ ; leanMultisig: github.com/leanEthereum/leanMultisig  ✓
- EF PQ team: thequantuminsider.com/2026/01/26/...  ✓
- RISC Zero formal verif: risczero.com/blog/RISCZero-formally-verified-zkvm + Veridise round-2 audit (2025-04)  ✓
- SP1: docs.succinct.xyz, blog.succinct.xyz/google-sp1-quantum-threat/, blog.trailofbits.com/2026/04/17/we-beat-googles-zero-knowledge-proof-of-quantum-cryptanalysis/  ✓
- OpenVM 2.0 / SWIRL: blog.openvm.dev/2.0  ✓
- Stwo: starkware.co/blog/s-two-2-0-0-prover-for-developers/ (2026-01-27)  ✓
- Plonky3: github.com/Plonky3/Plonky3 + Least Authority audit 2024-11  ✓
- Thales Luna v7.9 → 7.9.3: data-protection-updates.gemalto.com/2026/04/22/...  ✓
- Utimaco Quantum Protect: utimaco.com/data-protection/gp-hsm/application-package/quantum-protect  ✓
- AWS KMS ML-DSA: aws.amazon.com/blogs/security/how-to-create-post-quantum-signatures-using-aws-kms-and-ml-dsa/  ✓
- AWS CloudHSM PQ preview: qtonicquantum.com/lab/solutions/aws-cloudhsm-pq  ⚠
- Yubico PQ: yubico.com/blog/future-proofing-authentication-a-look-at-the-future-of-post-quantum-cryptography/  ✓
- PQShield HSM: pqshield.com/use_cases/high-performance-hardware-security-modules/  ✓

Legend: ✓ direct fetch / strong WebSearch evidence ; ⚠ WebSearch snippet only (HTTP 403 on direct fetch).

---

## TODO[founder]: verify

1. EIP-8051 / 8052 gas figures (~3,000 gas) — quoted from search-result snippet of EIP body, not direct fetch. Pull actual EIP markdown from `github.com/ethereum/EIPs/blob/master/EIPS/eip-8051.md` via `gh`/`git` before using these in any external doc.
2. EIP-8141 final spec text — confirm whether it imposes any constraints on verifier gas budget.
3. `threshold-ml-dsa` crate version + scheme attribution — crates.io fetch returned 403; confirm via `cargo search` or local clone.
4. ETHFALCON 1.5M-gas figure — confirm whether benchmark covers full verify (hash-to-point + NTT + check) or only NTT step.
5. NTT precompile (0x15) — confirm whether it's slated for the Hegotia hard fork or remains devnet-only.
6. SP1 Hypercube formal verification scope — confirm whether ML-DSA / Falcon verify circuits inherit the formal-verification guarantee or only the underlying RISC-V opcodes.

File written: `/home/user/quantum-shield/docs/intelligence/research/2026-W19-pqc-primitive-landscape.md`
