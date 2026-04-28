# Building on the Coinbase Quantum Advisory: Custody-Layer PQC, Today

_Draft v1 — written 2026-04-28 for publication on Mirror.xyz, ETH
Research, and Hacker News by 2026-05-04._

_Author: Kota Kato, founder, Quantum Shield._

---

## TL;DR

- Coinbase's Independent Advisory Board on Quantum Computing &
  Blockchain (Boneh, Drake, Aaronson, Lindell, Malkhi, Kannan)
  published a 50-page report on April 21, 2026 calling the
  post-quantum migration **urgent**, citing roughly **6.9 million BTC**
  in pubkey-exposed wallets and a comparable order-of-magnitude
  exposure on Ethereum.
- The report's recommended construction — dual signatures combining a
  lattice scheme (ML-DSA / Dilithium) with a hash-based scheme
  (SLH-DSA / SPHINCS+) — has been live on Sepolia since 2026-04-03
  in the form of **Quantum Shield**, a non-custodial L1 vault
  protocol.
- This post is not a rebuttal. It's a "yes, and." The Advisory's
  framework is correct. We have the artifact.

## What the Advisory said

Six cryptographers and computer scientists with no shared commercial
interest reached consensus on three points:

1. **The threat is no longer a 2030+ research problem.** Hardware
   advances in 2025–2026 (Quantinuum's 94 protected logical qubits,
   IBM Nighthawk's 120 qubits with 10× error-correction speedup,
   Google Willow's below-threshold confirmation) compress the
   credible Q-Day window to a 5-year tail.
2. **Migration must happen at the custody layer first.** Account
   abstraction (EIP-8141) is on the Ethereum roadmap but EF
   Checkpoint #9 demoted it to "Considered for Inclusion" on April 10,
   2026 — meaning the consensus-layer PQ migration is at least 6 more
   months away. Custody primitives can ship now.
3. **Defense in depth requires dual-family signatures.** A single
   algorithm bet (lattice-only or hash-only) is uninsurable. The
   Advisory specifically recommends the combination of a
   structured-lattice scheme like ML-DSA-65 with a stateless
   hash-based scheme like SLH-DSA-128.

I read the report closely. I agree with all three points.

I'd like to show you what the recommended architecture looks like
when it ships.

## What Quantum Shield is

A non-custodial vault protocol on Ethereum that wraps any ETH or
ERC-20 deposit in dual NIST FIPS 204 + FIPS 205 cryptographic
authorization. To unlock, the user's ML-DSA-65 signature *and* a
quorum of SPHINCS+ co-signatures from a VRF-selected prover pool
must both verify.

- **L1 vault on Sepolia**:
  [`0x07012aeF87C6E423c32F2f8eaF81762f63337260`](https://sepolia.etherscan.io/address/0x07012aeF87C6E423c32F2f8eaF81762f63337260)
- **L3 governance contracts on Arbitrum Sepolia** (12 contracts
  including Governor, veQS, Treasury), Sourcify-verified.
- **WASM SDK** for browser-side Dilithium signing — same
  SLH-DSA-128 parameter set Trezor adopted in their Safe 7 hardware
  wallet, also released April 2026.
- **Public Beta** on
  [quantum-shield.xyz](https://quantum-shield.xyz) — fully open
  source under MIT at
  [github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield).

## Where Quantum Shield maps to the Advisory's recommendations

| Advisory recommendation | Quantum Shield's design |
|---|---|
| Dual-family signatures | ML-DSA-65 (FIPS 204) + SPHINCS+-128s (FIPS 205) — both required for every state transition |
| Migration must work today, not after consensus changes | L1 vault is a regular Ethereum contract; works against current EVM, no precompile dependency |
| Quantum-vulnerable assets need a custody primitive, not just a wallet feature | Vault is settlement-layer; Trezor / StarkNet S2morrow / future hardware wallets become *signing devices* into our vault, not competitors |
| Defense in depth against single-algorithm break | Compromising ML-DSA *or* SPHINCS+ alone never produces a successful unlock |
| Auditable, not aspirational | Sepolia-live; Sherlock contest scheduled; full repo public |

We did not retrofit the protocol to match the Advisory's framing. We
shipped this design in March 2026 because the underlying engineering
constraints are the same constraints the Advisory describes. We are
the empirical case study for the recommendations the Advisory makes.

## What's not done yet

I'd like to be specific about what we have not solved, because the
Advisory rightly notes that hand-waving in PQ custody costs lives:

1. **L1 SPHINCS+ verification is simplified in Phase 1.** Full FIPS
   205 verification on L1 costs >30M gas, exceeding the block gas
   limit. We have committed to a SP1-zkVM-based ZK proof of SPHINCS+
   verification for Phase 2 (Q3 2026), with the verifier interface
   already in place. Documented in
   [`docs/ROADMAP_PQ_VERIFIER.md`](https://github.com/kota1026/quantum-shield/blob/main/docs/ROADMAP_PQ_VERIFIER.md).
2. **Mainnet has not shipped.** Sepolia testnet is live; mainnet is
   gated on a Sherlock audit (in progress) plus pre-Sherlock blocker
   fixes [committed and reviewed publicly](https://github.com/kota1026/quantum-shield/blob/main/docs/security/PRE_SHERLOCK_BLOCKERS.md).
3. **No institutional partner has signed a production
   integration yet.** That conversation starts with this post.

## What I'd like from this conversation

If you are at a custodian, a hardware wallet vendor, or an L1 / L2
research team, three things would change my next quarter:

1. **Read the
   [threat model](https://github.com/kota1026/quantum-shield/blob/main/docs/threat-model.md)
   and tell me what's wrong.** The current Q-Day estimate, the
   dual-signature mitigation argument, the side-channel posture —
   challenge any of it.
2. **Try the protocol.** A 30-second flow on Sepolia. The WASM SDK
   produces a Dilithium key in your browser, the lock confirms on
   L1, the unlock co-signature flow exercises the prover quorum. No
   account, no waitlist.
3. **If you ship a hardware wallet that signs SLH-DSA today**
   (Trezor Safe 7 is the working example), we would value a
   reference-integration conversation. The hardware wallet signs;
   our vault settles. There's no IP overlap.

## Why I think this post matters

The Coinbase Advisory established a vocabulary the entire industry
will use for the next 18 months. Anyone building PQ custody now has
to either fit that vocabulary or argue against it. We fit it. That
matters less for marketing than for engineering — it means a Sherlock
auditor, an EF reviewer, or a prospective integration partner can
read both documents and resolve them against each other in 20
minutes.

The Advisory's report is the most credible piece of public PQ
analysis published in 2026. The fact that there is now also a working
implementation on Sepolia that mirrors its construction is, I think,
the most actionable post-Coinbase-Advisory news this month.

I'd be grateful for criticism. The
[`@kota1026`](https://github.com/kota1026) GitHub issues are open;
my email is `kota@quantum-shield.xyz`.

---

_Quantum Shield is a solo-founder MIT-licensed open source project.
The views in this post are mine. Nothing here implies endorsement by
Coinbase, the Advisory Board members, or the Ethereum Foundation._

_Live demo: [quantum-shield.xyz](https://quantum-shield.xyz)._
_Repository:
[github.com/kota1026/quantum-shield](https://github.com/kota1026/quantum-shield)._
_Threat model:
[docs/threat-model.md](https://github.com/kota1026/quantum-shield/blob/main/docs/threat-model.md)._
