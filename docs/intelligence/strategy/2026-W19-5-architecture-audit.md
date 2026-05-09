---
status: TIER-1 ARCHITECTURE AUDIT (5-lens cross-check)
date: 2026-05-09 Sat JST
parent: docs/intelligence/strategy/2026-W19-5-pulse.md
trigger: founder concern that Nov-Dec 2025 architecture premises may have shifted before public credibility commit
auditors: qs-cto, qs-compete, qs-devils-ad, architect, qs-threat (5 agents, ~$0.50 cost)
verdict: PUBLICATION-BLOCKING — narrative pivot has not landed in code
---

# QS Architecture Audit — Tier 1 Synthesis (W19.5)

## TL;DR

5 agents independently audited 8 load-bearing architectural assumptions from Nov-Dec 2025. **5 of 8 are at minimum ⚠️ across multiple lenses**. The most damaging finding (architect, with code-grep evidence): the W19 "composable layer for MPC custodians" pivot exists in `docs/` only — **zero matches for `MPC|Fireblocks|composable|custodian|integrator` in `src/` tree**. The deployed L1Vault.sol still implements "user calls lock() directly" (standalone PQC custody chain, the original Nov 2025 premise). The 4 credibility documents about to publish (ethresear.ch, arxiv outline, regulatory crosswalk, ESP body Phase 5) commit to architectural claims the code does not back. Reviewers will find this in <5 minutes.

**Recommended action**: hold #3 ethresear.ch publish; consider ESP submit body amendment; pursue **Path C (standards-anchoring pivot)** as the cheapest path that resolves the contradiction without a 4-8 week contract rebuild.

---

## 5-lens convergence matrix

| Assumption | CTO (tech) | Compete (market) | DA (steelman) | Architect (code) | Threat (regulatory) | Verdict |
|---|---|---|---|---|---|---|
| **A** composable layer | — | ⚠️ HSM 3rd option emerged | obj 2: build signal | **❌ code 反映ゼロ** | ✅ DORA Art.28 reinforces | **NARRATIVE-CODE GAP** |
| **B** drop dual-sig | — | — | — | ⚠️ contradicts A | ✅ no regulatory credit | OK if A holds |
| **C** Prover Pool | ⚠️ dispute path unimplemented | — | obj 1: classical game theory | **❌ structurally inconsistent with A** | ⚠️ DORA 3rd-party gap | **COMPROMISED** |
| **D** L1+L3 topology | ✅ sound | — | — | ✅ coherent | ✅ stable | **KEEP** |
| **E** FROST/threshold-Dilithium | **❌ structurally invalid** | — | — | low blast (decorative) | ❓ deferred correctly | **CLOSE formally** |
| **F** SR_0/SR_1 split | ✅ disclosure required | — | — | ⚠️ NTT precompile dependent | ✅ SHA3-256 holds | OK + disclosure |
| **G** MPC vendor integrate vs build | — | **❓→❌** build signal | obj 2 (same) | **❌ no SDK exists** | ⚠️ DORA vendor register | **EXISTENTIAL** |
| **H** EIP-8141 orthogonality | ⚠️ unverified | — | obj 3: redundant for AA | **❌ ABI incompatible** | ✅ no regulatory dep | **REVERT or build shim** |

**Convergence count**: A/C/G/H received ❌ from architect (code) + at least one other lens. E received ❌ from CTO. Only D and F survive multi-lens scrutiny.

---

## 3 hardest findings (with file evidence)

### Finding 1 — W19 pivot is cosmetic. Code still implements Nov 2025 architecture.

Architect agent (tool_uses: 46, real code analysis):

- `src/l1/contracts/src/L1Vault.sol` lines 340-428: `lock(recipient, dilithiumPubKey)` records `sender: msg.sender` directly. **No `onlyIntegrator` modifier, no `IntegratorRegistry`, no `lockOnBehalfOf` entrypoint.**
- `src/l1/contracts/src/interfaces/`: only `IConstitutionLock`, `ISPHINCSVerifier`, `IVRFConsumer`, `ICoreVerifier`, `ICoreBatch`, `IProverRegistry`. **No custodian/MPC adapter.**
- Repository-wide grep: `MPC|Fireblocks|composable|custodian|integrator` returns **zero matches** in `src/api/api/src/`, `src/frontend/web/src/`, deployed L1 contracts.
- The HSM-attestation `ProverRegistry.sol` v3 variant exists but is **not the deployed contract** at `0x08e1fc1A0d614bc132B48950760c7A291cCB8946`.

> **Quote (architect)**: "The four credibility documents about to ship are making architectural claims that the code does not back. Publishing the ethresear.ch post in current form will draw responses pointing to L1Vault.sol lines 340-428 as evidence that the 'composable layer' framing is not implemented — and ethresear.ch reviewers will find this in under five minutes."

### Finding 2 — A vs C is structurally mutually exclusive

CTO + Architect + DA independently identified this:

- **A** says "MPC custodian holds the keys; QS sits on top as attestation layer"
- **C** says "VRF-selected external Provers co-sign every lock"

A custodian like Fireblocks will not subordinate every customer transaction to an external VRF Prover quorum. Either:
- A wins → Prover Pool becomes redundant or repurposed as "external auditor pool" (different design)
- C wins → QS is a decentralized PQC custody chain (not composable layer), competes with QRL, abandons MPC-vendor wedge

Cannot have both. Current code implements C. Current narrative claims A.

### Finding 3 — G (buy vs build) is existential, evidence leans to build

DA + Compete + Architect converge:

- W19 job-posting survey: 8/8 custodians 0 PQC keyword. Two valid readings:
  1. "buying window — they're not ready" (DA's own W19.5 framing, since softened)
  2. "they will build internally — they don't need vendors" (the brutal reading)
- Fireblocks public language: "actively building our roadmap and conducting research" + "publishing full PQC strategy doc later in 2026". **A vendor about to issue an RFP does not publish their own strategy doc.**
- Coinbase: executive commitment to "quantum-proof custody by late 2026" + zero PQC hiring = ambiguous (buy or single-engineer thin wrapper)
- Zero confirmed public custodian × PQC-vendor partnerships (Thales, Utimaco, PQShield, SandboxAQ).

> **Quote (DA, sharpest)**: "If Fireblocks ships even a rudimentary ML-DSA wrapper around their existing MPC architecture before QS has a single paying customer, the composable layer argument collapses — because the vendor they were supposed to compose with has already composed with themselves."

---

## Three paths forward

### Path A — Rebuild contracts to match the W19 pivot (4-8 weeks engineering)

Add `IntegratorRegistry` + `lockOnBehalfOf(custodian, depositor, ...)` ABI to L1Vault. Demote/reframe Prover Pool as "external auditor pool". Add EIP-8141 EntryPoint-aware lock path. Redeploy → new Sepolia addresses → update every doc that hardcodes `0x07012aeF...7260`.

- **Cost**: 4-8 weeks founder time + audit risk on new contracts
- **Risk**: ESP submission body becomes a roadmap promise rather than deployed-evidence; W20 buyer-call momentum lost; cash burn continues without revenue evidence
- **Outcome**: narrative finally true. But you are betting 2 months of runway on an architectural premise (G) that has not been buyer-validated.

### Path B — Revert W19 narrative pivot, ship as "decentralized PQC custody protocol with Prover Pool" (1-2 days)

Match the public claims to what the code actually is. Drop "composable layer for MPC custodians" framing entirely. Compete head-to-head with QRL.

- **Cost**: rewrite the 4 credibility docs (1-2 days founder time)
- **Risk**: lose the wedge that was the entire 2026-W19 strategic decision. Become QRL competitor (QRL is established 2018, has token/community/exchanges). Lose Japan FSA-friendly narrative because "decentralized" doesn't map to JFSA's regulated-entity preference.
- **Outcome**: architecturally honest. Strategically retreating to a worse market position.

### Path C — Standards-anchoring pivot ⭐ (3-5 days, recommended)

Both **compete** (alternative wedge) and **DA** (objection-2 defang) independently arrived here.

> **Quote (DA)**: "Stop trying to sell the Vault contract as a product custodians integrate. Swap the integration model: publish QS's SR_0/SR_1 split-receipt construction as an open ERC with a reference implementation that custodians adopt as a standard, rather than as a vendor dependency."

> **Quote (compete)**: "Standards-anchoring play rather than B2B SaaS play. Revenue model shifts from integration license to certification-as-a-service. Japan-rooted distribution remains relevant because FSA compliance filings create the citation demand."

**Concrete shape**:
1. Reframe QS as: **"Open specification (ERC) for PQC custody attestation receipts, with deployed reference implementation on Sepolia."**
2. Submit SR_0/SR_1 split + Prover/Observer pattern as an ERC to ethereum/EIPs (2-3 days)
3. Update credibility docs:
   - **ethresear.ch**: "We're proposing this as an ERC. Reference implementation is deployed. Open problems are X, Y, Z."
   - **arxiv outline**: keep as-is; preprint becomes the spec rationale
   - **ESP body**: change Phase 5 from "reference integration with Fireblocks/BitGo" to "ERC submission + reference implementation maintenance"
   - **regulatory crosswalk**: position QS as the citable open spec for compliance filings (no claim of being a regulated vendor)
4. Defangs G (buy vs build): standards-layer wins regardless of vendor decision
5. Defangs H (EIP-8141): if EIP-8141 ships and obviates the lock flow, the ERC remains the on-chain receipt format
6. Defangs C (Prover Pool A vs C contradiction): the ERC **specifies** the trust model; reference implementation can use Prover Pool, custodians can use their own MPC for SR_1 generation. Both interpretations valid under the spec.

- **Cost**: 3-5 days founder time (writing the ERC + updating docs)
- **Risk**: ERC submission may not be accepted by EIPs editors; standards plays take 12-24 months to gain traction; revenue model less clear (certification-as-a-service is new)
- **Outcome**: architecturally honest, narratively coherent, defends against build-or-buy outcome regardless of which way it goes. Founder remains positioned as protocol author, not vendor.

---

## Recommended path: C, with conditions

### Why C
- Resolves the A-vs-C structural contradiction (architect)
- Defangs DA's sharpest objection (Fireblocks builds anyway)
- Aligns with EF preferences (specifications are EF's love language)
- Honest about current code state (no rebuild required)
- Maintains W20 momentum for buyer calls (now framed as "would you cite this ERC in your DORA filing?")

### What stops C
- ERC submission process timing (founder must accept "spec accepted" is not guaranteed)
- May need a co-author / ERC champion in Ethereum community
- Loses the "defensible product" framing that was nice for VC pitch deck (this is real — pitch deck v1 needs revision)

---

## Immediate publication implications

### #3 ethresear.ch post (`docs/blog/W20-ethresearch-pqc-mpc-composable.md`)
**Status: BLOCK PUBLISH until Path C decision**

The post claims "PQC-on-top-of-MPC: composable layer". L1Vault.sol does not implement this. ethresear.ch reviewers reading the linked code will identify this immediately. If founder commits to Path C, rewrite as **"Proposed ERC: PQC attestation receipts on EVM, with Sepolia reference implementation."** That framing is honest and survives code review.

### ESP submission Mon 2026-05-11 (`docs/grants/EF_ESP_APPLICATION.md`)
**Status: 月曜判断必要 (Sun までに decide)**

Application body Phase 5 claims "Reference integration for EIP-8141: Quantum Shield as the first deployed custody protocol that fulfils the 'PQ-ready account' semantics defined in the EIP." Architect identified this as code-unbacked.

Two options for Mon:
- **Option ESP-1**: Submit as-is, accept reviewer-question risk, plan amendment via tcoratger@ethereum.org follow-up email after Path C decision
- **Option ESP-2**: Defer 1 week, rewrite Phase 5 as "Submit ERC for PQC attestation receipts; maintain reference implementation; integrate community feedback for EIP-8141 composition path", submit Mon 2026-05-18

ESP-1 preserves the $25k/h × 30% = $7,500/h CFO calculus but bets on follow-up email being sufficient. ESP-2 delays by a week but ships a defensible application.

### #5 Compliance crosswalk (`docs/compliance/QS_REGULATORY_CROSSWALK.md`)
**Status: usable post Path C revision** — most rows already framed as "claims to address" not "addresses". After Path C, position QS as "open spec referenced in compliance filings".

### #6 arxiv preprint outline
**Status: usable post Path C revision** — preprint becomes the spec rationale document. Sections 3, 5, 6 stand. Section 1.3 contributions need rewording (contribution (a) becomes "specification + reference implementation", not "deployed protocol claiming production utility").

---

## Concrete decisions for founder by Sun 5/10 18:00 JST

1. **Path A / B / C — pick one** (or hybrid: e.g., Path C now + Path A engineering in parallel as W21+ workstream)
2. **#3 ethresear.ch publish: BLOCK confirmed?** (default: YES until Path C decision)
3. **ESP submit Mon: ESP-1 (submit as-is + follow-up) or ESP-2 (defer 1 week + revise)?**

If founder picks Path C + ESP-2:
- Sun: rewrite ESP Phase 5 (~1h)
- Mon-Wed: draft ERC document (~6h founder)
- Thu-Fri: rewrite #3 ethresear.ch as ERC-framed (~2h)
- Mon 5/18: submit ESP + post ethresear.ch + submit ERC simultaneously

If founder picks Path C + ESP-1:
- Mon 5/11 09:00: submit ESP as-is per existing T-1 checklist
- Mon 5/11 PM: send Tcoratger follow-up email noting amendment incoming
- Mon-Fri: same ERC drafting
- Mon 5/18: post ethresear.ch + submit ERC

If founder picks Path A or B, separate workstream design needed.

---

## Audit cost vs value

- 5 agents × ~$0.10 = ~$0.50 spend
- Time: ~25 minutes wall-clock from launch to last completion
- Value: prevented public commitment to architectural claim that code does not back. Saved likely-public embarrassment and grant-credibility damage. **This is exactly what the agentic infrastructure was built for.**

This audit is the W19.5 follow-up that the W19 memo's "freeze new agent infra 7 days" decision was supposed to prevent us from skipping. Founder's instinct to pause and audit before publish was correct.

---

**Next**: founder decides Path A/B/C + ESP/publish timing by Sun 5/10 18:00 JST. Recommend launching Path C draft work Sun evening if signal is positive.
