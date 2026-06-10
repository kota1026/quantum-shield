---
status: DRAFT — research output, founder must verify before any external claim
date: 2026-05-09
parent: docs/intelligence/research/2026-W19-architecture-alternatives.md
purpose: Find every EF/PSE/0xPARC published PQC problem statement; map to QS Path A architecture alternatives
---

# EF PQC Grant Problem Statements (2025-2026)

## Scope and method

Search across `esp.ethereum.foundation`, `blog.ethereum.org`, `pq.ethereum.org`, `pse.dev`, `0xparc.org`, `ethresear.ch`, `ethereum-magicians.org` for every EF (and EF-adjacent) PQC problem statement / RFP / wishlist / grant call published since 2025-01. WebFetch returned HTTP 403 for every EF property direct URL; confidence ratings reflect that verification was via search snippets + third-party press (Coindesk, The Block, Crowdfund Insider, Quantum Insider), not raw page content. Founder must reverify before external use.

Mapping target = the five Path A alternatives in `2026-W19-architecture-alternatives.md`: A (EIP-native attestation registry on EIP-8141/8051), B (threshold-ML-DSA reference impl), C (migration-vehicle pivot), D (ZKVM-attested), E (Falcon+LaBRADOR aggregator).

---

## Direct PQC problem statements found

### 1. ESP Wishlist — "Smart Account Passkey Support"

- `esp.ethereum.foundation/applicants/wishlist/passkey-support` (403). Program launched 2025-11-03. "New users cannot manage seed phrases. Passkeys = simple, secure auth via fingerprint/face/device credentials preserving self-custody. Implement natively in smart accounts (ERC-4337 / ERC-7579)." References Ithaca/Porto, Base Account.
- **Map**: PARTIAL **A** (registry could record passkey + ML-DSA dual); WEAK **C** (migration wizard onboarding); NONE B/D/E. Wishlist is AA-framed, not PQ-framed. Confidence MEDIUM.

### 2. ESP Wishlist + RFP suite (general)

- `/applicants/rfp`, `/applicants/wishlist` (403); framing 2025-11-03. Two channels: **Wishlist** ("key gaps; propose ideas"), **RFPs** ("focused problems, prescriptive, time-bound"). Domains: cryptography, privacy, app-layer, security, community. **No single-line PQC RFP** surfaced; closest are #1 and the AI-Powered Protocol Security RFP (`phdfp26/phdfp-rfpd1`).
- **Map**: Channel, not problem. A/C fit cryptography+security; B fits cryptography+standards; D fits cryptography+ZK; E fits cryptography (lattice). Confidence HIGH on structure; MEDIUM on absence-of-PQC-RFP (can't fully prove negative).

### 3. EF Poseidon Prize ($1M umbrella)

- `poseidon-initiative.info/`; EFPG (poseidon@ethereum.org); 2026-01 press. Apply 2026-06-01; ePrint end-2026; runs to 2029-01-01.
- Pay-per-paper bounty for cryptanalytic attacks on reduced-round Poseidon-256/64/31 improving on the survey baseline. Min $5,000; total fund $90,000 vs $1M umbrella discrepancy in reporting — verify.
- **Map**: NONE. Hash cryptanalysis, not custody/migration. Listed for completeness. Confidence HIGH.

### 4. EF Proximity Prize ($1M)

- `proximityprize.org/`. Originally 2024; active 2026. $1M bounty for the up-to-capacity proximity-gaps conjecture for Reed-Solomon codes / Mutual Correlated Agreement. Mathematical-research bounty.
- **Map**: NONE direct, MARGINAL **D**. **Important**: popular press conflates with PQC; it is ZK-SNARK foundations work whose PQ relevance is only via "hash-based SNARKs (FRI/WHIR) are PQ-friendly." Do not cite as PQC alignment. Confidence HIGH.

### 5. ethresear.ch — "Tasklist for post-quantum ETH" (thread 21296)

- `ethresear.ch/t/tasklist-for-post-quantum-eth/21296` (snippet only). Active 2024-Q4 → 2026. Community-curated PQ-Ethereum migration tasklist. Confirmed items: **replace BIP32 hdkey derivation** with PQ equivalent (= QS problem P3); PQ sig aggregation at consensus (`leanXMSS / leanSig / leanMultisig / leanSpec`); PQTS at tx layer (#6); replace BLS validator scheme with hash-based; BIP39 (pbkdf2-sha512) + EIP2333 withdrawal keys flagged still secure. No direct funding — research thread. EF-funded teams (ZKnox, Coratger, PSE) work against this list.
- **Map**: STRONG **C** (BIP32 replacement = legacy-EOA/HD-derivation, C's core); PARTIAL **A** (registry); PARTIAL **D** (zkVM aggregation overlaps leanMultisig motivation). Confidence HIGH on existence, MEDIUM on per-item wording.

### 6. ethereum-magicians — Post-Quantum Transaction Signature (PQTS) Breakout

- `ethereum-magicians.org/t/.../27554` + breakouts #2/#3/#6. Kickoff 2026-02-04; biweekly; led by Antonio Sanso (EF). User-facing PQ tx-layer security: PQ precompiles (EIP-8051 ML-DSA), AA (EIP-8141 Frame, EIP-7702 delegation, EIP-7932 secondary sigs, EIP-7693 backward-compat migration, EIP-6404 SSZ), long-term tx-sig aggregation via leanVM. Protocol WG; outputs feed Hegotia (2H-2026) inclusion.
- **Map**: STRONG **A** (8141+8051 are A's preconditions); STRONG **C** (7693/7702/7932 are migration EIPs); MEDIUM **B** (threshold-ML-DSA as "scheme variant"); WEAK **D**; NONE **E** (per-account, not aggregator). Confidence HIGH.

### 7. PSE — "Post-Quantum Signature Aggregation with Falcon + LaBRADOR"

- `pse.dev/blog/post-quantum-signature-aggregation-with-falcon-and-LaBRADOR` (2025-05-19). Project page `pse.dev/projects/post-quantum-cryptography`. **Critical caveat**: 2026 search results report it "monitored for bug fixes but not under active feature development" — published research, not "looking for contributors." "Use LaBRADOR (lattice SNARK, CRYPTO'23) to combine Falcon sigs into a single succinct argument." PSE is EF-funded; no separate RFP.
- **Map**: STRONG **E**; WEAK others. **Critical**: W19 flagged "no production LaBRADOR library; PSE blog is research not code." 2026 maintenance-mode status *confirms* — E's primitive has *less* active EF backing in 2026 than 2025. Confidence HIGH.

### 8. PSE — "Towards a Quantum-Safe P2P for Ethereum"

- **Source**: `pse.dev/blog/towards_a_quantum-safe_p2p_for_ethereum` (2025). PQC on Ethereum P2P "currently impractical" (PQ keys/sigs too large for UDP); QUIC + composite keys flagged as future paths. NONE map to any QS architecture (networking layer). Confidence HIGH; QS-relevance LOW.

### 9. EF Q1-2026 grant allocation (zkVM formal verification)

- `blog.ethereum.org/2026/04/29/allocation-q1-26` (403); covered `crypto.news` 2026-04-29. Q1 2026 categories: "quantum-resistant + homomorphic mixed-encryption; deeper Poseidon analysis; Gröbner basis attacks on algebraic structures; **formal verification of RISC-V-based zkVM**." Total round $32.6M / 101 projects (founder reverify; figure may be Q1 2025).
- **Map**: STRONG **D** (RISC-V zkVM formal verification = D's substrate; SP1 Hypercube named beneficiary; ArkLib under $20M Protocol Snarkification umbrella); MEDIUM **A/B**; WEAK **E**. Confidence MEDIUM on wording, HIGH on direction.

### 10. ZKnox — EF grant (Feb 2025) — funded precedent

- **Source**: `zknox.eth.limo/posts/2025/03/21/ETHFALCON.html`; EF X announcement `1896592240228893072`. Grant Feb 2025; ETHFALCON post 2025-03-21.
- **Problem (paraphrased)**: ZKnox mission per EF: "provide high impact open source code that improves Ethereum security and efficiency." Output: ETHFALCON / ETHDILITHIUM (gas-optimized Solidity verifiers — Falcon claimed 24M → 2-2.5M gas); proposed EIP-7885 (lattice primitive accelerator). 2025 roadmap includes "easy integration for AA with hardware wallets" + "evaluating EIPs that may improve efficiency."
- **Funding**: Direct EF grant (closed; not a public RFP). Listed as *funded-precedent* signaling EF preference.
- **Map to QS**: STRONG **A** (ZKnox builds exactly the on-chain verifier infra A consumes); MEDIUM **C** (AA + hardware-wallets framing maps to migration UX); WEAK **D/E**. **B is the cleanest QS-distinct positioning** — ZKnox does NOT work on threshold-ML-DSA, leaving a gap.
- **Confidence**: HIGH.

### 11. EF Post-Quantum Team formation + $2M prize umbrella

- `pq.ethereum.org/`; press 2026-01-23 to 2026-01-26 (The Block, Coindesk, Decrypt, Crowdfund Insider). EF formed dedicated PQ team led by Thomas Coratger; "top strategic priority." The $2M = Poseidon $1M + Proximity $1M (neither is a custody-protocol grant; both math bounties). Strategic signal: EF **hash-biased** ("betting big on hash-based ... strongest and leanest foundations"); `leanXMSS / leanSig / leanMultisig / leanSpec` is consensus-layer primary.
- **Map**: Hash-bias creates structural tension with B/E (lattice-heavy). **A** survives (8051 is lattice but 8141 scheme-agnostic). **C** is hash/lattice-agnostic at protocol layer (STARKs are hash-based). **D** is scheme-agnostic in zkVM. Soft bias, not exclusion. Confidence HIGH.

### 12. Coinbase Independent Quantum Advisory Council Paper (April 2026)

- `assets.ctfassets.net/.../Quantum_Computing_and_Blockchain_v10.3_15April2026.pdf`; Coinbase blog; Coindesk 2026-04-21. Internal date 2026-04-15 / public 2026-04-21. Authors: Scott Aaronson, Dan Boneh, **Justin Drake (EF)**, Sreeram Kannan, Yehuda Lindell, Dahlia Malkhi. Position: "threat not imminent but clearly on the horizon; migrations should be planned now." Key rec: **"decisions about wallets that never upgrade should be made and communicated publicly ASAP."** Ranks Algorand + Aptos most quantum-ready. Wallet-level sig crypto = real vulnerability; on-chain-exposed pubkeys most exposed.
- **Founder-recollection correction**: **Coinbase's** council with Drake (EF) co-author — not EF's council. Internal QS notes need correction.
- **Map**: STRONG **C** (dormant-wallet rec = migration-governance gap); STRONG **A** (wallet-level framing aligns with per-account registry); MEDIUM **B** (Lindell-style custody framing sympathetic to threshold-ML-DSA); WEAK **D/E**. Confidence HIGH.

### 13. ERC-7826 — "Quantum Supremacy Bounty"

- `ethereum-magicians.org/t/erc-7826-quantum-supremacy-bounty/21866` (active 2025-2026). On-chain puzzle only quantum computers can solve, trustlessly verifiable, triggers PQ-scheme switch. ERC not grant. WEAK **A** (registry could include "Q-supremacy-triggered upgrade"); NONE B/C/D/E. Useful as citation, not architectural fit. Confidence HIGH.

---

## EF priorities surfaced (even without explicit RFP)

EF revealed preference as inferred from what they fund, hire, ship:

- **Hash-based cryptography as consensus-layer bet** (`leanXMSS / leanSig / leanMultisig / leanSpec`; >10 client PQ devnets; Drake "betting big on hash-based"). Strongest single signal.
- **Account-abstraction as migration vehicle** (EIP-8141 in Hegotia consideration; PQTS Breakout organized around it; EIP-7702 already shipped Pectra). Per-account agility preferred over protocol-wide cutover.
- **ML-DSA precompile** (EIP-8051, ~3k gas proposed) is the lattice-side concession at execution layer.
- **zkVM formal verification** is the cross-cutting investment ($20M Protocol Snarkification; Verified zkEVM project; SP1 Hypercube ALU chip in Lean).
- **Dormant-wallet governance** is the unsolved political problem; Coinbase council paper (#12) amplifies "decide and communicate." Non-engineering opportunity for citation.
- **Q-day = 2029 working assumption** (Drake roadmap target).
- **No explicit "PQ custody protocol" RFP exists**. EF funds *primitives* (ZKnox), *standards* (EIPs), *aggregation infra* (leanXMSS), *research* (PSE LaBRADOR) — not "a PQ custody product." Custody is Coinbase / Fireblocks / Anchorage territory in EF's mental model.

---

## Alignment matrix

Cells: **STRONG** / **PARTIAL** / **NONE**. Rows = EF/EF-adjacent problem statement. Columns = QS architecture A-E.

| EF problem statement | A: EIP-native | B: Threshold-ML-DSA | C: Migration vehicle | D: ZKVM-attested | E: Aggregator |
|---|---|---|---|---|---|
| 1. ESP Smart Account Passkey wishlist | PARTIAL | NONE | PARTIAL | NONE | NONE |
| 2. ESP Wishlist+RFP suite (general) | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| 3. Poseidon Prize | NONE | NONE | NONE | NONE | NONE |
| 4. Proximity Prize | NONE | NONE | NONE | PARTIAL | NONE |
| 5. ethresear.ch Tasklist (BIP32, leanXMSS, agility) | PARTIAL | PARTIAL | **STRONG** | PARTIAL | NONE |
| 6. PQTS Breakout (8141/8051/7693/7702/7932) | **STRONG** | PARTIAL | **STRONG** | NONE | NONE |
| 7. PSE Falcon+LaBRADOR aggregation | NONE | NONE | NONE | PARTIAL | **STRONG** |
| 8. PSE Quantum-Safe P2P | NONE | NONE | NONE | NONE | NONE |
| 9. EF Q1-2026 grants (zkVM formal verification) | NONE | NONE | NONE | **STRONG** | NONE |
| 10. ZKnox precedent (ETHFALCON / ETHDILITHIUM / EIP-7885) | **STRONG** | NONE | PARTIAL | NONE | NONE |
| 11. EF PQ Team / hash-bias framing | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL (against) |
| 12. Coinbase Council paper (dormant wallets, wallet-level vuln) | **STRONG** | PARTIAL | **STRONG** | NONE | NONE |
| 13. ERC-7826 Quantum Supremacy Bounty | PARTIAL | NONE | NONE | NONE | NONE |

**Tally of STRONG cells per architecture**: A=3, B=0, C=3, D=1, E=1.

**Tally of (STRONG + PARTIAL) per architecture**: A=8, B=5, C=7, D=5, E=2 (with one PARTIAL-against).

---

## The 1-2 strongest alignment opportunities

### Strongest: Architecture C (Migration vehicle)

C lights up STRONG against three EF-canonical problem statements: ethresear.ch tasklist (BIP32 replacement is a literal task line), PQTS Breakout Room's migration-EIP suite (7693/7702/7932), and Coinbase Council paper's "wallet-level vulnerability + decide-dormant-wallet-policy" pair. C avoids head-on collision with ZKnox (which builds verifiers, not migration tooling) and with Coratger's PQ Team (which builds consensus-layer primitives, not user-migration UX). A QS pitch as "canonical user-migration vehicle citing ethresear.ch 21296 + Coinbase Council, implemented against EIP-7693/7932/8141" has **the highest density of EF-published problem-statement support of the five**. The W19 critique that C is "throwaway tooling once Hegotia ships migration" is softened: EF funds migration *primitives* and *specs* but not migration *products* — product-shaped space EF is not internally building.

### Second-strongest: Architecture A (EIP-native attestation registry)

A lights up STRONG against PQTS Breakout Room (8141+8051 are A's load-bearing EIPs), ZKnox precedent (A consumes ZKnox-built verifiers), and Coinbase Council "wallet-level vulnerability" framing. The W19 critique "if 8141 ships, who needs QS?" is partially answered by Coinbase #12: even post-8141, the world needs *reference impl + ERC for attestation receipts + dormant-wallet policy implementation*. A is also the lowest-cost-to-rebuild (11-15 weeks). **A and C are not mutually exclusive**: an `AttestationRegistry` (A) with a `MigrationPath` field (C) ships A first, adds C as v2.

### Why not B, D, E

- **B**: 0 STRONG cells. No EF problem statement asks for threshold-ML-DSA productionization. Fireblocks' MPC call (W19 input) is custodian-industry, not EF. Defensible, just not EF-aligned.
- **D**: 1 STRONG (Q1-2026 zkVM formal verification) but it aligns with D's *substrate*, not D's product framing. EF funds zkVM correctness, not zkVM-attested-custody.
- **E**: 1 STRONG (PSE LaBRADOR), now in maintenance mode per #7. PSE downgrade is the strongest negative signal in this document.

---

## Cannot-find-evidence (founder-described items not surfaced)

1. **A dedicated "PQ custody" RFP from EF.** No item across Wishlist / RFP / Academic Grants explicitly framed "we want a PQ custody protocol." Closest is Smart Account Passkey wishlist (#1), which is AA-framed, not custody-framed.
2. **0xPARC PQC research output or fellowship.** Searches returned only general PQC academic results. 0xPARC's visible focus is ZK applied research, not PQC. May be genuine gap or search-coverage limit.
3. **"April 2026 EF advisory council paper"** as the founder remembered — found, but published by **Coinbase**'s council, not EF's (Drake co-author = EF presence). Internal QS docs treating it as EF-published need correction.
4. **EthGlobal PQC track explicitly EF-funded.** No 2026 hackathon prize track surfaced.
5. **EF "we want X" framing for QS-scale custody.** Closest are (a) Coinbase Council dormant-wallet policy rec (custody-policy not custody-tech) and (b) PQTS Breakout per-tx work (not custody). Neither = "build a PQ custody protocol."

---

## Sources accessed (with HTTP status)

**WebFetch (all 403 — sandboxed)**: `esp.ethereum.foundation/applicants/rfp`, `esp.ethereum.foundation/`, `blog.ethereum.org/en/2025/11/03/new-esp-grants`, `pq.ethereum.org/`.

**WebSearch (~36 queries, snippet-level only — primary source)**: ESP wishlist/RFP; Poseidon + Proximity Prize; ZKnox / ETHFALCON / ETHDILITHIUM; PSE Falcon+LaBRADOR + PSE PQC status; pq.ethereum.org + leanRoadmap; ethresear.ch tasklist 21296; EIPs 8141/8051/7693/7702/7932/6404 + ERC-7826; Coinbase Council April 2026; EF Q1-2026 allocation; Protocol Snarkification / SP1 / Verified zkEVM; 0xPARC PQC; EthGlobal PQC tracks; dormant-wallet governance; Aayush Gupta / ZK Email.

**Key URLs (snippet-level only)**:
- `esp.ethereum.foundation/{applicants/wishlist,applicants/wishlist/passkey-support,applicants/rfp,applicants,funded-projects,rounds/phdfp26/phdfp-rfpd1}`
- `blog.ethereum.org/{en/2025/11/03/new-esp-grants,2026/04/29/allocation-q1-26,en/2026/02/17/ethereum-protocol-studies-26,en/2026/02/18/protocol-priorities-update-2026,2025/07/31/lean-ethereum}`
- `pq.ethereum.org/`, `leanroadmap.org/`, `hackmd.io/@tcoratger/ryS1ElrWbx`
- `ethresear.ch/t/{tasklist-for-post-quantum-eth/21296, post-quantum-signature-aggregation-a-folding-approach/23639, poqeth-.../21554, the-road-to-post-quantum-ethereum-transaction-...AA/21783}`
- `ethereum-magicians.org/t/{pqts-breakout-room/27554 + breakouts 2/3/6, post-quantum-migrations-crypto-agility.../27836, erc-7826-quantum-supremacy-bounty/21866, eip-7693-backward-compatible-post-quantum-migration/19769, eip-8051-ml-dsa-verification/25857}`
- `eips.ethereum.org/EIPS/{eip-8141,eip-8051}`
- `pse.dev/{blog/post-quantum-signature-aggregation-with-falcon-and-LaBRADOR, blog/towards_a_quantum-safe_p2p_for_ethereum, projects/post-quantum-cryptography, research}`
- `poseidon-initiative.info/`, `proximityprize.org/`
- `zknox.eth.limo/posts/2025/{03/21/ETHFALCON.html, 02/26/Roadmap_26_02_25.html}`, `github.com/zknoxhq`, `github.com/ethereum/research/wiki/Problems`
- Coinbase Council: `coinbase.com/blog/coinbase-quantum-advisory-council-publishes-position-paper...`, PDF `assets.ctfassets.net/.../Quantum_Computing_and_Blockchain_v10.3_15April2026.pdf`
- Press: theblock.co/386938, thequantuminsider.com/2026/01/26, coindesk.com/tech/2026/{01/24, 03/25, 04/21}, crypto.news q1-2026-grants, coinlaw.io ESP wishlist/RFP, decrypt.co/355798
- Academic: `eprint.iacr.org/2025/091.pdf` (poqeth)

---

## Founder action items implied

1. **Resolve C-vs-A ambiguity in Phase 2.4** — C highest STRONG count; A highest STRONG+PARTIAL and lowest rebuild cost. A-as-v1 + C-as-v2-module is technically feasible.
2. **Drop "Proximity Prize" from any QS pitch claiming PQC alignment** — it is Reed-Solomon coding-theory, not PQC; cryptographer reviewers will catch the mislabel.
3. **Correct internal notes calling the April-2026 paper "EF council"** — it is Coinbase's council with EF co-author Drake. Cite as "Coinbase Independent Quantum Advisory Council, April 2026."
4. **Reweight E downward in Phase 2.4** — PSE's PQ project in maintenance mode per 2026 reporting; E's primitive substrate has less active EF backing in 2026 than W19 assumed.
5. **Engage PQTS Breakout + ethresear.ch 21296 directly if C is selected** — that is where the EF-side audience for migration tooling already exists.
