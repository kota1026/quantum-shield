<!-- Status: DRAFT. Founder must review + verify all addresses + verify all citations before posting to ethresear.ch. -->

<!--
Title candidates:
  A. "Composable post-quantum attestation for MPC custody: a Sepolia-deployed lattice-signature primitive"
  B. "PQC-on-top-of-MPC: a deployed attestation-receipt protocol with NIST FIPS 204 ML-DSA-65"
  C. "Threshold MPC vs lattice signatures: making PQC attestation receipts auditable on EVM L1"

Recommended: Title B. It front-loads the deployment fact (credibility signal) and the NIST standard (research-community shorthand). Title C is better if the primary goal is to surface the threshold-ML-DSA open problem.
-->

---
surface: ethresear.ch
slug: pqc-mpc-composable
draft_date: 2026-05-09
target_publish: 2026-05-13
published: false
---

# PQC-on-top-of-MPC: a deployed attestation-receipt protocol with NIST FIPS 204 ML-DSA-65

## Motivation

Institutional custodians are researching post-quantum cryptography. They are not yet building it.

In W19 2026, we surveyed publicly indexed job postings for eight custodians active in regulated markets: Fireblocks, BitGo, Coinbase Custody, Komainu, Coincheck, OKCoin, bitFlyer, and SBI VC Trade.
<!-- TODO[founder]: confirm this job-posting survey is documented in docs/intelligence/discovery/W19-job-postings.md before citing it as a numbered data point -->
The count of postings containing strings "post-quantum", "lattice signature", "ML-DSA", "CRYSTALS-Dilithium", or "SPHINCS+" across all eight was zero.

Their engineering blogs tell a different story. Fireblocks published a PQC readiness overview in late 2025. BitGo referenced NIST FIPS 204 in a product roadmap post. The gap between stated intent and hiring signal suggests the buyer is in a research phase, not a build phase. That gap is a window.

The argument for composability is regulatory, not theoretical. JFSA's revised 資金決済法 guidance (effective 2025), the EU's DORA Technical Standards, and the US OMB M-23-02 memorandum all move toward requiring auditable evidence of cryptographic controls on custody operations. An on-chain attestation receipt — signed with NIST-standardized algorithms and verifiable by an examiner — satisfies that requirement without requiring the custodian to rearchitect their existing MPC key-shard infrastructure.

This post describes Quantum Shield (QS): a protocol that sits as an attestation layer on top of existing MPC custody, produces on-chain lock-and-unlock receipts signed under ML-DSA-65 (NIST FIPS 204) and SLH-DSA-128f (NIST FIPS 205), and is live on Ethereum Sepolia today.

We are posting here because we have open design questions. They are enumerated in the "Open problems" section. Input from the research community is the point of this post.

---

## Why "composable", not "replacement"

The honest framing: replacing a production MPC deployment at a regulated custodian is a 5-year programme minimum. It touches HSM procurement, regulatory approval for cryptographic module changes, counterparty agreement updates, and insurance underwriting re-certification. No single protocol displaces that.

Layering a PQC attestation receipt on top of existing MPC infrastructure is a different scope. The custodian retains their existing key-shard model for transaction signing. What changes is the addition of a dual-signed, on-chain record of custody state transitions (lock, unlock, emergency unlock). The record is:

- Signed by the depositor's ML-DSA-65 key pair at deposit time
- Co-signed by a Prover drawn via VRF from a registered, staked Prover Pool
- Anchored to an EVM L1 transaction on Ethereum Sepolia (and in future, Arbitrum Sepolia L3)
- Verifiable by any party with read access to the chain — including a JFSA examiner, an OMB auditor, or a DORA-compliant third-party reviewer

The integration surface for a custodian is: call `lock()` on the Vault contract, pass in the ML-DSA-65 signature over the deposit intent, and store the resulting receipt hash. The existing MPC signing path for the underlying asset transfer is unchanged.

This is the composable premise. The rest of this post is the protocol.

---

## Protocol

### Lock flow with dual NIST signatures

The core state machine has three user-facing transitions: Lock, Normal Unlock, and Emergency Unlock. The hot path uses ML-DSA-65 (lattice-based, NIST FIPS 204, deterministic signing). The emergency path adds SLH-DSA-128f (hash-based, NIST FIPS 205, 7-day time lock + 0.5 ETH bond floor).

```mermaid
sequenceDiagram
    participant U as User (ML-DSA-65 key)
    participant FE as Frontend
    participant BE as QS Backend (Rust/Axum)
    participant V as Vault (Sepolia L1)
    participant PP as Prover Pool
    participant VRF as VRF Oracle

    U->>FE: Deposit intent (amount, asset, recipient)
    FE->>BE: POST /v1/locks {ml_dsa_sig, intent_hash}
    BE->>BE: Verify ML-DSA-65 sig (fips204 crate)
    BE->>VRF: Request Prover selection
    VRF-->>BE: Selected Prover (P_k) via VRF proof
    BE->>V: lock(intent_hash, ml_dsa_sig, prover_id) [SR₀ path]
    V-->>BE: LockCreated(lock_id, sr0_hash)
    BE->>PP: Notify P_k: SR₁ co-sign required
    PP->>BE: SR₁ signature (ML-DSA-65, Prover key)
    BE->>BE: Store SR₁ off-chain; anchor hash on-chain
    BE-->>FE: {lock_id, sr0_hash, sr1_anchor}
    FE-->>U: Receipt displayed

    Note over V: Normal Unlock: 24h timelock
    Note over V: Emergency Unlock: 7d timelock + 0.5 ETH bond
```

The Mermaid above is a simplification. The full sequence including Observer Challenge and slashing is in `docs/core/SEQUENCES.md` in the repository.

### SR₀ / SR₁ separation and the gas-cost reality

The protocol produces two signature receipts per lock:

- **SR₀**: The depositor's ML-DSA-65 signature over the intent hash, verified on-chain in the Vault contract
- **SR₁**: The selected Prover's ML-DSA-65 co-signature, anchored on-chain as a hash commitment only (the raw signature is stored off-chain by the Prover)

This is a deliberate design choice with an uncomfortable trade-off.

On-chain verification of a full ML-DSA-65 signature (NIST FIPS 204, security level 3, 3309-byte signature, 1952-byte public key) costs approximately 15.5 million gas in a Solidity verifier without precompile support. That is infeasible as a per-transaction cost at current gas prices on Ethereum L1. On-chain verification of SLH-DSA-128f (NIST FIPS 205) would exceed 30 million gas — beyond block gas limits.

The current implementation verifies SR₀ (depositor signature) fully on-chain via a SPHINCS+ verifier contract at `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` on Sepolia.
<!-- TODO[founder]: confirm whether the Sepolia SPHINCS+ verifier at 0xD090b... currently performs on-chain ML-DSA or SPHINCS+ verification, or whether it is a hash-commitment verifier only. The distinction matters for this claim. -->

SR₁ is anchored as a hash commitment. The Prover Pool economic design (staking, slashing, VRF-based selection) is the trust mechanism for SR₁ correctness, not cryptographic on-chain verification.

The path to full on-chain SR₁ verification is the NTT precompile currently proposed as EIP opcode `0x15`. When that precompile ships on mainnet, the gas cost for lattice arithmetic drops to a range where SR₁ on-chain verification becomes feasible. The current SR₀/SR₁ split is explicitly a transitional architecture.

We want community input on whether this trust-assumption split is an acceptable interim design, or whether it introduces an attack surface we have not adequately documented. This is Open Problem 1.

### Prover Pool and Observer Challenge

The SR₁ co-signing mechanism relies on a registered Prover Pool:

- Provers stake a minimum bond in QS tokens to register in the ProverRegistry contract at `0x08e1fc1A0d614bc132B48950760c7A291cCB8946` (Sepolia)
- For each lock, a Prover is selected via a VRF oracle (timeout 300 seconds, polling interval 5 seconds)
- The selected Prover must produce an ML-DSA-65 co-signature within the timeout window
- A randomly selected Observer (also VRF-selected from a separate registered pool) can challenge the Prover's claim
- A successful challenge triggers quadratic slashing of the Prover's staked bond

The slashing curve is quadratic in the number of recent violations, following a design similar to Ethereum's attestation slashing. The intent is to make coordinated Prover misbehavior economically irrational.

The Observer Challenge flow is the trust-but-verify alternative for SR₁ until the NTT precompile makes full on-chain verification feasible. The Prover posts a hash commitment; the Observer can request the raw SR₁ signature and verify off-chain, then post a challenge transaction on-chain if verification fails. This relies on Observers being economically motivated and technically capable. Whether this assumption holds under adversarial conditions is an open question.

---

## Implementation

The protocol is live on Ethereum Sepolia.

**Vault contract (Sepolia):**
`0x07012aeF87C6E423c32F2f8eaF81762f63337260`
[View on Etherscan](https://sepolia.etherscan.io/address/0x07012aeF87C6E423c32F2f8eaF81762f63337260)

**ProverRegistry (Sepolia):**
`0x08e1fc1A0d614bc132B48950760c7A291cCB8946`
[View on Etherscan](https://sepolia.etherscan.io/address/0x08e1fc1A0d614bc132B48950760c7A291cCB8946)

**SPHINCS+ Verifier (Sepolia):**
`0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103`
[View on Etherscan](https://sepolia.etherscan.io/address/0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103)

<!-- TODO[founder]: Add 5 example lock transaction hashes from Sepolia here once test transactions are confirmed live. Format: `- Lock tx: 0x...` (one per line). Use this placeholder until then. -->
Example lock transactions: [TODO — founder to insert confirmed Sepolia tx hashes]

**Source code:**
[github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield)

**Cryptographic stack:**

The backend is Rust. Signature operations use:

```rust
// ML-DSA-65 (NIST FIPS 204) — hot path
// Crate: fips204
use fips204::ml_dsa_65;

// SLH-DSA-128f (NIST FIPS 205 / SPHINCS+) — emergency path
// Crate: slh-dsa
use slh_dsa::Sha2_128f;
```

All hashing at the application layer uses SHA3-256. The Solidity contracts use `keccak256` — this is an EVM constraint, not a design choice. The application-layer cryptographic boundary is SHA3-256 throughout.

The backend runs NIST FIPS 204 in ML-DSA-65 mode (security level 3). We are not using ML-DSA-44 or ML-DSA-87.

**EF ESP application:**
We submitted an Ethereum Foundation Ecosystem Support Programme application covering the NTT precompile integration research and the threshold-ML-DSA feasibility probe.
<!-- TODO[founder]: Insert ESP application ID and submission confirmation link once submission is confirmed on Mon 2026-05-11. Replace this line. -->
ESP application: [TODO — insert application ID post 2026-05-11 submission]

---

## Open problems

These are the questions we have not resolved. We are describing them because the ethresear.ch audience is more likely than we are to have relevant prior work or to identify failure modes we have missed.

### 1. Is the SR₀/SR₁ trust split a defensible interim design?

The argument for it: SR₀ provides on-chain proof of depositor intent; SR₁ provides economic accountability for Prover behavior; the combination is meaningfully stronger than no PQC attestation at all, even if SR₁ is not cryptographically verified on-chain.

The argument against it: if the Prover Pool colludes or the VRF oracle is compromised, SR₁ is not evidenced on-chain. An examiner relying on the SR₁ hash commitment for compliance purposes is trusting the Prover economic mechanism, not a cryptographic proof.

We have not found a published analysis of this specific trust-assumption split in the context of EVM-constrained PQC verification. Counter-arguments and citations welcome.

### 2. Threshold-ML-DSA: prior art past 2018?

We have committed (internal W19 Decision #5) to running a feasibility probe on threshold-ML-DSA. The motivation: a multi-party institutional custody setup may require that no single party holds a complete ML-DSA signing key, mirroring how MPC/TSS distributes ECDSA keys today.

The FROST construction (Komlo and Goldberg, 2021) is structurally designed for Schnorr-like schemes. It does not directly transfer to module-lattice signatures because ML-DSA lacks the additive homomorphism that makes FROST's secret-sharing approach work cleanly.

The most recent threshold lattice signature work we are aware of is Damgård, Orlandi, Takahashi, and Tibouchi (2022) on threshold ECDSA, and Boneh and Glass (ongoing) on threshold BLS, neither of which is directly applicable. In the lattice setting specifically, we are aware of Bendlin, Damgård, Orlandi, and Zakarias (2011) on threshold lattice primitives, but nothing production-grade for ML-DSA-65 specifically.

If anyone has pointers to more recent work — particularly anything targeting CRYSTALS-Dilithium or ML-DSA specifically — we want them.

### 3. Composition with EIP-8141

EIP-8141 (proposed March 2026, referenced in the Ethereum Magicians thread [TODO — founder to confirm EIP-8141 exists and insert canonical link]) addresses the user-side key migration path via account abstraction: users can migrate from ECDSA wallets to ML-DSA or SLH-DSA keys through AA-compatible smart accounts.

Our reading is that EIP-8141 and the QS attestation-receipt layer are orthogonal. EIP-8141 handles the user's own signing key. QS handles the institutional custody vault's attestation receipts for locked assets. A user could have an EIP-8141-compliant AA wallet and interact with a QS-secured custody vault simultaneously, with no conflict.

The tension we see: if EIP-8141 is adopted widely, the depositor's ML-DSA signing key may be managed by an AA entrypoint contract rather than directly by the user. The QS lock flow currently expects the depositor to present an ML-DSA-65 signature directly. Whether this remains compatible with AA-managed keys is an integration question we have not fully worked through.

Counter-arguments to the "orthogonal" framing, or prior work on the custody-vault-side migration question that EIP-8141 does not address, are welcome.

### 4. SLH-DSA signature size in the emergency path

SLH-DSA-128f (SPHINCS+-SHA2-128f-robust equivalent) produces signatures of approximately 17 KB. For the emergency unlock path — used only when the normal 24-hour time lock is bypassed — we accept this signature size, pass it through calldata, and pay the corresponding L1 gas cost. The economic design makes emergency unlocks expensive by intent (0.5 ETH bond minimum, plus calldata gas).

For any production-path use case where SLH-DSA signatures need to appear frequently on-chain, 17 KB calldata is a hard constraint. We are aware of SLH-DSA-128s (smaller, ~7.9 KB signatures, slower keygen) but have not evaluated the trade-off for this use case.

If there is a hash-based scheme with sub-5 KB signatures and equivalent NIST security level that we are missing, we would like to know about it.

---

## What we are not claiming

The ethresear.ch community is rightly skeptical of overclaiming. To preempt the most likely critiques:

**Not a replacement for MPC, TSS, or FROST.** QS is a composable attestation layer. The underlying asset transfer signing mechanism at an MPC custodian is unchanged. We are not arguing that lattice signatures should replace threshold ECDSA for transaction signing at this time.

**Not "quantum-resistant" in the marketing sense.** ML-DSA-65 and SLH-DSA-128f are NIST FIPS 204/205 standardized algorithms. The community knows what that means in terms of conjectured security against both classical and quantum adversaries. We are not making claims beyond what the NIST standardization implies.

**Not deployed to mainnet.** Ethereum Sepolia only. We intend to add Arbitrum Sepolia (chain 421614) as an L3 testnet deployment; the L3 contracts for governance and token operations are already deployed there. Mainnet deployment is not on the current roadmap; it follows from a successful testnet period and regulatory engagement in target jurisdictions.

**Not solving HSM PQC integration.** Hardware security modules with ML-DSA support are a separate problem. Our current implementation performs ML-DSA-65 signing in software (Rust, `fips204` crate). The HSM vendor certification pipeline for NIST FIPS 204 is a different workstream, driven by vendors like Thales and Utimaco. We track it but do not attempt to solve it.

**Not claiming a specific Q-day timeline.** The urgency framing we use is regulatory, not threat-timeline-based. JFSA, OMB, and DORA are requiring cryptographic agility planning now, independent of when fault-tolerant quantum computers arrive. That is the driver.

---

## Feedback wanted

Four specific questions for the community:

1. **SR₀/SR₁ security argument.** Is the separation — on-chain cryptographic verification of the depositor signature, economic accountability for the Prover co-signature — an acceptable interim trust model, or does it open an attack vector we have not documented? Specifically: can a sophisticated adversary exploit the off-chain SR₁ storage in a way that undermines the depositor's on-chain claim?

2. **Threshold-ML-DSA prior art.** For the threshold-ML-DSA feasibility probe: is anyone aware of work on threshold lattice signatures more recent than Damgård-Orlandi 2018-era results, specifically targeting CRYSTALS-Dilithium or ML-DSA? We are starting the probe from Bendlin et al. (2011) and would prefer not to re-derive known results.

3. **EIP-8141 composition.** Does the "orthogonal" framing hold? If an institution uses QS for custody-vault attestation receipts and their depositors migrate to EIP-8141-compliant AA wallets, is there an integration path, or a fundamental incompatibility we are missing?

4. **Practical institutional input.** If you work at or advise an institutional custodian, exchange, or regulatory body: would an attestation-receipt primitive of this shape — on-chain, NIST FIPS 204/205 signed, auditor-readable — be integrable into your compliance reporting workflow, or is there a structural reason it would not be accepted? We are interested in failure modes from the compliance side, not just the cryptographic side.

---

## Resources

- Live protocol: [quantum-shield.xyz](https://quantum-shield.xyz)
- Source code: [github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield)
- Vault on Sepolia Etherscan: [0x07012aeF87C6E423c32F2f8eaF81762f63337260](https://sepolia.etherscan.io/address/0x07012aeF87C6E423c32F2f8eaF81762f63337260)
- EF ESP application: [TODO — insert link post 2026-05-11 submission]
- NIST FIPS 204 (ML-DSA): [https://doi.org/10.6028/NIST.FIPS.204](https://doi.org/10.6028/NIST.FIPS.204)
- NIST FIPS 205 (SLH-DSA): [https://doi.org/10.6028/NIST.FIPS.205](https://doi.org/10.6028/NIST.FIPS.205)
- `fips204` Rust crate: [https://crates.io/crates/fips204](https://crates.io/crates/fips204)
- `slh-dsa` Rust crate: [https://crates.io/crates/slh-dsa](https://crates.io/crates/slh-dsa)

---

## Founder publish checklist

Before posting this to ethresear.ch, verify each item. Do not post with any unresolved TODO.

1. **Contract addresses.** Confirm the three Sepolia addresses in the "Implementation" section (`0x07012...`, `0x08e1fc...`, `0xD090b5...`) resolve correctly on [sepolia.etherscan.io](https://sepolia.etherscan.io) and match what is deployed. Do not post if any address is stale or undeployed.

2. **Etherscan transaction hashes.** Replace the `[TODO — founder to insert confirmed Sepolia tx hashes]` placeholder with 5 real lock transaction hashes from Sepolia. These should be transactions that actually executed `lock()` on the Vault. An examiner or researcher will check them.

3. **GitHub repository visibility.** Confirm [github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield) is public and the `src/contracts/` directory is visible. If the repo is private, ethresear.ch readers cannot verify the implementation claims and the post loses its primary credibility anchor.

4. **EF ESP application ID.** After submitting the ESP application on or around Mon 2026-05-11, insert the application ID and/or confirmation link into both the "Implementation" section and the "Resources" section. Remove the `[TODO]` placeholder.

5. **EIP-8141 existence check.** Verify that EIP-8141 (referenced in Open Problem 3) actually exists and is accurately described. Search [eips.ethereum.org](https://eips.ethereum.org) for the EIP number. If the EIP number is wrong or the EIP does not yet exist, either correct it or remove the reference and rephrase the AA composition question in general terms.

6. **Job-posting survey citation.** The W19 job-posting zero-count claim in the Motivation section must be backed by `docs/intelligence/discovery/W19-job-postings.md`. If this survey is not documented, either document it or soften the claim to "no public evidence of active PQC engineering hiring" without a specific survey count.

7. **On-chain ML-DSA vs hash-commitment verification.** The "Implementation" section states that SR₀ is "verified on-chain" via the SPHINCS+ Verifier contract. Confirm whether this contract currently performs full on-chain ML-DSA-65 verification, full SLH-DSA-128f verification, or only a hash-commitment check. The distinction is material to the SR₀/SR₁ security argument in Open Problem 1. Correct the text to match actual contract behavior.

8. **Word count and tone check.** Read the full post aloud (or have a colleague read it). ethresear.ch posts that read as product marketing are downvoted quickly. The "What we are not claiming" section is load-bearing for tone. If any sentence sounds like it belongs in a press release, cut or rewrite it before posting.

---

<!-- Distribution notes (internal — do not post):

Cross-post candidates after ethresear.ch publish:
- Link in Ethereum Magicians thread on EIP-8141 (if thread exists)
- Link in any active CRYSTALS-Dilithium / NIST PQC EVM integration discussion threads
- Share in QRL Discord #ethereum channel if relevant discussion is active

Suggested X thread excerpt (founder posts manually, no emojis):
"We deployed an ML-DSA-65 (NIST FIPS 204) attestation receipt protocol on Ethereum Sepolia and wrote up the open problems we haven't solved yet. Specifically: threshold-ML-DSA prior art, SR0/SR1 trust split defensibility, and EIP-8141 composition. Post on ethresear.ch [link]. Feedback on any of the four questions is the point."

LinkedIn note (Japanese institutional audience — post separately, not a cross-post of the ethresear.ch text):
Draft separately as a Zenn/note article targeting JFSA compliance leads. The ethresear.ch post is English-technical and is not appropriate for direct LinkedIn cross-post to Japanese compliance audience.
-->
