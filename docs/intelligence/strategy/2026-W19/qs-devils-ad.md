# qs-devils-ad — Devil's Advocate Brief (W19, 2026-05-09)

## 1. Position

QS is solving a **2040 problem with 2026 dollars** while burning solo-founder runway on an agentic management LARP that hasn't shipped Phase 1. The actual buyers of custody (BitGo, Anchorage, Fireblocks, Coincheck) are hedging quantum risk with **MPC + key rotation**, not by migrating to a new PQC-native chain — meaning QS is building a product whose enterprise TAM evaporates the moment any incumbent ships an ML-DSA verifier as a 200-line addition to their existing stack. The "Japan-rooted post-quantum custody protocol" frame is three constraints stacked into a positioning, not an edge.

## 2. Three concrete actions to derisk (next 7 days)

1. **Five buyer calls or pivot.** Get on calls with: 1 Japanese exchange CTO (bitFlyer / Coincheck / SBI VC), 1 BitGo or Fireblocks PM (cold LinkedIn works — say "PQC roadmap, 20 min"), 1 institutional custodian compliance lead, 1 EF PSE researcher, 1 PQShield or QRL BD. **Disqualifying signal**: nobody says "we'd pay for a PQC custody chain in 2026-2027." If 0/5, pivot the wedge to PQC compliance attestation / PQC-as-a-service for existing custodians within 14 days.

2. **Freeze agent infrastructure. Ship Phase 1 + a 90-second demo.** No new agents, skills, or workflows for 7 days. Consumer Lock FE → BE → DB → L1 working end-to-end on Sepolia, with a recorded demo posted to Twitter/Farcaster. If you cannot ship Phase 1 in a week with 9 agents and 13 workflows already in place, **the agentic model is a tax, not leverage** — and that's the data point.

3. **Add API-key fallback to the daily-plan cron and decouple grant deadlines from OAuth.** Anthropic can rate-limit Pro OAuth for CI any Tuesday. EF ESP, NIST grant windows, and the daily-plan PR pipeline must survive that. 2 hours of work; ignoring it is gambling the Q2 grant cycle on a TOS the founder doesn't control.

## 3. One scenario where QS dies in 6 months

**November 2026**: EIP-7932 (account abstraction signature aggregation) ships on mainnet with a generic verifier precompile. A PSE intern lands a 400-line PR adding ML-DSA verification to Safe{Wallet}. Safe ships "post-quantum mode" as a one-click toggle for all 8M existing Safes. BitGo announces same week. **QS's entire architectural moat — a separate L3, a Prover Pool, VRF challenges, a custom Vault — collapses into "why not just use Safe?"** Founder has 4 months of runway, no paying customers, two grants pending that now look redundant. The protocol is technically correct, strategically irrelevant, and the EF politely declines the ESP because Safe shipped what QS proposed. This is not a tail risk — **Safe + PSE are actively scoping this**.

## 4. One non-obvious thing the founder is wrong about

**"Dual NIST signatures (Dilithium + SPHINCS+) is a feature."** It's a liability. Two signature schemes = two attack surfaces, two verifier contracts to audit, two gas-cost regressions, two upgrade paths when NIST revises parameters. Real institutional buyers want **one auditable scheme with a clear migration story**, not a hedge that doubles their compliance review burden. The "belt and suspenders" framing is engineering aesthetics masquerading as risk management — and it's the kind of thing that makes a Fireblocks security review reject the integration in week 2.

## Position summary

1. **Five buyer calls in 7 days or pivot the wedge** — kill the thesis fast or commit harder.
2. **Freeze agent infra; ship Phase 1 + demo this week** — prove the operating model creates leverage on a real artifact, not on itself.
3. **API-key fallback + decouple grants from OAuth** — 2 hours to remove a single-vendor kill switch on the cron pipeline.
