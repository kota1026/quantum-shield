# qs-cfo — Funding Brief (W19, 2026-05-09)

## 1. Position

**Submit EF ESP Track A this week — $150k ask, ~6 hours of remaining work for a draft that is already 95% done.** The application body, two-track strategy (ESP Wishlist + EF Post-Quantum Security $2M prize), and submission checklist are complete in `docs/grants/`. The blocker is operational: 60-second Loom demo + screenshot artifacts + click-submit. At $150k / 6h = **$25,000/hour expected value × probability** — the highest $/hour grant on the entire QS map. Every week we delay, EIP-8141 reference-impl competitors close the "first deployed PQ custody" moat in our application narrative.

## 2. Three concrete actions (next 7 days)

1. **Mon 2026-05-11 — Submit ESP Track A** (`https://esp.ethereum.foundation/applicants`).
   Deliverables: 60s Loom (Lock → Sign → 24h timer), architecture PNG, Playwright 9/9 green screenshot. All three are T-1 items in `SUBMISSION_CHECKLIST.md`. Format: web form, paste-from-`EF_ESP_APPLICATION.md`. Cost: ~4 hrs founder time. **Expected: $50k–$200k, 8–12 week decision cycle.**

2. **Wed 2026-05-13 — Email EF Post-Quantum Security team** (Track B, prize pool $2M, lead: Thomas Coratger). Reference Track A application ID. Email template + 1-page PDF already drafted in checklist. Cost: ~2 hrs. **Expected: prize allocation + EF technical co-author signal — worth more than the cash for downstream VC.**

3. **Fri 2026-05-15 — File NEDO 量子技術イノベーション expression-of-interest** (公募 typically opens June, EOI accepted earlier). Deliverable: existing `EF_ESP_APPLICATION.md` translated to Japanese, 2-page tech summary emphasizing "ETH custody for Japanese 金融庁 compliance" angle. Cost: ~6 hrs (translation + reformat). **Expected: ¥30M–¥100M ($200k–$700k), but 6–9 month cycle.** $/hour = ~$50k.

## 3. One funding-side risk

**If neither EF track lands by 2026-09 and no JST/NEDO acceptance arrives by 2026-12, founder runway exhausts before mainnet.** Bridge financing via crypto-native VC (a16z / Paradigm / SBI) requires either (a) deployed mainnet TVL or (b) a credible institutional pilot LOI. Today QS has neither. **Mitigation: spend 1 day next week securing a non-binding pilot LOI from a Japanese custodian (SBI VC Trade or bitFlyer institutional desk) — that single PDF unlocks both VC conversations and grant credibility, and is reusable across every funding source listed above.**

## 4. One non-obvious opportunity

**防衛装備庁 安全保障技術研究推進制度 (MoD-ATLA Security Tech Research Promotion Program)** — Japan MoD's dual-use research grant, ¥20M–¥600M ($130k–$4M), explicitly funds post-quantum cryptography under "情報セキュリティ" theme. **Generic PQC researchers miss this because it requires a defense-adjacent narrative**; QS qualifies because asset custody for critical infrastructure (energy, supply chain payments) is on the dual-use whitelist. Solo founders also qualify (unlike NEDO which prefers consortia). FY2026 公募 closes typically June; deliverable is a 10-page Japanese 研究計画書. **No competitor on our radar (QRL, PQShield, SandboxAQ) is a Japan-resident solo entity — kota1026 has a structural lock on this lane.** Estimated $/hour: ¥30M / 40h ≈ $5k/hour, but with strategic optionality (defense network access) worth far more.

## Position summary

| Rank | Action | Amount | Deadline | $/hour |
|------|--------|--------|----------|--------|
| 1 | **Submit EF ESP Track A** (already drafted) | $150k | **Mon 2026-05-11** | ~$25k/h |
| 2 | **Email EF PQ Security prize** (Track B) | share of $2M | **Wed 2026-05-13** | ~$100k/h (signal-weighted) |
| 3 | **防衛装備庁 安全保障技術 EOI** (Japan-only moat) | ¥20M–¥600M | **June 2026 公募** | ~$5k/h + defense network |

**Skip this week**: Gitcoin micro-grants ($/hour < $500), generic VC outreach (no mainnet/LOI), OP RetroPGF (no OP-stack deployment yet).

**One question for the team**: Does kota1026 have a `tcoratger@ethereum.org` warm intro path through any of the 10+ EF PQ client teams? A warm Track B intro is the single highest-leverage hour available this week.
