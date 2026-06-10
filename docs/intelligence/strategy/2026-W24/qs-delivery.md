---
agent: qs-delivery (first meeting — agent created 2026-06-10)
meeting: 2026-W24 (2026-06-10)
model: general-purpose proxy (agent type registers next session)
---

# qs-delivery — W24 Position Paper (2026-06-10)

Repo evidence base: kickoff committed today (`871f530`); `docs/engineering/specs/` does not exist yet (0h burned, plan is day-0); daily-plan dir has only `2026-05-09.md` + today's diagnosis (32-day gap confirmed); Zenn draft still `published: false`; no ESP confirmation screenshot or "submitted" marker anywhere in `docs/grants/`; PR #197 still open/draft/unmerged (28 commits, 54 files, 16,426 additions, all docs — created 2026-05-09, base `main` now 32 days stale).

## 1. Burn-down status: 0/198h, and the W20 ledger says our tracking is fiction

The plan starts today; 0h burned is fine. What is not fine: **all three W20 founder actions show zero completion evidence.** Zenn draft still `published: false` (`docs/blog/W19-zenn-pqc-custody-japan.md:6`); no `EF_ESP_confirmation_2026-05-11.png` and no "submitted" marker in `docs/grants/`; no demo tx-hash capture commits. PR #197 (the W20 package itself) sits draft/unmerged 32 days. Git log W19→W24: 28 commits, all docs — the only code is the T1 spike (`cc1871d`, `33241be`). Founder-hours are currently **unknowable from repo evidence**. Cheapest fix (15 min, this week): a `## Burn-down` table appended to `docs/engineering/2026-W24-approach-a-kickoff.md` — one line per session (`date | sub-project | hours | artifact SHA`). Artifact-based verification: S0 = vectors JSON committed; S3 = guest-program commit. No artifact by Sunday = 0h, no self-reporting.

## 2. Capacity ledger W24–W25 (budget: 30h)

| Item | Hours |
|---|---|
| Kickoff: pre-flight 4h + S0 8h + S3 8h | 20 |
| Pipeline restoration (billing, Actions settings, dispatch, verify) | 1 |
| PR #197 review + merge decision (main is 32 days stale — strategy ground truth must land on main) | 1 |
| **Remaining for ALL other agents' P0s** | **8** |

qs-cto's 19h of proposals largely overlap the kickoff (Action 1 ≈ S0 vectors-first — adopt it; Action 3 = pre-flight P3). Count once. Historical meeting output is 10–20h of P0s: **we are oversubscribed before the meeting starts.** What gets cut if so: every L4 external-surface action (new drafts, publishes, outreach) and CTO Action 2 (early-S1 pull-forward) — deferred to W26 unless S0+S3 artifacts exist first.

## 3. Slip signals + pre-agreed fallbacks

- **Sun 2026-06-14, no S0 vectors JSON committed** → earliest slip signal. Fallback: drop spec prose, ship vectors-only (6h, per qs-cto).
- **W25 end, P3 unrun or m>36** → fallback N=64→N=16 (kickoff risk register) before any S2 hour is spent.
- **W24 logged hours <10** → at 10h/week, 198h ≈ W44 finish — Q4 KPI margin gone and RWC writing hours (not in the 198h) squeezed against 2026-11-16.
- **S1 exit gate (W28)** → S2 commits to 80h or 160h end of range; decide then, not now.

## 4. Pipeline health: RED

Last real briefing 2026-05-09 — 32 days, 16× the 48h incident threshold. Charter §5 KPI ("≥1 briefing/JST day") missed for a month spanning the entire v1.2 re-pivot. Code fixes landed today but are **unverified** until the 3 founder actions run (~1h, do before any S0 work — it's the cheapest item on the board). bug-hunter and claude-updates-weekly crons are equally dead (zero scheduled runs repo-wide). Charter §8's $30/month budget assumption failed silently — qs-cfo should re-baseline it.

## 5. Scope-cut recommendation

**Cut all external publication work this cycle**: W20 ladder #3 (ethresear.ch publish, ~3h), #6 (arxiv expansion, 5–8h), and any new qs-pr/community/IR P0s. **Returns ~12h.** Charter v1.2 says differentiation is benchmark numbers; we have none yet, and W20 proved drafts without founder execution hours are dead weight. Publish after S4 produces gas numbers — the paper sequencing demands it anyway.

*(Note: this directly conflicts with qs-devils-ad's recommendation to publish the two drafts as the cheapest falsification test. The synthesis memo must surface this tension for founder decision, not paper over it.)*
