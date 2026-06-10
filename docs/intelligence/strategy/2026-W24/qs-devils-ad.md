---
agent: qs-devils-ad
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# W24 Devil's Advocate Position Paper — 2026-06-10

### 1. Position: The 198-Hour Plan Is a Thesis That Has Never Touched a Paying Human

The v1.2 pivot is intellectually defensible. "Fastest on-chain ML-DSA-65 verifier" is at least a falsifiable claim — unlike the prior five framings. But the current execution plan is a solo founder spending 198 hours (minimum) building novel crypto FS transcripts and a 500-1000 LOC Solidity verifier that has no auditor, no co-author, no external user, and no committed grant — in order to submit a paper to a conference with a November 2026 deadline, whose acceptance rate and relevance to paying buyers is entirely assumed. The specific attack: **the differentiation is a researcher's distinction dressed as a business moat, and the 198h plan converts founder runway into academic prestige that may never convert into revenue, grant approval, or competitive distance from better-resourced actors who can outrun QS in the same lane.**

### 2. Three Concrete Actions to Derisk

**Action 1 — Run the pre-flight P1/P4 check BEFORE spending hour 1 on code (2 hours, this week).**
Loop #4 confirmed no KeccakChallenger exists as of 2026-06-01 — but Succinct ships weekly. If they merged a Keccak-based IopCtx between W22 and W24, S1's 40h drops to near zero. If they have NOT and they confirm they plan to — QS has a 6-week window before the sub-project is commoditized. Check now, not after 50 hours of code.

**Action 2 — Do 5 technical buyer calls in the next 3 weeks targeting one concrete question: "Would you integrate a gas-optimized ML-DSA-65 Solidity verifier if QS shipped it, and what's your decision timeline?"**
The charter §1.3 KPI floor is benchmark numbers. Zero of those numbers have been shown to a buyer. The ethresear.ch post (`docs/blog/W20-ethresearch-pqc-mpc-composable.md`) has been in DRAFT since 2026-05-09 — 32 days unposted. The Zenn article is `published: false` since at least W19. The W19.5 architecture audit explicitly blocked the ethresear.ch post pending a framing fix — that fix has not been made in 32 days. No publication, no buyer signal, no external validation. If 5 calls return "we'd integrate" plus a named timeline, spend the 198 hours. If they return "interesting research," reframe as EF grant collateral only.

**Action 3 — Freeze all new infrastructure work until the autonomous pipeline is demonstrably running.**
Zero scheduled workflows have ever fired across 7 cron-scheduled workflows; the autonomous operating model was silent for 32 days spanning the entire v1.2 re-pivot period. If the pipeline that is supposed to surface competitive threats, NIST signals, and SP1 upstream changes silently fails for a month, the founder is flying blind while committing 198 hours to a 13-week build. Fix and verify the pipeline before starting S0.

### 3. One Scenario Where QS Dies in 6 Months

Founder spends W24-W34 on S0+S1+S2. At W28, Succinct ships a first-party `KeccakIopCtx` as part of SP1 Hypercube's public SDK — possibly as part of the "WHIR audit fixes" work referenced in SP1 issue #2706. S1's headline novelty collapses: QS is now wrapping Succinct's own implementation, not writing the first one. The "first end-to-end PQ-sound on-chain ML-DSA-65 batch verification" claim weakens to "we verified what Succinct built." RWC 2027 reviewers reject on novelty grounds. EF ESP grant — whose status remains unconfirmed in the repo — is either rejected or pending while the token budget and JP hosting fees exhaust remaining runway. No paying customers, no grant, no publication. Founder is 13 weeks older and the project is effectively dead.

**The risk register in the kickoff doc lists "SP1 workspace fork drift" but does NOT list "Succinct ships first-party KeccakChallenger before S1 complete" — which is the actual architectural obsolescence risk.**

### 4. One Non-Obvious Thing the Founder Is Wrong About

**The agentic operating model IS the procrastination.** 28 commits of strategy docs and zero shipped product since W19 is not coincidence — it is the operating model functioning exactly as designed. Every week a strategy meeting produces a position paper, a synthesis memo, a W-N-kickoff doc, a loop-N-final-derisk. The output is more docs gating more decisions. The Zenn article has been draft since W19. The ethresear.ch post has been draft since W19. The EF ESP application is pinned at "2026-04-27." The credibility ladder items assigned in W20 were not completed. The founder has not been blocked by engineering difficulty — the founder has been blocked by the overhead of a multi-agent strategy apparatus that generates higher-quality excuses than any single founder could produce alone. This is the ego-cost of pivoting in disguise: the system makes every reframe feel like validated progress because seven agents agreed on it.

### 5. Position Summary — Top 3 Derisking Actions Ranked

1. **5 technical buyer calls, 3 weeks, one falsification question** — the only test that converts "interesting benchmark" into "someone will pay." No other action matters if the answer is "no."
2. **Pre-flight P1 + P4 (2 hours, this week)** — if Succinct is 4 weeks from shipping KeccakChallenger, S1 is dead. Check before writing one line.
3. **Post the ethresear.ch draft + Zenn draft, then measure engagement within 14 days** — both sitting unpublished since W19. Posting costs 2 hours. The signal it returns is more valuable than any strategy memo.

### Cheapest falsification test before the next 50 founder-hours

Post the ethresear.ch draft and the Zenn article, then count external responses within 14 days. If the research community engages substantively, the RWC 2027 path is real. If the posts get silence or only spam, the academic-credibility channel is weaker than assumed, and the 198h build is building toward an audience that doesn't exist yet. Cost: 2-3 founder-hours to review and publish. No code required.
