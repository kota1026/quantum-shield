---
agent: qs-compete
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# Quantum Shield — qs-compete W24 Position Paper (2026-06-10)

### 1. Position: Wedge Restatement + Spot-Check Update

The W22 wedge stands: **end-to-end PQ-sound batch ML-DSA-65 verification** — inner signature FIPS 204 compliant, outer aggregation proof a STARK/WHIR system with Keccak Fiat-Shamir, no classical SNARK wrap anywhere.

**Competitive gap assessment — no window-closing event found:**

- **ZKnox (ETHDILITHIUM)**: Active TODAY (June 10 commit: "Signature size is 2420"), focused on Solidity gas optimization. Zero evidence of SP1 integration, WHIR aggregation, or batch verification. Directionally adjacent but not closing on the aggregation + PQ-sound outer proof claim.
- **PSE (now privacy-ethereum org)**: org migration underway, no PQ repositories visible.
- **0xPARC**: Pod2 updated June 10, zero PQC activity; classical curves.
- **QRL**: v4.0.7–4.0.9 (May 30–June 2), own-chain maintenance only.
- **PQShield**: GitHub 404, no signal.
- **Independent search**: two SP1+ML-DSA repos in last 60 days — `ebulgin/qrypta-pu` (ML-DSA-44 + SP1 wrapped in **Groth16/BN254**, single sig, no benchmarks) and `vjb/quantum-safe-cre` (SP1 + ML-DSA + EigenDA, individual sigs, 1.27MB proof). Both are the archetype QS out-runs on PQ-soundness.

**Zero public repositories combine ML-DSA + WHIR. The gap is real.**

New risk: ZKnox is the most likely team to extend from pure-Solidity toward a zkVM prover layer. Current trajectory is the S2 track, not S1+S3. QS has a structural lead in the outer-proof layer.

### 2. Three Concrete Actions

**P0 — Stake the claim with a public artifact before W34 (September).** Minimum viable proof-of-existence: a numbered IACR ePrint preprint with (a) ML-DSA-65 batch SP1 cycle counts at N=1/N=64, (b) WHIR proof size, (c) Solidity amortized gas/sig, (d) explicit theorem statement that neither layer relies on hardness assumptions outside NIST FIPS 204 and the WHIR proximity bound. Submittable on S1+S3 results with S2 partial. Zero dollars, timestamps the claim, gates the RWC 2027 submission (2026-11-16).

**P1 — Competitive benchmark table as a standalone artifact by W27.** Columns: [System] × [Inner PQ-sound?] × [Outer PQ-sound?] × [Aggregation N] × [Gas/sig] × [Proof size] × [Chain]. Rows: QS (projected), ZKnox, ebulgin, vjb. Forces QS to define the benchmark axis before a competitor does; doubles as BD outreach attachment. File under `docs/intelligence/competitive/`.

**P2 — Fireblocks cold outreach (Q2 KPI, overdue).** Their threshold ML-DSA is still paper-stage. Pitch: QS batch verifier drops their on-chain ML-DSA cost an order of magnitude; composable primitive they call, not competing custody. One email, decision tree by W27.

### 3. One Competitive Risk

**ZKnox extends ETHDILITHIUM with an SP1 prover layer before QS publishes S1+S3 results.** They committed today; they have the S2-equivalent largely built. If they wrap in SP1 they'd likely default to Groth16 (classical outer — same pattern as ebulgin). But if they substitute a STARK backend, they close QS's window. **Mitigation**: the S3 guest program (8h) and a KeccakIopCtx proof-of-concept should be the first public commits out of Approach A — a repo generating one verifiable WHIR proof over a single ML-DSA-65 verification, public before W28, stakes the claim. The RWC paper formalizes it; the repo timestamps it.

### 4. Non-Obvious Geopolitical / Commercial Angle

**The White House draft quantum EO (Nextgov, 2026-05) sets 2030 for contractors / 2031-12-31 for federal high-impact systems.** If signed, a 2027-2028 procurement wave follows for audited, benchmarked PQC primitives with academic citations — exactly the artifact QS is building toward RWC 2027. Unsigned as of W22 verification (single-source; founder must confirm via whitehouse.gov). If signed before W30, reference it in the ePrint abstract and BD framing. Japan distribution moat (NTT/FSA rails) is the secondary lever, not the headline.

### 5. Position Summary — Top 3 Actions Ranked

| Rank | Action | Deadline | Founder hours | Why P0 |
|---|---|---|---|---|
| 1 | ePrint preprint (partial S1+S3 results) | W34, before RWC deadline | ~20h write-up | Timestamps the end-to-end PQ-sound claim before anyone pivots to WHIR |
| 2 | Competitive benchmark table | W27 | 6–8h | Stakes the benchmark axis publicly; BD attachment |
| 3 | Fireblocks cold outreach | W27 | 2h | Overdue KPI; "complement, don't compete" window still open |

**Wedge verdict: defensible, not pedantry — but it must be articulable in 30 seconds.**

- **Steelman FOR**: Groth16/BN254 falls to a CDLP-capable quantum adversary. Competitors wrapping ML-DSA in Groth16 ship "PQ inner, classical outer" — as quantum-vulnerable as the weakest link. A real Q-day attacker forges the Groth16 proof, not the ML-DSA signature. Load-bearing security claim, not marketing.
- **Steelman AGAINST**: (a) breaking BN254 DLP may be practically harder than RSA-2048; (b) WHIR's outer security carries its own non-NIST-standardized assumption; (c) Groth16 is practically safe 5–7 years, so this is a 2031+ feature. The RWC paper must answer this explicitly.
- **Resolution**: Frame as "**quantum-honest security model**" — QS makes no security claim requiring classical assumptions in any layer; the (draft) EO 2031 mandate makes the claim operationally relevant today.
