---
status: PHASE 2.5 STRATEGY MEETING — final synthesis before T1 engineering test
date: 2026-05-09 Sat JST
parent: docs/intelligence/research/2026-W19-crypto-optimization-deep.md
participants: qs-pm, qs-cto, qs-cfo, qs-threat, qs-compete, qs-devils-ad, qs-crypto-research
agent_cost: ~$0.70 across 7 strategic-agent stress-tests
verdict: F+C path conditional on T1 (1-day SP1 spike Mon W21) — STOP all further strategy meetings until T1 results commit
---

# QS Architecture — Phase 2.5 Strategy Meeting (Reframed)

## TL;DR

7 agents stress-tested the reframed architecture: **A-E custody-product choices × F-J cost-optimization layers as orthogonal axes** (qs-crypto-research's structural reframe). Consensus path emerged:

- **Primary**: **F + C** = Migration vehicle (Architecture C) + Batch ZK verifier (Architecture F) as cost engine
- **Conditional on**: T1 single test in W21 Mon (1 day, $0) — compile `fips204` v0.4.1 inside SP1 no_std, prove single ML-DSA-65 verify, measure wall-clock
- **Kill if**: T1 prove time >60s on dev hardware OR N=4 scaling >5min in W21 Tue

**Architecture D (zkVM-attested single sig) is retired** — it is the N=1 degenerate case of F (cto + crypto-research converge).

The Groth16 BN254 wrap creates a "PQ-sig with classical-proof" gap (threat + devils-ad + pm flag) — defangable through explicit disclosure + WHIR transition plan, not a killer.

**STOP DISCIPLINE**: 5 strategic memos + 1 deep research output today (cumulative ~$3.00 / $30 monthly budget). The next agent dollar goes to engineering code review (rust-reviewer, security-reviewer), NOT another strategy memo. No more meetings until T1 result is committed to repo.

---

## 7-Lens Verdict Matrix (Phase 2.5)

| Agent | Verdict | Sharpest single contribution | Top combination |
|---|---|---|---|
| **qs-pm** | MODIFY (stays) | "F doesn't produce a named buyer — it produces better cost for a STILL-unnamed batch-use-case buyer. Send the cold email." | F + B (if T2 positive); F + C (otherwise) |
| **qs-cto** | MODIFY F | "T1 must measure SP1 N=1 ML-DSA-65 prove time before anything else. Kota Dilithium gadget's 22s is for a different circuit; ML-DSA-65 has k=6,l=5 vs ML-DSA-44 k=4,l=4 — could be 1.5-2× more arithmetic" | F + (any A-E) provided T1 passes |
| **qs-cfo** | CONFIRM F | "ESP EV under F = $10k/h (vs $2.4k/h Phase 2.4); Phase 2.4 JSPS $45,375/h was arithmetic error — actual is $545/h. JSPS is FASTER cash event, not higher $/h. **Pursue F + JSPS in parallel.**" | F + JSPS bridge grant |
| **qs-threat** | MODIFY F | "Groth16 BN254 = classical proof of PQ sig. Defangable if disclosed explicitly + WHIR transition plan documented. NOT defangable if hidden. Update regulatory crosswalk." | F + explicit transition disclosure |
| **qs-compete** | F + C strongest | "Vacant cell (a) batched ML-DSA-65 ZK verifier with NIST inner sig is least contested. ZKNoxHQ is most likely competitor (4-12 month window). Stake claim on ethresear.ch at W3/W4 not W7." | **F + C** |
| **qs-devils-ad** | OBJECTION 1 | "Headline 1,055 gas/sig is at N=256 MAX. QS consumer flow is N=1. **Reframe F as prover-pool batching layer (epoch settlement), not user-facing lock primitive.** Falsifiable in 1 hour: 'what's QS's actual batch granularity?'" | F + C (with reframe) OR F + B (if epoch-settlement) |
| **qs-crypto-research** | **CONFIRM F + C** | "F at N≥4 already dominates ETHDILITHIUM (4.9M) and ETHFALCON (1.5M). Audit-deferred 8-week MVP, audit Month 3-6 ($40-60k). Hidden risk: SP1 Groth16 setup ceremony (per-circuit trusted setup) — 6 strategic agents will all miss this." | **F + C** |

---

## Convergence (5+ agents agree)

### 1. THE Mon W21 test is SP1 single-sig prove time
qs-cto, qs-cfo, qs-devils-ad, qs-crypto-research, qs-pm all converge:

**T1' (reframed)**: Compile `fips204` v0.4.1 (`docs.rs/fips204`) inside SP1 v4 no_std (`github.com/succinctlabs/sp1`). Prove ONE ML-DSA-65 verify against a NIST KAT vector. Measure wall-clock prove time + constraint count + proof size.

- **Falsification**: prove time >60s on dev hardware → F dies, redirect to G/H
- **Confirmation**: prove time ≤30s → proceed to N=4 in W21 Tue, then N=64 in W21 Wed
- **Cost**: 1 founder day, $0 cash
- **Output**: 1 markdown table committed to `docs/intelligence/research/` by W21 Mon EOD

**This single test gates everything**. Phase 2.4's T1 (ETHFALCON gas benchmark) is now subsumed — SP1 substrate dominates.

### 2. F + C is the leading combination
qs-compete + qs-crypto-research explicitly. qs-cfo aligned (F is the engine that makes C economically viable: migration of 256 EOAs at ~270k gas total vs 460M gas without F). qs-pm partial support (C is the migration use case where N≥32 batches naturally arise).

Reasoning chain:
- F at N=1 = ETH gas baseline (no advantage)
- F at N≥4 dominates all single-sig Solidity competitors
- F at N=256 = 1,700× cheaper than current baseline
- C (migration vehicle) is the use case that NATURALLY batches (custodian migrating multiple clients in one settlement window)
- A + F is undifferentiated (Safe/Coinbase Wallet can copy)
- B + F requires custodian buyer confirmation (T2 cold email pending)

### 3. Architecture D is retired (subsumed by F)
qs-cto + qs-crypto-research both: Architecture D (zkVM-attested single sig) is the N=1 degenerate case of F. Same SP1 proof, same ~270k gas, same 22s prove time. D should be removed from the strategy menu as a standalone option. F operated at variable N is the unified framing.

### 4. Groth16 BN254 gap is real but disclosable
qs-threat + qs-devils-ad + qs-pm flag it. qs-crypto-research concedes partially. Convergence:

- **Honest framing**: "FIPS 204 ML-DSA-65 signatures + classical Groth16 BN254 verification optimization (transition tech), migrating to WHIR-based PQ-SNARK Solidity verifier upon production availability."
- **Update**: `docs/compliance/QS_REGULATORY_CROSSWALK.md` DORA Art. 6 row + CNSA 2.0 row to disclose BN254 dependency explicitly.
- **Risk**: NISC PQC guidance H2 2026 IF it adopts "end-to-end cryptographic integrity" language → forces F revision. Probability 25-30%.

### 5. Stop the meetings, start the engineering
qs-pm + qs-cfo explicitly: 5 strategic memos + 1 deep research today. Decision quality has converged. **No more strategy meetings until T1 result is committed.** Next agent budget → `rust-reviewer` / `security-reviewer` on actual SP1 circuit code in W22+.

---

## Preserved Tensions (founder must adjudicate)

### Tension 1 — Objection 1 (devils-ad): N=1 vs N=256 batch mismatch
**The killer question**: Is QS's actual transaction granularity N=1 (per-user lock) or N≥32 (epoch settlement)?

- If N=1: F's 1,055 gas/sig headline is misleading. F at N=1 = 270k gas, worse than ETHFALCON 1.5M in UX terms (22s prove latency).
- If N≥32 (epoch settlement / migration batches): F is correct optimization.

**Devils-ad's defang (recommended)**: Reframe F as **prover-pool batching layer for epoch settlement** — users get instant off-chain attestation, on-chain settlement batches every hour. This decouples user-facing latency from on-chain cost. Aligns with charter's "institutional MPC custodians" positioning.

**Founder must answer**: "Is QS's product a user-facing instant-lock service OR an institutional epoch-settlement service?" 1 hour decision, free.

### Tension 2 — JSPS $/h math correction
qs-cfo Phase 2.5 caught arithmetic error in Phase 2.4 memo:
- Phase 2.4 claimed: JSPS $45,375/h (18× better than ESP)
- Phase 2.5 corrected: JSPS $33k × 25% / 20h = **$412/h**, NOT $45,375
- ESP under F: $10,000/h (per qs-cfo Phase 2.5 calculation)
- JSPS is **FASTER cash event**, not higher $/h

**Implication**: JSPS still worth pursuing for cash-flow reasons (W20-Q4 vs ESP W37-Q1 2027), but it's NOT a higher-EV path than ESP under F. Phase 2.4's "JSPS is highest-EV bridge" framing should be revised.

### Tension 3 — Glamsterdam vs Hegotia naming
qs-crypto-research and qs-cto both flag: internal docs say "Hegotia"; actual upcoming fork appears to be "Glamsterdam" per EIP-7773. Multiple strategic memos built on Hegotia 2H-2026 assumption.

**Founder action**: Resolve via Bash `gh api repos/ethereum/EIPs/...` or watch next All-Core-Devs recording (W22, 3h). Affects Phase 2.4 T4 test scope.

### Tension 4 — Competitive race window
qs-crypto-research flags 3 named threats:
1. **Succinct Labs themselves** — substrate + incentive post-Google Q-day. Could publish their own ML-DSA reference circuit any week.
2. **Microsoft Research / Setty camp** — Neo/SuperNeo papers, folding-scheme path
3. **ZKNoxHQ** — single-sig Solidity team, could pivot to batch ZK

**Defensive timing**: qs-compete recommends posting ethresear.ch claim at **W3/W4 of prototype**, not W7. Stake the vacant cell publicly before competitors do.

### Tension 5 — SP1 Groth16 setup ceremony
qs-crypto-research single hidden finding: SP1 Groth16-wrap requires per-circuit one-time setup (proving-key/verifying-key generation).
- If Succinct holds ceremony centrally → opaque trusted-setup dependency in audit packet (embarrassing for PQ-pitched product)
- If per-deployer → multi-hour key-gen step per circuit change (UX concern)

**Founder action**: Confirm SP1's Groth16 setup ceremony model in W21 alongside T1. Affects audit framing.

---

## The Decision Tree

```
W21 Mon (1 day, $0)
└── T1: Compile fips204 in SP1, prove ML-DSA-65 N=1, measure wall-clock
    │
    ├── PROVE TIME ≤30s → F is alive
    │   │
    │   ├── W21 Tue: Test N=4 (target <5min)
    │   │   ├── PASS → F+C path confirmed
    │   │   │   ├── W21 Wed: ethresear.ch claim post (stake the vacant cell)
    │   │   │   ├── W22-W34: 8-week audit-deferred MVP prototype
    │   │   │   ├── W34: Sepolia benchmark + blog + ESP rewrite
    │   │   │   ├── W22 parallel: JSPS university affiliation outreach
    │   │   │   ├── W22 parallel: Update regulatory crosswalk (BN254 disclosure)
    │   │   │   └── W37-44: ESP re-submission + audit cycle
    │   │   │
    │   │   └── FAIL (N=4 >5min) → superlinear scaling, F dies at large N
    │   │       └── Redirect to A-only (Hegotia/Glamsterdam wait) OR G (folding, 12+ months)
    │   │
    │   └── PROVE TIME 30-60s → F alive but slow, reconsider epoch granularity
    │
    └── PROVE TIME >60s → F is DEAD
        ├── Redirect to A-only (ERC + Japan FSA crosswalk publish, no rebuild)
        ├── Document failure in `docs/intelligence/strategy/`
        └── Re-run Phase 2.4 5-test sequence (T2 cold email becomes the gate)
```

---

## What founder commits BY W20 Fri (2026-05-16)

ONE binary commitment:

**Run T1 on Mon W21 (May 18) and commit results to repo by Mon EOD.**

If founder is at son's soccer Sunday and Mon is full of other work → push T1 to Tue/Wed but COMMIT TO A SPECIFIC DAY. T1 sliding indefinitely = continued analysis-paralysis.

**No other commitments needed by Fri W20.** Specifically:
- Don't book audit firms yet (post-W28 task)
- Don't submit ESP yet (post-W34 task)
- Don't pursue JSPS yet (post-W22 task, requires Q4 deadline)
- Don't write more strategy memos (this is the last one)

---

## What changes vs Phase 2.4

| Phase 2.4 finding | Phase 2.5 update |
|---|---|
| A+C hybrid recommended | **F + C** (F replaces A as primary, F is cost engine for C) |
| T1 = ETHFALCON gas benchmark | T1' = **SP1 ML-DSA-65 prove time** (more load-bearing) |
| T2 cold email = critical | T2 still important but **secondary** to T1 (T1 gates F, T2 gates B fallback) |
| JSPS = highest-EV bridge ($45k/h) | JSPS arithmetic error: actual $545/h. Still pursue for fast cash, NOT $/h. ESP under F = $10k/h dominates. |
| 26 weeks A+C audit | 8 weeks F MVP + audit Months 3-6 in parallel = 24-28 weeks total ESP-ready |
| Hegotia 2H-2026 critical dependency | Glamsterdam (real name?) — F is fork-independent, A dies if slip |
| Architecture D = "transition tech, single-sig zkVM" | D = N=1 degenerate of F; D **retired** as standalone option |
| MPC-vendor wedge conceded | Replaced wedge: "first batched FIPS 204 ML-DSA-65 ZK verifier on-chain, level III, no precompile dependency" |

---

## Audit cost discipline

- W19.5 audit: ~$0.50
- Tier-2 research: ~$1.20
- Phase 2.4 meeting: ~$0.60
- Phase 2.1b EF alignment: ~$0.30
- qs-crypto-research deep dive: ~$0.30
- Phase 2.5 meeting: ~$0.70
- **Cumulative weekend: ~$3.60 / $30 monthly = 12%**

The marginal information value of additional strategy meetings is now zero. **HARD STOP**: no further strategic agent invocations until founder commits T1 result to repo. Next agent spend should go to:
- `rust-reviewer` on SP1 circuit code (post-T1 pass)
- `security-reviewer` on audit-preparation packet (post-W28)
- `silent-failure-hunter` on the prover-pool epoch-settlement design (post-N=64 scaling test)

NOT another strategy memo, NOT another deep-research output, NOT another competitive analysis.

---

## Single-line bottom line for founder

> **Mon W21 install SP1, compile ML-DSA-65 verify, time the proof. ≤30s = F+C path. >60s = back to A-only. Pick a day before Fri W20.**

Everything else is documented in this and the prior 5 memos. The agentic strategy phase has converged. Engineering reality (1 test, 1 day, 1 number) takes over from here.
