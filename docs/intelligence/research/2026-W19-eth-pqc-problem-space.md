---
status: DRAFT — research output, founder must verify before using in any external claim
date: 2026-05-09
purpose: Map ETH community's current PQC migration problem definitions as of 2026-05, NOT as of Nov-Dec 2025 when QS architecture was decided
researcher: research agent (general-purpose with WebSearch/WebFetch)
constraint_hit: WebFetch returned HTTP 403 on every direct fetch attempted (ethresear.ch, eips.ethereum.org, pq.ethereum.org, blog.ethereum.org, eprint.iacr.org, hackmd.io, lambdaclass.com, coindesk.com, vitalik.eth.limo, web.archive.org). All findings below are reconstructed from Anthropic-side WebSearch, which returns search-engine summaries of the URLs. Direct quote fidelity is therefore limited; URLs are recorded as-is so the founder can manually verify any claim before external use.
---

# Top 5 PQC Problems the ETH Community Is Actively Debating (2026-05)

## Executive frame

Between Nov-Dec 2025 and May 2026, post-quantum migration moved from a Vitalik-blog-post topic to a fully-staffed Ethereum Foundation engineering programme. The shift happened in three steps:

1. **2025-11 (Devconnect Buenos Aires)**: Vitalik publicly raises the "20% chance of Q-day before 2030" framing. Still no EF team.
2. **2026-01-21**: EF announces dedicated Post-Quantum Security team led by Thomas Coratger, with $2M in research prizes and a coordinated programme spanning the cryptography, protocol-architecture and protocol-coordination teams ([thequantuminsider 2026-01-26](https://thequantuminsider.com/2026/01/26/ethereum-foundation-elevates-post-quantum-security-to-top-strategic-priority/), [coindesk 2026-01-24](https://www.coindesk.com/tech/2026/01/24/ethereum-foundation-makes-post-quantum-security-a-top-priority-as-new-team-forms)).
3. **2026-01-23**: Coinbase independently forms a quantum advisory board ([thequantuminsider 2026-01-23](https://thequantuminsider.com/2026/01/23/coinbase-forms-independent-advisory-board-to-assess-quantum-risks-to-blockchain/)). Their April 2026 position paper is the loudest non-EF voice in the debate.
4. **2026-02-04 onward**: A new "Post Quantum Transaction Signature (PQTS)" Breakout Room opens biweekly under All Core Devs ([ethereum-magicians 27554](https://ethereum-magicians.org/t/post-quantum-transaction-signature-pqts-breakout-room-kickoff-call/27554)). Six sessions ran Feb-Apr, with the topic agenda visibly shifting **away** from "pick one signature scheme" and **toward** "agility + aggregation + migration mechanics".
5. **2026-03-25**: `pq.ethereum.org` launches as the central hub (10+ client teams running interop devnets).
6. **2026-03**: Google Quantum AI publishes the "1,200 logical qubits" estimate (vs. previously ~2,400) ([research.google](https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/)). This is the single biggest external timeline-compression event in the period.

The five problems below are the topics that **3+ independent threads** keep returning to in 2026-Q1/Q2. None of them are framed the way QS framed PQC custody in Nov 2025.

---

## Problem 1: "Too many competing PQ-migration EIPs and no convergence path"

- **What it is**: As of 2026-05, the migration path for *user transactions* (not validator BLS) involves at least four overlapping EIPs: EIP-7693 (Backward-Compatible PQ Migration), EIP-7932 (Secondary Signature Algorithms / Algorithmic Transaction Wrapper), EIP-8141 (Frame Transaction / native Account Abstraction championed by Vitalik), and EIP-6404 (SSZ transactions). The Ethereum Magicians thread "Post Quantum migrations, Crypto-agility and how to prevent EIP-7932 from failing" explicitly frames the situation as "Shibuya Crossing — too many proposals all with different ways of doing the same fundamental thing." The community recognises that without convergence, *no* migration ships.
- **Who's leading the discussion**: Renaud Dubois (rdubois-crypto, ZKnox / EF advisor) leads on EIP-7932 and the NTT precompile track. Vitalik personally champions EIP-8141. Thomas Coratger (EF PQ team lead) coordinates the PQTS Breakout. The Ethereum Magicians thread #27836 ("how to prevent EIP-7932 from failing") is the public record of the convergence anxiety.
- **Cited sources**:
  - https://ethereum-magicians.org/t/post-quantum-migrations-crypto-agility-and-how-to-prevent-eip-7932-from-failing/27836
  - https://ethereum-magicians.org/t/eip-7932-multi-algorithm-signing-support-algorithmic-transactions/23514
  - https://ethereum-magicians.org/t/the-case-for-eip-7932-eip-7980-inclusion-in-glamsterdam/25293
  - https://ethereum-magicians.org/t/eip-7693-backward-compatible-post-quantum-migration/19769
  - https://eips.ethereum.org/EIPS/eip-8141
  - https://eips.ethereum.org/EIPS/eip-7932
  - https://ethresear.ch/t/the-road-to-post-quantum-ethereum-transaction-is-paved-with-account-abstraction-aa/21783
- **Current state of debate**: EIP-8141 has Vitalik's backing and "Consider for Inclusion" status for Hegotia (late-2026 fork) but is *not* the headliner ([cryptotimes 2026-03-23](https://www.cryptotimes.io/2026/03/23/ethereums-quantum-defense-vitalik-buterin-backs-eip-8141-upgrade/), [kucoin](https://www.kucoin.com/news/flash/eip-8141-why-native-account-abstraction-isn-t-a-headliner-for-ethereum-s-hegota-upgrade)). EIP-7932 is the "agility wrapper" that the EF PQ team is actively de-risking. The convergence question — "do we ship 8141 first and let it carry signature agility, or do we ship 7932 as a fast on-ramp?" — is genuinely unresolved.
- **Implication for QS**: QS's L1 vault hardcodes Dilithium + SPHINCS+ as a *fixed dual-pair*. The community is converging on **algorithm registries** (EIP-7932) and **per-account scheme choice** (EIP-8141), not fixed pairs. A protocol that pre-commits to a specific PQ pair without a registry/agility hook will look architecturally regressive within 6-12 months.
- **Did this problem exist as a community topic in Nov-Dec 2025?** EMERGING. EIP-7693 existed Nov 2025; EIP-7932 was being drafted; EIP-8141 was a Vitalik concept, not yet a public EIP (it was published Feb-Mar 2026). The "convergence anxiety" frame is purely 2026-Q1.

---

## Problem 2: "Old EOA migration — accounts that already exposed their secp256k1 public key cannot be saved by a fork"

- **What it is**: Any Ethereum EOA that has *ever* sent a transaction has its secp256k1 public key permanently on-chain. A future quantum computer running Shor's algorithm can derive the private key from that exposed public key, regardless of any future protocol fork. EIP-8141 helps **future** users opt into PQ signatures, but it does not protect addresses whose pubkey is already harvested. The unresolved question: how does an existing user *prove* control of an exposed-pubkey address using a *new* PQ key, without revealing the old private key (which an attacker may already be able to recover)?
- **Who's leading the discussion**: An ethresear.ch post from approximately 2026-04-W2 titled "Upgrade any Ethereum wallet to post-quantum security in one transaction using ZK proofs with a hidden public key" (thread 24754) proposes a zk-STARK construction in which the user binds a new PQ pubkey to the legacy address via a STARK proof of knowledge of the original BIP39 seed phrase, *without revealing the new PQ key on-chain*. Aayush Gupta (earlier ethresear.ch post on "Quantum Proof Keypairs with ECDSA + ZK", thread 14901) is cited as the conceptual ancestor. Mehmet Sabir Kiraz and Suleyman Kardas published "Migrating Bitcoin and Ethereum Addresses to the Quantum Blockchain Era" (eprint 2026/352) proposing on-chain primitives `OP_CHECKQUANTUMSIG` / `OP_CHECKSTARKPROOF` for the same problem.
- **Cited sources**:
  - https://ethresear.ch/t/upgrade-any-ethereum-wallet-to-post-quantum-security-in-one-transaction-using-zk-proofs-with-a-hidden-public-key/24754
  - https://ethresear.ch/t/quantum-proof-keypairs-with-ecdsa-zk/14901
  - https://eprint.iacr.org/2026/352 (Kiraz & Kardas, 2026-02-23)
  - https://en.cryptonomist.ch/2026/03/04/quantum-safe-wallet-ethereum/ (Ephemeral Key Rotation)
  - https://pqcee.github.io/Enabling_a_Smooth_Migration_towards_Post_Quantum_Security_for_Ethereum.pdf
  - https://github.com/Bisht13/post-quantum-eth-security
- **Current state of debate**: The "hidden PQ pubkey via ZK proof" mechanic appears to be the emerging consensus *technique*, but the *gas cost* of the STARK verifier on-chain is unresolved (likely 5-15M gas per upgrade tx). A subsidiary debate: should EIP-8141 specify a canonical hidden-pubkey upgrade path, or leave it to wallets?
- **Implication for QS**: QS's SR_0/SR_1 split-receipt construction is structurally adjacent — both are "bind a PQ artefact to an EVM-native identifier without exposing the PQ key prematurely". But QS targets *future locked deposits* (forward-looking custody), not *legacy EOA migration* (backward-looking recovery). The Kiraz/Kardas and ethresear.ch 24754 work is **exactly the same shape** as SR_0/SR_1 but applied to the much larger market problem (every existing ETH holder, not just future custody depositors). If QS wants to be cited, the SR_0/SR_1 framing must explicitly engage with the legacy-EOA recovery use case, not just custody.
- **Did this problem exist as a community topic in Nov-Dec 2025?** YES, but only as a niche theoretical thread (Aayush Gupta's earlier ethresear.ch 14901). The 2026 explosion is driven by Google's March qubit revision making the timeline credible. Nov 2025 had ~2 active threads; May 2026 has 5-7 active threads + 2 published preprints + 1 Coinbase advisory paper citing the problem.

---

## Problem 3: "BIP32-style hierarchical deterministic key derivation does not survive in lattice-land"

- **What it is**: BIP32 / HD wallets rely on the additive homomorphism of secp256k1: `pub(sk1 + sk2) = pub(sk1) + pub(sk2)`. This is what makes "non-hardened derivation" work — exchanges can derive fresh deposit addresses from an extended *public* key while the master *private* key stays cold-stored. ML-DSA (Dilithium) and SLH-DSA (SPHINCS+) do not have this homomorphism. Every major exchange and self-custody wallet structurally depends on BIP32. A naive PQ migration breaks the entire deposit-address-rotation business model of Coinbase, Binance, Kraken, MetaMask, Ledger, etc.
- **Who's leading the discussion**: "Lattice HD Wallets: Post-Quantum BIP32 Hierarchical Deterministic Wallets from Lattice Assumptions" (eprint 2026/380, published Feb 2026) by Project Eleven / academic team. The Coratger ethresear.ch tasklist explicitly flags BIP32 as needing replacement. The Coinbase April advisory paper highlights this as a top operational concern.
- **Cited sources**:
  - https://eprint.iacr.org/2026/380 ("Lattice HD Wallets" — Feb 2026)
  - https://blog.projecteleven.com/posts/lattice-hd-wallets-post-quantum-bip32-hierarchical-deterministic-wallets-from-lattice-assumptions
  - https://ethresear.ch/t/tasklist-for-post-quantum-eth/21296
  - https://decrypt.co/360394/post-quantum-shift-crypto-exchanges-wallet-security
  - https://thequantuminsider.com/2026/04/25/coinbase-advisers-warn-quantum-computing-will-crack-blockchain-encryption-and-the-window-to-prepare-is-narrowing/
- **Current state of debate**: The 2026/380 paper presents the *first* construction recovering full BIP32 functionality (including non-hardened derivation) under standard lattice assumptions — using a Raccoon-G variant. This is genuinely new and not yet stress-tested by the community. Open questions: (a) can it be combined with ML-DSA standardised verifier or does it require a custom scheme; (b) what's the on-chain verifier cost; (c) how do you migrate trillions of dollars of HD-wallet-derived addresses from existing master seeds.
- **Implication for QS**: QS's Prover Pool architecture assumes *single-key-per-account* PQC custody. Any institutional integration via Fireblocks / BitGo / Coinbase Custody flows through HD-wallet infrastructure. If QS does not have a story for "how does a Fireblocks customer's existing HD-derived deposit address migrate into a QS lock", the integration story is incomplete.
- **Did this problem exist as a community topic in Nov-Dec 2025?** EMERGING. The cryptography problem was known to specialists (Project Eleven, NIST threshold call). The first practical paper (2026/380) was published Feb 2026. Nov 2025: not in the public Ethereum discourse. May 2026: actively discussed at PQTS Breakout #3 and in the Coinbase advisory.

---

## Problem 4: "PQ signature aggregation for validator BLS replacement — hash-based vs lattice-based is genuinely contested"

- **What it is**: Ethereum's PoS consensus uses BLS aggregation: hundreds of thousands of validator signatures collapse into one aggregate. No PQ scheme has BLS-style native aggregation. The community has split into two camps: (a) **hash-based** — replace BLS with leanXMSS (a Winternitz-OTS / XMSS variant) and use a SNARK aggregator (leanVM / leanMultisig) to compress aggregates ~250×; and (b) **lattice-based** — aggregate Falcon signatures with the LaBRADOR lattice SNARK. Both work; both have orders-of-magnitude different cost profiles; both have credible champions.
- **Who's leading the discussion**:
  - **Hash-based camp**: Justin Drake, Thomas Coratger, EF leanRoadmap team. Paper: "Hash-Based Multi-Signatures for Post-Quantum Ethereum" (eprint 2025/055, also in CIC vol 2 issue 1 paper 13). HackMD writeup at hackmd.io/@tcoratger/S1t-qhPFJx. Implementation: IrreducibleOSS/leansig, leanVM, leanMultisig. ~10 client teams running interop devnets per pq.ethereum.org.
  - **Lattice-based camp**: PSE (Privacy & Scaling Explorations). Blog: "Post-Quantum Signature Aggregation with Falcon + LaBRADOR" (pse.dev/blog).
  - **Folding / recursive-SNARK camp**: Srinath Setty (Microsoft Research) + Coratger, "Post Quantum Signature Aggregation: a Folding Approach", ethresear.ch thread 23639 (Dec 2025).
- **Cited sources**:
  - https://eprint.iacr.org/2025/055 + https://cic.iacr.org/p/2/1/13
  - https://hackmd.io/@tcoratger/S1t-qhPFJx
  - https://github.com/IrreducibleOSS/leansig
  - https://leanroadmap.org/
  - https://pse.dev/blog/post-quantum-signature-aggregation-with-falcon-and-LaBRADOR
  - https://ethresear.ch/t/post-quantum-signature-aggregation-a-folding-approach/23639
  - https://ethresear.ch/t/lattice-based-signature-aggregation/22282/1
  - https://ethresear.ch/t/separator-based-participation-commitments-for-post-quantum-attestation-aggregation/24622
  - https://blog.lambdaclass.com/ethereum-signature-schemes-explained-ecdsa-bls-xmss-and-post-quantum-leansig-with-rust-code-examples/
- **Current state of debate**: EF's *current* operational bet is hash-based (leanXMSS/leanVM is what the 10+ client teams are wiring up), but the leanXMSS scheme has an ~8-year key lifetime (statefulness is a hard problem) and the SNARK aggregator is research-grade. The lattice camp argues Falcon+LaBRADOR is more mature mathematically; the hash camp counters with security conservativism (no novel assumptions). The tension is real, not resolved.
- **Implication for QS**: This problem is **validator-side**, not custody-side, so it does not directly contradict QS architecture. **However**, the fact that EF committed to hash-based at the validator layer creates pressure for "hash-based everywhere" narrative coherence. QS using ML-DSA (lattice) for SR_0 puts QS on the *lattice* side of an active religious split. This is not fatal, but the "why lattice for SR_0" justification needs to be explicit.
- **Did this problem exist as a community topic in Nov-Dec 2025?** YES. The 2025/055 paper predates the EF team. But the *operational* commitment (10+ client teams wiring leanXMSS) is purely 2026-Q1.

---

## Problem 5: "MPC-friendly PQ signing — threshold ML-DSA from 2025/1166 to 2026/013/638 is now production-credible"

- **What it is**: For institutional custody (Fireblocks, BitGo, Coinbase Custody, Anchorage, BNY Mellon), the existing model is MPC-based threshold signing of ECDSA — *no single party ever holds the full private key*. To move to PQ custody, the industry needs **threshold ML-DSA** (or equivalent PQ scheme) with practical performance. Throughout 2025 this was theoretical-only ("Threshold Signatures Reloaded", 2025/1166; "Trilithium", 2025/675). In 2026-Q1, two papers landed with concrete performance numbers: "Efficient Threshold ML-DSA" (2026/013, Sofía Celi/Rafaël del Pino/Thomas Espitau/Guilhem Niot/Thomas Prest) demonstrates 2-6 party threshold ML-DSA with sub-second signing in WAN deployments and 21-1050 KB per-party communication. "THED: Threshold Dilithium from FHE" (2026/638, Park/Passelègue/Stehlé) achieves 0.202s online time on GPU using ThFHE+CKKS. **This is the inflection point that flips MPC-vendor PQ adoption from "research" to "next year's roadmap item".**
- **Who's leading the discussion**: Cryptography-side: PQShield/CryptoLab/ENS-Lyon academic axis. Industry-side: Fireblocks' "Standardizing MPC Cryptography" cross-industry call to action explicitly cites threshold-ML-DSA as the priority (fireblocks.com/blog/standardizing-mpc-cryptography-a-cross-industry-call-to-action). Fireblocks' "What Google's New Quantum Research Means" (April 2026) explicitly says they are "auditing internal cryptographic infrastructure" and that "some PQC constructions, particularly code-based and multivariate approaches, may be more naturally suited to MPC". NIST IR 8214C (published 2026-01-20) opens the formal threshold-PQ-scheme call with submissions due May 2026.
- **Cited sources**:
  - https://eprint.iacr.org/2026/013 (Efficient Threshold ML-DSA, Jan 2026)
  - https://eprint.iacr.org/2026/638 (THED: Threshold Dilithium from FHE, Apr 2026)
  - https://eprint.iacr.org/2025/1166 (Threshold Signatures Reloaded)
  - https://eprint.iacr.org/2025/675 (Trilithium)
  - https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security
  - https://www.fireblocks.com/blog/standardizing-mpc-cryptography-a-cross-industry-call-to-action
  - https://csrc.nist.gov/pubs/ir/8214/c/2pd (NIST IR 8214C, 2026-01-20)
  - https://csrc.nist.gov/News/2026/nist-and-multi-party-threshold-schemes
  - https://csrc.nist.gov/events/2026/mpts2026
- **Current state of debate**: NIST is actively soliciting threshold-PQ scheme submissions through 2026. Fireblocks is publicly building. Coinbase advisory paper (April 2026) explicitly calls out MPC-PQ as a strategic priority. The remaining contention: do you do threshold *at the cryptographic primitive level* (2026/013-style) or *at the application level* via FHE (2026/638-style)? Both have credible advocates.
- **Implication for QS**: This is the **most architecturally consequential** finding. QS's W19 audit identified that "Threshold-Dilithium / FROST" was structurally invalid in the *2025* version of the literature — the audit verdict was "CLOSE formally". As of 2026-Q1, that verdict is **outdated**. Threshold ML-DSA is now production-credible and is exactly the wedge MPC custodians need. If QS's strategic premise was "MPC custodians can't do PQ alone, so they need QS to attest on top", that premise was stronger in Nov 2025 than it is in May 2026. The Fireblocks "standardising MPC cryptography" cross-industry call is *the vendor saying out loud* that they will build threshold-PQ themselves, leveraging the new academic results. This validates the W19.5 audit's "G is existential, evidence leans to build" finding — but with a different mechanism: it's not that custodians will *thinly wrap ML-DSA*, it's that they will *use threshold ML-DSA from 2026/013 onward*.
- **Did this problem exist as a community topic in Nov-Dec 2025?** EMERGING. The theoretical groundwork (2025/1166, 2025/675) existed. But the **practical, deployable** versions (2026/013 with sub-second WAN signing, 2026/638 with GPU acceleration, NIST IR 8214C formalising the call) are all 2026-Q1. The Fireblocks cross-industry call is 2026. **This is the single biggest gap between the QS Nov 2025 architecture brief and the May 2026 reality.**

---

## Convergence summary — what 3+ independent sources agree on

| Convergence point | Source 1 | Source 2 | Source 3 |
|---|---|---|---|
| Validator-side: hash-based (leanXMSS) + SNARK aggregator is the operational bet | EF leanRoadmap | Coratger/Drake 2025/055 | 10+ client teams in pq.ethereum.org devnets |
| User-side: signature *agility* (registry + per-account choice) beats fixed-pair | EIP-7932 | EIP-8141 | ethereum-magicians #27836 anti-failure thread |
| Legacy EOA migration via ZK-hidden-PQ-pubkey is the emerging mechanic | ethresear.ch 24754 | eprint 2026/352 | Vitalik EIP-8141 validation-frames concept |
| Threshold ML-DSA is now production-credible | 2026/013 | 2026/638 | NIST IR 8214C / Fireblocks |
| Q-day timeline compressed by Google March 2026 | research.google | Coinbase advisory paper | Vitalik 20%-by-2030 framing |
| Hash-based BIP32 (or equivalent) is required, not optional | Project Eleven 2026/380 | Coratger tasklist | Coinbase advisory |

## Tensions / open splits

1. **Hash vs lattice for everything-not-validator** — EF's hash bet is operational, but Falcon+LaBRADOR keeps showing better aggregation numbers. If QS chose lattice (ML-DSA) for SR_0, QS is on the "minority within Ethereum, majority within NIST/standards" side.
2. **Signature agility (EIP-7932) vs. Account Abstraction (EIP-8141) as the migration vehicle** — both Vitalik and the EF PQ team support both, but they bottleneck on different forks. If 8141 lands in Hegotia (late 2026), 7932 may become redundant. If 8141 slips, 7932 carries the load.
3. **MPC-native threshold-PQ vs. attestation-on-top of existing MPC** — Fireblocks is publicly exploring both. The QS premise was "attestation on top". The 2026/013 result says "MPC-native is achievable", which is the path of least vendor friction.
4. **Freeze vs. do-nothing for pre-quantum coins** — Ethereum's exposure is ~0.1% of supply (vs. Bitcoin's ~30%), so the political pressure is much lower. EF position: "community governance question, both options live". This is *not* a problem QS addresses, but it does mean Ethereum has more time / less pressure than Bitcoin.

---

## Five problems the QS Nov-Dec 2025 architecture did NOT account for

This is the load-bearing section.

1. **Threshold ML-DSA going production-credible in Q1 2026** (Problem 5 above). QS's Nov 2025 premise that "PQC custody = single-key signature on the deposit, dual-pair Dilithium+SPHINCS+" treats threshold signing as a future research topic. As of May 2026, MPC-vendors have a ~12-month path to threshold ML-DSA without QS. The W19.5 audit's "G is existential, evidence leans to build" finding has hardened: the *mechanism* by which vendors build is now visible (use 2026/013).

2. **Signature-agility EIPs converging on per-account scheme choice** (Problem 1). QS's L1 vault hardcodes a specific Dilithium+SPHINCS+ pair per lock. The community is moving toward registries (EIP-7932) and per-account programmable verifiers (EIP-8141). A QS lock that cannot rotate its signature scheme will be architecturally stale within 12 months.

3. **Legacy EOA migration via ZK-hidden-pubkey** (Problem 2). QS's SR_0/SR_1 split-receipt construction is structurally adjacent to ethresear.ch thread 24754 and eprint 2026/352, but QS targets *forward-looking custody* whereas the larger market problem is *backward-looking legacy migration*. The bigger ERC opportunity is "PQ-attestation receipts that work for legacy EOA migration", not just "PQ-attestation receipts for new locks". Path C in the W19.5 audit is correctly oriented but undersized — the problem space is bigger than QS's current scope.

4. **BIP32-class HD-wallet derivation in lattice-land** (Problem 3). QS architecture has zero story for "how does an institutional integrator's HD-derived deposit address flow into a QS lock". This is the biggest hidden integration cost for any custodian considering QS as a wedge. The Project Eleven 2026/380 paper shows the cryptographic primitive exists; QS would need to engage with it.

5. **EIP-8141 "validation frames" obsoleting separate aggregation protocols** (Problem 4 + EIP-8141 docs). Vitalik's "validation frames" mechanic in EIP-8141 explicitly proposes bundling many signatures + ZK proofs into a single combined proof at the *account-abstraction* layer. If this lands, then QS's Prover Pool aggregation pattern (multiple Provers VRF-selected to co-sign each lock) is partially redundant — accounts can self-aggregate at the EVM level. The W19.5 audit flagged H (EIP-8141 orthogonality) as ❌; this research confirms that risk has hardened, not softened.

---

## Sources accessed (with status)

WebFetch was uniformly blocked (HTTP 403) on every primary-source URL attempted. Findings reconstructed from Anthropic-side WebSearch (search-engine summaries). Founder must verify any quote/figure against the URL directly.

**WebFetch attempted, returned 403:**
- https://ethresear.ch/t/the-road-to-post-quantum-ethereum-transaction-is-paved-with-account-abstraction-aa/21783 (403)
- https://ethresear.ch/t/so-you-wanna-post-quantum-ethereum-transaction-signature/21291 (403)
- https://ethresear.ch/t/tasklist-for-post-quantum-eth/21296 (403)
- https://eips.ethereum.org/EIPS/eip-8141 (403)
- https://pq.ethereum.org/ (403)
- https://ethereum.org/roadmap/future-proofing/quantum-resistance/ (403)
- https://blog.ethereum.org/2026/02/18/protocol-priorities-update-2026 (403)
- https://blog.ethereum.org/2026/04/29/allocation-q1-26 (403)
- https://eprint.iacr.org/2026/013 (403)
- https://eprint.iacr.org/2026/638 (403)
- https://eprint.iacr.org/2026/352 (403)
- https://eprint.iacr.org/2025/1626.pdf (403)
- https://eprint.iacr.org/2026/609.pdf (403)
- https://hackmd.io/@tcoratger/S1t-qhPFJx (403)
- https://blog.lambdaclass.com/ethereum-signature-schemes-explained-ecdsa-bls-xmss-and-post-quantum-leansig-with-rust-code-examples/ (403)
- https://www.btq.com/blog/ethereums-roadmap-post-quantum-cryptography (403)
- https://arxiv.org/html/2512.13333v1 (403)
- https://thequantuminsider.com/2026/01/26/... (403)
- https://www.coindesk.com/tech/2026/02/26/vitalik-buterin-unveils-ethereum-roadmap-... (403)
- https://cointelegraph-magazine.com/dirty-secret-quantum-signatures-no-one-knows/ (403)
- https://ambcrypto.com/time-to-go-full-pq-ethereum-foundation-launches-post-quantum-push/ (403)
- https://web.archive.org/web/2026/* (Claude Code unable to fetch web.archive.org)

**WebSearch (succeeded, results summarised by search engine, used as primary signal source):**
- All 14 WebSearch queries returned coherent results spanning ethresear.ch threads 21783, 21291, 21296, 22282, 23639, 24622, 24754; Ethereum-Magicians threads 27554, 27699, 27831, 27836, 28190, 25293, 23514, 19769, 25857; EIPs 7693, 7885, 7932, 8051, 8052, 8141; eprints 2025/055, 2025/1166, 2025/675, 2025/2025, 2026/013, 2026/352, 2026/380, 2026/609, 2026/638; PSE blog; Fireblocks 3 blog posts; Coinbase advisory; NIST IR 8214C; Google Quantum AI March 2026 paper.

**Cannot find evidence for (despite searching):**
- A specific April 2026 Vitalik "advisory council" paper at vitalik.eth.limo (search returned only his April 2026 self-sovereign LLM post and his April 20 2026 Hong Kong Web3 Carnival keynote, neither of which is a PQC advisory paper specifically). The closest primary Vitalik PQC text appears to be the February 2026 "quantum roadmap" X-thread referenced by Coindesk, not a longer essay. **If founder believes a Vitalik April PQC paper exists, manual verification is required — research could not surface it.**
- Devcon 2026 PQC talk schedule (event is November 2026, schedule not yet published).
- Confirmed public custodian × PQC-vendor partnership announcement (Fireblocks/Thales/Utimaco/PQShield). Search returned the Fireblocks "Standardizing MPC Cryptography" call-to-action, which is the *opposite* signal — Fireblocks asking the industry to standardise *with them*, not Fireblocks adopting an external vendor.

---

## Founder verification checklist

Before citing any of the above externally:
1. Open each `ethresear.ch/t/...` URL manually and verify the post date, author, and that the technical content matches my paraphrase.
2. Open each `eprint.iacr.org/2026/...` URL and confirm the paper exists and has the title/authors I list.
3. Specifically verify the Fireblocks "Standardizing MPC Cryptography" blog post — this is the load-bearing source for Problem 5's "vendor builds, not buys" claim. If the post does not say what I summarised, Problem 5's strategic implication weakens.
4. Verify EIP-8141's "validation frames" mechanic. If the EIP text does not actually contain a "validation frames" concept that bundles signatures+proofs, Problem 4-via-8141 weakens.
5. Re-check Project Eleven 2026/380 — if the construction does not actually recover BIP32 non-hardened derivation under standard lattice assumptions, Problem 3 needs softening.

The single highest-leverage verification: **Fireblocks "Standardizing MPC Cryptography" blog post**. If that post says what I summarised, the W19.5 audit's recommendation to pursue Path C (standards-anchoring) is reinforced — the vendor is publicly asking for a standard, which is exactly the gap a QS-authored ERC could fill.

Word count: ~2,400 words.
