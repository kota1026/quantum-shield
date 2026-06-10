---
status: DRAFT — Tier 2 Phase 2.3 architecture synthesis. Founder picks 1 of 5 in Phase 2.4 meeting.
date: 2026-05-09
parent: docs/intelligence/strategy/2026-W19-5-architecture-audit.md
synthesized_from:
  - docs/intelligence/research/2026-W19-eth-pqc-problem-space.md (Phase 2.1)
  - docs/intelligence/research/2026-W19-pqc-primitive-landscape.md (Phase 2.2)
  - docs/intelligence/strategy/2026-W19-5-architecture-audit.md (W19.5 5-lens audit)
---

# 5 Alternative QS Architectures (2026-05 Path A Candidates)

## Decision context

The Nov-2025 QS architecture (deployed L1Vault `0x07012aeF...7260`, ProverRegistry `0x08e1fc1A...8946`, SPHINCSVerifier `0xD090b5A6...0103`) was correct for its constraint set: no on-chain ML-DSA precompile, no FIPS-204-compatible threshold scheme, no signature-agility EIP, no programmable-EOA verification frame. The Prover Pool + dual-NIST-pair design was the rational workaround for "ML-DSA verify is 1.8M gas in Solidity, SPHINCS+ verify is prohibitive on-chain." Six months later (W19.5 audit) two of those constraints have loosened (EIP-8051 / EIP-8052 / NTT 0x15 / EIP-8141 in motion; Mithril threshold ML-DSA published with Rust crate) and one assumption has reversed (MPC vendors are signalling "build" not "buy", per the Fireblocks "Standardizing MPC Cryptography" cross-industry call).

The W19.5 architecture audit found 5 of 8 load-bearing assumptions degraded across multiple lenses, with the A-vs-C structural contradiction (composable-MPC-layer narrative vs Prover-Pool code) as the hardest finding. The Phase 2.1 problem-space research surfaced 5 community problems (P1 migration-vehicle convergence, P2 legacy-EOA ZK-hidden-pubkey, P3 lattice BIP32, P4 hash-vs-lattice aggregation, P5 threshold-ML-DSA productionization) that the Nov-2025 architecture does not address. The Phase 2.2 primitive landscape confirmed the new building blocks are real but several are unaudited research code (`threshold-ml-dsa` crate, ETHFALCON's "DO NOT USE IN PRODUCTION" warning, leanXMSS interop devnets only).

The 5 alternatives below take the W19.5 audit's "Path A is on the table" decision as input and ask: if QS rebuilds, what shape does it take? Each alternative addresses an explicit subset of P1–P5, picks specific primitives from the 2026-05 inventory, and is honest about cost-to-rebuild including audit time. None is "the answer"; the comparison matrix and the founder open-questions section are how this document earns its keep.

What stays in any rebuild: SHA3-256 hashing convention (CP-1 compliant, no incentive to change); L3 governance / veQS topology on Arbitrum Sepolia (W19.5 lens D verdict KEEP); the SR_0 split-receipt insight (a real contribution, even if its scope is reframed). What is at risk in every rebuild: the deployed L1 contract address triple, the Prover Pool framing as load-bearing, the dual-NIST-pair as fixed schema rather than registry entry.

---

## Architecture A: EIP-native QS — thin attestation registry on top of EIP-8141 + EIP-8051

- **Elevator**: When EIP-8141 (Frame Transaction / programmable verifier) and EIP-8051 (ML-DSA-44 precompile, ~3k gas proposed) ship in Hegotia (planned 2H-2026), on-chain PQC verify becomes cheap enough that Prover Pool is unnecessary. QS becomes a thin `AttestationRegistry` contract that stores per-account `(scheme_id, pq_pubkey_hash, vault_metadata)` tuples and lets the EIP-8141 verifier do the actual signature check.
- **Problem set addressed**: P1 (registry convergence — QS becomes an *implementer* of the EIP-7932 algorithm registry pattern at the application layer), P5 (partial — registry can record threshold-MLDSA as a scheme variant).
- **Primitive choices**: ML-DSA-44 (level II) for the user hot path (matches EIP-8051 scope, sig 2,420 B); Falcon-512 / EPERVIER (FIPS 206 IPD) as a registered alternate scheme (sig 666 B, recovery API like ecrecover); SHA3-256 for receipt hashing; no SPHINCS+ on-chain (no precompile candidate, prohibitive cost per poqeth eprint 2025/091); no separate Prover Pool.
- **L1 contract surface**: NEW `AttestationRegistry.registerScheme(uint16 algId, address verifier)`, `AttestationRegistry.bind(address account, uint16 algId, bytes32 pqPubkeyHash)`, `Vault.lockUnderScheme(account, algId, sigBytes)`. REMOVED `ProverRegistry` (deployed at `0x08e1fc1A...8946`, becomes deprecated), removed VRF-based Prover selection, removed Observer Challenge slashing. KEPT receipt-format primitive (SR_0 = SHA3-256(lock_params || pq_pubkey)) — that survives as the registry leaf format.
- **Off-chain components**: Backend simplifies dramatically — no AutoClaim, no Prover coordination, no AI Prover. Backend becomes API-only: serve registry leaves, serve historical receipts, sign user TXs via WASM front-end. RabbitMQ probably removable. The L3 Aegis layer (CoreLayer at `0xb04F4D...DBf0`) keeps governance / veQS roles and loses any custody-flow role.
- **Trust model**: Trust degrades from "Prover quorum + Observer challenge" to "EIP-8141 verifier code + EIP-8051 precompile correctness". This is *honest* — it pushes the trust to Ethereum L1 protocol consensus rather than QS's bespoke quorum. Composability with arbitrary AA wallets is high.
- **Cost to rebuild**: 3-4 weeks engineering for new contracts + 6-8 weeks audit (critical-path because vault holds funds) + 2-3 weeks frontend rewire = **11-15 weeks calendar**, assuming Hegotia ships on time. If Hegotia slips, the architecture is unusable until it doesn't.
- **Strengths**:
  - Architecturally honest in the post-Hegotia world.
  - Resolves W19.5 A-vs-C contradiction by removing C entirely.
  - Aligns with EF preference for protocol-native solutions over bespoke quorums.
  - Smallest surface area = smallest audit cost.
  - Naturally compatible with EIP-7932 if EIP-7932 wins the convergence race instead of EIP-8141.
- **Weaknesses**:
  - **Steelman objection**: "If EIP-8141 ships, why does the world need QS at all? The registry is 200 lines of Solidity that any wallet team will write themselves in an afternoon. The defensibility is zero." This is the hardest critique. QS would need a different moat — convening role, Japan-FSA citation, ERC authorship — none of which require deploying contracts.
  - Hegotia timeline risk: if 8141 is removed from Hegotia (its "Consider for Inclusion" status is not "Confirmed"), the architecture has no host fork.
  - Ditches the entire MPC-vendor wedge (W19 narrative) without a replacement.
  - Loses the "decentralized custody protocol" framing that distinguishes from QRL.
  - ML-DSA-44 vs ML-DSA-65 has not been validated against ESP / CNSA 2.0 expectations (level II vs level III is a regulatory question).
- **EIP-8141 compatibility**: yes — it *is* an EIP-8141 reference application.
- **ETHResearch defensibility**: would survive review *only if* framed as "reference implementation + ERC for attestation receipts". If framed as a competing custody product, reviewers will say "use 8141 directly, why do we need QS." The audit's Path C ("standards-anchoring pivot") is structurally this architecture without the rebuild cost.

---

## Architecture B: Threshold-ML-DSA-first QS — reference implementation of Mithril-style custody

- **Elevator**: Take the Fireblocks "Standardizing MPC Cryptography" cross-industry call literally. Position QS as the *open reference implementation* of threshold ML-DSA custody, leveraging the Mithril paper (eprint 2026/013, USENIX Sec '26) and the published `threshold-ml-dsa` Rust crate. The protocol is a deployable demonstration that a 3-of-5 or 4-of-7 threshold ML-DSA signing flow can complete in <1 s WAN with FIPS-204-compatible aggregate signatures.
- **Problem set addressed**: P5 directly (this is the productionization play); P1 partially (registers as a "threshold-ml-dsa-65" scheme variant in any registry that emerges); P3 partially via Hermine (lattice FROST-like, eprint 2026/419, Raccoon-based — non-FIPS but supports HD-style derivation paths).
- **Primitive choices**: Mithril threshold ML-DSA-65 (FIPS-204-compatible, RSS-based, 3 online rounds, ≤6 parties, ≤1 MB comms/party); SPHINCS+ as emergency single-party fallback (kept from current architecture for break-glass); the unaudited `threshold-ml-dsa` Rust crate from the lattice-safe org as starting code, *with full re-audit before mainnet*.
- **L1 contract surface**: KEEP `L1Vault` ABI shape but generalize the signature input from "single ML-DSA sig" to "aggregate threshold sig + party set commitment". NEW `ThresholdGroupRegistry.createGroup(parties[], threshold)`, `Vault.lockWithThresholdSig(groupId, sig, partySetBitmap)`. ProverRegistry repurposed as "approved threshold-group registry" — semantically much closer to its current code than under Architecture A.
- **Off-chain components**: Backend becomes a multi-party signing coordinator (RabbitMQ stays, plays a real role for cross-party message routing). New off-chain protocol: party discovery, round-1/round-2/round-3 message exchange, abort handling, replay protection. This is genuine new engineering.
- **Trust model**: Threshold trust — t-of-n parties cannot collude below threshold. Stronger than single-key custody, weaker than fully decentralized. Maps cleanly to Fireblocks / BitGo / Coinbase Custody mental model (they already think in t-of-n).
- **Cost to rebuild**: 6-8 weeks for off-chain MPC coordinator (this is hard — message authentication, abort safety, party impersonation defenses) + 4-5 weeks contracts + 8-10 weeks audit (the threshold-ml-dsa crate is unaudited research code; a serious audit is non-optional here) + 3-4 weeks frontend = **21-27 weeks calendar**. Realistically 6 months.
- **Strengths**:
  - Directly addresses the W19.5 audit's "G is existential, evidence leans to build" finding by *being* what custodians would build.
  - Solves the W19 "MPC composable layer" narrative by becoming the open standard rather than the integrator.
  - FIPS-204 compatibility is a real regulatory advantage (ESP / CNSA 2.0 / DORA Art.28).
  - Real published academic basis (USENIX Sec '26 paper) — defensible at ethresear.ch.
- **Weaknesses**:
  - **Steelman objection**: "Fireblocks has 200 engineers and is publicly committed to building MPC-PQ themselves. By the time QS ships an audited threshold-ML-DSA implementation, Fireblocks will have shipped one for their internal stack. Custodians have no reason to adopt the QS reference implementation over their own internal one." This is real. The defense is "open standard wins regulatory citation even if not adopted as code", which is not a software-product defense.
  - `threshold-ml-dsa` crate is unaudited research code; one audit cycle is not enough — likely needs 2-3 audit cycles before institutional custody risk-acceptance.
  - 6-month rebuild eats most remaining runway per CFO model.
  - The "MPC coordinator" is not a blockchain protocol — QS the brand drifts away from "Ethereum custody" toward "MPC infrastructure" which is a different market.
  - No story for P2 (legacy EOA migration) or P4 (aggregation).
- **EIP-8141 compatibility**: partial — threshold sigs can be wrapped in an EIP-8141 verifier, but the aggregation logic lives off-chain.
- **ETHResearch defensibility**: yes, with strong academic footing. The Mithril paper plus a deployed open-source coordinator is publishable. Risk: ethresear.ch audience may push back on "is this actually Ethereum-native or just MPC infrastructure that happens to settle on Ethereum?".

---

## Architecture C: Migration-vehicle QS — pivot from custody to PQ migration tooling

- **Elevator**: Stop selling custody. The largest market problem is *getting the existing $400B of ETH-class assets onto PQ rails without losing the addresses*. QS becomes a migration-tooling protocol: a registry-based per-account agility layer (P1) plus a ZK-hidden-pubkey legacy-EOA upgrade flow (P2). The product is the migration path itself.
- **Problem set addressed**: P1 (registry-based per-account agility) and P2 (legacy EOA migration via ZK-hidden-pubkey) directly; P3 partially (BIP32 derivation needs to be addressed for any wallet integration).
- **Primitive choices**: ML-DSA-65 *and* Falcon-512 (registry permits both; user/wallet picks); SP1 Hypercube zkVM (formally verified RISC-V opcodes per Nethermind+EF audit) to host the STARK proof of "I know the BIP39 seed for legacy EOA X and I am binding new PQ pubkey Y" per ethresear.ch thread 24754 / eprint 2026/352 (Kiraz & Kardas); SHA3-256 receipt hashing; OpenVM 2.0 / SWIRL as a fallback prover if SP1 cost is prohibitive.
- **L1 contract surface**: NEW `MigrationRegistry.upgrade(address legacyEoa, uint16 newAlgId, bytes32 newPqPubkeyHash, bytes zkProof)`, `MigrationRegistry.lookup(address) returns (uint16 algId, bytes32 pqPubkeyHash)`. NEW `STARKVerifier` (or precompile call when one exists). REMOVED Vault entirely — there is no custody. ProverRegistry repurposed as "STARK proof verifier registry" or removed.
- **Off-chain components**: Frontend becomes a migration wizard (paste seed, generate PQ keypair, generate STARK proof, submit). Backend serves proof generation either client-side (WASM zkVM is ~100-300 MB which is challenging) or via a subsidized prover service. The SR_0 receipt insight survives as the post-migration attestation format.
- **Trust model**: User trusts SP1 / OpenVM correctness (formally verified opcodes help here) and ZK proof soundness. No multi-party trust assumption, no quorum — this is a single-user upgrade flow. Much simpler trust model than custody architectures.
- **Cost to rebuild**: 4-5 weeks contracts (small surface, but STARK verifier integration is non-trivial), 8-12 weeks ZK circuit design and audit (this is the hard part — the STARK proof of seed-knowledge needs to be both sound and gas-feasible), 6-8 weeks frontend (migration wizard is UX-critical), 8-10 weeks audit. Total **26-35 weeks calendar**.
- **Strengths**:
  - Addresses a *much* larger market problem (every existing ETH holder, not just future custody depositors). This is the W19.5 audit's "Path C is correctly oriented but undersized" critique answered head-on.
  - Aligns with eprint 2026/352 (Kiraz & Kardas) and ethresear.ch thread 24754 — there is genuine community pull for this.
  - Defangs the QRL / Coinbase / Fireblocks competitive question entirely (they all need migration tooling too; QS becomes their tool, not their competitor).
  - Survives EIP-8141 landing (in fact, *needs* 8141 or 7932 to land — the registry sits in the EIP's verification frame).
- **Weaknesses**:
  - **Steelman objection**: "ZK-hidden-pubkey legacy-EOA migration is what the EF PQ team itself is going to build into EIP-8141 as a canonical migration path. A bespoke migration registry is a temporary value bridge that gets swept aside the moment 8141 specifies its own. QS gets exactly the lifespan of pre-Hegotia → Hegotia, which is 6-12 months." This is a real concern. The defense is "we can be the canonical reference impl that 8141 cites" but that's a co-design relationship with EF, not a sustainable product.
  - Gas cost of STARK verifier on-chain is 5-15M gas per upgrade tx (per Phase 2.1 research); needs precompile to be cheap, and STARK precompile is not on the Hegotia roadmap.
  - No P5 story — threshold custody is unaddressed.
  - Six-month rebuild on what is essentially throwaway tooling.
  - Revenue model is unclear (charge per migration? subsidize for ecosystem citation?).
- **EIP-8141 compatibility**: yes — this *is* a migration vehicle for EIP-8141 / EIP-7932 deployment.
- **ETHResearch defensibility**: high; the legacy-EOA migration problem is one of the top-3 community problems per Phase 2.1 research, and QS would be entering a thread (24754) with active engagement. Risk: the founder is not Aayush Gupta or Kiraz/Kardas — entering a thread requires academic credibility that the W19.5 audit identified as not yet established.

---

## Architecture D: ZKVM-attested QS — single ZK proof replaces Prover Pool

- **Elevator**: The W19.5 audit's A-vs-C contradiction (composable-MPC-layer vs Prover-Pool) is resolved by removing the Prover Pool entirely and replacing it with a single SP1 / RISC Zero / OpenVM ZK proof of "ML-DSA verify of (msg, sig, pk) returned true". The lock flow becomes: user signs ML-DSA-65 client-side; off-chain prover (single, not a quorum) generates ZK proof; L1 verifies the (much cheaper) ZK proof. No quorum, no VRF, no Observer Challenge.
- **Problem set addressed**: P1 partially (the proof can be generic over any signature scheme — naturally agility-friendly), P4 (the zkVM is itself an aggregator — a single proof can attest to N signatures), P5 indirectly (threshold sigs can be verified inside the zkVM).
- **Primitive choices**: ML-DSA-65 inside SP1 Hypercube (formally verified RISC-V opcodes; Trail of Bits + Veridise reviewed; the Google Q-day ZKP from April 2026 is a real-world reference for SP1+ML-DSA-class circuits) or RISC Zero R0VM 2.0 (Veridise round-2 audited); SHA3-256 receipt hashing; Groth16 wrapper for cheap on-chain verify (~250k gas) or direct STARK verify via Stwo / Plonky3 verifier contracts. Optionally Falcon-512 inside the same zkVM if the gas reduction is worth the circuit cost.
- **L1 contract surface**: KEEP `L1Vault` shape but replace SPHINCS+ verifier with `Groth16Verifier` or `StarkVerifier`. `Vault.lockWithProof(proof, publicInputs)` where publicInputs = (msgHash, pkCommitment, recipient, amount). REMOVED `ProverRegistry` (deployed `0x08e1fc1A...8946`, becomes deprecated), REMOVED VRF, REMOVED Observer Challenge, REMOVED slashing. The deployed `SPHINCSVerifier` at `0xD090b5A6...0103` is replaced by the proof-system verifier.
- **Off-chain components**: Backend becomes a proof-generation service (latency: SP1 ~minutes, RISC Zero similar, OpenVM 2.0 / SWIRL <300 KB proof but compile time matters). This is the new operational concern. AutoClaim becomes "auto-generate proof on user TX" rather than "wait for VRF prover quorum".
- **Trust model**: Trust = (zkVM correctness, proof system soundness, ML-DSA inside-zkVM circuit correctness). Formal verification of SP1 opcodes (Nethermind+EF audit) is real; the ML-DSA circuit on top of those opcodes is *not* covered by that audit. So the marginal audit risk is the ML-DSA circuit, not the zkVM.
- **Cost to rebuild**: 3-4 weeks contracts (small surface), 10-14 weeks ML-DSA-in-zkVM circuit work + audit (this is genuine cryptographic engineering), 4-6 weeks proof-service infrastructure, 6-8 weeks audit on the full stack. Total **23-32 weeks calendar**.
- **Strengths**:
  - Resolves W19.5 A-vs-C contradiction by removing C.
  - Naturally aggregation-friendly (a single proof over N signatures answers P4).
  - Aligns with EF formal-verification thrust ($20M Protocol Snarkification) — narrative coherence with EF priorities is high.
  - SP1's Google-Q-day-ZKP April-2026 reference (per Trail of Bits blog) is a credibility anchor.
  - The proof-system can be substituted (SP1 → RISC Zero → OpenVM) without changing on-chain surface.
- **Weaknesses**:
  - **Steelman objection**: "If EIP-8051 ships with a 3k-gas ML-DSA-44 precompile in Hegotia, why generate a multi-minute ZK proof to verify a signature the precompile does in 3k gas? The architecture is over-engineered for a problem the protocol is about to solve natively." This is the killer critique. ZKVM-attested-QS is the *transition technology* between "no precompile" and "precompile lands"; its useful lifespan is the gap window.
  - Proof generation latency (minutes) is a worse UX than the current Prover Pool (seconds-to-minutes).
  - ML-DSA-in-zkVM circuits are not yet a solved engineering problem at audit-grade — Medium walkthroughs exist but no production-deployed equivalent.
  - No P2 (legacy EOA) or P3 (HD wallet) story.
  - The "single off-chain prover" reintroduces a centralization point that Prover Pool was originally designed to avoid (steelman: "why decentralize and then re-centralize?").
- **EIP-8141 compatibility**: yes — the ZK proof verifier can sit inside an 8141 verification frame.
- **ETHResearch defensibility**: medium-high. The ML-DSA-in-zkVM angle is publishable. Risk: ethresear.ch reviewers will ask "why not just wait 6-12 months for EIP-8051 and skip the zkVM?".

---

## Architecture E: Aggregator QS — Falcon + LaBRADOR cross-custodian aggregation layer

- **Elevator**: Solve P4 (signature aggregation) by aggregating Falcon-512 attestations from multiple custodians via the LaBRADOR lattice SNARK (PSE blog 2025-05). QS becomes the cross-custodian aggregation layer: each custodian signs their own deposit attestations with Falcon, and QS produces a single aggregate proof posted on L1. The product is the aggregation layer between custodians and L1.
- **Problem set addressed**: P4 directly (lattice aggregation alternative to leanXMSS hash-aggregation); P1 partially (a registry of which Falcon variant each custodian uses); intentionally does *not* address P2/P3/P5.
- **Primitive choices**: Falcon-512 (FIPS 206 IPD, 666-byte sig — ~5× smaller than ML-DSA-65, important when aggregating many sigs); LaBRADOR lattice SNARK for aggregation (research-only currently, no production library — this is a real risk); EIP-8052 precompile (~3k gas proposed) for the per-signature verify path before aggregation; SHA3-256 commitment hashing.
- **L1 contract surface**: NEW `AggregationVault.submitAggregate(bytes proof, bytes32 batchCommitment, address[] custodians)`, `AggregationVault.proveInclusion(bytes32 attestationHash, bytes inclusionProof)`. KEPT current Vault as legacy interface. ProverRegistry repurposed as "approved aggregator registry" (parties allowed to submit aggregates).
- **Off-chain components**: A LaBRADOR aggregator service — receives signed attestations from N custodians, generates the aggregate proof, posts it. Backend becomes aggregation-coordinator. This is a new operational role and a single point of failure (or needs decentralization, which adds complexity).
- **Trust model**: Custodian-attested aggregation. Custodians sign their own attestations (own trust); aggregator combines them (no trust required — proof is verifiable); on-chain verifier checks the LaBRADOR proof. Trust = (custodian honesty for their own attestation, LaBRADOR soundness, Falcon soundness).
- **Cost to rebuild**: 4-5 weeks contracts, **12-16 weeks LaBRADOR implementation** (this is research-grade cryptography being productionized — there is no shipped library; the PSE blog post is a sketch, not code), 6-8 weeks audit (LaBRADOR audit is hard because it's novel), 4-6 weeks integration with at least one custodian (without an integration partner, the architecture is theatre). Total **26-35 weeks calendar** assuming a custodian partner.
- **Strengths**:
  - Solves a real problem (P4) on the lattice side of the hash-vs-lattice religious split.
  - Falcon-512's small sig size makes aggregation gas-economics genuinely attractive.
  - Differentiated from the EF leanXMSS / leanMultisig play (which is hash-side) — QS occupies the lattice-aggregation niche that PSE is actively researching but no one is shipping.
  - The MPC-vendor wedge survives in mutated form: "you sign with Falcon, we aggregate".
- **Weaknesses**:
  - **Steelman objection**: "There is no production LaBRADOR library. PSE's blog post is research and PSE itself has not productionized it. QS would be implementing novel lattice-SNARK cryptography from scratch as a solo founder, which is the highest-risk audit-cost-explosion path of any of the five alternatives. Realistically this is an 18-month engineering programme, not 6 months." This is fatal at solo-founder scale. The audit cost alone could exceed the entire ESP grant.
  - Aggregation is validator-side (P4) per Phase 2.1 — EF's operational bet is hash-based at the validator layer. Custody-side aggregation may not have the same urgency.
  - Requires a custodian partner to be more than a research artifact; W19.5 audit shows zero confirmed custodian × PQC-vendor partnerships exist publicly.
  - No P2/P3/P5 story.
- **EIP-8141 compatibility**: partial — aggregate proofs sit outside the per-account 8141 frame.
- **ETHResearch defensibility**: high if the LaBRADOR work is real, low if the implementation is a research shim. The "lattice-side answer to leanXMSS" framing is a defensible angle but credentials matter — solo founder vs PSE / Setty / Coratger camps.

---

## Comparison matrix

| Dimension | A: EIP-native | B: Threshold-ML-DSA | C: Migration vehicle | D: ZKVM-attested | E: Aggregator |
|---|---|---|---|---|---|
| Problems addressed | P1, P5(part) | P5, P1(part), P3(part) | P1, P2, P3(part) | P1(part), P4, P5(indir) | P4, P1(part) |
| Primary primitive | ML-DSA-44 + EIP-8051 | Mithril threshold ML-DSA-65 | ML-DSA-65 + Falcon + SP1/STARK | ML-DSA-65 in SP1/RISC Zero | Falcon-512 + LaBRADOR |
| Audit-readiness of primitives | medium (8051 unaudited spec) | low (`threshold-ml-dsa` unaudited) | medium-low (STARK circuit novel) | medium (zkVMs audited, circuit not) | very low (LaBRADOR research-only) |
| Calendar weeks to rebuild | 11-15 | 21-27 | 26-35 | 23-32 | 26-35+ |
| Hard external dependency | Hegotia / EIP-8141 ships | None (paper exists, crate exists) | EIP-8141 or 7932 ships; STARK precompile would help | None hard; precompile makes it obsolete | LaBRADOR productionization |
| Survives if Hegotia slips | No | Yes | Partially | Yes | Yes |
| Resolves A-vs-C audit finding | yes (removes C) | reframes (C becomes threshold) | yes (removes both) | yes (removes C) | reframes (C becomes aggregator) |
| MPC-vendor wedge alive | dead | reborn as standard | dead | dead | mutated |
| Distinguishes from QRL | weak | strong (FIPS-204 thresh) | strong (migration) | medium | strong (lattice aggreg) |
| ESP / regulatory fit | strong (NIST-anchored) | very strong (FIPS-204) | medium | medium | medium |
| ethresear.ch survivability | conditional on framing | strong | strong | medium | conditional on credentials |
| Founder solo-ability | high | medium | medium | medium-low | very low |
| Replaces deployed L1 | yes | partial | yes | partial | additive |

---

## Recommended sequencing (per architecture)

**A (EIP-native)**: (1) Draft ERC for AttestationRegistry leaf format reusing SR_0. (2) Watch Hegotia confirmations through 2026-Q3. (3) Deploy a *parallel* registry contract on Sepolia not replacing the deployed Vault — keep current Vault as legacy. (4) Submit ERC + reference impl as the W19.5 Path C output. (5) If Hegotia confirms 8141, rewire frontend at fork time. Order minimizes pre-Hegotia commitment.

**B (Threshold-ML-DSA)**: (1) Audit + harden the `threshold-ml-dsa` crate with a contracted cryptographer (this is the gating dependency). (2) Build off-chain coordinator with explicit abort-safety invariants. (3) Ship a 3-of-5 demo on Sepolia using the existing Vault ABI extended with threshold sig parsing. (4) Submit to NIST IR 8214C threshold-PQ call. (5) Approach Fireblocks / Anchorage with the demo as the standardization anchor. Order leverages the academic citation as the credibility ladder.

**C (Migration vehicle)**: (1) Engage with ethresear.ch thread 24754 + eprint 2026/352 authors directly (Kiraz / Kardas) — this is *their* problem space, QS enters as a collaborator not a competitor. (2) Choose proof system (SP1 vs OpenVM 2.0 vs Stwo) based on circuit benchmark for BIP39 → PQ-keypair STARK. (3) Ship the migration wizard frontend before the contracts (UX is the product). (4) Deploy MigrationRegistry on Sepolia. (5) Co-author EIP that specifies the migration receipt format. Order front-loads the academic engagement that the founder currently lacks.

**D (ZKVM-attested)**: (1) Pick a single zkVM (recommend SP1 given the Google-Q-day-ZKP precedent and Nethermind+EF formal-verification audit). (2) Implement and audit ML-DSA verify circuit before any contract work. (3) Wrap circuit in Groth16 for cheap on-chain verify; deploy Vault redirect to new verifier. (4) Run side-by-side with current Prover Pool for 1-2 months to compare gas/latency/UX. (5) Deprecate Prover Pool. Order minimizes contract churn and lets data drive the cutover.

**E (Aggregator)**: (1) Do not start without a confirmed custodian partner. (2) If partner exists, contract a lattice cryptographer (PSE / academic) as co-author for LaBRADOR implementation — solo-founder-shipping-LaBRADOR is implausible. (3) Ship single-custodian (N=1) aggregate first as proof of concept. (4) Scale to N=3. (5) ERC for the aggregation receipt format. Order gates on the non-engineering precondition (partner) before any code.

---

## Architectures explicitly rejected

**R1. SQIsign-based custody**. SQIsign's 177-335 byte sig is the smallest of any candidate, but the signer is "very slow" (Phase 2.2), it is NIST Round 2 only, reference C only, and isogeny-based crypto has had multiple late-stage breaks (SIDH 2022). Anchoring custody on Round 2 isogeny crypto is irresponsible.

**R2. HAWK-based custody**. HAWK-512's 555-byte sig is competitive with Falcon, but eprint 2026/699 ("HAWK with Hint") published a side-channel key-recovery in 2026. NIST Round 2 only. No production Rust. The side-channel paper is recent enough that the scheme has not absorbed mitigations.

**R3. SLH-DSA / SPHINCS+ as primary on-chain verifier**. poqeth (eprint 2025/091, AsiaCCS '25) measured full SPHINCS+ verify as "prohibitively costly except in optimistic Naysayer mode". No EIP precompile candidate exists. The current QS use of SPHINCS+ as Prover-Pool co-sign is the *only* place hash-based fits, and it goes away in 4 of the 5 alternatives.

**R4. Classic McEliece custody**. KEM-only, no signature variant exists. Public keys 261 KB to 1.3 MB. Not a custody candidate.

**R5. BBS+ / FROST custody**. BBS+ and FROST are DLP-bound, broken under Shor. The W19.5 audit's Finding E ("FROST/threshold-Dilithium structurally invalid in 2025") was correct; the 2026-Q1 fix is Mithril (Architecture B), not classical FROST.

---

## Open questions for founder

1. **Hegotia confidence**: how much of the architecture should be bet on Hegotia (and EIP-8141 specifically) shipping in 2H-2026? Architectures A and C are most exposed; B and D survive a Hegotia slip.

2. **Solo-founder bandwidth vs hiring**: Architecture E requires a lattice cryptographer co-author and Architecture B benefits from one. The W19.5 audit's CFO context implied limited runway; is hiring a contracted cryptographer (~$30-50k for 3-month engagement) within budget if it gates the architecture decision?

3. **Wedge replacement**: Architectures A and C abandon the MPC-vendor wedge entirely. Architecture B reframes it as standards-authorship (which is the W19.5 Path C). Architectures D and E either kill or mutate it. Which wedge is the founder willing to fully concede?

4. **Migration vs custody as the strategic frame**: Architecture C is the largest market opportunity but requires the founder to enter a research thread (ethresear.ch 24754 / Kiraz-Kardas) where current credentials are not yet established. Is the founder willing to spend 1-2 months on academic relationship-building before any code?

5. **Current deployed Sepolia contracts as legacy vs replace**: Architectures A, C, D replace the Vault. B, E extend it. The deployed addresses (`0x07012aeF...7260`, `0x08e1fc1A...8946`, `0xD090b5A6...0103`) are referenced in the ESP application body and W20 buyer-call materials. Migration plan affects every external commitment; is the founder prepared to communicate "here is the v2 deployment, here is the v1 deprecation timeline" externally?
